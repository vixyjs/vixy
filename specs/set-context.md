# Request Context Specification

A request context is a set of key-value pairs that provide additional information about the request being made.

## Usage

```ts
// Setting a value
app.use("*", (c, next) => {
  c.req.setContext("email", "test@examppe.com");
  await next();
});

// Getting a value
app.get("/", (c) => {
  const email = c.req.getContext("email");
  return email;
});
```

As long as the `c.req.getContext` method is used AFTER the `c.req.setContext` method, the value will be available. This means that you can set a value in one middleware and access it in another middleware or route handler that comes after it in the middleware stack.

## Types Definition

```ts
c.req.setContext: <T = any>(key: string, value: T) => void;
c.req.getContext: <T = any>(key: string) => T | undefined;
```
