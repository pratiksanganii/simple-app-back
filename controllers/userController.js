const User = require("../models/User");
const jwt = require("jsonwebtoken");
const { validate } = require("email-validator");

exports.register = function (req, res) {
  let user = new User(req.body);
  user
    .register()
    .then((data) => {
      res.json(data);
    })
    .catch((err) => {
      res.json(err);
    });
};

exports.login = function (req, res) {
  const body = {
    username: req.body.username,
    password: req.body.password,
  };
  let user = new User(body);
  user
    .login()
    .then((token) => {
      req.session.token = token;
      res.json(token);
    })
    .catch((err) => {
      res.json(err);
    });
};

exports.verifyToken = function (req, res, next) {
  if (!req.headers.token) {
    res.status(401).json("Your session has been expired kindly login again.");
  } else {
    try {
      const isAuthorized = jwt.verify(
        req.headers.token,
        process.env.JWT_SECRET
      );
      if (isAuthorized) {
        req.session.user = isAuthorized;
        next();
      } else {
        res.status(401).json("Token is not valid.");
      }
    } catch {
      res.status(401).json("Token is not valid.");
    }
  }
};

exports.forgetPassword = function (req, res) {
  if (validate(req.body.email)) {
    const user = new User(req.body);
    user
      .forgetPassword()
      .then(() => {
        res.json("Reset Password link sent to your Email.");
      })
      .catch((err) => {
        res.json(err);
      });
  } else {
    res.json("That is not a valid email.");
  }
};
