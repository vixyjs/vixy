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

> Request/Reply Hooks (in execution order)

`onRequest`
- Invoked at the very beginning of the request lifecycle
- Can access request and reply objects
- Cannot access request.body (always undefined at this point)
- Can modify the request/reply objects
- Can perform early authentication checks or logging
- Executes before body parsing
- Implication: Stopping here prevents all subsequent processing; body data not available yet

`preParsing`
- Invoked before the request payload is parsed
- Can access request, reply, and the raw payload stream
- Cannot access request.body (parsing hasn't happened yet)
- Can transform the payload stream (e.g., decompression)
- Must return a stream if modifying payload
- Executes after onRequest but before body parsing
- Implication: Only hook that can modify the raw request stream before parsing

`preValidation`
- Invoked after body parsing but before validation
- Can access request, reply, and parsed request.body
- Can modify request.body before validation occurs
- Can add or transform data that will be validated
- Executes after body parsing, before schema validation
- Implication: Last chance to modify data before validation rules are applied

`preHandler`
- Invoked after validation but before the route handler
- Can access validated request and reply objects
- Can access fully parsed and validated request.body
- Can perform authentication, authorization, or data enrichment
- Common place for middleware-like functionality
- Executes after validation, before route handler
- Implication: Final checkpoint before business logic executes

`preSerialization`
- Invoked before the response payload is serialized
- Can access request, reply, and the response payload
- Can modify or wrap the response payload
- Cannot modify string, Buffer, stream, or null payloads
- Transforms data before JSON serialization
- Executes after handler returns, before serialization
- Implication: Last chance to modify response data structure

`onError`
- Invoked when an error occurs during request processing
- Can access request, reply, and error object
- Cannot modify the error or send responses
- Can perform custom error logging or add headers
- Useful for monitoring and diagnostics
- Executes before custom error handlers
- Implication: For observation only; cannot alter error handling flow

`onSend`
- Invoked before the response is sent to the client
- Can access request, reply, and serialized payload
- Can modify the payload (string, Buffer, stream, or null)
- Can change response content or clear payload
- Final transformation before transmission
- Executes after serialization, before sending
- Implication: Last opportunity to modify what client receives

`onResponse`
- Invoked after the response has been sent
- Can access request and reply objects
- Cannot send more data to the client
- Can perform logging, metrics collection, cleanup
- Useful for external service notifications
- Executes after response is fully sent
- Implication: For post-processing only; client interaction complete

## Calling Hooks

1. Global

Will apply to all requests, routes, and `Ivy` instances under the same `Ivy` instances.

```ts
const app = new Ivy();

app.onRequest((request, reply, done) => {
  // global onRequest logic
  done();
});

app.onSend((request, reply, payload, done) => {
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
    onRequest: (request, reply, done) => {
      // route-specific onRequest logic
      done();
    },
  },
);
```
