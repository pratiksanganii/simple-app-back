const Category = require("../models/Category");

exports.create = function (req, res) {
  const category = new Category(req.body);
  category
    .create()
    .then((value) => {
      res.json(value);
    })
    .catch((err) => {
      res.json(err);
    });
};
