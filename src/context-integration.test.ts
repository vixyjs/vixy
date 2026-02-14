// @ts-nocheck - Test file with intentional unknown types from JSON parsing
import { describe, expect, it } from "vitest";
import type { IvyContext } from "./context";
import Ivy, { type Next } from "./index";

describe("Context integration with middleware", () => {
  it("should set context in middleware and access in handler", async () => {
    const app = new Ivy();

    app.use("*", async (c, next) => {
      c.req.setContext("email", "user@example.com");
      await next();
    });

    app.get("/test", (c) => {
      const email = c.req.getContext<string>("email");
      return c.res.json({ email });
    });

    const req = new Request("http://localhost/test", { method: "GET" });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data.email).toBe("user@example.com");
  });

  it("should pass context through multiple middleware layers", async () => {
    const app = new Ivy();

    app.use("*", async (c, next) => {
      c.req.setContext("step1", "first");
      await next();
    });

    app.use("*", async (c, next) => {
      const step1 = c.req.getContext<string>("step1");
      c.req.setContext("step2", step1 + "-second");
      await next();
    });

    app.use("*", async (c, next) => {
      const step2 = c.req.getContext<string>("step2");
      c.req.setContext("step3", step2 + "-third");
      await next();
    });

    app.get("/test", (c) => {
      const step1 = c.req.getContext<string>("step1");
      const step2 = c.req.getContext<string>("step2");
      const step3 = c.req.getContext<string>("step3");
      return c.res.json({ step1, step2, step3 });
    });

    const req = new Request("http://localhost/test", { method: "GET" });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data).toEqual({
      step1: "first",
      step2: "first-second",
      step3: "first-second-third",
    });
  });

  it("should store user authentication data in context", async () => {
    const app = new Ivy();

    interface User {
      id: number;
      email: string;
      role: string;
    }

    const authMiddleware = async (c: IvyContext, next: Next) => {
      const token = c.req.header("Authorization");
      if (!token) {
        return c.res.json({ error: "No token" }, 401);
      }

      // Simulate user lookup
      const user: User = {
        id: 123,
        email: "user@example.com",
        role: "admin",
      };

      c.req.setContext<User>("user", user);
      await next();
    };

    app.use("*", authMiddleware);

    app.get("/profile", (c) => {
      const user = c.req.getContext<User>("user");
      return c.res.json({ user });
    });

    const req = new Request("http://localhost/profile", {
      method: "GET",
      headers: { Authorization: "Bearer token" },
    });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data.user).toEqual({
      id: 123,
      email: "user@example.com",
      role: "admin",
    });
  });

  it("should allow middleware to override context values", async () => {
    const app = new Ivy();

    app.use("*", async (c, next) => {
      c.req.setContext("value", "first");
      await next();
    });

    app.use("*", async (c, next) => {
      c.req.setContext("value", "second");
      await next();
    });

    app.get("/test", (c) => {
      const value = c.req.getContext<string>("value");
      return c.res.json({ value });
    });

    const req = new Request("http://localhost/test", { method: "GET" });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data.value).toBe("second");
  });

  it("should isolate context between different requests", async () => {
    const app = new Ivy();
    const receivedIds: number[] = [];

    app.use("*", async (c, next) => {
      const id = c.req.query("id");
      c.req.setContext("requestId", Number(id));
      await next();
    });

    app.get("/test", (c) => {
      const requestId = c.req.getContext<number>("requestId");
      receivedIds.push(requestId!);
      return c.res.json({ requestId });
    });

    // Make multiple requests
    const req1 = new Request("http://localhost/test?id=1", { method: "GET" });
    const req2 = new Request("http://localhost/test?id=2", { method: "GET" });
    const req3 = new Request("http://localhost/test?id=3", { method: "GET" });

    const [res1, res2, res3] = await Promise.all([
      app.fetch(req1),
      app.fetch(req2),
      app.fetch(req3),
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();
    const data3 = await res3.json();

    expect(data1.requestId).toBe(1);
    expect(data2.requestId).toBe(2);
    expect(data3.requestId).toBe(3);
    expect(receivedIds.sort()).toEqual([1, 2, 3]);
  });

  it("should handle complex objects in context", async () => {
    const app = new Ivy();

    interface RequestMetadata {
      timestamp: Date;
      userAgent: string;
      requestId: string;
      features: string[];
    }

    app.use("*", async (c, next) => {
      const metadata: RequestMetadata = {
        timestamp: new Date(),
        userAgent: c.req.header("User-Agent") || "unknown",
        requestId: Math.random().toString(36),
        features: ["feature1", "feature2"],
      };
      c.req.setContext<RequestMetadata>("metadata", metadata);
      await next();
    });

    app.get("/test", (c) => {
      const metadata = c.req.getContext<RequestMetadata>("metadata");
      return c.res.json({
        userAgent: metadata?.userAgent,
        features: metadata?.features,
        hasTimestamp: metadata?.timestamp instanceof Date,
      });
    });

    const req = new Request("http://localhost/test", {
      method: "GET",
      headers: { "User-Agent": "TestClient/1.0" },
    });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data.userAgent).toBe("TestClient/1.0");
    expect(data.features).toEqual(["feature1", "feature2"]);
    expect(data.hasTimestamp).toBe(true);
  });

  it("should work with route-specific middleware", async () => {
    const app = new Ivy();

    const routeMiddleware = async (c: IvyContext, next: Next) => {
      c.req.setContext("routeData", "from-route-middleware");
      await next();
    };

    app.use("*", async (c, next) => {
      c.req.setContext("globalData", "from-global-middleware");
      await next();
    });

    app.get("/test", routeMiddleware, (c) => {
      const globalData = c.req.getContext<string>("globalData");
      const routeData = c.req.getContext<string>("routeData");
      return c.res.json({ globalData, routeData });
    });

    const req = new Request("http://localhost/test", { method: "GET" });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data.globalData).toBe("from-global-middleware");
    expect(data.routeData).toBe("from-route-middleware");
  });

  it("should return undefined for context keys that were never set", async () => {
    const app = new Ivy();

    app.get("/test", (c) => {
      const nonExistent = c.req.getContext("nonExistent");
      return c.res.json({ nonExistent: nonExistent === undefined });
    });

    const req = new Request("http://localhost/test", { method: "GET" });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data.nonExistent).toBe(true);
  });

  it("should handle context in authentication and authorization flow", async () => {
    const app = new Ivy();

    interface User {
      id: number;
      role: string;
    }

    // Authentication middleware
    const authenticate = async (c: IvyContext, next: Next) => {
      const token = c.req.header("Authorization");
      if (!token) {
        return c.res.json({ error: "Not authenticated" }, 401);
      }

      const user: User = { id: 1, role: "user" };
      c.req.setContext<User>("user", user);
      await next();
    };

    // Authorization middleware
    const requireAdmin = async (c: IvyContext, next: Next) => {
      const user = c.req.getContext<User>("user");
      if (!user || user.role !== "admin") {
        return c.res.json({ error: "Forbidden" }, 403);
      }
      await next();
    };

    app.get("/public", (c) => c.res.text("Public"));
    app.get("/protected", authenticate, (c) => {
      const user = c.req.getContext<User>("user");
      return c.res.json({ userId: user?.id });
    });
    app.get("/admin", authenticate, requireAdmin, (c) =>
      c.res.text("Admin area"),
    );

    // Public endpoint should work
    const publicReq = new Request("http://localhost/public", {
      method: "GET",
    });
    const publicRes = await app.fetch(publicReq);
    expect(publicRes.status).toBe(200);

    // Protected endpoint without auth
    const protectedReq1 = new Request("http://localhost/protected", {
      method: "GET",
    });
    const protectedRes1 = await app.fetch(protectedReq1);
    expect(protectedRes1.status).toBe(401);

    // Protected endpoint with auth
    const protectedReq2 = new Request("http://localhost/protected", {
      method: "GET",
      headers: { Authorization: "Bearer token" },
    });
    const protectedRes2 = await app.fetch(protectedReq2);
    expect(protectedRes2.status).toBe(200);
    expect(await protectedRes2.json()).toEqual({ userId: 1 });

    // Admin endpoint with non-admin user
    const adminReq = new Request("http://localhost/admin", {
      method: "GET",
      headers: { Authorization: "Bearer token" },
    });
    const adminRes = await app.fetch(adminReq);
    expect(adminRes.status).toBe(403);
  });

  it("should preserve context when middleware throws after setting it", async () => {
    const app = new Ivy();
    let contextValue: string | undefined;

    app.use("*", async (c, next) => {
      c.req.setContext("key", "value");
      contextValue = c.req.getContext<string>("key");
      throw new Error("Middleware error");
    });

    app.get("/test", (c) => c.res.text("OK"));

    const req = new Request("http://localhost/test", { method: "GET" });

    await expect(app.fetch(req)).rejects.toThrow("Middleware error");
    expect(contextValue).toBe("value");
  });

  it("should handle performance tracking across middleware", async () => {
    const app = new Ivy();

    interface PerformanceData {
      startTime: number;
      checkpoints: Record<string, number>;
    }

    app.use("*", async (c, next) => {
      const perfData: PerformanceData = {
        startTime: Date.now(),
        checkpoints: {},
      };
      c.req.setContext<PerformanceData>("perf", perfData);
      await next();
    });

    app.use("*", async (c, next) => {
      const perfData = c.req.getContext<PerformanceData>("perf");
      if (perfData) {
        perfData.checkpoints.middleware1 = Date.now() - perfData.startTime;
      }
      await next();
    });

    app.use("*", async (c, next) => {
      const perfData = c.req.getContext<PerformanceData>("perf");
      if (perfData) {
        perfData.checkpoints.middleware2 = Date.now() - perfData.startTime;
      }
      await next();
    });

    app.get("/test", (c) => {
      const perfData = c.req.getContext<PerformanceData>("perf");
      if (perfData) {
        perfData.checkpoints.handler = Date.now() - perfData.startTime;
      }
      return c.res.json({ checkpoints: perfData?.checkpoints });
    });

    const req = new Request("http://localhost/test", { method: "GET" });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data.checkpoints).toHaveProperty("middleware1");
    expect(data.checkpoints).toHaveProperty("middleware2");
    expect(data.checkpoints).toHaveProperty("handler");
    expect(typeof data.checkpoints.middleware1).toBe("number");
  });

  it("should handle multiple independent context keys", async () => {
    const app = new Ivy();

    app.use("*", async (c, next) => {
      c.req.setContext("userId", 123);
      c.req.setContext("sessionId", "abc-def-ghi");
      c.req.setContext("isAdmin", true);
      await next();
    });

    app.get("/test", (c) => {
      const userId = c.req.getContext<number>("userId");
      const sessionId = c.req.getContext<string>("sessionId");
      const isAdmin = c.req.getContext<boolean>("isAdmin");
      return c.res.json({ userId, sessionId, isAdmin });
    });

    const req = new Request("http://localhost/test", { method: "GET" });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data).toEqual({
      userId: 123,
      sessionId: "abc-def-ghi",
      isAdmin: true,
    });
  });

  it("should handle context with async operations in middleware", async () => {
    const app = new Ivy();

    app.use("*", async (c, next) => {
      // Simulate async operation
      await new Promise((resolve) => setTimeout(resolve, 1));
      c.req.setContext("asyncData", "loaded");
      await next();
    });

    app.get("/test", (c) => {
      const asyncData = c.req.getContext<string>("asyncData");
      return c.res.json({ asyncData });
    });

    const req = new Request("http://localhost/test", { method: "GET" });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data.asyncData).toBe("loaded");
  });

  it("should work with different HTTP methods", async () => {
    const app = new Ivy();

    app.use("*", async (c, next) => {
      c.req.setContext("method", c.req.raw.method);
      await next();
    });

    app.post("/test", (c) => {
      const method = c.req.getContext<string>("method");
      return c.res.json({ method });
    });

    const req = new Request("http://localhost/test", { method: "POST" });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data.method).toBe("POST");
  });

  it("should allow context modification by reference", async () => {
    const app = new Ivy();

    interface Counter {
      count: number;
    }

    app.use("*", async (c, next) => {
      c.req.setContext<Counter>("counter", { count: 0 });
      await next();
    });

    app.use("*", async (c, next) => {
      const counter = c.req.getContext<Counter>("counter");
      if (counter) {
        counter.count++;
      }
      await next();
    });

    app.use("*", async (c, next) => {
      const counter = c.req.getContext<Counter>("counter");
      if (counter) {
        counter.count++;
      }
      await next();
    });

    app.get("/test", (c) => {
      const counter = c.req.getContext<Counter>("counter");
      return c.res.json({ count: counter?.count });
    });

    const req = new Request("http://localhost/test", { method: "GET" });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data.count).toBe(2);
  });

  it("should support context-based rate limiting pattern", async () => {
    const app = new Ivy();

    interface RateLimitData {
      requestCount: number;
      firstRequestTime: number;
    }

    // Simulating rate limiting (normally would use external storage)
    app.use("*", async (c, next) => {
      const rateLimitData: RateLimitData = {
        requestCount: 1,
        firstRequestTime: Date.now(),
      };
      c.req.setContext<RateLimitData>("rateLimit", rateLimitData);
      await next();
    });

    app.get("/test", (c) => {
      const rateLimit = c.req.getContext<RateLimitData>("rateLimit");
      return c.res.json({
        count: rateLimit?.requestCount,
        hasTimestamp: typeof rateLimit?.firstRequestTime === "number",
      });
    });

    const req = new Request("http://localhost/test", { method: "GET" });
    const response = await app.fetch(req);
    const data = await response.json();

    expect(data.count).toBe(1);
    expect(data.hasTimestamp).toBe(true);
  });
});
