# Agent Guidelines for Ivy

This document provides coding agents with essential information about the Ivy codebase, including build commands, code style guidelines, and best practices.

## Project Overview

Ivy is a lightweight but complete web framework for Bun runtime, built with TypeScript. It provides a simple, Express-like API for routing HTTP requests with support for path parameters, query parameters, wildcards, and multiple HTTP methods.

## Build & Test Commands

### Installation
```bash
bun install
```

### Testing
```bash
# Run all tests
bun test
# or
vitest

# Run tests in watch mode
vitest --watch

# Run a single test file
vitest src/index.test.ts

# Run a specific test by name pattern
vitest -t "should extract single path param"

# Run tests with coverage
vitest --coverage
```

### Formatting
```bash
# Format all files
bun prettier --write .

# Check formatting
bun prettier --check .
```

### Running Examples
```bash
# Run the basic example
bun run examples/basic/index.ts
```

## Code Style Guidelines

### TypeScript Configuration
- Target: `ESNext` with `Preserve` module mode
- Strict mode enabled with additional strictness flags:
  - `noUncheckedIndexedAccess: true`
  - `noImplicitOverride: true`
  - `noFallthroughCasesInSwitch: true`
- Allow importing `.ts` extensions (Bun bundler mode)
- Use `verbatimModuleSyntax` for explicit imports/exports

### Formatting (Prettier)
- **Print width**: 80 characters
- **Quotes**: Double quotes (`"`)
- **Semicolons**: Always use semicolons
- **Indentation**: 2 spaces (no tabs)
- **Trailing commas**: Always (`"all"`)
- **Import organization**: Automatically sorted via `prettier-plugin-organize-imports`

### Import Style
- Use ES module imports: `import X from "module"`
- Imports are automatically organized alphabetically
- Group imports: external packages first, then local modules
- Use type imports when importing only types: `import type { Type } from "./module"`

Example:
```typescript
import FindMyWay from "find-my-way";
import { Context } from "./context";
```

### Type Definitions
- **Prefer interfaces** for object shapes that may be extended
- **Use type aliases** for unions, intersections, and complex types
- Always explicitly type function parameters and return types for public APIs
- Use `Record<K, V>` for dictionary/map types
- Leverage TypeScript's strict null checking - use `| undefined` explicitly

Example:
```typescript
interface RouteStore {
  handler: Handler;
  path: string;
}

type Method = "GET" | "POST" | "PUT" | "DELETE" | "PATCH" | "OPTIONS";
type Handler = (c: Context) => Response | Promise<Response>;
```

### Naming Conventions
- **Classes**: PascalCase (e.g., `Ivy`, `Context`)
- **Interfaces**: PascalCase, no `I` prefix (e.g., `IvyRequest`, `RouteStore`)
- **Types**: PascalCase (e.g., `Method`, `Handler`)
- **Functions/Methods**: camelCase (e.g., `fetch`, `convertWildcardPath`)
- **Variables**: camelCase (e.g., `router`, `params`)
- **Constants**: camelCase for local, UPPER_SNAKE_CASE for module-level constants
- **Private members**: prefix with `private` keyword, use camelCase (e.g., `private router`)

### Function & Method Style
- Use arrow functions for callbacks and short functions
- Use regular methods for class methods
- Prefer `async/await` over promise chains
- Always bind methods that will be passed as callbacks (see `constructor` in `Ivy`)

Example:
```typescript
constructor() {
  // Bind fetch to maintain context when called by Bun
  this.fetch = this.fetch.bind(this);
}
```

### Error Handling
- Return appropriate HTTP status codes (404 for not found, etc.)
- Use simple error responses for now (e.g., `new Response("Not Found", { status: 404 })`)
- TODO items exist for `onNotFound` and `onError` handlers - implement when needed

### Method Chaining
- All route registration methods return `this` for fluent API
- Example: `app.get("/").post("/").put("/")`

### Feature Development
- Any new features should follow the existing code style and architecture patterns
- Ensure new features are covered by tests

### Comments & Documentation
- Use single-line comments (`//`) for brief explanations
- Use multi-line comments for longer explanations or TODOs
- Document complex logic inline (e.g., wildcard conversion logic)
- Keep TODO comments structured:
  ```typescript
  // TODO:
  // - Feature 1
  // - Feature 2
  ```

### Testing Style
- Use Vitest for all tests
- Organize tests with `describe` blocks for logical grouping
- Use descriptive test names starting with "should"
- Test both success and error cases
- Create a new app instance for each test (no shared state)

Example:
```typescript
describe("Ivy", () => {
  describe("route registration", () => {
    it("should register GET routes", async () => {
      const app = new Ivy();
      app.get("/test", (c) => c.text("GET response"));
      
      const req = new Request("http://localhost/test", { method: "GET" });
      const response = await app.fetch(req);
      
      expect(response.status).toBe(200);
      expect(await response.text()).toBe("GET response");
    });
  });
});
```

### Code Organization
- Keep files focused and small (< 200 lines preferred)
- Export main classes/functions as default when appropriate
- Group related functionality in the same file
- Use descriptive file names: `context.ts`, `index.ts`

### Response Helpers
- Context provides helper methods: `text()`, `json()`, `html()`
- Default status code is 200; provide custom status as second parameter
- Always set appropriate `Content-Type` headers

Example:
```typescript
c.text("Hello", 200);
c.json({ data: "value" }, 201);
c.html("<h1>Title</h1>", 200);
```

## Architecture Notes

### Router Implementation
- Uses `find-my-way` library for fast route matching
- Wildcards (`*`) are converted to named parameters internally (`:wildcard1`, `:wildcard2`)
- Wildcard parameters are filtered out from exposed `params` object
- Route metadata stored in `RouteStore` including original path pattern

### Context Design
- Encapsulates request and provides convenience methods
- Separates raw request access via `c.req.raw`
- Provides dedicated methods for params, query strings, etc.
- Immutable design - create new responses rather than modifying context
