import FindMyWay from "find-my-way";
import { Context } from "./context";

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";

type Handler = (c: Context) => Response | Promise<Response>;

interface RouteStore {
  handler: Handler;
  path: string;
}

export default class Ivy {
  private router: FindMyWay.Instance<FindMyWay.HTTPVersion.V1>;

  constructor() {
    // Bind fetch to maintain context when called by Bun
    this.fetch = this.fetch.bind(this);

    // Initialize find-my-way router
    this.router = FindMyWay({
      defaultRoute: () => {
        // Default route is handled in fetch method
      },
    });
  }

  // Convert wildcard routes to find-my-way compatible format
  // find-my-way only supports wildcards at the end of paths
  // Convert /foo/*/bar to /foo/:wildcard1/bar
  private convertWildcardPath(path: string): string {
    let wildcardCount = 0;
    return path.replace(/\*/g, () => {
      wildcardCount++;
      return `:wildcard${wildcardCount}`;
    });
  }

  // TODO:
  // - `strict` mode for route matching (trailing slashes) like hono?
  // - middleware support
  // - route groups / prefixes
  on(
    methods: Method | Method[],
    paths: string | string[],
    handler: Handler,
  ): this {
    const methodArray = Array.isArray(methods) ? methods : [methods];
    const pathArray = Array.isArray(paths) ? paths : [paths];

    for (const method of methodArray) {
      for (const path of pathArray) {
        const convertedPath = this.convertWildcardPath(path);
        const store: RouteStore = { handler, path };
        this.router.on(method, convertedPath, () => {}, store);
      }
    }

    return this;
  }

  get(path: string, handler: Handler): this {
    const convertedPath = this.convertWildcardPath(path);
    const store: RouteStore = { handler, path };
    this.router.on("GET", convertedPath, () => {}, store);
    return this;
  }

  post(path: string, handler: Handler): this {
    const convertedPath = this.convertWildcardPath(path);
    const store: RouteStore = { handler, path };
    this.router.on("POST", convertedPath, () => {}, store);
    return this;
  }

  put(path: string, handler: Handler): this {
    const convertedPath = this.convertWildcardPath(path);
    const store: RouteStore = { handler, path };
    this.router.on("PUT", convertedPath, () => {}, store);
    return this;
  }

  delete(path: string, handler: Handler): this {
    const convertedPath = this.convertWildcardPath(path);
    const store: RouteStore = { handler, path };
    this.router.on("DELETE", convertedPath, () => {}, store);
    return this;
  }

  patch(path: string, handler: Handler): this {
    const convertedPath = this.convertWildcardPath(path);
    const store: RouteStore = { handler, path };
    this.router.on("PATCH", convertedPath, () => {}, store);
    return this;
  }

  options(path: string, handler: Handler): this {
    const convertedPath = this.convertWildcardPath(path);
    const store: RouteStore = { handler, path };
    this.router.on("OPTIONS", convertedPath, () => {}, store);
    return this;
  }

  async fetch(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const pathname = url.pathname;
    const method = req.method as Method;

    // Use find-my-way to locate the route
    const route = this.router.find(method, pathname);

    if (route && route.store) {
      const { handler, path } = route.store as RouteStore;

      // Get params from find-my-way, but filter out wildcard params
      const params: Record<string, string> = {};
      if (route.params) {
        for (const [key, value] of Object.entries(route.params)) {
          // Don't expose internal wildcard parameter names
          if (!key.startsWith("wildcard")) {
            params[key] = value as string;
          }
        }
      }

      const context = new Context(req, params, path);
      return await handler(context);
    }

    return new Response("Not Found", { status: 404 });
  }
}
