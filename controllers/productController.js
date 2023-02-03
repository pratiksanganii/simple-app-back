const Product = require("../models/Product");

exports.createProduct = function (req, res) {
  let product = new Product(req.body, req.session.user._userId);
  product
    .createProduct()
    .then((val) => {
      res.json(val);
    })
    .catch((err) => {
      res.json(err);
    });
};

exports.getProducts = function (req, res) {
  let product = new Product(undefined, req.query.owner);
  product
    .getProducts()
    .then((products) => {
      res.json({ products });
    })
    .catch((err) => {
      res.json(err);
    });
};

exports.addQuantity = function (req, res) {
  if (!req.body.productId) {
    res.json("Product Id is required.");
  } else if (!req.body.quantity) {
    res.json("Quantity is required.");
  } else {
    const product = new Product(req.body, req.session.user._userId,req.body.productId);
    product.addQuantity();
  }
};
