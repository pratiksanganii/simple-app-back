const { validate } = require("email-validator");
const bcrypt = require("bcrypt");
const client = require("../db");
const jwt = require("jsonwebtoken");

const saltRounds = 10;
const usersCollection = client.db("simple-app").collection("users");

let User = function (data) {
  this.data = data;
  this.errors = [];
};

User.prototype.cleanUp = function () {
  if (typeof this.data?.username != "string") {
    this.data.username = "";
  }
  if (typeof this.data?.email != "string") {
    this.data.email = "";
  }
  if (typeof this.data?.password != "string") {
    this.data.password = "";
  }

  this.data = {
    username: this.data.username,
    email: this.data.email,
    password: this.data.password,
  };
};

User.prototype.validate = function () {
  return new Promise(async (resolve) => {
    let errors = [];
    if (!this.data?.username) {
      this.errors.push({ username: ["Username is required."] });
    }
    if (!this.data?.email) {
      this.errors.push({ username: ["Email is required."] });
    }

    if (!this.data?.password) {
      this.errors.push({ username: ["Password is required."] });
    }

    if (this.data.username) {
      errors = [];
      if (this.data.username.length < 5) {
        errors.push("Username must be atleast 5 characters.");
      }
      if (this.data.username.length > 30) {
        errors.push("Username cannot exceed 30 characters.");
      }
      if (/[^a-z0-9]+/g.test(this.data.username)) {
        errors.push("Username must be Alphanumeric.");
      }
      if (errors.length) {
        this.errors.push({ username: errors });
      }
    }
    if (this.data?.email) {
      errors = [];
      if (!validate(this.data.email)) {
        errors.push("You must provide a valid email address.");
      }
      if (errors.length) {
        this.errors.push({ email: errors });
      }
    }
    if (this.data?.password) {
      errors = [];
      if (this.data.password.length < 8) {
        errors.push("Password must be atleast 8 characters.");
      }
      if (this.data.password.length > 30) {
        errors.push("Password cannot exceed 30 characters.");
      }
      if (errors.length) {
        this.errors.push({ password: errors });
      }
    }

    // check if username is already taken
    if (!this.errors.length) {
      const doesUserExist = await usersCollection.findOne({
        username: this.data.username,
      });
      if (doesUserExist) {
        this.errors.push({ username: "That username is already being used." });
      }
    }
    resolve();
  });
};

User.prototype.register = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    await this.validate();
    if (this.errors.length) {
      reject(this.errors);
    } else {
      bcrypt.hash(this.data.password, saltRounds, (err, hash) => {
        const userDoc = usersCollection.insertOne({
          username: this.data.username,
          email: this.data.email,
          password: hash,
        });
        resolve(userDoc);
      });
    }
  });
};

User.prototype.login = function () {
  return new Promise(async (resolve, reject) => {
    this.cleanUp();
    const userDoc = await usersCollection.findOne({
      username: this.data.username,
    });
    if (userDoc) {
      if (!bcrypt.compareSync(this.data.password, userDoc.password)) {
        reject("Invalid Credentials.");
      }
      const token = jwt.sign(
        {
          _userId: userDoc._id,
          _username: userDoc.username,
          _email: userDoc.email,
        },
        process.env.JWT_SECRET,
        {
          expiresIn: 24 * 60 * 1000,
        }
      );
      resolve({ token });
    } else {
      reject("No user found with given credentials.");
    }
  });
};

module.exports = User;
