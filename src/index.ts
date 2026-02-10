import { Context } from "./context";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH";

type Handler = (c: Context) => Response | Promise<Response>;

interface Route {
  method: Method;
  path: string;
  handler: Handler;
  pattern?: RegExp;
  paramNames?: string[];
}

export default class Ivy {
  private routes: Route[] = [];

  constructor() {
    // Bind fetch to maintain context when called by Bun
    this.fetch = this.fetch.bind(this);
  }

  private compileRoute(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    
    // Escape special regex characters except * and :
    let pattern = path.replace(/[.+?^${}()|[\]\\]/g, '\\$&');
    
    // Replace :param with named capture groups
    pattern = pattern.replace(/:(\w+)/g, (_, paramName) => {
      paramNames.push(paramName);
      return '([^/]+)';
    });
    
    // Replace * with wildcard pattern
    pattern = pattern.replace(/\*/g, '[^/]+');
    
    return {
      pattern: new RegExp(`^${pattern}$`),
      paramNames
    };
  }

  on(
    methods: Method | Method[],
    paths: string | string[],
    handler: Handler,
  ): this {
    const methodArray = Array.isArray(methods) ? methods : [methods];
    const pathArray = Array.isArray(paths) ? paths : [paths];

    for (const method of methodArray) {
      for (const path of pathArray) {
        const { pattern, paramNames } = this.compileRoute(path);
        this.routes.push({ method, path, handler, pattern, paramNames });
      }
    }

    return this;
  }

  get(path: string, handler: Handler): this {
    const { pattern, paramNames } = this.compileRoute(path);
    this.routes.push({ method: "GET", path, handler, pattern, paramNames });
    return this;
  }

  post(path: string, handler: Handler): this {
    const { pattern, paramNames } = this.compileRoute(path);
    this.routes.push({ method: "POST", path, handler, pattern, paramNames });
    return this;
  }

  put(path: string, handler: Handler): this {
    const { pattern, paramNames } = this.compileRoute(path);
    this.routes.push({ method: "PUT", path, handler, pattern, paramNames });
    return this;
  }

  delete(path: string, handler: Handler): this {
    const { pattern, paramNames } = this.compileRoute(path);
    this.routes.push({ method: "DELETE", path, handler, pattern, paramNames });
    return this;
  }

  patch(path: string, handler: Handler): this {
    const { pattern, paramNames } = this.compileRoute(path);
    this.routes.push({ method: "PATCH", path, handler, pattern, paramNames });
    return this;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method;

    for (const route of this.routes) {
      if (route.method === method && route.pattern) {
        const match = pathname.match(route.pattern);
        if (match) {
          const params: Record<string, string> = {};
          
          // Extract params if any
          if (route.paramNames && route.paramNames.length > 0) {
            route.paramNames.forEach((name, index) => {
              params[name] = match[index + 1];
            });
          }
          
          const context = new Context(req, params);
          return await route.handler(context);
        }
      }
    }

    return new Response("Not Found", { status: 404 });
  }
}
