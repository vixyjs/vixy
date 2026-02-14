import { describe, expect, it } from "vitest";
import { IvyContext } from "./context";

describe("IvyContext", () => {
  describe("res.text()", () => {
    it("should return text response with default status 200", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.text("Hello World");

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/plain");
      expect(await response.text()).toBe("Hello World");
    });

    it("should return text response with custom status", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.text("Created", 201);

      expect(response.status).toBe(201);
      expect(await response.text()).toBe("Created");
    });
  });

  describe("res.json()", () => {
    it("should return JSON response with default status 200", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const data = { message: "Hello JSON" };

      const response = ctx.res.json(data);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(await response.json()).toEqual(data);
    });

    it("should return JSON response with custom status", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const data = { error: "Not Found" };

      const response = ctx.res.json(data, 404);

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual(data);
    });

    it("should handle array data", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const data = [1, 2, 3];

      const response = ctx.res.json(data);

      expect(await response.json()).toEqual(data);
    });
  });

  describe("res.html()", () => {
    it("should return HTML response with default status 200", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const html = "<h1>Hello HTML</h1>";

      const response = ctx.res.html(html);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/html");
      expect(await response.text()).toBe(html);
    });

    it("should return HTML response with custom status", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const html = "<h1>Server Error</h1>";

      const response = ctx.res.html(html, 500);

      expect(response.status).toBe(500);
      expect(await response.text()).toBe(html);
    });
  });

  describe("res.null()", () => {
    it("should return null response with default status 204", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.null();

      expect(response.status).toBe(204);
      expect(await response.text()).toBe("");
    });

    it("should return null response with custom status 204", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.null(204);

      expect(response.status).toBe(204);
      expect(await response.text()).toBe("");
    });

    it("should return null response with status 205", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.null(205);

      expect(response.status).toBe(205);
      expect(await response.text()).toBe("");
    });

    it("should return null response with status 304", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.null(304);

      expect(response.status).toBe(304);
      expect(await response.text()).toBe("");
    });

    it("should not have Content-Type header", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.null();

      expect(response.headers.get("Content-Type")).toBeNull();
    });
  });

  describe("constructor", () => {
    it("should store the raw request object", () => {
      const req = new Request("http://localhost/test");
      const ctx = new IvyContext(req);

      expect(ctx.req.raw).toBe(req);
      expect(ctx.req.raw.url).toBe("http://localhost/test");
    });

    it("should store params when provided", () => {
      const req = new Request("http://localhost/test");
      const params = { id: "123", name: "john" };
      const ctx = new IvyContext(req, params);

      expect(ctx.req.param("id")).toBe("123");
      expect(ctx.req.param("name")).toBe("john");
      expect(ctx.req.params).toEqual(params);
    });

    it("should initialize with empty params when not provided", () => {
      const req = new Request("http://localhost/test");
      const ctx = new IvyContext(req);

      expect(ctx.req.param("anything")).toBeUndefined();
      expect(ctx.req.params).toEqual({});
    });

    it("should provide param method on req object", () => {
      const req = new Request("http://localhost/test");
      const params = { userId: "999" };
      const ctx = new IvyContext(req, params);

      expect(ctx.req.param("userId")).toBe("999");
      expect(ctx.req.param("nonExistent")).toBeUndefined();
    });
  });

  describe("req.param()", () => {
    it("should return param value when it exists", () => {
      const req = new Request("http://localhost/test");
      const params = { userId: "456", action: "edit" };
      const ctx = new IvyContext(req, params);

      expect(ctx.req.param("userId")).toBe("456");
      expect(ctx.req.param("action")).toBe("edit");
    });

    it("should return undefined for non-existent param", () => {
      const req = new Request("http://localhost/test");
      const params = { id: "123" };
      const ctx = new IvyContext(req, params);

      expect(ctx.req.param("nonExistent")).toBeUndefined();
    });

    it("should return undefined when no params were set", () => {
      const req = new Request("http://localhost/test");
      const ctx = new IvyContext(req);

      expect(ctx.req.param("id")).toBeUndefined();
    });
  });

  describe("req.params", () => {
    it("should provide direct access to params object", () => {
      const req = new Request("http://localhost/test");
      const params = { id: "123", name: "test" };
      const ctx = new IvyContext(req, params);

      expect(ctx.req.params.id).toBe("123");
      expect(ctx.req.params.name).toBe("test");
    });
  });

  describe("req.raw", () => {
    it("should provide access to raw Request properties", () => {
      const req = new Request("http://localhost/test?foo=bar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const ctx = new IvyContext(req);

      expect(ctx.req.raw.url).toBe("http://localhost/test?foo=bar");
      expect(ctx.req.raw.method).toBe("POST");
      expect(ctx.req.raw.headers.get("Content-Type")).toBe("application/json");
    });

    it("should allow reading request body via raw", async () => {
      const req = new Request("http://localhost/test", {
        method: "POST",
        body: JSON.stringify({ key: "value" }),
        headers: { "Content-Type": "application/json" },
      });
      const ctx = new IvyContext(req);

      const body = await ctx.req.raw.json();
      expect(body).toEqual({ key: "value" });
    });
  });

  describe("req.query()", () => {
    it("should return specific query parameter", () => {
      const req = new Request("http://localhost/search?q=hello&limit=10");
      const ctx = new IvyContext(req);

      expect(ctx.req.query("q")).toBe("hello");
      expect(ctx.req.query("limit")).toBe("10");
    });

    it("should return undefined for non-existent query parameter", () => {
      const req = new Request("http://localhost/search?q=hello");
      const ctx = new IvyContext(req);

      expect(ctx.req.query("nonExistent")).toBeUndefined();
    });

    it("should return all query parameters when called without arguments", () => {
      const req = new Request(
        "http://localhost/search?q=hello&limit=10&offset=0",
      );
      const ctx = new IvyContext(req);

      const allParams = ctx.req.query();
      expect(allParams).toEqual({
        q: "hello",
        limit: "10",
        offset: "0",
      });
    });

    it("should return empty object when no query parameters", () => {
      const req = new Request("http://localhost/search");
      const ctx = new IvyContext(req);

      const allParams = ctx.req.query();
      expect(allParams).toEqual({});
    });

    it("should handle URL-encoded query parameters", () => {
      const req = new Request(
        "http://localhost/search?q=hello%20world&name=John%20Doe",
      );
      const ctx = new IvyContext(req);

      expect(ctx.req.query("q")).toBe("hello world");
      expect(ctx.req.query("name")).toBe("John Doe");
    });

    it("should return first value for duplicate query parameters", () => {
      const req = new Request("http://localhost/search?tag=A&tag=B");
      const ctx = new IvyContext(req);

      expect(ctx.req.query("tag")).toBe("A");
    });
  });

  describe("req.queries()", () => {
    it("should return array of values for multiple query parameters", () => {
      const req = new Request("http://localhost/search?tags=A&tags=B&tags=C");
      const ctx = new IvyContext(req);

      const tags = ctx.req.queries("tags");
      expect(tags).toEqual(["A", "B", "C"]);
    });

    it("should return array with single value for single parameter", () => {
      const req = new Request("http://localhost/search?tag=A");
      const ctx = new IvyContext(req);

      const tags = ctx.req.queries("tag");
      expect(tags).toEqual(["A"]);
    });

    it("should return undefined for non-existent parameter", () => {
      const req = new Request("http://localhost/search?q=hello");
      const ctx = new IvyContext(req);

      const tags = ctx.req.queries("tags");
      expect(tags).toBeUndefined();
    });

    it("should handle multiple parameters with different names", () => {
      const req = new Request(
        "http://localhost/search?tags=A&tags=B&colors=red&colors=blue",
      );
      const ctx = new IvyContext(req);

      expect(ctx.req.queries("tags")).toEqual(["A", "B"]);
      expect(ctx.req.queries("colors")).toEqual(["red", "blue"]);
    });

    it("should handle URL-encoded values", () => {
      const req = new Request(
        "http://localhost/search?tags=hello%20world&tags=foo%20bar",
      );
      const ctx = new IvyContext(req);

      const tags = ctx.req.queries("tags");
      expect(tags).toEqual(["hello world", "foo bar"]);
    });
  });

  describe("req.href", () => {
    it("should provide full URL including query parameters", () => {
      const req = new Request(
        "http://localhost:8787/users/123?auto=true&format=json",
      );
      const ctx = new IvyContext(req);

      expect(ctx.req.href).toBe(
        "http://localhost:8787/users/123?auto=true&format=json",
      );
    });

    it("should work with URL without query parameters", () => {
      const req = new Request("http://localhost/users/123");
      const ctx = new IvyContext(req);

      expect(ctx.req.href).toBe("http://localhost/users/123");
    });
  });

  describe("req.pathname", () => {
    it("should provide pathname of the request", () => {
      const req = new Request("http://localhost/users/123?auto=true");
      const ctx = new IvyContext(req);

      expect(ctx.req.pathname).toBe("/users/123");
    });

    it("should handle root path", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      expect(ctx.req.pathname).toBe("/");
    });

    it("should not include query parameters", () => {
      const req = new Request("http://localhost/search?q=test&limit=10");
      const ctx = new IvyContext(req);

      expect(ctx.req.pathname).toBe("/search");
    });
  });

  describe("req.routePathname", () => {
    it("should provide the defined route path pattern", () => {
      const req = new Request("http://localhost/users/123");
      const ctx = new IvyContext(req, { userId: "123" }, "/users/:userId");

      expect(ctx.req.routePathname).toBe("/users/:userId");
    });

    it("should work with wildcard routes", () => {
      const req = new Request("http://localhost/files/abc/download");
      const ctx = new IvyContext(req, {}, "/files/*/download");

      expect(ctx.req.routePathname).toBe("/files/*/download");
    });

    it("should be empty string when not provided", () => {
      const req = new Request("http://localhost/test");
      const ctx = new IvyContext(req);

      expect(ctx.req.routePathname).toBe("");
    });

    it("should handle static routes", () => {
      const req = new Request("http://localhost/about");
      const ctx = new IvyContext(req, {}, "/about");

      expect(ctx.req.routePathname).toBe("/about");
    });
  });

  describe("res.header()", () => {
    it("should set custom header on text response", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.header("X-Custom-Header", "custom-value");
      const response = ctx.res.text("Hello");

      expect(response.headers.get("X-Custom-Header")).toBe("custom-value");
      expect(response.headers.get("Content-Type")).toBe("text/plain");
    });

    it("should set custom header on json response", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.header("X-Request-Id", "12345");
      const response = ctx.res.json({ data: "test" });

      expect(response.headers.get("X-Request-Id")).toBe("12345");
      expect(response.headers.get("Content-Type")).toBe("application/json");
    });

    it("should set custom header on html response", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.header("X-Frame-Options", "DENY");
      const response = ctx.res.html("<h1>Test</h1>");

      expect(response.headers.get("X-Frame-Options")).toBe("DENY");
      expect(response.headers.get("Content-Type")).toBe("text/html");
    });

    it("should set custom header on null response", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.header("X-Custom", "value");
      const response = ctx.res.null();

      expect(response.headers.get("X-Custom")).toBe("value");
    });

    it("should set multiple custom headers", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.header("X-Header-1", "value1");
      ctx.res.header("X-Header-2", "value2");
      ctx.res.header("X-Header-3", "value3");
      const response = ctx.res.text("Hello");

      expect(response.headers.get("X-Header-1")).toBe("value1");
      expect(response.headers.get("X-Header-2")).toBe("value2");
      expect(response.headers.get("X-Header-3")).toBe("value3");
    });

    it("should use last declared value when header is set multiple times", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.header("X-Custom", "first");
      ctx.res.header("X-Custom", "second");
      ctx.res.header("X-Custom", "third");
      const response = ctx.res.text("Hello");

      expect(response.headers.get("X-Custom")).toBe("third");
    });

    it("should convert non-string values to strings", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.header("X-Number", 123);
      ctx.res.header("X-Boolean", true);
      ctx.res.header("X-Null", null);
      const response = ctx.res.json({ test: true });

      expect(response.headers.get("X-Number")).toBe("123");
      expect(response.headers.get("X-Boolean")).toBe("true");
      expect(response.headers.get("X-Null")).toBe("null");
    });

    it("should not affect responses from different contexts", async () => {
      const req1 = new Request("http://localhost/1");
      const ctx1 = new IvyContext(req1);
      ctx1.res.header("X-Context", "context1");

      const req2 = new Request("http://localhost/2");
      const ctx2 = new IvyContext(req2);
      ctx2.res.header("X-Context", "context2");

      const response1 = ctx1.res.text("Hello 1");
      const response2 = ctx2.res.text("Hello 2");

      expect(response1.headers.get("X-Context")).toBe("context1");
      expect(response2.headers.get("X-Context")).toBe("context2");
    });
  });

  describe("req.cookie()", () => {
    it("should return specific cookie value", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "session=abc123; theme=dark" },
      });
      const ctx = new IvyContext(req);

      expect(ctx.req.cookie("session")).toBe("abc123");
      expect(ctx.req.cookie("theme")).toBe("dark");
    });

    it("should return undefined for non-existent cookie", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "session=abc123" },
      });
      const ctx = new IvyContext(req);

      expect(ctx.req.cookie("nonExistent")).toBeUndefined();
    });

    it("should return all cookies when called without arguments", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "session=abc123; theme=dark; lang=en" },
      });
      const ctx = new IvyContext(req);

      const allCookies = ctx.req.cookie();
      expect(allCookies).toEqual({
        session: "abc123",
        theme: "dark",
        lang: "en",
      });
    });

    it("should return empty object when no cookies", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const allCookies = ctx.req.cookie();
      expect(allCookies).toEqual({});
    });

    it("should handle cookies with spaces around equals sign", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "key1 = value1; key2= value2 ;key3 =value3" },
      });
      const ctx = new IvyContext(req);

      expect(ctx.req.cookie("key1")).toBe("value1");
      expect(ctx.req.cookie("key2")).toBe("value2");
      expect(ctx.req.cookie("key3")).toBe("value3");
    });

    it("should handle cookies with special characters in values", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "data=hello%20world; token=Bearer%20abc123" },
      });
      const ctx = new IvyContext(req);

      expect(ctx.req.cookie("data")).toBe("hello%20world");
      expect(ctx.req.cookie("token")).toBe("Bearer%20abc123");
    });

    it("should handle single cookie", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "session=abc123" },
      });
      const ctx = new IvyContext(req);

      expect(ctx.req.cookie("session")).toBe("abc123");
      expect(ctx.req.cookie()).toEqual({ session: "abc123" });
    });

    it("should ignore malformed cookies without equals sign", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "validCookie=value; malformedCookie; another=test" },
      });
      const ctx = new IvyContext(req);

      const allCookies = ctx.req.cookie();
      expect(allCookies).toEqual({
        validCookie: "value",
        another: "test",
      });
      expect(ctx.req.cookie("malformedCookie")).toBeUndefined();
    });

    it("should handle empty cookie values", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "empty=; session=abc123" },
      });
      const ctx = new IvyContext(req);

      expect(ctx.req.cookie("empty")).toBe("");
      expect(ctx.req.cookie("session")).toBe("abc123");
    });

    it("should handle cookies with only whitespace separators", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "   key1=value1  ;  key2=value2   " },
      });
      const ctx = new IvyContext(req);

      expect(ctx.req.cookie("key1")).toBe("value1");
      expect(ctx.req.cookie("key2")).toBe("value2");
    });
  });

  describe("res.cookie()", () => {
    it("should set basic cookie", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123");
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe("session=abc123");
    });

    it("should set cookie with maxAge", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", { maxAge: 3600 });
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe(
        "session=abc123; Max-Age=3600",
      );
    });

    it("should set cookie with expires", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const expires = new Date("2026-12-31T23:59:59Z");

      ctx.res.cookie("session", "abc123", { expires });
      const response = ctx.res.text("Hello");

      const cookie = response.headers.get("Set-Cookie");
      expect(cookie).toContain("session=abc123; Expires=");
      expect(cookie).toContain("31 Dec 2026 23:59:59 GMT");
    });

    it("should prefer maxAge over expires when both are set", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const expires = new Date("2026-12-31T23:59:59Z");

      ctx.res.cookie("session", "abc123", { maxAge: 3600, expires });
      const response = ctx.res.text("Hello");

      const cookie = response.headers.get("Set-Cookie");
      expect(cookie).toContain("Max-Age=3600");
      expect(cookie).not.toContain("Expires");
    });

    it("should set cookie with domain", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", { domain: "example.com" });
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe(
        "session=abc123; Domain=example.com",
      );
    });

    it("should set cookie with path", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", { path: "/admin" });
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe(
        "session=abc123; Path=/admin",
      );
    });

    it("should set cookie with secure flag", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", { secure: true });
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe("session=abc123; Secure");
    });

    it("should not set secure flag when false", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", { secure: false });
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe("session=abc123");
    });

    it("should set cookie with httpOnly flag", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", { httpOnly: true });
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe(
        "session=abc123; HttpOnly",
      );
    });

    it("should not set httpOnly flag when false", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", { httpOnly: false });
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe("session=abc123");
    });

    it("should set cookie with sameSite=Strict", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", { sameSite: "Strict" });
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe(
        "session=abc123; SameSite=Strict",
      );
    });

    it("should set cookie with sameSite=Lax", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", { sameSite: "Lax" });
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe(
        "session=abc123; SameSite=Lax",
      );
    });

    it("should set cookie with sameSite=None", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", { sameSite: "None" });
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe(
        "session=abc123; SameSite=None",
      );
    });

    it("should set cookie with all options", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", {
        maxAge: 3600,
        domain: "example.com",
        path: "/",
        secure: true,
        httpOnly: true,
        sameSite: "Strict",
      });
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe(
        "session=abc123; Max-Age=3600; Domain=example.com; Path=/; Secure; HttpOnly; SameSite=Strict",
      );
    });

    it("should work with json response", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", { httpOnly: true });
      const response = ctx.res.json({ message: "success" });

      expect(response.headers.get("Set-Cookie")).toBe(
        "session=abc123; HttpOnly",
      );
    });

    it("should work with html response", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123", { path: "/" });
      const response = ctx.res.html("<h1>Hello</h1>");

      expect(response.headers.get("Set-Cookie")).toBe("session=abc123; Path=/");
    });

    it("should work with null response", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "abc123");
      const response = ctx.res.null();

      expect(response.headers.get("Set-Cookie")).toBe("session=abc123");
    });

    it("should override previous cookie with same key", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.cookie("session", "first");
      ctx.res.cookie("session", "second", { httpOnly: true });
      const response = ctx.res.text("Hello");

      expect(response.headers.get("Set-Cookie")).toBe(
        "session=second; HttpOnly",
      );
    });
  });

  describe("res.redirect()", () => {
    it("should return redirect response with default status 302", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.redirect("/new-location");

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("/new-location");
    });

    it("should return redirect response with custom status 301", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.redirect("/permanent", 301);

      expect(response.status).toBe(301);
      expect(response.headers.get("Location")).toBe("/permanent");
    });

    it("should return redirect response with status 303", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.redirect("/see-other", 303);

      expect(response.status).toBe(303);
      expect(response.headers.get("Location")).toBe("/see-other");
    });

    it("should return redirect response with status 307", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.redirect("/temporary", 307);

      expect(response.status).toBe(307);
      expect(response.headers.get("Location")).toBe("/temporary");
    });

    it("should return redirect response with status 308", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.redirect("/permanent-redirect", 308);

      expect(response.status).toBe(308);
      expect(response.headers.get("Location")).toBe("/permanent-redirect");
    });

    it("should handle absolute URLs", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.redirect("https://example.com/page");

      expect(response.status).toBe(302);
      expect(response.headers.get("Location")).toBe("https://example.com/page");
    });

    it("should include custom headers", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.res.header("X-Custom-Header", "value");
      const response = ctx.res.redirect("/new-location");

      expect(response.headers.get("Location")).toBe("/new-location");
      expect(response.headers.get("X-Custom-Header")).toBe("value");
    });

    it("should have no body", async () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const response = ctx.res.redirect("/new-location");

      expect(await response.text()).toBe("");
    });
  });

  describe("req.setContext() and req.getContext()", () => {
    it("should set and get string values", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.req.setContext("email", "test@example.com");

      expect(ctx.req.getContext("email")).toBe("test@example.com");
    });

    it("should set and get number values", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.req.setContext("userId", 123);

      expect(ctx.req.getContext("userId")).toBe(123);
    });

    it("should set and get boolean values", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.req.setContext("isAuthenticated", true);

      expect(ctx.req.getContext("isAuthenticated")).toBe(true);
    });

    it("should set and get object values", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const user = { id: 1, name: "John Doe", email: "john@example.com" };

      ctx.req.setContext("user", user);

      expect(ctx.req.getContext("user")).toEqual(user);
    });

    it("should set and get array values", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const tags = ["tag1", "tag2", "tag3"];

      ctx.req.setContext("tags", tags);

      expect(ctx.req.getContext("tags")).toEqual(tags);
    });

    it("should set and get null values", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.req.setContext("nullValue", null);

      expect(ctx.req.getContext("nullValue")).toBeNull();
    });

    it("should set and get undefined values", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.req.setContext("undefinedValue", undefined);

      expect(ctx.req.getContext("undefinedValue")).toBeUndefined();
    });

    it("should return undefined for non-existent keys", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      expect(ctx.req.getContext("nonExistent")).toBeUndefined();
    });

    it("should overwrite existing values", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.req.setContext("key", "first");
      expect(ctx.req.getContext("key")).toBe("first");

      ctx.req.setContext("key", "second");
      expect(ctx.req.getContext("key")).toBe("second");
    });

    it("should handle multiple keys independently", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.req.setContext("key1", "value1");
      ctx.req.setContext("key2", "value2");
      ctx.req.setContext("key3", "value3");

      expect(ctx.req.getContext("key1")).toBe("value1");
      expect(ctx.req.getContext("key2")).toBe("value2");
      expect(ctx.req.getContext("key3")).toBe("value3");
    });

    it("should work with typed generic parameter", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      interface User {
        id: number;
        name: string;
      }

      const user: User = { id: 1, name: "Alice" };
      ctx.req.setContext<User>("user", user);

      const retrieved = ctx.req.getContext<User>("user");
      expect(retrieved).toEqual(user);
      expect(retrieved?.id).toBe(1);
      expect(retrieved?.name).toBe("Alice");
    });

    it("should not share context between different request contexts", () => {
      const req1 = new Request("http://localhost/1");
      const ctx1 = new IvyContext(req1);
      ctx1.req.setContext("key", "value1");

      const req2 = new Request("http://localhost/2");
      const ctx2 = new IvyContext(req2);
      ctx2.req.setContext("key", "value2");

      expect(ctx1.req.getContext("key")).toBe("value1");
      expect(ctx2.req.getContext("key")).toBe("value2");
    });

    it("should maintain context throughout request lifecycle", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      // Simulate middleware setting context
      ctx.req.setContext("email", "test@example.com");
      ctx.req.setContext("userId", 456);

      // Simulate handler accessing context
      const email = ctx.req.getContext<string>("email");
      const userId = ctx.req.getContext<number>("userId");

      expect(email).toBe("test@example.com");
      expect(userId).toBe(456);
    });

    it("should handle complex nested objects", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      const complexData = {
        user: {
          id: 1,
          profile: {
            name: "John",
            address: {
              street: "123 Main St",
              city: "New York",
            },
          },
        },
        permissions: ["read", "write"],
      };

      ctx.req.setContext("data", complexData);

      const retrieved = ctx.req.getContext("data");
      expect(retrieved).toEqual(complexData);
      expect(retrieved.user.profile.address.city).toBe("New York");
    });

    it("should handle Date objects", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const now = new Date("2026-02-14T12:00:00Z");

      ctx.req.setContext("timestamp", now);

      const retrieved = ctx.req.getContext<Date>("timestamp");
      expect(retrieved).toEqual(now);
      expect(retrieved?.getTime()).toBe(now.getTime());
    });

    it("should handle Map objects", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const map = new Map([
        ["key1", "value1"],
        ["key2", "value2"],
      ]);

      ctx.req.setContext("map", map);

      const retrieved = ctx.req.getContext<Map<string, string>>("map");
      expect(retrieved).toEqual(map);
      expect(retrieved?.get("key1")).toBe("value1");
    });

    it("should handle Set objects", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const set = new Set([1, 2, 3, 4, 5]);

      ctx.req.setContext("set", set);

      const retrieved = ctx.req.getContext<Set<number>>("set");
      expect(retrieved).toEqual(set);
      expect(retrieved?.has(3)).toBe(true);
    });

    it("should handle function values", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const fn = (x: number) => x * 2;

      ctx.req.setContext("fn", fn);

      const retrieved = ctx.req.getContext<typeof fn>("fn");
      expect(retrieved).toBe(fn);
      expect(retrieved?.(5)).toBe(10);
    });

    it("should handle Symbol keys", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const symKey = "symbolKey";

      ctx.req.setContext(symKey, "symbolValue");

      expect(ctx.req.getContext(symKey)).toBe("symbolValue");
    });

    it("should allow storing and retrieving empty strings", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.req.setContext("emptyString", "");

      expect(ctx.req.getContext("emptyString")).toBe("");
    });

    it("should allow storing and retrieving zero", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.req.setContext("zero", 0);

      expect(ctx.req.getContext("zero")).toBe(0);
    });

    it("should allow storing and retrieving false", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.req.setContext("false", false);

      expect(ctx.req.getContext("false")).toBe(false);
    });

    it("should handle rapid successive updates", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      for (let i = 0; i < 100; i++) {
        ctx.req.setContext("counter", i);
      }

      expect(ctx.req.getContext("counter")).toBe(99);
    });

    it("should handle many different keys", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      for (let i = 0; i < 100; i++) {
        ctx.req.setContext(`key${i}`, `value${i}`);
      }

      expect(ctx.req.getContext("key0")).toBe("value0");
      expect(ctx.req.getContext("key50")).toBe("value50");
      expect(ctx.req.getContext("key99")).toBe("value99");
    });

    it("should work with class instances", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      class TestClass {
        constructor(public value: string) {}
        getValue() {
          return this.value;
        }
      }

      const instance = new TestClass("test");
      ctx.req.setContext("instance", instance);

      const retrieved = ctx.req.getContext<TestClass>("instance");
      expect(retrieved).toBe(instance);
      expect(retrieved?.getValue()).toBe("test");
    });

    it("should handle Error objects", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const error = new Error("Test error");

      ctx.req.setContext("error", error);

      const retrieved = ctx.req.getContext<Error>("error");
      expect(retrieved).toBe(error);
      expect(retrieved?.message).toBe("Test error");
    });

    it("should handle regular expressions", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const regex = /test.*pattern/gi;

      ctx.req.setContext("regex", regex);

      const retrieved = ctx.req.getContext<RegExp>("regex");
      expect(retrieved).toBe(regex);
      expect(retrieved?.test("test some pattern")).toBe(true);
    });

    it("should handle Buffer objects", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const buffer = Buffer.from("Hello World");

      ctx.req.setContext("buffer", buffer);

      const retrieved = ctx.req.getContext<Buffer>("buffer");
      expect(retrieved).toBe(buffer);
      expect(retrieved?.toString()).toBe("Hello World");
    });

    it("should handle BigInt values", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const bigIntValue = BigInt(9007199254740991);

      ctx.req.setContext("bigInt", bigIntValue);

      const retrieved = ctx.req.getContext<bigint>("bigInt");
      expect(retrieved).toBe(bigIntValue);
    });

    it("should preserve object references", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const obj = { mutable: true };

      ctx.req.setContext("obj", obj);

      const retrieved = ctx.req.getContext("obj");
      expect(retrieved).toBe(obj);

      // Mutating retrieved object should affect original
      if (retrieved) {
        retrieved.mutable = false;
      }
      expect(obj.mutable).toBe(false);
    });

    it("should work with keys containing special characters", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.req.setContext("key-with-dashes", "value1");
      ctx.req.setContext("key.with.dots", "value2");
      ctx.req.setContext("key:with:colons", "value3");
      ctx.req.setContext("key with spaces", "value4");

      expect(ctx.req.getContext("key-with-dashes")).toBe("value1");
      expect(ctx.req.getContext("key.with.dots")).toBe("value2");
      expect(ctx.req.getContext("key:with:colons")).toBe("value3");
      expect(ctx.req.getContext("key with spaces")).toBe("value4");
    });

    it("should handle unicode keys", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);

      ctx.req.setContext("🔑", "emoji key");
      ctx.req.setContext("日本語", "japanese");

      expect(ctx.req.getContext("🔑")).toBe("emoji key");
      expect(ctx.req.getContext("日本語")).toBe("japanese");
    });

    it("should handle very long strings", () => {
      const req = new Request("http://localhost/");
      const ctx = new IvyContext(req);
      const longString = "a".repeat(10000);

      ctx.req.setContext("longString", longString);

      expect(ctx.req.getContext("longString")).toBe(longString);
      expect(ctx.req.getContext<string>("longString")?.length).toBe(10000);
    });
  });
});
