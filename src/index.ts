import FindMyWay from "find-my-way";
import { IvyContext } from "./context";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

type Handler = (c: IvyContext) => Response | Promise<Response>;

export type Next = () => Promise<void>;

type Middleware = (c: IvyContext, next: Next) => Promise<Response | void>;

interface RouteStore {
  handler: Handler;
  path: string;
  middleware: Middleware[];
}

interface MiddlewareEntry {
  path: string;
  middleware: Middleware;
}

export default class Ivy {
  private router: FindMyWay.Instance<FindMyWay.HTTPVersion.V1>;
  private notFoundHandler?: Handler;
  private globalMiddleware: MiddlewareEntry[] = [];

  constructor() {
    this.fetch = this.fetch.bind(this);

    this.router = FindMyWay({
      defaultRoute: () => {},
    });
  }

  private convertWildcardPath(path: string): string {
    let wildcardCount = 0;
    return path.replace(/\*/g, () => {
      wildcardCount++;
      return `:wildcard${wildcardCount}`;
    });
  }

  use(path: string, middleware: Middleware): this {
    this.globalMiddleware.push({ path, middleware });
    return this;
  }

  private matchesMiddlewarePath(
    middlewarePath: string,
    requestPath: string,
  ): boolean {
    if (middlewarePath === "*") {
      return true;
    }

    if (middlewarePath.endsWith("/*")) {
      const prefix = middlewarePath.slice(0, -2);
      return requestPath.startsWith(prefix);
    }

    return middlewarePath === requestPath;
  }

  private async executeMiddlewareChain(
    context: IvyContext,
    middlewares: Middleware[],
    finalHandler: Handler,
  ): Promise<Response> {
    let index = 0;
    let response: Response | undefined;

    const next = async (): Promise<void> => {
      if (index >= middlewares.length) {
        response = await finalHandler(context);
        return;
      }
      const middleware = middlewares[index];
      index++;
      if (!middleware) {
        return next();
      }
      const result = await middleware(context, next);
      if (result !== undefined) {
        throw { __isResponse: true, response: result };
      }
    };

    try {
      await next();
      return response!;
    } catch (error) {
      if (
        typeof error === "object" &&
        error !== null &&
        "__isResponse" in error &&
        "response" in error
      ) {
        return error.response as Response;
      }
      throw error;
    }
  }

  private registerRoute(
    method: Method,
    path: string,
    middleware: Middleware[],
    handler: Handler,
  ): void {
    const convertedPath = this.convertWildcardPath(path);
    const store: RouteStore = {
      handler,
      path,
      middleware,
    };
    this.router.on(method, convertedPath, () => {}, store);
  }

  // Helper type for middleware chain
  private extractHandlerAndMiddleware(handlers: (Handler | Middleware)[]): {
    handler: Handler;
    middleware: Middleware[];
  } {
    return {
      handler: handlers[handlers.length - 1] as Handler,
      middleware: handlers.slice(0, -1) as Middleware[],
    };
  }

  on(
    methods: Method | Method[],
    paths: string | string[],
    handler: Handler,
  ): this;
  on(
    methods: Method | Method[],
    paths: string | string[],
    middleware: Middleware,
    handler: Handler,
  ): this;
  on(
    methods: Method | Method[],
    paths: string | string[],
    ...handlers: (Handler | Middleware)[]
  ): this {
    const methodArray = Array.isArray(methods) ? methods : [methods];
    const pathArray = Array.isArray(paths) ? paths : [paths];
    const { handler, middleware } = this.extractHandlerAndMiddleware(handlers);

    for (const method of methodArray) {
      for (const path of pathArray) {
        this.registerRoute(method, path, middleware, handler);
      }
    }

    return this;
  }

  get(path: string, handler: Handler): this;
  get(path: string, middleware: Middleware, handler: Handler): this;
  get(path: string, ...handlers: (Handler | Middleware)[]): this {
    const { handler, middleware } = this.extractHandlerAndMiddleware(handlers);
    this.registerRoute("GET", path, middleware, handler);
    return this;
  }

  post(path: string, handler: Handler): this;
  post(path: string, middleware: Middleware, handler: Handler): this;
  post(path: string, ...handlers: (Handler | Middleware)[]): this {
    const { handler, middleware } = this.extractHandlerAndMiddleware(handlers);
    this.registerRoute("POST", path, middleware, handler);
    return this;
  }

  put(path: string, handler: Handler): this;
  put(path: string, middleware: Middleware, handler: Handler): this;
  put(path: string, ...handlers: (Handler | Middleware)[]): this {
    const { handler, middleware } = this.extractHandlerAndMiddleware(handlers);
    this.registerRoute("PUT", path, middleware, handler);
    return this;
  }

  delete(path: string, handler: Handler): this;
  delete(path: string, middleware: Middleware, handler: Handler): this;
  delete(path: string, ...handlers: (Handler | Middleware)[]): this {
    const { handler, middleware } = this.extractHandlerAndMiddleware(handlers);
    this.registerRoute("DELETE", path, middleware, handler);
    return this;
  }

  patch(path: string, handler: Handler): this;
  patch(path: string, middleware: Middleware, handler: Handler): this;
  patch(path: string, ...handlers: (Handler | Middleware)[]): this {
    const { handler, middleware } = this.extractHandlerAndMiddleware(handlers);
    this.registerRoute("PATCH", path, middleware, handler);
    return this;
  }

  options(path: string, handler: Handler): this;
  options(path: string, middleware: Middleware, handler: Handler): this;
  options(path: string, ...handlers: (Handler | Middleware)[]): this {
    const { handler, middleware } = this.extractHandlerAndMiddleware(handlers);
    this.registerRoute("OPTIONS", path, middleware, handler);
    return this;
  }

  notFound(handler: Handler): this {
    this.notFoundHandler = handler;
    return this;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method as Method;

    const route = this.router.find(method, pathname);

    if (route && route.store) {
      const { handler, path, middleware } = route.store as RouteStore;

      const params: Record<string, string> = {};
      if (route.params) {
        for (const [key, value] of Object.entries(route.params)) {
          if (!key.startsWith("wildcard")) {
            params[key] = value as string;
          }
        }
      }

      const context = new IvyContext(req, params, path);

      const globalMiddlewares: Middleware[] = [];
      for (const entry of this.globalMiddleware) {
        if (this.matchesMiddlewarePath(entry.path, pathname)) {
          globalMiddlewares.push(entry.middleware);
        }
      }

      const allMiddleware = [...globalMiddlewares, ...middleware];

      return await this.executeMiddlewareChain(context, allMiddleware, handler);
    }

    if (this.notFoundHandler) {
      const context = new IvyContext(req, {}, pathname);
      return await this.notFoundHandler(context);
    }

    return new Response("Not Found", { status: 404 });
  }
}
