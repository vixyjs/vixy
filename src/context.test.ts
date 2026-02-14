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
});
