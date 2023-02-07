const { ObjectId } = require("mongodb");
const client = require("../db");

const productsCollection = client.db("simple-app").collection("products");
const categoriesCollection = client.db("simple-app").collection("categories");

let Product = function (data, ownerId) {
  this.data = data;
  this.ownerId = ownerId;
  this.errors = [];
};

Product.prototype.cleanUp = function () {
  if (typeof this.data.name != "string") {
    this.data.name = "";
  }
  if (typeof parseInt(this.data.price) != "number") {
    this.data.price = 0;
  }
  if (typeof parseInt(this.data.quantity) != "number") {
    this.data.quantity = 0;
  }
  if (typeof this.data.categoryId != "string") {
    this.data.categoryId = "";
  }
  if (typeof this.data.ownerId != "string") {
    this.data.ownerId = "";
  }
  this.data = {
    name: this.data.name,
    price: this.data.price,
    categoryId: this.data?.categoryId && new ObjectId(this.data?.categoryId),
    quantity: parseInt(this.data.quantity),
    ownerId:
      (this.data.ownerId || this.data.ownerId) &&
      new ObjectId(this.ownerId ? this.ownerId : this.data.ownerId),
  };
};

Product.prototype.validate = function () {
  return new Promise(async (resolve) => {
    let fieldErr = [];

    if (!this.data.name) {
      this.errors.push({ name: "Name is required." });
    }
    if (!this.data.price) {
      this.errors.push({ price: "Price is required." });
    }
    if (!this.data.quantity) {
      this.errors.push({ quantity: "Quantity is required." });
    }

    if (this.data.name) {
      fieldErr = [];
      if (this.data.name.length < 3) {
        fieldErr.push("Product name must be atleast 3 characters.");
      }
      if (this.data.name.length > 50) {
        fieldErr.push("Product name cannot exceed 50 characters.");
      }
      if (!fieldErr.length) {
        const isNameInUse = await productsCollection.findOne({
          name: this.data.name,
        });
        if (isNameInUse) fieldErr.push("Product name is already in use.");
      }
      fieldErr.length && this.errors.push({ name: fieldErr });
    }

    if (this.data.price) {
      fieldErr = [];
      if (isNaN(this.data.price)) {
        fieldErr.push("Product price must be in numbers.");
      }
      if (parseInt(this.data.price) <= 0) {
        fieldErr.push("Product price must be number greater than 0.");
      }
      if (this.data.price.length > 50) {
        fieldErr.push("Product price cannot exceed 50 characters.");
      }
      fieldErr.length && this.errors.push({ price: fieldErr });
    }
    if (this.data.quantity) {
      fieldErr = [];
      if (isNaN(this.data.quantity)) {
        fieldErr.push("Quantity price must be in numbers.");
      }
      if (parseInt(this.data.quantity) <= 0) {
        fieldErr.push("Quantity price must be number greater than 0.");
      }
      if (this.data.quantity.length > 50) {
        fieldErr.push("Quantity price cannot exceed 50 characters.");
      }
      fieldErr.length && this.errors.push({ quantity: fieldErr });
    }

    if (this.data.categoryId) {
      fieldErr = [];
      if (this.data.categoryId.length < 3) {
        fieldErr.push("Product category must be atleast 3 characters.");
      }
      if (this.data.categoryId.length > 50) {
        fieldErr.push("Product category cannot exceed 50 characters.");
      }
      if (!fieldErr.length) {
        const doesCategoryIdExist = categoriesCollection.findOne({
          _id: this.data.categoryId,
        });
        if (!doesCategoryIdExist) {
          fieldErr.push("That category does not exist.");
        }
      }
      fieldErr.length && this.errors.push({ category: fieldErr });
    }
    resolve();
  });
};

Product.prototype.createProduct = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate();
    if (this.errors.length) {
      reject(this.errors);
    } else {
      const productDoc = await productsCollection.insertOne(this.data);
      resolve(productDoc);
    }
  });
};

Product.prototype.getProducts = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();

    let aggOpertaions = [];

    if (this.data.ownerId) {
      aggOpertaions.push({
        $match: {
          ownerId: this.data.ownerId,
        },
      });
    }
    if (this.data.categoryId) {
      aggOpertaions.push({
        $match: {
          categoryId: this.data.categoryId,
        },
      });
    }
    if (this.data.ownerId) {
      aggOpertaions.push({
        $lookup: {
          from: "users",
          localField: "ownerId",
          foreignField: "_id",
          as: "owner",
        },
      });
    }
    aggOpertaions.push({
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "category",
      },
    });
    if (this.data.ownerId) {
      aggOpertaions.push({
        $project: {
          owner: { $arrayElemAt: ["$owner.username", 0] },
          category: { $arrayElemAt: ["$category.name", 0] },
          name: true,
        },
      });
    } else {
      aggOpertaions.push({
        $project: {
          category: { $arrayElemAt: ["$category.name", 0] },
          name: true,
        },
      });
    }
    try {
      const products = await productsCollection
        .aggregate(aggOpertaions)
        .toArray();
      resolve(products);
    } catch {
      reject("Something went wrong..");
    }
  });
};

Product.prototype.addQuantity = function () {
  return new Promise(async (resolve, reject) => {
    if (!this.ownerId) {
      reject("You must be login to perform that action.");
    } else if (!this.productId) {
      reject("productId is required.");
    } else if (!this.data.quantity) {
      reject("Quantity is required.");
    } else {
      try {
        productsCollection
          .findOneAndUpdate(
            { _id: new ObjectId(this.productId) },
            { $inc: { quantity: this.data.quantity } }
          )
          .then((val) => {
            if (val.value) {
              resolve(val.value);
            } else {
              reject("Product does not exist.");
            }
          })
          .catch((err) => {
            reject(err);
          });
      } catch {
        reject("Something went wrong...");
      }
    }
  });
};

module.exports = Product;
// let aggOpertaions = uniqueOperations.concat([
//   {
//     $lookup: {
//       from: "users",
//       localField: "author",
//       foreignField: "_id",
//       as: "authorDocument",
//     },
//   },
//   {
//     $project: {
//       title: 1,
//       body: 1,
//       createdDate: 1,
//       authorId: "$author",
//       author: { $arrayElemAt: ["$authorDocument", 0] },
//     },
//   },
// ]);
