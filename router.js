const express = require("express");
const router = express.Router();
const userController = require("./controllers/userController");
const productController = require("./controllers/productController");
const categoryController = require("./controllers/categoryController");

router.get("/", function (req, res) {
  res.json("Welcome to the simple-api..");
});

router.post("/register", userController.register);
router.post("/login", userController.login);

router.get("/products", productController.getProducts);
router.post(
  "/create-product",
  userController.verifyToken,
  productController.createProduct
);
router.post(
  "/add-quantity",
  userController.verifyToken,
  productController.addQuantity
);

router.post(
  "/create-category",
  userController.verifyToken,
  categoryController.create
);

router.post('/demo')

module.exports = router;
