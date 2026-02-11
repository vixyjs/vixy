import Ivy from "../../src/index.ts";

const app = new Ivy();

// JSON body parsing
app.post("/api/json", async (c) => {
  const body = await c.req.json();
  return c.json({ received: body, type: "json" });
});

// Text body parsing
app.post("/api/text", async (c) => {
  const body = await c.req.text();
  return c.text(`You sent: ${body}`);
});

// Form data parsing
app.post("/api/form", async (c) => {
  const formData = await c.req.formData();
  const name = formData.get("name");
  const email = formData.get("email");
  return c.json({ name, email });
});

// Binary data parsing
app.post("/api/binary", async (c) => {
  const buffer = await c.req.arrayBuffer();
  return c.json({ byteLength: buffer.byteLength });
});

// Multiple body parser calls (demonstrating caching)
app.post("/api/multi", async (c) => {
  // You can call multiple body parsers on the same request
  // without getting "Body already used" error
  const json = await c.req.json();
  const text = await c.req.text();
  const buffer = await c.req.arrayBuffer();

  return c.json({
    parsedAsJson: json,
    textLength: text.length,
    bufferSize: buffer.byteLength,
  });
});

console.log("Server running on http://localhost:3000");
console.log("\nExample requests:");
console.log(
  '  curl -X POST http://localhost:3000/api/json -H "Content-Type: application/json" -d \'{"name":"John","age":30}\'',
);
console.log(
  '  curl -X POST http://localhost:3000/api/text -H "Content-Type: text/plain" -d "Hello World"',
);
console.log(
  '  curl -X POST http://localhost:3000/api/form -F "name=Alice" -F "email=alice@example.com"',
);

export default app;
