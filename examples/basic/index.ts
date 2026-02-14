import Vixy from "../../src/index";

const app = new Vixy();

app.use("*", async (c, next) => {
  c.req.setContext("startTime", Date.now());
  await next();
});

app.get("/", (c) => {
  const startTime = c.req.getContext("startTime");
  return c.res.text(`Start time: ${startTime}`);
});

app.get("/greet", (c) => {
  return c.res.json({
    message: "Hello",
  });
});

app.get("/users/:id", (c) => {
  const id = c.req.param("id");
  return c.res.json({ userId: id, name: `User ${id}` });
});

app.get("/posts/:postId/comments/:commentId", (c) => {
  const postId = c.req.param("postId");
  const commentId = c.req.param("commentId");
  return c.res.json({
    post: postId,
    comment: commentId,
  });
});

// DELETE route with null response (204 No Content)
app.delete("/null", (c) => {
  return c.res.null(); // Returns 204 by default
});

// HTML response
app.get("/about", (c) => {
  return c.res.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>Hello Vixy!</title>
      </head>
      <body>
        <p>This is a response from Vixy!</p>
      </body>
    </html>
  `);
});

// Cookie examples
app.get("/set-cookie", (c) => {
  c.res.cookie("session", "abc123", {
    httpOnly: true,
    maxAge: 3600,
    path: "/",
  });
  return c.res.json({ message: "Cookie set!" });
});

app.get("/get-cookie", (c) => {
  const session = c.req.cookie("session");
  return c.res.json({
    session: session ?? "No session cookie found",
  });
});

// Redirect examples
app.get("/old-page", (c) => {
  return c.res.redirect("/new-page"); // 302 temporary redirect by default
});

app.get("/permanent-redirect", (c) => {
  return c.res.redirect("/new-location", 301); // 301 permanent redirect
});

app.get("/new-page", (c) => {
  return c.res.text("Welcome to the new page!");
});

app.get("/new-location", (c) => {
  return c.res.text("This is the permanent location");
});

app.listen();

export default app;
