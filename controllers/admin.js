const { matchedData, validationResult } = require("express-validator/src");
const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
  if (!req.session.isLoggedIn) return res.redirect("/login");
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    oldInput: {},
    errorMessage: req.flash("error"),
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.body.imageUrl;
  const price = req.body.price;
  const description = req.body.description;

  const errors = validationResult(req);

  if (errors.isEmpty()) {
    const data = matchedData(req);
    const { title, price, description, imageUrl } = data;
    const product = new Product({
      title: title,
      price: price,
      description: description,
      imageUrl: imageUrl,
      userId: req.user,
    });
    product
      .save()
      .then((result) => {
        // console.log(result);
        console.log("Created Product");
        res.redirect("/admin/products");
      })
      .catch((err) => {
        console.log(err);
        res.status(400).render("admin/edit-product", {
          pageTitle: "Add Product",
          path: "/admin/add-product",
          editing: false,
          errorMessage: req.flash("error", err.message),
          oldInput: {
            title,
            imageUrl,
            price,
            description,
          },
        });
      });
  } else {
    res.status(400).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      errorMessage: errors
        .array()
        .map((error) => `Field: ${error.path}. ${error.msg}`),
      oldInput: {
        title,
        imageUrl,
        price,
        description,
      },
    });
  }
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/admin/products");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
        errorMessage: {},
      });
    })
    .catch((err) => {
      res.redirect("/admin/products");
      console.log(err);
    });
};

exports.postEditProduct = (req, res, next) => {
  const productId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.body.imageUrl;
  const updatedDesc = req.body.description;

  const errors = validationResult(req);
  Product.findById(productId)
    .then((product) => {
      if (errors.isEmpty()) {
        const data = matchedData(req);
        console.log("Product ID: ", productId);
        const { title, price, description, imageUrl } = data;
        product.title = title;
        product.price = price;
        product.description = description;
        product.imageUrl = imageUrl;
        return product.save();
      } else {
        throw new Error(
          errors
            .array()
            .map((error) => `Field: ${error.path}. ${error.msg}`)
            .join(",")
        );
      }
    })
    .then(() => {
      console.log("UPDATED PRODUCT!");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      res.status(400).render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: true,
        product: {
          _id: productId,
          title: updatedTitle,
          imageUrl: updatedImageUrl,
          price: updatedPrice,
          description: updatedDesc,
        },
        errorMessage: err.message,
        oldInput: {
          title: updatedTitle,
          imageUrl: updatedImageUrl,
          price: updatedPrice,
          description: updatedDesc,
        },
      });
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.user._id })
    .then((products) => {
      console.log(products);
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch(next);
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findByIdAndRemove(prodId)
    .then(() => {
      console.log("DESTROYED PRODUCT");
      res.redirect("/admin/products");
    })
    .catch(next);
};
