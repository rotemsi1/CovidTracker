// Crypto - built-in NodeJS tool for encryption
const crypto = require("crypto");
// Bcrypt - 3rd party tool for encrypting password in the database
const bcrypt = require("bcryptjs");
// 3rd party libraries for send emails
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
// 3rd party library for validation
const { validationResult } = require("express-validator");

const errorHandler = require("../middleware/error-handling");

const User = require("../models/user");
const Country = require("../models/country");

// Use a transporter object by SendGrid to send e-mails
// 1. When signing up
// 2. When resetting the password
const transporter = nodemailer.createTransport(
  sendGridTransport({
    auth: {
      api_key:
        "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",
    },
  })
);

exports.getLogin = (request, response, next) => {
  let message = request.flash("error");
  message = message.length > 0 ? message[0] : null;
  console.log(request.flash("error"));
  response.render("authentication/login", {
    path: "/authentication/login",
    pageTitle: "Login",
    errorMessage: message,
    // Since it's possible to input invalid credentials, re-render them
    // As they are rendered in the signup page
    oldInput: { email: "", password: "" },
  });
};

exports.postLogin = async (request, response, next) => {
  // Store the errors from the request's validation in an array
  const errors = validationResult(request);
  // If there are any errors - render the signup page with the errors
  if (!errors.isEmpty()) {
    return response.status(422).render("authentication/login", {
      path: "/authentication/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
      oldInput: { email: request.body.email, password: request.body.password },
    });
  }
  try {
    const user = await User.findOne({ email: request.body.email });
    // If no user with such email was found - render an error message
    if (!user) {
      return response.status(422).render("authentication/login", {
        path: "/authentication/login",
        pageTitle: "Login",
        errorMessage: errors.array()[0].msg,
      });
    }
    const isMatchingPasswords = await bcrypt.compare(
      request.body.password,
      user.password
    );
    // If the encrypted password matches the password entered in the login page
    if (isMatchingPasswords) {
      // Register a "isLoggedIn" boolean value and the logged in user on the session property of the request
      request.session.isLoggedIn = true;
      request.session.user = user;
      // If an error occurs, redirect back to the main page
      return request.session.save((error) => response.redirect("/"));
    }
    // If the passwords don't match - render an error message
    response.status(422).render("authentication/login", {
      path: "/authentication/login",
      pageTitle: "Login",
      errorMessage: errors.array()[0].msg,
    });
  } catch (error) {
    console.log(error);
    response.redirect("/login");
    errorHandler(error, next);
  }
};

exports.getSignup = async (request, response, next) => {
  let message = request.flash("error");
  message = message.length > 0 ? message[0] : null;
  try {
    const countries = await Country.find({ adminUser: undefined });
    response.render("authentication/signup", {
      path: "/authentication/signup",
      pageTitle: "Signup",
      countriesData: countries,
      errorMessage: message,
      // Since it's possible to input invalid credentials, re-render them
      // As they are rendered in the signup page
      oldInput: { email: "", password: "" },
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.postSignup = async (request, response, next) => {
  // Store the errors from the request's validation in an array
  const errors = validationResult(request);
  // If there are any errors - render the signup page with the errors
  if (!errors.isEmpty()) {
    return response.status(422).render("authentication/signup", {
      path: "/signup",
      pageTitle: "Signup",
      errorMessage: errors.array()[0].msg,
      // In case of an error - render a dummy empty array to not break the render
      countriesData: [],
      // Re-render the invalid email and/or password as a hint to the user
      oldInput: { email: request.body.email, password: request.body.password },
    });
  }
  try {
    // Register a new user
    // 1. Hash the password
    const hashedPassword = await bcrypt.hash(request.body.password, 12);
    // 2. Find the country that the new user will be the owner of
    const country = await Country.findOne({ name: request.body.country });
    // 3. Create the new user and save to the database
    const user = new User({
      email: request.body.email,
      password: hashedPassword,
      countryOwnership: country._id,
      resetToken: undefined,
      resetTokenExpiration: undefined,
    });
    await user.save();
    // 4. Set the country's admin user to be the new user
    const ownedCountry = await Country.findOne({ name: request.body.country });
    ownedCountry.adminUser = user._id;
    await ownedCountry.save();
    response.redirect("/login");
    console.log("Signed up successfully");
    transporter.sendMail({
      to: request.body.email,
      from: "rotemsinger2011@gmail.com",
      subject: "You have successfully signed up to Covid Tracker",
      html: "<h1>You have successfully signed up!</h1>",
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.postLogout = (request, response, next) => {
  // Remove the session property from the request and redirect to the main page
  request.session.destroy((error) => {
    console.log("Logged out");
    response.redirect("/");
  });
};

exports.getResetPassword = (request, response, next) => {
  let message = request.flash("error");
  message = message.length > 0 ? message[0] : null;
  response.render("authentication/reset-password", {
    path: "/reset-password",
    pageTitle: "Reset Password",
    errorMessage: message,
  });
};

// Need to change to async/await
exports.postResetPassword = (request, response, next) => {
  // Generate a buffer of encrypted data
  crypto.randomBytes(32, (error, buffer) => {
    if (error) {
      console.log(error);
      response.redirect("/reset-password");
    }
    // Transform the encrypted data buffer for hexadecimal to plain text
    const token = buffer.toString("hex");
    User.findOne({ email: request.body.email })
      .then((user) => {
        // If no use with such an email was found, flash an error and redirect to the "Reset password" page
        if (!user) {
          request.flash("error", "No account with that email was found");
          return response.redirect("/reset-password");
        }
        // Set the reset password token and expiration date and save them to the database
        // The token is only valid for 1 hour in this project
        user.resetToken = token;
        user.resetTokenExpiration = Date.now() + 3600000;
        return user.save();
      })
      .then((result) => {
        // Redirect to the main page and send an email with the password reset link
        response.redirect("/");
        transporter.sendMail({
          to: request.body.email,
          from: "rotemsinger2011@gmail.com",
          subject: "Resetting the password to Covid Tracker",
          html: `
            <p>You have requested to reset your password</p>
            <p>Click this <a href="http://localhost:3000/reset-password/${token}">link to set a new password</p>
          `,
        });
      })
      .catch((error) => errorHandler(error, next));
  });
};

exports.getNewPassword = async (request, response, next) => {
  // Find a user whose reset password token is equal to the one from the request's parameters
  try {
    const user = await User.findOne({
      resetToken: request.params.token,
      resetTokenExpiration: { $gt: Date.now() },
    });
    let message = request.flash("error");
    message = message.length > 0 ? message[0] : null;
    response.render("authentication/new-password", {
      path: "/new-password",
      pageTitle: "New Password",
      errorMessage: message,
      userId: user._id.toString(),
      passwordToken: request.params.token,
    });
  } catch (error) {
    errorHandler(error, next);
  }
};

exports.postNewPassword = async (request, response, next) => {
  // It is necessary to define a new resetUser variable since the user needs to be available
  // in the latter then block, after the password hash action which returns a callback
  // Find a user whose password token is equal to the one from the request and whose password token's expiration date
  // is from the last 1 hour
  try {
    const user = await User.findOne({
      resetToken: request.body.passwordToken,
      resetTokenExpiration: { $gt: Date.now() },
    });
    const hashedPassword = await bcrypt.hash(request.body.password, 12);
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpiration = undefined;
    await user.save();
    // Redirect back to the lgin page after setting the new password
    response.redirect("/login");
  } catch (error) {
    errorHandler(error, next);
  }
};
