import { describe, expect, it } from "vitest";
import Ivy from "./index";

describe("Ivy", () => {
  describe("route registration", () => {
    it("should register GET routes", async () => {
      const app = new Ivy();

      app.get("/test", (c) => c.text("GET response"));

      const req = new Request("http://localhost/test", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("GET response");
    });

    it("should register POST routes", async () => {
      const app = new Ivy();

      app.post("/test", (c) => c.text("POST response"));

      const req = new Request("http://localhost/test", { method: "POST" });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("POST response");
    });

    it("should register PUT routes", async () => {
      const app = new Ivy();

      app.put("/test", (c) => c.text("PUT response"));

      const req = new Request("http://localhost/test", { method: "PUT" });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("PUT response");
    });

    it("should register DELETE routes", async () => {
      const app = new Ivy();

      app.delete("/test", (c) => c.text("DELETE response"));

      const req = new Request("http://localhost/test", { method: "DELETE" });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("DELETE response");
    });

    it("should register PATCH routes", async () => {
      const app = new Ivy();

      app.patch("/test", (c) => c.text("PATCH response"));

      const req = new Request("http://localhost/test", { method: "PATCH" });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("PATCH response");
    });

    it("should support method chaining", () => {
      const app = new Ivy();

      const result = app
        .get("/one", (c) => c.text("One"))
        .get("/two", (c) => c.text("Two"))
        .post("/three", (c) => c.text("Three"));

      expect(result).toBe(app);
    });
  });

  describe(".on() method", () => {
    it("should register a single method with single path", async () => {
      const app = new Ivy();

      app.on("GET", "/test", (c) => c.text("GET response"));

      const req = new Request("http://localhost/test", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("GET response");
    });

    it("should register multiple methods with single path", async () => {
      const app = new Ivy();

      app.on(["GET", "POST"], "/test", (c) => c.text("Multi-method response"));

      const getReq = new Request("http://localhost/test", { method: "GET" });
      const getRes = await app.fetch(getReq);
      expect(await getRes.text()).toBe("Multi-method response");

      const postReq = new Request("http://localhost/test", { method: "POST" });
      const postRes = await app.fetch(postReq);
      expect(await postRes.text()).toBe("Multi-method response");
    });

    it("should register single method with multiple paths", async () => {
      const app = new Ivy();

      app.on("GET", ["/test1", "/test2"], (c) => c.text("Multi-path response"));

      const req1 = new Request("http://localhost/test1", { method: "GET" });
      const res1 = await app.fetch(req1);
      expect(await res1.text()).toBe("Multi-path response");

      const req2 = new Request("http://localhost/test2", { method: "GET" });
      const res2 = await app.fetch(req2);
      expect(await res2.text()).toBe("Multi-path response");
    });

    it("should register multiple methods with multiple paths", async () => {
      const app = new Ivy();

      app.on(["GET", "POST"], ["/api/v1", "/api/v2"], (c) => c.text("Multi response"));

      const tests = [
        { method: "GET", path: "/api/v1" },
        { method: "GET", path: "/api/v2" },
        { method: "POST", path: "/api/v1" },
        { method: "POST", path: "/api/v2" },
      ];

      for (const test of tests) {
        const req = new Request(`http://localhost${test.path}`, { method: test.method });
        const res = await app.fetch(req);
        expect(await res.text()).toBe("Multi response");
      }
    });

    it("should support method chaining", () => {
      const app = new Ivy();

      const result = app
        .on("GET", "/one", (c) => c.text("One"))
        .on(["GET", "POST"], "/two", (c) => c.text("Two"));

      expect(result).toBe(app);
    });

    it("should work alongside other method helpers", async () => {
      const app = new Ivy();

      app.get("/get-route", (c) => c.text("GET helper"));
      app.on("POST", "/post-route", (c) => c.text("POST on method"));

      const getReq = new Request("http://localhost/get-route", { method: "GET" });
      const getRes = await app.fetch(getReq);
      expect(await getRes.text()).toBe("GET helper");

      const postReq = new Request("http://localhost/post-route", { method: "POST" });
      const postRes = await app.fetch(postReq);
      expect(await postRes.text()).toBe("POST on method");
    });
  });

  describe("routing", () => {
    it("should route requests to correct handler", async () => {
      const app = new Ivy();

      app.get("/", (c) => c.text("Home"));
      app.get("/about", (c) => c.text("About"));

      const homeReq = new Request("http://localhost/", { method: "GET" });
      const homeRes = await app.fetch(homeReq);
      expect(await homeRes.text()).toBe("Home");

      const aboutReq = new Request("http://localhost/about", { method: "GET" });
      const aboutRes = await app.fetch(aboutReq);
      expect(await aboutRes.text()).toBe("About");
    });

    it("should differentiate between HTTP methods", async () => {
      const app = new Ivy();

      app.get("/resource", (c) => c.text("GET resource"));
      app.post("/resource", (c) => c.text("POST resource"));

      const getReq = new Request("http://localhost/resource", {
        method: "GET",
      });
      const getRes = await app.fetch(getReq);
      expect(await getRes.text()).toBe("GET resource");

      const postReq = new Request("http://localhost/resource", {
        method: "POST",
      });
      const postRes = await app.fetch(postReq);
      expect(await postRes.text()).toBe("POST resource");
    });

    it("should return 404 for unmatched routes", async () => {
      const app = new Ivy();

      app.get("/exists", (c) => c.text("Found"));

      const req = new Request("http://localhost/notfound", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(404);
      expect(await response.text()).toBe("Not Found");
    });

    it("should return 404 for unmatched HTTP methods", async () => {
      const app = new Ivy();

      app.get("/test", (c) => c.text("GET only"));

      const req = new Request("http://localhost/test", { method: "POST" });
      const response = await app.fetch(req);

      expect(response.status).toBe(404);
    });
  });

  describe("handler context", () => {
    it("should pass raw request to context", async () => {
      const app = new Ivy();

      app.get("/test", (c) => {
        return c.text(c.req.raw.url);
      });

      const req = new Request("http://localhost/test", { method: "GET" });
      const response = await app.fetch(req);

      expect(await response.text()).toBe("http://localhost/test");
    });

    it("should provide access to raw request properties", async () => {
      const app = new Ivy();

      app.get("/method", (c) => {
        return c.text(c.req.raw.method);
      });

      const req = new Request("http://localhost/method", { method: "GET" });
      const response = await app.fetch(req);

      expect(await response.text()).toBe("GET");
    });

    it("should support JSON responses", async () => {
      const app = new Ivy();

      app.get("/json", (c) => c.json({ message: "Hello" }));

      const req = new Request("http://localhost/json", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(await response.json()).toEqual({ message: "Hello" });
    });

    it("should support HTML responses", async () => {
      const app = new Ivy();

      app.get("/html", (c) => c.html("<h1>Title</h1>"));

      const req = new Request("http://localhost/html", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.headers.get("Content-Type")).toBe("text/html");
      expect(await response.text()).toBe("<h1>Title</h1>");
    });
  });

  describe("async handlers", () => {
    it("should support async handlers", async () => {
      const app = new Ivy();

      app.get("/async", async (c) => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return c.text("Async response");
      });

      const req = new Request("http://localhost/async", { method: "GET" });
      const response = await app.fetch(req);

      expect(await response.text()).toBe("Async response");
    });
  });

  describe("wildcard paths", () => {
    it("should match wildcard in middle of path", async () => {
      const app = new Ivy();

      app.get("/wild/*/card", (c) => c.text("GET /wild/*/card"));

      const req = new Request("http://localhost/wild/anything/card", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("GET /wild/*/card");
    });

    it("should match wildcard with different values", async () => {
      const app = new Ivy();

      app.get("/files/*/download", (c) => c.text("Download"));

      const req1 = new Request("http://localhost/files/123/download", { method: "GET" });
      const res1 = await app.fetch(req1);
      expect(await res1.text()).toBe("Download");

      const req2 = new Request("http://localhost/files/abc/download", { method: "GET" });
      const res2 = await app.fetch(req2);
      expect(await res2.text()).toBe("Download");
    });

    it("should match multiple wildcards", async () => {
      const app = new Ivy();

      app.get("/api/*/users/*/profile", (c) => c.text("Profile"));

      const req = new Request("http://localhost/api/v1/users/123/profile", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("Profile");
    });

    it("should not match incorrect wildcard paths", async () => {
      const app = new Ivy();

      app.get("/wild/*/card", (c) => c.text("Match"));

      const req = new Request("http://localhost/wild/card", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(404);
    });
  });

  describe("path params", () => {
    it("should extract single path param", async () => {
      const app = new Ivy();

      app.get("/user/:name", (c) => {
        const name = c.req.param("name");
        return c.text(`Hello ${name}`);
      });

      const req = new Request("http://localhost/user/john", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("Hello john");
    });

    it("should extract multiple path params", async () => {
      const app = new Ivy();

      app.get("/users/:userId/posts/:postId", (c) => {
        const userId = c.req.param("userId");
        const postId = c.req.param("postId");
        return c.json({ userId, postId });
      });

      const req = new Request("http://localhost/users/123/posts/456", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.json()).toEqual({ userId: "123", postId: "456" });
    });

    it("should handle params with different values", async () => {
      const app = new Ivy();

      app.get("/product/:id", (c) => {
        const id = c.req.param("id");
        return c.text(`Product ${id}`);
      });

      const req1 = new Request("http://localhost/product/abc", { method: "GET" });
      const res1 = await app.fetch(req1);
      expect(await res1.text()).toBe("Product abc");

      const req2 = new Request("http://localhost/product/123", { method: "GET" });
      const res2 = await app.fetch(req2);
      expect(await res2.text()).toBe("Product 123");
    });

    it("should return undefined for non-existent param", async () => {
      const app = new Ivy();

      app.get("/test/:id", (c) => {
        const nonExistent = c.req.param("name");
        return c.text(nonExistent === undefined ? "undefined" : nonExistent);
      });

      const req = new Request("http://localhost/test/123", { method: "GET" });
      const response = await app.fetch(req);

      expect(await response.text()).toBe("undefined");
    });

    it("should work with POST requests", async () => {
      const app = new Ivy();

      app.post("/api/:version/users", (c) => {
        const version = c.req.param("version");
        return c.json({ version, action: "create" });
      });

      const req = new Request("http://localhost/api/v2/users", { method: "POST" });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({ version: "v2", action: "create" });
    });

    it("should combine with .on() method", async () => {
      const app = new Ivy();

      app.on(["GET", "POST"], "/resource/:id", (c) => {
        const id = c.req.param("id");
        return c.text(`Resource ${id}`);
      });

      const getReq = new Request("http://localhost/resource/123", { method: "GET" });
      const getRes = await app.fetch(getReq);
      expect(await getRes.text()).toBe("Resource 123");

      const postReq = new Request("http://localhost/resource/456", { method: "POST" });
      const postRes = await app.fetch(postReq);
      expect(await postRes.text()).toBe("Resource 456");
    });

    it("should allow accessing params via req.params object", async () => {
      const app = new Ivy();

      app.get("/user/:id/profile/:section", (c) => {
        return c.json({
          id: c.req.params.id,
          section: c.req.params.section,
        });
      });

      const req = new Request("http://localhost/user/456/profile/settings", { method: "GET" });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({ id: "456", section: "settings" });
    });
  });
});
