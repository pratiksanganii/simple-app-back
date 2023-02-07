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
  let product = new Product(req.body);
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
  const product = new Product(
    req.body,
    req.session.user._userId,
    req.body.productId
  );
  product
    .addQuantity()
    .then((product) => {
      res.json(product);
    })
    .catch((err) => {
      res.json(err);
    });
};
