const path = require("path");

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const session = require("express-session");
const errorController = require("./controllers/error");
const MongoDBStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const User = require("./models/user");
const flash = require("connect-flash");

const MONGO_DB_URI =
  "mongodb+srv://orestkhomitskyi:agl76RcuBCX1SMd0@some-new-cluster.ssnio3i.mongodb.net/shop";

const app = express();
const store = new MongoDBStore({
  uri: MONGO_DB_URI,
  collection: "sessions",
});

app.set("view engine", "ejs");
app.set("views", "views");

const adminRoutes = require("./routes/admin");
const shopRoutes = require("./routes/shop");
const authRoutes = require("./routes/auth");

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    name: "session.id",
    store,
  })
);
app.use(flash());
app.use(csrf());

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

app.use((req, res, next) => {
  if (!req.session.user) return next();
  User.findById(req.session.user._id)
    .then((user) => {
      if (user) req.user = user;
      next();
    })
    .catch((err) => {
      throw new Error(err);
    });
});

app.use(authRoutes);
app.use("/admin", adminRoutes);
app.use(shopRoutes);

app.use((err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  res.status(500);
  res.render("500", {
    pageTitle: "Error",
    path: "/500",
  });
});

app.use(errorController.get404);

mongoose
  .connect(MONGO_DB_URI, {
    dbName: "shop",
  })
  .then(() => {
    app.listen(8080);
  })
  .catch((err) => {
    console.log(err);
  });
