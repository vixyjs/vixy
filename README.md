# Vixy

A lightweight web framework for Bun runtime with Express-like API for routing, path/query parameters, wildcards, and multiple HTTP methods.

## Overview

Vixy provides a simple and familiar routing API for building web applications on the Bun runtime. It features:

- Express-like routing with method chaining
- Feature complete with built-in response helpers for text, JSON, and HTML
- Powered by `find-my-way` for fast route matching
- Delightful developer experience with consistent API

## Quickstart

```bash
bun create vixy@latest
```

## Quick Example

```typescript
import Vixy from "vixy";

const app = new Vixy();

app.get("/", (c) => {
  return c.res.json({ message: "Hello, Vixy!" });
});

app.listen();
```

The app will be available at `http://localhost:8000` by default.

## Documentation

For full documentation, visit [https://vixyjs.github.io/docs](https://vixyjs.github.io/docs)

## Author

[Hisam Fahri](https://hisam.dev): [@hisamafahri](https://github.com/hisamafahri)

## License

[MIT](LICENSE)
