import { describe, expect, it } from "vitest";
import { Context } from "./context";

describe("Context", () => {
  describe("text()", () => {
    it("should return text response with default status 200", async () => {
      const req = new Request("http://localhost/");
      const ctx = new Context(req);

      const response = ctx.text("Hello World");

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/plain");
      expect(await response.text()).toBe("Hello World");
    });

    it("should return text response with custom status", async () => {
      const req = new Request("http://localhost/");
      const ctx = new Context(req);

      const response = ctx.text("Created", 201);

      expect(response.status).toBe(201);
      expect(await response.text()).toBe("Created");
    });
  });

  describe("json()", () => {
    it("should return JSON response with default status 200", async () => {
      const req = new Request("http://localhost/");
      const ctx = new Context(req);
      const data = { message: "Hello JSON" };

      const response = ctx.json(data);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("application/json");
      expect(await response.json()).toEqual(data);
    });

    it("should return JSON response with custom status", async () => {
      const req = new Request("http://localhost/");
      const ctx = new Context(req);
      const data = { error: "Not Found" };

      const response = ctx.json(data, 404);

      expect(response.status).toBe(404);
      expect(await response.json()).toEqual(data);
    });

    it("should handle array data", async () => {
      const req = new Request("http://localhost/");
      const ctx = new Context(req);
      const data = [1, 2, 3];

      const response = ctx.json(data);

      expect(await response.json()).toEqual(data);
    });
  });

  describe("html()", () => {
    it("should return HTML response with default status 200", async () => {
      const req = new Request("http://localhost/");
      const ctx = new Context(req);
      const html = "<h1>Hello HTML</h1>";

      const response = ctx.html(html);

      expect(response.status).toBe(200);
      expect(response.headers.get("Content-Type")).toBe("text/html");
      expect(await response.text()).toBe(html);
    });

    it("should return HTML response with custom status", async () => {
      const req = new Request("http://localhost/");
      const ctx = new Context(req);
      const html = "<h1>Server Error</h1>";

      const response = ctx.html(html, 500);

      expect(response.status).toBe(500);
      expect(await response.text()).toBe(html);
    });
  });

  describe("constructor", () => {
    it("should store the raw request object", () => {
      const req = new Request("http://localhost/test");
      const ctx = new Context(req);

      expect(ctx.req.raw).toBe(req);
      expect(ctx.req.raw.url).toBe("http://localhost/test");
    });

    it("should store params when provided", () => {
      const req = new Request("http://localhost/test");
      const params = { id: "123", name: "john" };
      const ctx = new Context(req, params);

      expect(ctx.req.param("id")).toBe("123");
      expect(ctx.req.param("name")).toBe("john");
      expect(ctx.req.params).toEqual(params);
    });

    it("should initialize with empty params when not provided", () => {
      const req = new Request("http://localhost/test");
      const ctx = new Context(req);

      expect(ctx.req.param("anything")).toBeUndefined();
      expect(ctx.req.params).toEqual({});
    });

    it("should provide param method on req object", () => {
      const req = new Request("http://localhost/test");
      const params = { userId: "999" };
      const ctx = new Context(req, params);

      expect(ctx.req.param("userId")).toBe("999");
      expect(ctx.req.param("nonExistent")).toBeUndefined();
    });
  });

  describe("req.param()", () => {
    it("should return param value when it exists", () => {
      const req = new Request("http://localhost/test");
      const params = { userId: "456", action: "edit" };
      const ctx = new Context(req, params);

      expect(ctx.req.param("userId")).toBe("456");
      expect(ctx.req.param("action")).toBe("edit");
    });

    it("should return undefined for non-existent param", () => {
      const req = new Request("http://localhost/test");
      const params = { id: "123" };
      const ctx = new Context(req, params);

      expect(ctx.req.param("nonExistent")).toBeUndefined();
    });

    it("should return undefined when no params were set", () => {
      const req = new Request("http://localhost/test");
      const ctx = new Context(req);

      expect(ctx.req.param("id")).toBeUndefined();
    });
  });

  describe("req.params", () => {
    it("should provide direct access to params object", () => {
      const req = new Request("http://localhost/test");
      const params = { id: "123", name: "test" };
      const ctx = new Context(req, params);

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
      const ctx = new Context(req);

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
      const ctx = new Context(req);

      const body = await ctx.req.raw.json();
      expect(body).toEqual({ key: "value" });
    });
  });

  describe("req.query()", () => {
    it("should return specific query parameter", () => {
      const req = new Request("http://localhost/search?q=hello&limit=10");
      const ctx = new Context(req);

      expect(ctx.req.query("q")).toBe("hello");
      expect(ctx.req.query("limit")).toBe("10");
    });

    it("should return undefined for non-existent query parameter", () => {
      const req = new Request("http://localhost/search?q=hello");
      const ctx = new Context(req);

      expect(ctx.req.query("nonExistent")).toBeUndefined();
    });

    it("should return all query parameters when called without arguments", () => {
      const req = new Request(
        "http://localhost/search?q=hello&limit=10&offset=0",
      );
      const ctx = new Context(req);

      const allParams = ctx.req.query();
      expect(allParams).toEqual({
        q: "hello",
        limit: "10",
        offset: "0",
      });
    });

    it("should return empty object when no query parameters", () => {
      const req = new Request("http://localhost/search");
      const ctx = new Context(req);

      const allParams = ctx.req.query();
      expect(allParams).toEqual({});
    });

    it("should handle URL-encoded query parameters", () => {
      const req = new Request(
        "http://localhost/search?q=hello%20world&name=John%20Doe",
      );
      const ctx = new Context(req);

      expect(ctx.req.query("q")).toBe("hello world");
      expect(ctx.req.query("name")).toBe("John Doe");
    });

    it("should return first value for duplicate query parameters", () => {
      const req = new Request("http://localhost/search?tag=A&tag=B");
      const ctx = new Context(req);

      expect(ctx.req.query("tag")).toBe("A");
    });
  });

  describe("req.queries()", () => {
    it("should return array of values for multiple query parameters", () => {
      const req = new Request("http://localhost/search?tags=A&tags=B&tags=C");
      const ctx = new Context(req);

      const tags = ctx.req.queries("tags");
      expect(tags).toEqual(["A", "B", "C"]);
    });

    it("should return array with single value for single parameter", () => {
      const req = new Request("http://localhost/search?tag=A");
      const ctx = new Context(req);

      const tags = ctx.req.queries("tag");
      expect(tags).toEqual(["A"]);
    });

    it("should return undefined for non-existent parameter", () => {
      const req = new Request("http://localhost/search?q=hello");
      const ctx = new Context(req);

      const tags = ctx.req.queries("tags");
      expect(tags).toBeUndefined();
    });

    it("should handle multiple parameters with different names", () => {
      const req = new Request(
        "http://localhost/search?tags=A&tags=B&colors=red&colors=blue",
      );
      const ctx = new Context(req);

      expect(ctx.req.queries("tags")).toEqual(["A", "B"]);
      expect(ctx.req.queries("colors")).toEqual(["red", "blue"]);
    });

    it("should handle URL-encoded values", () => {
      const req = new Request(
        "http://localhost/search?tags=hello%20world&tags=foo%20bar",
      );
      const ctx = new Context(req);

      const tags = ctx.req.queries("tags");
      expect(tags).toEqual(["hello world", "foo bar"]);
    });
  });

  describe("req.href", () => {
    it("should provide full URL including query parameters", () => {
      const req = new Request(
        "http://localhost:8787/users/123?auto=true&format=json",
      );
      const ctx = new Context(req);

      expect(ctx.req.href).toBe(
        "http://localhost:8787/users/123?auto=true&format=json",
      );
    });

    it("should work with URL without query parameters", () => {
      const req = new Request("http://localhost/users/123");
      const ctx = new Context(req);

      expect(ctx.req.href).toBe("http://localhost/users/123");
    });
  });

  describe("req.pathname", () => {
    it("should provide pathname of the request", () => {
      const req = new Request("http://localhost/users/123?auto=true");
      const ctx = new Context(req);

      expect(ctx.req.pathname).toBe("/users/123");
    });

    it("should handle root path", () => {
      const req = new Request("http://localhost/");
      const ctx = new Context(req);

      expect(ctx.req.pathname).toBe("/");
    });

    it("should not include query parameters", () => {
      const req = new Request("http://localhost/search?q=test&limit=10");
      const ctx = new Context(req);

      expect(ctx.req.pathname).toBe("/search");
    });
  });

  describe("req.routePathname", () => {
    it("should provide the defined route path pattern", () => {
      const req = new Request("http://localhost/users/123");
      const ctx = new Context(req, { userId: "123" }, "/users/:userId");

      expect(ctx.req.routePathname).toBe("/users/:userId");
    });

    it("should work with wildcard routes", () => {
      const req = new Request("http://localhost/files/abc/download");
      const ctx = new Context(req, {}, "/files/*/download");

      expect(ctx.req.routePathname).toBe("/files/*/download");
    });

    it("should be empty string when not provided", () => {
      const req = new Request("http://localhost/test");
      const ctx = new Context(req);

      expect(ctx.req.routePathname).toBe("");
    });

    it("should handle static routes", () => {
      const req = new Request("http://localhost/about");
      const ctx = new Context(req, {}, "/about");

      expect(ctx.req.routePathname).toBe("/about");
    });
  });

  describe("req.cookie()", () => {
    it("should return specific cookie value", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "session=abc123; theme=dark" },
      });
      const ctx = new Context(req);

      expect(ctx.req.cookie("session")).toBe("abc123");
      expect(ctx.req.cookie("theme")).toBe("dark");
    });

    it("should return undefined for non-existent cookie", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "session=abc123" },
      });
      const ctx = new Context(req);

      expect(ctx.req.cookie("nonExistent")).toBeUndefined();
    });

    it("should return all cookies when called without arguments", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "session=abc123; theme=dark; lang=en" },
      });
      const ctx = new Context(req);

      const allCookies = ctx.req.cookie();
      expect(allCookies).toEqual({
        session: "abc123",
        theme: "dark",
        lang: "en",
      });
    });

    it("should return empty object when no cookies", () => {
      const req = new Request("http://localhost/");
      const ctx = new Context(req);

      const allCookies = ctx.req.cookie();
      expect(allCookies).toEqual({});
    });

    it("should handle cookies with spaces around equals sign", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "key1 = value1; key2= value2 ;key3 =value3" },
      });
      const ctx = new Context(req);

      expect(ctx.req.cookie("key1")).toBe("value1");
      expect(ctx.req.cookie("key2")).toBe("value2");
      expect(ctx.req.cookie("key3")).toBe("value3");
    });

    it("should handle cookies with special characters in values", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "data=hello%20world; token=Bearer%20abc123" },
      });
      const ctx = new Context(req);

      expect(ctx.req.cookie("data")).toBe("hello%20world");
      expect(ctx.req.cookie("token")).toBe("Bearer%20abc123");
    });

    it("should handle single cookie", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "session=abc123" },
      });
      const ctx = new Context(req);

      expect(ctx.req.cookie("session")).toBe("abc123");
      expect(ctx.req.cookie()).toEqual({ session: "abc123" });
    });

    it("should ignore malformed cookies without equals sign", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "validCookie=value; malformedCookie; another=test" },
      });
      const ctx = new Context(req);

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
      const ctx = new Context(req);

      expect(ctx.req.cookie("empty")).toBe("");
      expect(ctx.req.cookie("session")).toBe("abc123");
    });

    it("should handle cookies with only whitespace separators", () => {
      const req = new Request("http://localhost/", {
        headers: { Cookie: "   key1=value1  ;  key2=value2   " },
      });
      const ctx = new Context(req);

      expect(ctx.req.cookie("key1")).toBe("value1");
      expect(ctx.req.cookie("key2")).toBe("value2");
    });
  });
});
