export interface IvyRequest {
  raw: Request;
  param: (name: string) => string | undefined;
  params: Record<string, string>;
  query: {
    (): Record<string, string>;
    (name: string): string | undefined;
  };
  queries: (name: string) => string[] | undefined;
  header: (name: string) => string | undefined;
  cookie: {
    (): Record<string, string>;
    (name: string): string | undefined;
  };
  json: () => Promise<any>;
  text: () => Promise<string>;
  formData: () => Promise<FormData>;
  arrayBuffer: () => Promise<ArrayBuffer>;
  blob: () => Promise<Blob>;
  href: string;
  pathname: string;
  routePathname: string;
}

export class Context {
  // TODO:
  // - body validators (blocked by middleware implementation)
  req: IvyRequest;
  private bodyCache: ArrayBuffer | null = null;

  constructor(
    rawRequest: Request,
    params: Record<string, string> = {},
    routePathname: string = "",
  ) {
    const url = new URL(rawRequest.url);
    const searchParams = url.searchParams;

    // Parse cookies from Cookie header
    const parseCookies = (): Record<string, string> => {
      const cookieHeader = rawRequest.headers.get("Cookie");
      if (!cookieHeader) {
        return {};
      }

      const cookies: Record<string, string> = {};
      const pairs = cookieHeader.split(";");

      for (const pair of pairs) {
        const trimmed = pair.trim();
        const equalsIndex = trimmed.indexOf("=");

        if (equalsIndex === -1) {
          continue;
        }

        const name = trimmed.substring(0, equalsIndex).trim();
        const value = trimmed.substring(equalsIndex + 1).trim();

        if (name) {
          cookies[name] = value;
        }
      }

      return cookies;
    };

    const cookiesCache = parseCookies();

    // Create cookie function with overloads
    const cookieFn = ((name?: string) => {
      if (name === undefined) {
        // Return all cookies as an object
        return cookiesCache;
      }
      // Return specific cookie
      return cookiesCache[name];
    }) as {
      (): Record<string, string>;
      (name: string): string | undefined;
    };

    // Create query function with overloads
    const queryFn = ((name?: string) => {
      if (name === undefined) {
        // Return all query params as an object
        const allParams: Record<string, string> = {};
        searchParams.forEach((value, key) => {
          allParams[key] = value;
        });
        return allParams;
      }
      // Return specific query param
      return searchParams.get(name) ?? undefined;
    }) as {
      (): Record<string, string>;
      (name: string): string | undefined;
    };

    // Cache the body to prevent "Body already used" errors
    const getBodyCache = async (): Promise<ArrayBuffer> => {
      if (this.bodyCache === null) {
        this.bodyCache = await rawRequest.arrayBuffer();
      }
      return this.bodyCache;
    };

    this.req = {
      raw: rawRequest,
      params: params,
      param: (name: string) => params[name],
      query: queryFn,
      queries: (name: string) => {
        const values = searchParams.getAll(name);
        return values.length > 0 ? values : undefined;
      },
      header: (name: string) => rawRequest.headers.get(name) ?? undefined,
      cookie: cookieFn,
      json: async () => {
        const buffer = await getBodyCache();
        const text = new TextDecoder().decode(buffer);
        return JSON.parse(text);
      },
      text: async () => {
        const buffer = await getBodyCache();
        return new TextDecoder().decode(buffer);
      },
      formData: async () => {
        const buffer = await getBodyCache();
        const blob = new Blob([buffer]);
        const contentType = rawRequest.headers.get("Content-Type") ?? "";
        const response = new Response(blob, {
          headers: { "Content-Type": contentType },
        });
        return response.formData();
      },
      arrayBuffer: async () => {
        return getBodyCache();
      },
      blob: async () => {
        const buffer = await getBodyCache();
        return new Blob([buffer]);
      },
      href: rawRequest.url,
      pathname: url.pathname,
      routePathname: routePathname,
    };
  }

  text(content: string, status = 200): Response {
    return new Response(content, {
      status,
      headers: { "Content-Type": "text/plain" },
    });
  }

  json(data: any, status = 200): Response {
    return new Response(JSON.stringify(data), {
      status,
      headers: { "Content-Type": "application/json" },
    });
  }

  html(content: string, status = 200): Response {
    return new Response(content, {
      status,
      headers: { "Content-Type": "text/html" },
    });
  }
}
