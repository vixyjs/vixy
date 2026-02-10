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
});
