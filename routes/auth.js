const express = require("express");

const authController = require("../controllers/auth");
const { body } = require("express-validator/src");
const User = require("../models/user");
const router = express.Router();

router.get("/login", authController.getLogin);

router.get("/signup", authController.getSignup);

router.post(
  "/login",
  body("email")
    .isEmail()
    .withMessage("Please type a valid email.")
    .normalizeEmail(),
  body("password").notEmpty().trim(),
  authController.postLogin
);

router.post(
  "/signup",
  body("email")
    .isEmail()
    .withMessage("Please type a valid email.")
    .custom(async (value) => {
      const user = await User.findOne({ email: value });
      if (user) {
        throw new Error("E-mail already in use");
      }
      return true;
    })
    .normalizeEmail(),
  body(
    "password",
    "Please enter password with only numbers and text and at least 5 characters."
  )
    .isLength({ min: 5 })
    .trim(),
  body("confirmPassword")
    .notEmpty()
    .withMessage(["Please enter confirmation password."])
    .custom((value, { req }) => {
      return value === req.body.password;
    })
    .withMessage("Passwords do not match")
    .trim(),
  authController.postSignup
);

router.post("/logout", authController.postLogout);

router.get("/reset", authController.getReset);

router.post("/reset", authController.postReset);

router.get("/reset/:token", authController.newPassword);

router.post("/newpass", authController.postNewPassword);

module.exports = router;
