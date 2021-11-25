const { check, body } = require("express-validator");

const authenticationController = require("../controllers/authentication");
const User = require("../models/user");

const express = require("express");

const router = express.Router();

router.get("/login", authenticationController.getLogin);

router.get("/signup", authenticationController.getSignup);

router.post(
  "/login",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .normalizeEmail(),
    body(
      "password",
      "Please enter a password of at least 5 characters made up of only numbers and letters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
  ],
  authenticationController.postLogin
);

router.post("/logout", authenticationController.postLogout);

router.post(
  "/signup",
  [
    check("email")
      .isEmail()
      .withMessage("Please enter a valid email")
      .custom((value) => {
        return User.findOne({ email: value }).then((user) => {
          if (user)
            return Promise.reject(
              "This email address already exists, please enter a different one"
            );
        });
      })
      .normalizeEmail(),
    body(
      "password",
      "Please enter a password of at least 5 characters made up of only numbers and letters"
    )
      .isLength({ min: 5 })
      .isAlphanumeric()
      .trim(),
  ],
  authenticationController.postSignup
);

router.get("/reset-password", authenticationController.getResetPassword);

router.post("/reset-password", authenticationController.postResetPassword);

router.get("/reset-password/:token", authenticationController.getNewPassword);

router.post("/new-password", authenticationController.postNewPassword);

module.exports = router;
