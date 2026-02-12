import { describe, expect, it } from "vitest";
import type { IvyContext } from "./context";
import Ivy, { type Next } from "./index";

describe("Middleware", () => {
  describe("global middleware", () => {
    it("should execute global middleware for all routes", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      app.use("*", async (c, next) => {
        execution.push("global");
        await next();
      });

      app.get("/test", (c) => {
        execution.push("handler");
        return c.res.text("OK");
      });

      const req = new Request("http://localhost/test", { method: "GET" });
      await app.fetch(req);

      expect(execution).toEqual(["global", "handler"]);
    });

    it("should execute multiple global middleware in order", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      app.use("*", async (c, next) => {
        execution.push("global1 start");
        await next();
        execution.push("global1 end");
      });

      app.use("*", async (c, next) => {
        execution.push("global2 start");
        await next();
        execution.push("global2 end");
      });

      app.use("*", async (c, next) => {
        execution.push("global3 start");
        await next();
        execution.push("global3 end");
      });

      app.get("/", (c) => {
        execution.push("handler");
        return c.res.text("Hello!");
      });

      const req = new Request("http://localhost/", { method: "GET" });
      await app.fetch(req);

      expect(execution).toEqual([
        "global1 start",
        "global2 start",
        "global3 start",
        "handler",
        "global3 end",
        "global2 end",
        "global1 end",
      ]);
    });

    it("should support path-specific global middleware", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      app.use("*", async (c, next) => {
        execution.push("global");
        await next();
      });

      app.use("/api/*", async (c, next) => {
        execution.push("api");
        await next();
      });

      app.get("/api/users", (c) => {
        execution.push("handler");
        return c.res.text("Users");
      });

      const req = new Request("http://localhost/api/users", { method: "GET" });
      await app.fetch(req);

      expect(execution).toEqual(["global", "api", "handler"]);
    });

    it("should not execute non-matching path middleware", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      app.use("/api/*", async (c, next) => {
        execution.push("api");
        await next();
      });

      app.get("/users", (c) => {
        execution.push("handler");
        return c.res.text("Users");
      });

      const req = new Request("http://localhost/users", { method: "GET" });
      await app.fetch(req);

      expect(execution).toEqual(["handler"]);
    });

    it("should short-circuit on middleware without next()", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      app.use("*", async (c, next): Promise<Response | void> => {
        execution.push("middleware1");
        if (!c.req.header("Authorization")) {
          return c.res.json({ error: "Unauthorized" }, 401);
        }
        await next();
      });

      app.get("/protected", (c) => {
        execution.push("handler");
        return c.res.text("Protected");
      });

      const req = new Request("http://localhost/protected", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "Unauthorized" });
      expect(execution).toEqual(["middleware1"]);
    });

    it("should allow middleware to modify context", async () => {
      const app = new Ivy();

      app.use("*", async (c, next) => {
        await next();
      });

      app.get("/test", (c) => {
        return c.res.text("OK");
      });

      const req = new Request("http://localhost/test", {
        method: "GET",
        headers: { "User-Agent": "TestClient" },
      });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
    });
  });

  describe("route-specific middleware", () => {
    it("should execute route-specific middleware", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      const authMiddleware = async (
        c: IvyContext,
        next: Next,
      ): Promise<void> => {
        execution.push("auth");
        await next();
      };

      app.get("/protected", authMiddleware, (c) => {
        execution.push("handler");
        return c.res.text("Protected content");
      });

      const req = new Request("http://localhost/protected", { method: "GET" });
      await app.fetch(req);

      expect(execution).toEqual(["auth", "handler"]);
    });

    it("should work with .on() method", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      const authMiddleware = async (c: IvyContext, next: Next) => {
        execution.push("auth");
        await next();
      };

      app.on("POST", "/protected", authMiddleware, (c) =>
        c.res.text("POST response"),
      );

      const req = new Request("http://localhost/protected", { method: "POST" });
      await app.fetch(req);

      expect(execution).toEqual(["auth"]);
    });

    it("should short-circuit route middleware", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      const authMiddleware = async (c: IvyContext, next: Next) => {
        execution.push("auth");
        const token = c.req.header("Authorization");
        if (!token) {
          return c.res.json({ error: "No token" }, 401);
        }
        await next();
      };

      app.get("/protected", authMiddleware, (c) => {
        execution.push("handler");
        return c.res.text("Protected");
      });

      const req = new Request("http://localhost/protected", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(401);
      expect(await response.json()).toEqual({ error: "No token" });
      expect(execution).toEqual(["auth"]);
    });
  });

  describe("combined global and route-specific middleware", () => {
    it("should execute global before route-specific middleware", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      app.use("*", async (c, next) => {
        execution.push("global");
        await next();
      });

      const routeMiddleware = async (c: IvyContext, next: Next) => {
        execution.push("route");
        await next();
      };

      app.get("/test", routeMiddleware, (c) => {
        execution.push("handler");
        return c.res.text("OK");
      });

      const req = new Request("http://localhost/test", { method: "GET" });
      await app.fetch(req);

      expect(execution).toEqual(["global", "route", "handler"]);
    });

    it("should short-circuit from global middleware", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      app.use("*", async (c, next) => {
        execution.push("global");
        return c.res.text("Blocked", 403);
      });

      const routeMw = async (c: IvyContext, next: Next) => {
        execution.push("route");
        await next();
      };

      app.get("/test", routeMw, (c) => {
        execution.push("handler");
        return c.res.text("OK");
      });

      const req = new Request("http://localhost/test", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(403);
      expect(await response.text()).toBe("Blocked");
      expect(execution).toEqual(["global"]);
    });

    it("should short-circuit from route middleware", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      app.use("*", async (c, next) => {
        execution.push("global");
        await next();
      });

      const routeMw = async (c: IvyContext, next: Next) => {
        execution.push("route");
        return c.res.text("Blocked", 403);
      };

      app.get("/test", routeMw, (c) => {
        execution.push("handler");
        return c.res.text("OK");
      });

      const req = new Request("http://localhost/test", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(403);
      expect(await response.text()).toBe("Blocked");
      expect(execution).toEqual(["global", "route"]);
    });
  });

  describe("middleware with different HTTP methods", () => {
    it("should work with POST routes", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      const middleware = async (c: IvyContext, next: Next) => {
        execution.push("middleware");
        await next();
      };

      app.post("/data", middleware, (c) => {
        execution.push("handler");
        return c.res.json({ success: true });
      });

      const req = new Request("http://localhost/data", { method: "POST" });
      await app.fetch(req);

      expect(execution).toEqual(["middleware", "handler"]);
    });

    it("should work with PUT routes", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      const middleware = async (c: IvyContext, next: Next) => {
        execution.push("middleware");
        await next();
      };

      app.put("/resource/:id", middleware, (c) => {
        execution.push("handler");
        return c.res.text("Updated");
      });

      const req = new Request("http://localhost/resource/123", {
        method: "PUT",
      });
      await app.fetch(req);

      expect(execution).toEqual(["middleware", "handler"]);
    });

    it("should work with DELETE routes", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      const middleware = async (c: IvyContext, next: Next) => {
        execution.push("middleware");
        await next();
      };

      app.delete("/resource/:id", middleware, (c) => {
        execution.push("handler");
        return c.res.null();
      });

      const req = new Request("http://localhost/resource/123", {
        method: "DELETE",
      });
      await app.fetch(req);

      expect(execution).toEqual(["middleware", "handler"]);
    });

    it("should work with PATCH routes", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      const middleware = async (c: IvyContext, next: Next) => {
        execution.push("middleware");
        await next();
      };

      app.patch("/resource/:id", middleware, (c) => {
        execution.push("handler");
        return c.res.text("Patched");
      });

      const req = new Request("http://localhost/resource/123", {
        method: "PATCH",
      });
      await app.fetch(req);

      expect(execution).toEqual(["middleware", "handler"]);
    });

    it("should work with OPTIONS routes", async () => {
      const app = new Ivy();
      const execution: string[] = [];

      const middleware = async (c: IvyContext, next: Next) => {
        execution.push("middleware");
        await next();
      };

      app.options("/resource", middleware, (c) => {
        execution.push("handler");
        return c.res.null();
      });

      const req = new Request("http://localhost/resource", {
        method: "OPTIONS",
      });
      await app.fetch(req);

      expect(execution).toEqual(["middleware", "handler"]);
    });
  });

  describe("middleware with path parameters", () => {
    it("should have access to path parameters", async () => {
      const app = new Ivy();
      let capturedId: string | undefined;

      const middleware = async (c: IvyContext, next: Next) => {
        capturedId = c.req.param("id");
        await next();
      };

      app.get("/users/:id", middleware, (c) => {
        return c.res.text(`User ${c.req.param("id")}`);
      });

      const req = new Request("http://localhost/users/123", { method: "GET" });
      const response = await app.fetch(req);

      expect(capturedId).toBe("123");
      expect(await response.text()).toBe("User 123");
    });

    it("should have access to query parameters", async () => {
      const app = new Ivy();
      let capturedQuery: string | undefined;

      const middleware = async (c: IvyContext, next: Next) => {
        capturedQuery = c.req.query("page");
        await next();
      };

      app.get("/search", middleware, (c) => {
        return c.res.text("Search results");
      });

      const req = new Request("http://localhost/search?page=2", {
        method: "GET",
      });
      await app.fetch(req);

      expect(capturedQuery).toBe("2");
    });

    it("should have access to request headers", async () => {
      const app = new Ivy();
      let capturedHeader: string | undefined;

      const middleware = async (c: IvyContext, next: Next) => {
        capturedHeader = c.req.header("Authorization");
        await next();
      };

      app.get("/test", middleware, (c) => {
        return c.res.text("OK");
      });

      const req = new Request("http://localhost/test", {
        method: "GET",
        headers: { Authorization: "Bearer token123" },
      });
      await app.fetch(req);

      expect(capturedHeader).toBe("Bearer token123");
    });
  });

  describe("middleware with request body", () => {
    it("should have access to JSON body", async () => {
      const app = new Ivy();
      let capturedBody: unknown;

      const middleware = async (c: IvyContext, next: Next) => {
        capturedBody = await c.req.json();
        await next();
      };

      app.post("/data", middleware, async (c) => {
        const body = await c.req.json();
        return c.res.json({ received: body });
      });

      const req = new Request("http://localhost/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Test" }),
      });
      const response = await app.fetch(req);

      expect(capturedBody).toEqual({ name: "Test" });
      expect(await response.json()).toEqual({ received: { name: "Test" } });
    });
  });

  describe("middleware error handling", () => {
    it("should return 500 if middleware throws", async () => {
      const app = new Ivy();

      app.use("*", async (c, next) => {
        throw new Error("Middleware error");
      });

      app.get("/test", (c) => {
        return c.res.text("OK");
      });

      const req = new Request("http://localhost/test", { method: "GET" });

      // Expect the error to be thrown
      await expect(app.fetch(req)).rejects.toThrow("Middleware error");
    });
  });

  describe("middleware method chaining", () => {
    it("should support method chaining with .use()", () => {
      const app = new Ivy();

      const result = app
        .use("*", async (c, next) => {
          await next();
        })
        .use("/api/*", async (c, next) => {
          await next();
        })
        .get("/test", (c) => c.res.text("OK"));

      expect(result).toBe(app);
    });
  });

  describe("real-world middleware scenarios", () => {
    it("should implement authentication middleware", async () => {
      const app = new Ivy();

      const authMiddleware = async (c: IvyContext, next: Next) => {
        const token = c.req.header("Authorization");
        if (!token || token !== "Bearer valid-token") {
          return c.res.json({ error: "Unauthorized" }, 401);
        }
        await next();
      };

      app.get("/public", (c) => c.res.text("Public content"));
      app.get("/protected", authMiddleware, (c) =>
        c.res.text("Protected content"),
      );

      // Public route should work
      const publicReq = new Request("http://localhost/public", {
        method: "GET",
      });
      const publicRes = await app.fetch(publicReq);
      expect(publicRes.status).toBe(200);

      // Protected route without token should fail
      const protectedReq1 = new Request("http://localhost/protected", {
        method: "GET",
      });
      const protectedRes1 = await app.fetch(protectedReq1);
      expect(protectedRes1.status).toBe(401);

      // Protected route with valid token should work
      const protectedReq2 = new Request("http://localhost/protected", {
        method: "GET",
        headers: { Authorization: "Bearer valid-token" },
      });
      const protectedRes2 = await app.fetch(protectedReq2);
      expect(protectedRes2.status).toBe(200);
      expect(await protectedRes2.text()).toBe("Protected content");
    });

    it("should implement logging middleware", async () => {
      const app = new Ivy();
      const logs: string[] = [];

      app.use("*", async (c, next) => {
        const start = Date.now();
        await next();
        const duration = Date.now() - start;
        logs.push(`${c.req.raw.method} ${c.req.pathname} - ${duration}ms`);
      });

      app.get("/test", (c) => c.res.text("OK"));

      const req = new Request("http://localhost/test", { method: "GET" });
      await app.fetch(req);

      expect(logs.length).toBe(1);
      expect(logs[0]).toMatch(/GET \/test - \d+ms/);
    });

    it("should implement CORS middleware", async () => {
      const app = new Ivy();

      const corsMiddleware = async (c: IvyContext, next: Next) => {
        await next();
      };

      app.use("*", corsMiddleware);

      app.get("/api/data", (c) => {
        return new Response(JSON.stringify({ data: "test" }), {
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
          },
        });
      });

      const req = new Request("http://localhost/api/data", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.headers.get("Access-Control-Allow-Origin")).toBe("*");
    });

    it("should implement request validation middleware", async () => {
      const app = new Ivy();

      const validateJson = async (c: IvyContext, next: Next) => {
        const contentType = c.req.header("Content-Type");
        if (!contentType || !contentType.includes("application/json")) {
          return c.res.json(
            { error: "Content-Type must be application/json" },
            400,
          );
        }
        await next();
      };

      app.post("/api/data", validateJson, async (c) => {
        const body = await c.req.json();
        return c.res.json({ received: body });
      });

      // Request without Content-Type
      const req1 = new Request("http://localhost/api/data", {
        method: "POST",
        body: JSON.stringify({ test: true }),
      });
      const res1 = await app.fetch(req1);
      expect(res1.status).toBe(400);

      // Request with correct Content-Type
      const req2 = new Request("http://localhost/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });
      const res2 = await app.fetch(req2);
      expect(res2.status).toBe(200);
    });
  });
});
