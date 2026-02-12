# Agent Guidelines for Ivy

Ivy is a lightweight web framework for Bun runtime with Express-like API for routing, path/query parameters, wildcards, and multiple HTTP methods.

## Build & Test Commands

```bash
# Install dependencies
bun install

# Run all tests
bun test
# or
vitest

# Run single test file
vitest src/index.test.ts

# Run specific test by name
vitest -t "should extract single path param"

# Watch mode
vitest --watch

# Coverage
vitest --coverage

# Format code
bun prettier --write .

# Check formatting
bun prettier --check .

# Run examples
bun run examples/basic/index.ts
```

## TypeScript Configuration

- Target: `ESNext` with `Preserve` module mode
- Strict mode with: `noUncheckedIndexedAccess`, `noImplicitOverride`, `noFallthroughCasesInSwitch`
- No importing `.ts` extensions
- Use `verbatimModuleSyntax` for explicit imports/exports

## Code Style

### Formatting (Prettier)

- Print width: 80, 2 spaces, double quotes
- Semicolons required, trailing commas: `"all"`
- Imports auto-sorted via `prettier-plugin-organize-imports`

### Import Style

```typescript
import FindMyWay from "find-my-way";
import { IvyContext } from "./context";
import type { ContentfulStatusCode } from "./lib/status-code";
```

### Type Definitions

- Prefer `interface` for object shapes that may be extended
- Use `type` for unions, intersections, complex types
- Explicitly type public API parameters and return types
- Use `Record<K, V>` for dictionaries

```typescript
interface RouteStore {
  handler: Handler;
  path: string;
}

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
type Handler = (c: IvyContext) => Response | Promise<Response>;
```

### Naming Conventions

- Classes: PascalCase (`Ivy`, `IvyContext`)
- Interfaces: PascalCase, no `I` prefix (`IvyRequest`, `RouteStore`)
- Types: PascalCase (`Method`, `Handler`)
- Functions/Methods: camelCase (`fetch`, `convertWildcardPath`)
- Variables: camelCase (`router`, `params`)
- Private members: use `private` keyword

### Function Style

- Arrow functions for callbacks, regular methods for classes
- Prefer `async/await` over promises
- Bind methods passed as callbacks in constructor

```typescript
constructor() {
  this.fetch = this.fetch.bind(this);
}
```

### Error Handling

- Return appropriate HTTP status codes
- Use simple responses: `new Response("Not Found", { status: 404 })`
- `notFoundHandler` is called if registered when route not found

### Method Chaining

Route registration methods return `this` for fluent API:

```typescript
app.get("/").post("/").put("/");
```

## Testing Style

- Use Vitest with `describe` blocks for grouping
- Test names start with "should"
- New app instance per test (no shared state)
- Test both success and error cases

```typescript
describe("Ivy", () => {
  describe("route registration", () => {
    it("should register GET routes", async () => {
      const app = new Ivy();
      app.get("/test", (c) => c.res.text("GET response"));

      const req = new Request("http://localhost/test", { method: "GET" });
      const response = await app.fetch(req);

      expect(response.status).toBe(200);
      expect(await response.text()).toBe("GET response");
    });
  });
});
```

## Code Organization

- Keep files focused (< 200 lines preferred)
- Descriptive filenames: `context.ts`, `index.ts`
- Group related functionality together

## Response Helpers

Context provides `res` with helper methods:

```typescript
c.res.text("Hello", 200);
c.res.json({ data: "value" }, 201);
c.res.html("<h1>Title</h1>", 200);
c.res.null(204);
```

## Architecture Notes

- Uses `find-my-way` library for route matching
- Wildcards (`*`) converted to named params (`:wildcard1`, etc.)
- Wildcard params filtered from exposed `params` object
- Route metadata stored in `RouteStore`
- Context encapsulates request with convenience methods via `c.req`
- Access raw request via `c.req.raw`
- Immutable design - create new responses rather than modifying context

## Comments

- Use `//` for brief explanations
- Multi-line comments for longer explanations or TODOs
- Document complex logic inline

```typescript
// TODO:
// - Feature 1
// - Feature 2
```
