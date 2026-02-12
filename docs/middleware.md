# Middleware Specification

Middleware are functions that run _before_ the route handler is executed. There are two types of middleware supported in Ivy:

- Global Middleware: Applied to all routes under the same instance
- Route-specific Middleware: Applied only to specific routes

### Global Middleware

Use the `.use()` method on the Ivy instance to register global middleware. This middleware will run for every incoming request before reaching the route handler.

```ts
import Ivy from "ivy";

const app = new Ivy();

app.use("*", async (c, next) => {
  await next(); // Proceed to the next middleware or route handler
});

app.use("/v1/*", async (c, next) => {
  // some process
  await next();
});
```

### Route-specific Middleware

You can also apply middleware to specific routes by passing them as additional arguments to the route registration methods.

```ts
const authMiddleware = async (c, next) => {
  // some process
  await next();
};

app.get("/protected", authMiddleware, (c) => {
  return c.text("Protected content");
});

app.on("POST", "/protected", authMiddleware, (c) =>
  c.res.text("POST response"),
);
```

in a route handler, you can have multiple middleware functions:

```ts
app.post("/submit", middleware1, middleware2, (c) => {
  return c.json({ message: "Data submitted" });
});
```

## Middleware Execution Order

The execution order will be determined from the order they are defined, with global middleware running first, followed by route-specific middleware in the order they are provided.

If there's multiple global middleware, they will execute in the order they were added using `app.use()`.

```ts
import Ivy from "../../src/index";

const app = new Ivy();

app.use("*", async (_, next) => {
  console.log("middleware 1 start");
  await next();
  console.log("middleware 1 end");
});
app.use("*", async (_, next) => {
  console.log("middleware 2 start");
  await next();
  console.log("middleware 2 end");
});
app.use("*", async (_, next) => {
  console.log("middleware 3 start");
  await next();
  console.log("middleware 3 end");
});

app.get("/", (c) => {
  console.log("handler");
  return c.res.text("Hello!");
});
```

will result:
```
middleware 1 start
  middleware 2 start
    middleware 3 start
      handler
    middleware 3 end
  middleware 2 end
middleware 1 end
```

## Short-circuiting Middleware

Middleware can choose to short-circuit the request by not calling `next()`. This is useful for scenarios like authentication, where you may want to terminate the request early.

```ts
app.use(async (c, next) => {
  if (!c.req.header("User-Agent")) {
    return c.res.json({ error: "User-Agent header missing" }, 400);
  }

  await next();
});
```

## Type Definition

Middleware functions have the following type signature:

```ts
type Middleware = (
  c: IvyContext,
  next: () => Promise<void>,
) => Response | Promise<Response> | void | Promise<void>;
```

**Parameters:**

- `c`: The `IvyContext` object containing request and response helpers
- `next`: A function to call the next middleware or route handler in the chain

**Return type:**

- `void | Promise<void>`: When calling `next()` to continue the middleware chain
- `Response | Promise<Response>`: When short-circuiting to return early without calling `next()`
