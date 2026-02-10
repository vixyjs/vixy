export class Context {
  req: {
    raw: Request;
    param: (name: string) => string | undefined;
    params: Record<string, string>;
  };

  constructor(rawRequest: Request, params: Record<string, string> = {}) {
    this.req = {
      raw: rawRequest,
      params: params,
      param: (name: string) => params[name],
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
