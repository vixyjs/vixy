# Ivy Request Lifecycle

The Ivy request lifecycle outlines the various stages a request goes through from initiation to completion.

```
 [Incoming Request]

          │
          └──┬─▶ [Routing]
             │
             │
             └─────┬─▶ onRequest Hook
                   │
                   │
                   └─────┬─▶ onPreParsing Hook
                         │
                         │
                         └─────┬─▶ [Parsing]          ─────▶ Based on the content type
                               │
                               │
                               └─────┬─▶ onPreValidation Hook
                                     │
                                     │
                                     └─────┬─▶ [Validation]       ──────▶ Based on the defined schema
                                           │
                                           │
                                           └─────┬─▶ onPreHandler Hook
                                                 │
                                                 │
                                                 └─────┬─▶ [Handler]
                                                       │
                                                       │
                                                       └─────┬─▶ [Reply]
                                                             │
                                                             │
                                                             └─────┬─▶ onPreSerialization Hook  ────────▶ Based on the defined schema
                                                                   │
                                                                   │
                                                                   └─────┬─▶ onSend Hook
                                                                         │
                                                                         │
                                                                         └─────┬─▶ [Response]
                                                                               │
                                                                               │
                                                                               └───────▶ onResponse Hook

```

## Request/Reply Hooks 

Listed in the proper execution order

<!-- Note: all hooks can return early to short-circuit the request lifecycle? -->

`onRequest`

```ts
onRequest(c: IvyRequest, next: Next) => void;
```

- Invoked at the very beginning of the request
- Can access request context
- Cannot access request body (always undefined at this point)
- Can modify the request/response objects
- Executes before body parsing
- Implication: Stopping here prevents all subsequent processing; body data not available yet

`onPreParsing`

```ts
onPreParsing(c: IvyRequest, next: Next<T>) => void;
```

- Invoked before the request payload is parsed
- Can access request context and the raw payload stream
- Cannot access request body (always undefined at this point, parsing hasn't happened yet)
- Can transform the payload stream (e.g., decompression)
- Must return a stream if modifying payload
- Executes after onRequest but before body parsing
- Implication: Only hook that can modify the raw request stream before parsing

`onPreValidation`

```ts
onPreValidation(c: IvyRequest, next: Next) => void;
```
- Invoked after body parsing but before validation
- Can access request context and parsed request.body
- Can modify request body (unvalidated body, since before validation occurs)
- Can add or transform data that will be validated
- Executes after body parsing, before schema validation
- Implication: Last chance to modify data before validation rules are applied

`onPreHandler`

```ts
onPreHandler(c: IvyRequest, next: Next) => void;
```
- Invoked after validation but before the route handler
- Can access request context, fully parsed and validated request body
- Can perform authentication, authorization, or data enrichment
- Common place for middleware-like functionality
- Executes after validation, before route handler
- Implication: Final checkpoint before business logic executes

`onPreSerialization` (optionally invoked)

```ts
onPreSerialization(c: IvyRequest, next: Next<T>) => void;
```
- Invoked after route handler but before the response payload is serialized
- Will NOT be invoked when the response data is: `string`, `Buffer`, `stream`, or `null`
  - because these types do not require serialization
- Can access request context and the response data (unserialized)
- Can modify the response data
- Transforms data before JSON serialization
- Implication: Last chance to modify response data structure before serialization

`onSend`

```ts
onSend(c: IvyRequest, next: Next<T>) => void;
```
- Invoked before the response is sent to the client and after serialization
- Can access request context, and serialized response data
- Can change response data before sent to client
- Final transformation before transmission
- Implication: Last opportunity to modify what client receives

`onResponse`

```ts
onSend(c: IvyRequest, next: Next) => void;
```
- Invoked after the response has been sent to the client
- Can access request context and response data (read-only)
- Cannot send more data to the client
- Can perform logging, metrics collection, cleanup
- Implication: For post-processing only; client interaction complete

## `next` Function

The `next` function is a callback provided to each hook to signal the continuation of the request lifecycle. It must be called to proceed to the next stage.

Next function have 2 variations:
- Without overrides payload: for hooks that cannot modify the request/response data
- With overrides payload: for hooks that can modify the request/response data


```ts
// without overrides payload
type Next = (err?: Error) => void;

// with overrides payload
type Next<T = any> = (err?: Error, payload?: T) => void;
```

## Hooks Usage & Scopes

1. Global

Will apply to all requests, routes, and `Ivy` instances under the same `Ivy` instances.

```ts
const app = new Ivy();

app.onRequest((request, response, next) => {
  // global onRequest logic
  next();
});

app.onSend((request, response, next) => {
  // global onSend logic
  next();
});

// all requests within this `app` instance will go through the above hooks
```

2. Per-route
   Will apply only to the specific route.

```ts
app.get(
  "/example",
  (c) => {
    return c.text("Hello, World!");
  },
  {
    // per-route hooks will override global hooks for this route
    onRequest: (request, response, next) => {
      // route-specific onRequest logic
      next();
    },
  },
);
```
