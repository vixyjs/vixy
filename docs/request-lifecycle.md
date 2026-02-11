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
                   └─────┬─▶ preParsing Hook
                         │
                         │
                         └─────┬─▶ [Parsing]
                               │
                               │
                               └─────┬─▶ preValidation Hook
                                     │
                                     │
                                     └─────┬─▶ [Validation]
                                           │
                                           │
                                           └─────┬─▶ preHandler Hook
                                                 │
                                                 │
                                                 └─────┬─▶ [Handler]
                                                       │
                                                       │
                                                       └─────┬─▶ [Reply]
                                                             │
                                                             │
                                                             └─────┬─▶ preSerialization Hook
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

Request/Reply Hooks (in execution order)

Note: all hooks can return early to short-circuit the request lifecycle.

`onRequest`
- Invoked at the very beginning of the request
- Can access request context
- Cannot access request body (always undefined at this point)
- Can modify the request/response objects
- Executes before body parsing
- Implication: Stopping here prevents all subsequent processing; body data not available yet

`preParsing`
- Invoked before the request payload is parsed
- Can access request context and the raw payload stream
- Cannot access request body (always undefined at this point, parsing hasn't happened yet)
- Can transform the payload stream (e.g., decompression)
- Must return a stream if modifying payload
- Executes after onRequest but before body parsing
- Implication: Only hook that can modify the raw request stream before parsing

`preValidation`
- Invoked after body parsing but before validation
- Can access request context and parsed request.body
- Can modify request body (unvalidated body, since before validation occurs)
- Can add or transform data that will be validated
- Executes after body parsing, before schema validation
- Implication: Last chance to modify data before validation rules are applied

`preHandler`
- Invoked after validation but before the route handler
- Can access request context, fully parsed and validated request body
- Can perform authentication, authorization, or data enrichment
- Common place for middleware-like functionality
- Executes after validation, before route handler
- Implication: Final checkpoint before business logic executes

`preSerialization` (optionally invoked)
- Invoked after route handler but before the response payload is serialized
- Will NOT be invoked when the response data is: `string`, `Buffer`, `stream`, or `null`
  * because these types do not require serialization
- Can access request context and the response data (unserialized)
- Can modify the response data
- Transforms data before JSON serialization
- Implication: Last chance to modify response data structure before serialization

`onSend`
- Invoked before the response is sent to the client and after serialization
- Can access request context, and serialized response data
- Can change response data before sent to client
- Final transformation before transmission
- Implication: Last opportunity to modify what client receives

`onResponse`
- Invoked after the response has been sent to the client
- Can access request context and response data (read-only)
- Cannot send more data to the client
- Can perform logging, metrics collection, cleanup
- Implication: For post-processing only; client interaction complete

## Calling Hooks

1. Global

Will apply to all requests, routes, and `Ivy` instances under the same `Ivy` instances.

```ts
const app = new Ivy();

app.onRequest((request, response, done) => {
  // global onRequest logic
  done();
});

app.onSend((request, response, payload, done) => {
  // global onSend logic
  done(null, payload);
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
    onRequest: (request, response, done) => {
      // route-specific onRequest logic
      done();
    },
  },
);
```
