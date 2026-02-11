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

    it("should register OPTIONS routes", async () => {
      const app = new Ivy();

      app.options("/test", (c) => c.text("OPTIONS response"));

      const req = new Request("http://localhost/test", { method: "OPTIONS" });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("OPTIONS response");
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

      app.on(["GET", "POST"], ["/api/v1", "/api/v2"], (c) =>
        c.text("Multi response"),
      );

      const tests = [
        { method: "GET", path: "/api/v1" },
        { method: "GET", path: "/api/v2" },
        { method: "POST", path: "/api/v1" },
        { method: "POST", path: "/api/v2" },
      ];

      for (const test of tests) {
        const req = new Request(`http://localhost${test.path}`, {
          method: test.method,
        });
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

      const getReq = new Request("http://localhost/get-route", {
        method: "GET",
      });
      const getRes = await app.fetch(getReq);
      expect(await getRes.text()).toBe("GET helper");

      const postReq = new Request("http://localhost/post-route", {
        method: "POST",
      });
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

      const req = new Request("http://localhost/wild/anything/card", {
        method: "GET",
      });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("GET /wild/*/card");
    });

    it("should match wildcard with different values", async () => {
      const app = new Ivy();

      app.get("/files/*/download", (c) => c.text("Download"));

      const req1 = new Request("http://localhost/files/123/download", {
        method: "GET",
      });
      const res1 = await app.fetch(req1);
      expect(await res1.text()).toBe("Download");

      const req2 = new Request("http://localhost/files/abc/download", {
        method: "GET",
      });
      const res2 = await app.fetch(req2);
      expect(await res2.text()).toBe("Download");
    });

    it("should match multiple wildcards", async () => {
      const app = new Ivy();

      app.get("/api/*/users/*/profile", (c) => c.text("Profile"));

      const req = new Request("http://localhost/api/v1/users/123/profile", {
        method: "GET",
      });
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

      const req = new Request("http://localhost/users/123/posts/456", {
        method: "GET",
      });
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

      const req1 = new Request("http://localhost/product/abc", {
        method: "GET",
      });
      const res1 = await app.fetch(req1);
      expect(await res1.text()).toBe("Product abc");

      const req2 = new Request("http://localhost/product/123", {
        method: "GET",
      });
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

      const req = new Request("http://localhost/api/v2/users", {
        method: "POST",
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        version: "v2",
        action: "create",
      });
    });

    it("should combine with .on() method", async () => {
      const app = new Ivy();

      app.on(["GET", "POST"], "/resource/:id", (c) => {
        const id = c.req.param("id");
        return c.text(`Resource ${id}`);
      });

      const getReq = new Request("http://localhost/resource/123", {
        method: "GET",
      });
      const getRes = await app.fetch(getReq);
      expect(await getRes.text()).toBe("Resource 123");

      const postReq = new Request("http://localhost/resource/456", {
        method: "POST",
      });
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

      const req = new Request("http://localhost/user/456/profile/settings", {
        method: "GET",
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({ id: "456", section: "settings" });
    });
  });

  describe("query parameters", () => {
    it("should access single query parameter", async () => {
      const app = new Ivy();

      app.get("/search", (c) => {
        const q = c.req.query("q");
        return c.text(`Search: ${q}`);
      });

      const req = new Request("http://localhost/search?q=hello", {
        method: "GET",
      });
      const response = await app.fetch(req);

      expect(await response.text()).toBe("Search: hello");
    });

    it("should access all query parameters at once", async () => {
      const app = new Ivy();

      app.get("/search", (c) => {
        const { q, limit, offset } = c.req.query();
        return c.json({ q, limit, offset });
      });

      const req = new Request(
        "http://localhost/search?q=test&limit=10&offset=20",
        { method: "GET" },
      );
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        q: "test",
        limit: "10",
        offset: "20",
      });
    });

    it("should get multiple values with queries()", async () => {
      const app = new Ivy();

      app.get("/filter", (c) => {
        const tags = c.req.queries("tags");
        return c.json({ tags });
      });

      const req = new Request("http://localhost/filter?tags=A&tags=B&tags=C", {
        method: "GET",
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({ tags: ["A", "B", "C"] });
    });

    it("should combine path params and query params", async () => {
      const app = new Ivy();

      app.get("/users/:id", (c) => {
        const id = c.req.param("id");
        const format = c.req.query("format");
        return c.json({ userId: id, format });
      });

      const req = new Request("http://localhost/users/123?format=json", {
        method: "GET",
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({ userId: "123", format: "json" });
    });

    it("should handle URL-encoded query parameters", async () => {
      const app = new Ivy();

      app.get("/search", (c) => {
        const q = c.req.query("q");
        return c.text(`Search: ${q}`);
      });

      const req = new Request("http://localhost/search?q=hello%20world", {
        method: "GET",
      });
      const response = await app.fetch(req);

      expect(await response.text()).toBe("Search: hello world");
    });
  });

  describe("request metadata", () => {
    it("should provide req.pathname", async () => {
      const app = new Ivy();

      app.get("/users/:id", (c) => {
        return c.json({ pathname: c.req.pathname });
      });

      const req = new Request("http://localhost/users/123?auto=true", {
        method: "GET",
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({ pathname: "/users/123" });
    });

    it("should provide req.href with full URL", async () => {
      const app = new Ivy();

      app.get("/test", (c) => {
        return c.json({ href: c.req.href });
      });

      const req = new Request("http://localhost:8787/test?foo=bar", {
        method: "GET",
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        href: "http://localhost:8787/test?foo=bar",
      });
    });

    it("should provide req.routePathname with defined route pattern", async () => {
      const app = new Ivy();

      app.get("/users/:userId", (c) => {
        return c.json({
          pathname: c.req.pathname,
          routePathname: c.req.routePathname,
          userId: c.req.param("userId"),
        });
      });

      const req = new Request("http://localhost/users/1232?auto=true", {
        method: "GET",
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        pathname: "/users/1232",
        routePathname: "/users/:userId",
        userId: "1232",
      });
    });

    it("should handle wildcard in routePathname", async () => {
      const app = new Ivy();

      app.get("/files/*/download", (c) => {
        return c.json({
          pathname: c.req.pathname,
          routePathname: c.req.routePathname,
        });
      });

      const req = new Request("http://localhost/files/abc123/download", {
        method: "GET",
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        pathname: "/files/abc123/download",
        routePathname: "/files/*/download",
      });
    });

    it("should provide all metadata together", async () => {
      const app = new Ivy();

      app.get("/api/:version/users/:id", (c) => {
        return c.json({
          href: c.req.href,
          pathname: c.req.pathname,
          routePathname: c.req.routePathname,
          version: c.req.param("version"),
          id: c.req.param("id"),
          format: c.req.query("format"),
        });
      });

      const req = new Request(
        "http://localhost:8787/api/v2/users/1232?format=json",
        { method: "GET" },
      );
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        href: "http://localhost:8787/api/v2/users/1232?format=json",
        pathname: "/api/v2/users/1232",
        routePathname: "/api/:version/users/:id",
        version: "v2",
        id: "1232",
        format: "json",
      });
    });
  });

  describe("request body parsers", () => {
    it("should parse JSON body with req.json()", async () => {
      const app = new Ivy();

      app.post("/api/data", async (c) => {
        const body = await c.req.json();
        return c.json({ received: body });
      });

      const req = new Request("http://localhost/api/data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "John", age: 30 }),
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        received: { name: "John", age: 30 },
      });
    });

    it("should parse text body with req.text()", async () => {
      const app = new Ivy();

      app.post("/api/echo", async (c) => {
        const body = await c.req.text();
        return c.text(`Received: ${body}`);
      });

      const req = new Request("http://localhost/api/echo", {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: "Hello, World!",
      });
      const response = await app.fetch(req);

      expect(await response.text()).toBe("Received: Hello, World!");
    });

    it("should parse form data with req.formData()", async () => {
      const app = new Ivy();

      app.post("/api/form", async (c) => {
        const formData = await c.req.formData();
        const name = formData.get("name");
        const email = formData.get("email");
        return c.json({ name, email });
      });

      const formData = new FormData();
      formData.append("name", "Alice");
      formData.append("email", "alice@example.com");

      const req = new Request("http://localhost/api/form", {
        method: "POST",
        body: formData,
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        name: "Alice",
        email: "alice@example.com",
      });
    });

    it("should parse array buffer with req.arrayBuffer()", async () => {
      const app = new Ivy();

      app.post("/api/binary", async (c) => {
        const buffer = await c.req.arrayBuffer();
        return c.json({ byteLength: buffer.byteLength });
      });

      const data = new Uint8Array([1, 2, 3, 4, 5]);
      const req = new Request("http://localhost/api/binary", {
        method: "POST",
        body: data,
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({ byteLength: 5 });
    });

    it("should parse blob with req.blob()", async () => {
      const app = new Ivy();

      app.post("/api/blob", async (c) => {
        const blob = await c.req.blob();
        return c.json({ size: blob.size });
      });

      const blob = new Blob(["test content"], { type: "text/plain" });
      const req = new Request("http://localhost/api/blob", {
        method: "POST",
        body: blob,
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        size: 12,
      });
    });

    it("should allow multiple body parser calls without 'Body already used' error", async () => {
      const app = new Ivy();

      app.post("/api/multi", async (c) => {
        const text1 = await c.req.text();
        const text2 = await c.req.text();
        return c.json({ text1, text2, same: text1 === text2 });
      });

      const req = new Request("http://localhost/api/multi", {
        method: "POST",
        body: "test data",
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        text1: "test data",
        text2: "test data",
        same: true,
      });
    });

    it("should allow accessing raw request after using body parser", async () => {
      const app = new Ivy();

      app.post("/api/test", async (c) => {
        const body = await c.req.json();
        const method = c.req.raw.method;
        return c.json({ body, method });
      });

      const req = new Request("http://localhost/api/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ test: true }),
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        body: { test: true },
        method: "POST",
      });
    });

    it("should cache body and allow different parser methods", async () => {
      const app = new Ivy();

      app.post("/api/mixed", async (c) => {
        const json = await c.req.json();
        const text = await c.req.text();
        const buffer = await c.req.arrayBuffer();
        return c.json({
          json,
          textLength: text.length,
          bufferLength: buffer.byteLength,
        });
      });

      const payload = { value: 42 };
      const body = JSON.stringify(payload);
      const req = new Request("http://localhost/api/mixed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: body,
      });
      const response = await app.fetch(req);

      const result = await response.json();
      expect(result.json).toEqual({ value: 42 });
      expect(result.textLength).toBe(body.length);
      expect(result.bufferLength).toBe(body.length);
    });

    it("should handle empty body", async () => {
      const app = new Ivy();

      app.post("/api/empty", async (c) => {
        const text = await c.req.text();
        return c.json({ isEmpty: text === "", length: text.length });
      });

      const req = new Request("http://localhost/api/empty", {
        method: "POST",
        body: "",
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({ isEmpty: true, length: 0 });
    });
  });

  describe("request headers", () => {
    it("should access single header by name", async () => {
      const app = new Ivy();

      app.get("/test", (c) => {
        const userAgent = c.req.header("User-Agent");
        return c.text(`UA: ${userAgent}`);
      });

      const req = new Request("http://localhost/test", {
        method: "GET",
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      const response = await app.fetch(req);

      expect(await response.text()).toBe("UA: Mozilla/5.0");
    });

    it("should return undefined for non-existent header", async () => {
      const app = new Ivy();

      app.get("/test", (c) => {
        const header = c.req.header("X-Custom-Header");
        return c.text(header === undefined ? "undefined" : header);
      });

      const req = new Request("http://localhost/test", { method: "GET" });
      const response = await app.fetch(req);

      expect(await response.text()).toBe("undefined");
    });

    it("should handle case-insensitive header names", async () => {
      const app = new Ivy();

      app.get("/test", (c) => {
        const contentType1 = c.req.header("Content-Type");
        const contentType2 = c.req.header("content-type");
        const contentType3 = c.req.header("CONTENT-TYPE");
        return c.json({
          contentType1,
          contentType2,
          contentType3,
        });
      });

      const req = new Request("http://localhost/test", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        contentType1: "application/json",
        contentType2: "application/json",
        contentType3: "application/json",
      });
    });

    it("should access multiple different headers", async () => {
      const app = new Ivy();

      app.get("/api", (c) => {
        const userAgent = c.req.header("User-Agent");
        const accept = c.req.header("Accept");
        const authorization = c.req.header("Authorization");
        return c.json({ userAgent, accept, authorization });
      });

      const req = new Request("http://localhost/api", {
        method: "GET",
        headers: {
          "User-Agent": "TestClient/1.0",
          Accept: "application/json",
          Authorization: "Bearer token123",
        },
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        userAgent: "TestClient/1.0",
        accept: "application/json",
        authorization: "Bearer token123",
      });
    });

    it("should work with custom headers", async () => {
      const app = new Ivy();

      app.post("/webhook", (c) => {
        const signature = c.req.header("X-Webhook-Signature");
        const timestamp = c.req.header("X-Webhook-Timestamp");
        return c.json({ signature, timestamp });
      });

      const req = new Request("http://localhost/webhook", {
        method: "POST",
        headers: {
          "X-Webhook-Signature": "sha256=abc123",
          "X-Webhook-Timestamp": "1234567890",
        },
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        signature: "sha256=abc123",
        timestamp: "1234567890",
      });
    });

    it("should combine headers with path params and query params", async () => {
      const app = new Ivy();

      app.get("/users/:id", (c) => {
        const id = c.req.param("id");
        const format = c.req.query("format");
        const accept = c.req.header("Accept");
        return c.json({ userId: id, format, accept });
      });

      const req = new Request("http://localhost/users/123?format=compact", {
        method: "GET",
        headers: { Accept: "application/json" },
      });
      const response = await app.fetch(req);

      expect(await response.json()).toEqual({
        userId: "123",
        format: "compact",
        accept: "application/json",
      });
    });
  });
});
