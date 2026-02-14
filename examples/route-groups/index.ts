import Vixy from "../../src/index";

// User controller
const userController = new Vixy();

userController.get("/", (c) => c.res.json({ message: "List all users" }));
userController.get("/:id", (c) =>
  c.res.json({ message: `Get user ${c.req.param("id")}` }),
);
userController.post("/", (c) => c.res.json({ message: "Create user" }));

// Product controller
const productController = new Vixy();

productController.get("/", (c) => c.res.json({ message: "List all products" }));
productController.get("/:id", (c) =>
  c.res.json({ message: `Get product ${c.req.param("id")}` }),
);

// API v1 group
const apiV1 = new Vixy();

apiV1.route("/users", userController);
apiV1.route("/products", productController);

// Main app
const app = new Vixy();

app.get("/", (c) => c.res.text("Welcome to Vixy Route Groups Example"));
app.route("/v1", apiV1);

app.listen({
  port: 3000,
  onListening: ({ port, hostname }) => {
    console.log(`Server is running at http://${hostname}:${port}`);
    console.log("\nTry these routes:");
    console.log("  http://localhost:3000/");
    console.log("  http://localhost:3000/v1/users");
    console.log("  http://localhost:3000/v1/users/123");
    console.log("  http://localhost:3000/v1/products");
    console.log("  http://localhost:3000/v1/products/456");
  },
});
