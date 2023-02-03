const { ObjectId } = require("mongodb");
const client = require("../db");

const productsCollection = client.db("simple-app").collection("products");
const categoriesCollection = client.db("simple-app").collection("categories");

let Product = function (data, ownerId, productId) {
  this.data = data;
  this.ownerId = ownerId;
  this.productId = productId;
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
  this.data = {
    name: this.data.name,
    price: this.data.price,
    categoryId: this.data.categoryId,
    quantity: this.data.quantity,
    ownerId: new ObjectId(this.ownerId),
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
    try {
      const products = await productsCollection
        .aggregate([
          {
            $match: {
              $and: [
                {
                  ...(this.categoryId && {
                    categoryId: new ObjectId(this.categoryId),
                  }),
                },
                {
                  ...(this.ownerId && {
                    ownerId: new ObjectId(this.ownerId),
                  }),
                },
              ],
            },
          },
          {
            // ...(this.ownerId && {
            $lookup: {
              from: "users",
              localField: "ownerId",
              foreignField: "_id",
              as: "owner",
              pipeline: [{ $project: { _id: 1, username: 1 } }],
            },
            // }),
          },
          {
            // ...(this.categoryId && {
            $lookup: {
              from: "categories",
              localField: "categoryId",
              foreignField: "_id",
              as: "category",
            },
            // }),
          },
          {
            $project: {
              owner: { $arrayElemAt: ["$owner.username", 0] },
              category: { $arrayElemAt: ["$category.name", 0] },
              name: true,
            },
          },
        ])
        .toArray();
      resolve(products);
    } catch {
      reject("Something went wrong..");
    }
  });
};

module.exports = Product;

Product.prototype.addQuantity = function () {
  return new Promise(async (resolve, reject) => {
    try {
      const udpatedProduct = productsCollection.updateOne(
        { _id: new ObjectId(this.productId) },
        { $inc: { quantity: this.data.quantity } }
      );
      resolve(udpatedProduct);
    } catch {
      reject("Something went wrong...");
    }
  });
};

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
