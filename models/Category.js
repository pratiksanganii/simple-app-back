const client = require("../db");

const categoriesCollection = client.db("simple-app").collection("categories");

class Category {
  constructor(data) {
    this.data = data;
    this.errors = [];
  }

  cleanUp() {
    if (typeof this.data?.name !== "string") {
      this.data.name = "";
    }
  }

  validate() {
    return new Promise(async (resolve) => {
      if (!this.data.name) {
        this.errors.push("Category name cannot be blank.");
      }
      if (this.data.name) {
        if (this.data.name.length < 3) {
          this.errors.push("Category name must be atleast 3 characters.");
        }
        if (this.data.name.length > 50) {
          this.errors.push("Category name cannot exceed 50 characters.");
        }
      }
      if (!this.errors.length) {
        const categoryDoc = await categoriesCollection.findOne({
          name: this.data.name,
        });
        if (categoryDoc) {
          this.errors.push("That category already exists.");
        }
      }
      resolve();
    });
  }

  create() {
    return new Promise(async (resolve, reject) => {
      this.cleanUp();
      await this.validate();
      if (!this.errors.length) {
        categoriesCollection
          .insertOne(this.data)
          .then((newDoc) => {
            resolve(newDoc.insertedId);
          })
          .catch(() => {
            reject("Something went wrong.");
          });
      } else {
        reject(this.errors);
      }
    });
  }
}

module.exports = Category