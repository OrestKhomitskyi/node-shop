const User = require("../models/user");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const sendgridTransport = require("nodemailer-sendgrid-transport");
const crypto = require("crypto");
const { validationResult, matchedData } = require("express-validator/src");

const transporter = nodemailer.createTransport(
  sendgridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

exports.getLogin = (req, res, next) => {
  res.render("auth/login", {
    path: "/login",
    pageTitle: "Login",
    errorMessage: req.flash("error"),
    oldInput: {},
  });
};

exports.getSignup = (req, res, next) => {
  res.render("auth/signup", {
    path: "/signup",
    pageTitle: "Signup",
    errorMessage: req.flash("error"),
  });
};

exports.postLogin = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    const data = matchedData(req);
    const { email, password } = data;
    let user;
    User.findOne({ email })
      .then((foundUser) => {
        if (!foundUser) throw new Error("User doesnt exist.");
        user = foundUser;
        return bcrypt.compare(password, user.password);
      })
      .then((isCorrect) => {
        if (isCorrect) {
          req.session.user = user;
          req.session.isLoggedIn = true;
          return req.session.save();
        } else {
          throw new Error("Invalid password");
        }
      })
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        res.status(422).render("auth/login", {
          path: "/login",
          pageTitle: "Login",
          errorMessage: err.message,
          oldInput: {
            email: req.body.email,
            password: req.body.password,
          },
        });
      });
  } else {
    res.status(422).render("auth/login", {
      path: "/login",
      pageTitle: "Login",
      errorMessage: result
        .array()
        .map((error) => `Field: ${error.path}. ${error.msg}`),
      oldInput: {
        email: req.body.email,
        password: req.body.password,
      },
    });
  }
};

exports.postSignup = (req, res, next) => {
  const result = validationResult(req);
  if (result.isEmpty()) {
    const data = matchedData(req);
    const { email, password } = data;
    bcrypt
      .hash(password, 12)
      .then((password) => {
        const user = new User({ email, password, cart: { items: [] } });
        return user.save();
      })
      .then(() => {
        return transporter.sendMail({
          to: email,
          from: "orestkhomitskyi@gmail.com",
          subject: "Signup succeded",
          html: "<h1>You successfully signed up</h1>",
        });
      })
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        req.flash("error", err.message);
        res.redirect("/signup");
      });
  } else {
    req.flash(
      "error",
      result.array().map((error) => `Field: ${error.path}. ${error.msg}`)
    );
    res.redirect("/signup");
  }
};

exports.postLogout = (req, res, next) => {
  req.session.destroy((err) => {
    res.redirect("/");
  });
};

exports.getReset = (req, res, next) => {
  res.render("auth/reset", {
    path: "/reset",
    pageTitle: "Reset password",
    errorMessage: req.flash("error"),
  });
};

exports.postReset = (req, res, next) => {
  const email = req.body.email;
  crypto.randomBytes(32, (err, buffer) => {
    if (err) {
      return res.redirect("/reset");
    }
    const token = buffer.toString("hex");
    User.findOne({ email: req.body.email })
      .then((user) => {
        if (!user) throw new Error("User doesnt exist");
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        return transporter.sendMail({
          to: email,
          from: "orestkhomitskyi@gmail.com",
          subject: "Reset password",
          html: `<p>You requested password reset</p>
                 <p>Click this <a href="http://localhost:3000/reset/${token}">link</a> to reset password!
          `,
        });
      })
      .then(() => {
        res.redirect("/");
      })
      .catch((err) => {
        req.flash("error", err.message);
        res.redirect("/reset");
      });
  });
};

exports.newPassword = (req, res, next) => {
  const { token } = req.params;
  User.findOne({
    resetToken: token,
    resetTokenExpiration: {
      $gt: Date.now(),
    },
  })
    .then((user) => {
      req.flash("backUrl", req.url);
      res.render("auth/newpass", {
        pageTitle: "New Password",
        path: "/new-password",
        errorMessage: req.flash("error"),
        userId: user._id.toString(),
        token,
      });
    })
    .catch((err) => {
      console.log(err);
      res.redirect("/reset");
    });
};

exports.postNewPassword = (req, res, next) => {
  const { password, confirmPassword, userId, token } = req.body;
  const backUrl = req.flash("backUrl");
  let user;
  User.findOne({
    _id: userId,
    resetToken: token,
    resetTokenExpiration: { $gt: Date.now() },
  })
    .then((foundUser) => {
      user = foundUser;
      if (!user) throw new Error("Cant be found user with that id");

      if (password !== confirmPassword)
        throw new Error("Passwords are not identical");

      return bcrypt.hash(password, 12);
    })
    .then((newPassword) => {
      user.password = newPassword;
      user.resetToken = undefined;
      user.resetTokenExpiration = undefined;
      return user.save();
    })
    .then(() => {
      res.redirect("/");
    })
    .catch((err) => {
      req.flash("error", err.message);
      res.redirect(backUrl);
    });
};
