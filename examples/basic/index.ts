import Ivy from "../../src/index";

const app = new Ivy();

// Simple GET route
app.get("/", (c) => {
  return c.text("Hello World!");
});

// JSON response
app.get("/users", (c) => {
  return c.json({
    users: [
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ],
  });
});

// Route with parameters
app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.json({ userId: id, name: `User ${id}` });
});

// Multiple route parameters
app.get("/posts/:postId/comments/:commentId", (c) => {
  const postId = c.req.param("postId");
  const commentId = c.req.param("commentId");
  return c.json({
    post: postId,
    comment: commentId,
  });
});

// POST route with JSON body parser
app.post("/users", async (c) => {
  const body = await c.req.json();
  return c.json(
    {
      message: "User created",
      user: body,
    },
    201,
  );
});

// Text body parser
app.post("/echo", async (c) => {
  const text = await c.req.text();
  return c.text(`You sent: ${text}`);
});

// Form data body parser
app.post("/contact", async (c) => {
  const formData = await c.req.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  const message = formData.get("message");

  return c.json({
    message: "Contact form received",
    data: { name, email, message },
  });
});

// Binary data body parser
app.post("/upload", async (c) => {
  const buffer = await c.req.arrayBuffer();
  const blob = await c.req.blob();

  return c.json({
    message: "File uploaded",
    size: buffer.byteLength,
    blobSize: blob.size,
  });
});

// Multiple body parser calls - demonstrating caching
app.post("/analyze", async (c) => {
  // You can call multiple body parsers without "Body already used" error
  const json = await c.req.json();
  const text = await c.req.text();
  const buffer = await c.req.arrayBuffer();

  return c.json({
    parsedData: json,
    rawTextLength: text.length,
    bufferSize: buffer.byteLength,
  });
});

// HTML response
app.get("/about", (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>About</title>
      </head>
      <body>
        <h1>About Page</h1>
        <p>This is a sample Ivy application.</p>
      </body>
    </html>
  `);
});

// Multiple methods on same path
app.on(["GET", "POST"], "/multi", (c) => {
  return c.text(`Method: ${c.req.raw.method}`);
});

// Query parameters - single value
app.get("/search", (c) => {
  const query = c.req.query("q");
  const limit = c.req.query("limit") || "10";
  return c.json({
    query,
    limit,
    results: [],
  });
});

// Query parameters - get all at once
app.get("/filter", (c) => {
  const { category, minPrice, maxPrice } = c.req.query();
  return c.json({
    category,
    minPrice,
    maxPrice,
    items: [],
  });
});

// Multiple query values
app.get("/tags", (c) => {
  const tags = c.req.queries("tag");
  return c.json({
    tags: tags || [],
    count: tags?.length || 0,
  });
});

// Combining path params and query params
app.get("/users/:id/posts", (c) => {
  const userId = c.req.param("id");
  const page = c.req.query("page") || "1";
  const limit = c.req.query("limit") || "10";

  return c.json({
    userId,
    page: parseInt(page),
    limit: parseInt(limit),
    posts: [],
  });
});

// Request metadata example
app.get("/api/:version/info", (c) => {
  return c.json({
    href: c.req.href,
    pathname: c.req.pathname,
    routePathname: c.req.routePathname,
    version: c.req.param("version"),
    allQueryParams: c.req.query(),
  });
});

// Request headers example
app.get("/headers", (c) => {
  const userAgent = c.req.header("User-Agent");
  const accept = c.req.header("Accept");
  const authorization = c.req.header("Authorization");

  return c.json({
    userAgent,
    accept,
    authorization: authorization ? "Present" : "Missing",
  });
});

// Cookies example
app.get("/profile", (c) => {
  const sessionId = c.req.cookie("session_id");
  const userId = c.req.cookie("user_id");
  const allCookies = c.req.cookie();

  return c.json({
    sessionId,
    userId,
    cookieCount: Object.keys(allCookies).length,
  });
});

// 404 for unmatched routes is handled automatically
export default app;
