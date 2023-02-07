const express = require("express");
const router = require("./router");
const bodyParser = require("body-parser");
const cors = require("cors");
const session = require("express-session");
const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

const sessionOptions = {
  resave: false,
  saveUninitialized: false,
  secret: process.env.JWT_SECRET,
};

app.use(session(sessionOptions));

app.use(cors());
app.use("/", router);
module.exports = app;
// const os = require("os");
// io.on("connection", (socket) => {
// });
// const http = require("http");
// const server = http.createServer(app);
// const { Server } = require("socket.io");
// const io = new Server(server);
