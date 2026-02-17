import type {
  ContentfulStatusCode,
  ContentlessStatusCode,
  RedirectStatusCode,
} from "./lib/status-code";

export interface VixyRequest {
  raw: Request;
  param: {
    (): Record<string, string>;
    (name: string): string | undefined;
  };
  query: {
    (): Record<string, string>;
    (name: string): string | undefined;
  };
  queries: (name: string) => string[] | undefined;
  header: {
    (): Record<string, string>;
    (name: string): string | undefined;
  };
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
  setContext: <T = any>(key: string, value: T) => void;
  getContext: <T = any>(key: string) => T | undefined;
}

export interface CookieOptions {
  expires?: Date;
  maxAge?: number;
  domain?: string;
  path?: string;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: "Strict" | "Lax" | "None";
}

export interface VixyResponse {
  // TODO:
  // - send file/blob
  // - send stream?
  header: (key: string, value: any) => void;
  cookie: (key: string, value: string, options?: CookieOptions) => void;
  json: (data: any, status?: ContentfulStatusCode) => Response;
  text: (content: string, status?: ContentfulStatusCode) => Response;
  html: (content: string, status?: ContentfulStatusCode) => Response;
  null: (status?: ContentlessStatusCode) => Response;
  redirect: (location: string, status?: RedirectStatusCode) => Response;
}

export class VixyContext {
  req: VixyRequest;
  res: VixyResponse;
  private bodyCache: ArrayBuffer | null = null;
  private customHeaders: Record<string, string> = {};
  private contextStore: Record<string, any> = {};

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

    // Create param function with overloads
    const paramFn = ((name?: string) => {
      if (name === undefined) {
        // Return all params as an object
        return params;
      }
      // Return specific param
      return params[name];
    }) as {
      (): Record<string, string>;
      (name: string): string | undefined;
    };

    // Create header function with overloads
    const headerFn = ((name?: string) => {
      if (name === undefined) {
        // Return all headers as an object
        const allHeaders: Record<string, string> = {};
        rawRequest.headers.forEach((value, key) => {
          allHeaders[key] = value;
        });
        return allHeaders;
      }
      // Return specific header
      return rawRequest.headers.get(name) ?? undefined;
    }) as {
      (): Record<string, string>;
      (name: string): string | undefined;
    };

    this.req = {
      raw: rawRequest,
      param: paramFn,
      query: queryFn,
      queries: (name: string) => {
        const values = searchParams.getAll(name);
        return values.length > 0 ? values : undefined;
      },
      header: headerFn,
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
        // Bun has native FormData support,
        // so we ignore the undici deprecation warning
        return response.formData() as Promise<FormData>;
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
      setContext: <T = any>(key: string, value: T): void => {
        this.contextStore[key] = value;
      },
      getContext: <T = any>(key: string): T | undefined => {
        return this.contextStore[key];
      },
    };

    this.res = {
      header: (key: string, value: any): void => {
        this.customHeaders[key] = String(value);
      },
      cookie: (key: string, value: string, options?: CookieOptions): void => {
        const parts: string[] = [`${key}=${value}`];

        if (options?.maxAge !== undefined) {
          parts.push(`Max-Age=${options.maxAge}`);
        } else if (options?.expires !== undefined) {
          parts.push(`Expires=${options.expires.toUTCString()}`);
        }

        if (options?.domain !== undefined) {
          parts.push(`Domain=${options.domain}`);
        }

        if (options?.path !== undefined) {
          parts.push(`Path=${options.path}`);
        }

        if (options?.secure === true) {
          parts.push("Secure");
        }

        if (options?.httpOnly === true) {
          parts.push("HttpOnly");
        }

        if (options?.sameSite !== undefined) {
          parts.push(`SameSite=${options.sameSite}`);
        }

        const cookieString = parts.join("; ");
        this.res.header("Set-Cookie", cookieString);
      },
      text: (content: string, status = 200): Response => {
        return new Response(content, {
          status,
          headers: { "Content-Type": "text/plain", ...this.customHeaders },
        });
      },
      json: (data: any, status = 200): Response => {
        return new Response(JSON.stringify(data), {
          status,
          headers: {
            "Content-Type": "application/json",
            ...this.customHeaders,
          },
        });
      },
      html: (content: string, status = 200): Response => {
        return new Response(content, {
          status,
          headers: { "Content-Type": "text/html", ...this.customHeaders },
        });
      },
      null: (status = 204): Response => {
        return new Response(null, { status, headers: this.customHeaders });
      },
      redirect: (location: string, status = 302): Response => {
        return new Response(null, {
          status,
          headers: { Location: location, ...this.customHeaders },
        });
      },
    };
  }
}
