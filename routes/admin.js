const express = require("express");

const adminController = require("../controllers/admin");
const isAuth = require("../middleware/is-auth");
const { body } = require("express-validator/src");
const router = express.Router();

const productValidationChain = [
  body("title")
    .isString()
    .withMessage("Please provide alphanumeric title")
    .isLength({ max: 50 })
    .withMessage("Max length = 50 characters"),
  body("imageUrl", "Please provide Image URl").isURL(),
  body(
    "price",
    "Please provide valid provide valid unsigned price less than 10000 and more than 0.99"
  )
    .isFloat({ gt: 0.99, lt: 10000 })
    .toFloat(),
  body("description", "Please provide valid description")
    .notEmpty()
    .isLength({ max: 100 }),
];

// /admin/add-product => GET
router.get("/add-product", isAuth, adminController.getAddProduct);

// /admin/products => GET
router.get("/products", isAuth, adminController.getProducts);

// /admin/add-product => POST
router.post(
  "/add-product",
  isAuth,
  ...productValidationChain,
  adminController.postAddProduct
);

router.get("/edit-product/:productId", isAuth, adminController.getEditProduct);

router.post(
  "/edit-product",
  isAuth,
  ...productValidationChain,
  adminController.postEditProduct
);

router.post("/delete-product", isAuth, adminController.postDeleteProduct);

module.exports = router;
