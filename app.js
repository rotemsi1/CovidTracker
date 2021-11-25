const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDbStore = require("connect-mongodb-session")(session);
const csrf = require("csurf");
const flash = require("connect-flash");
const multer = require("multer");
const helmet = require("helmet");
const compression = require("compression");

const filesHelper = require("./middleware/files");
const errorController = require("./controllers/error");
const User = require("./models/user");

const MONGODB_URI = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@covid-tracker.tlkro.mongodb.net/${process.env.MONGO_DEFAULT_DATABASE}?retryWrites=true&w=majority`;

const countryRoutes = require("./routes/country");
const authenticationRoutes = require("./routes/authentication");

const app = express();

// Define a "Sessions" collection
const mongoDbStore = new MongoDbStore({
  uri: MONGODB_URI,
  collection: "sessions",
});

// Use CSRF protection
const csrfProtection = csrf();

// Define a file storage destination and file names convention
const fileStorage = multer.diskStorage({
  destination: (request, file, callback) => callback(null, "images"),
  filename: (request, file, callback) =>
    callback(null, new Date().toISOString() + "-" + file.originalname),
});

// Use EJS as a templating engine
app.set("view engine", "ejs");

app.use(express.static(path.join(__dirname, "public")));
app.use("/images", express.static(path.join(__dirname, "images")));
app.use(express.urlencoded({ extended: false }));
app.use(multer({ storage: fileStorage, filter: filesHelper }).single("image"));

// Add a "session" property (as a session) to the request handled by the index ("/")
app.use(
  session({
    secret: "my secret",
    resave: false,
    saveUninitialized: false,
    store: mongoDbStore,
  })
);
// Add a CSRF protection to the session
app.use(csrfProtection);
// Use flash messages in the app
app.use(flash());
// Use Helmet to protect to response headers
app.use(helmet());
//
app.use(compression());

// After logging in:
// 1. Register a "isAuthenticated" boolean on the "locals" property of the response according to the
// "isLoggedIn" property of the session object
// 2. Register a CSRF-protection token on the "locals" property of the response
// This is for rendering the correct buttons/links according to the state of either being logged in or not
app.use((request, response, next) => {
  response.locals.isAuthenticated = request.session.isLoggedIn;
  response.locals.csrfToken = request.csrfToken();
  next();
});

app.use((request, response, next) => {
  // If no session is registered on the request, move to the next middleware
  if (!request.session.user) return next();
  // Find the user in the database according to the user ID registered on the session property of the request
  // This gives access to all the user's data as part of the session, not only the user's ID
  User.findById(request.session.user._id)
    .then((user) => {
      // If no user was found in the database (perhaps deleted in-between) - move to the next middleware
      if (!user) return next();
      request.user = user;
      next();
    })
    .catch((error) => next(new Error(error)));
});

app.use(authenticationRoutes);
app.use(countryRoutes);

// About page middleware
app.use("/about", (request, response, next) => {
  response.render("about", {});
});

// Index page middleware
app.use("/", (request, response, next) => {
  response.render("index", {});
});

// Error page middleware
app.get("/500", errorController.get500);

// Page not found middleware
app.use(errorController.get404);

// Error middleware
app.use((error, request, response, next) => {
  response.render("500"), {};
});

mongoose
  .connect(MONGODB_URI)
  .then(app.listen(process.env.PORT || 3000))
  .catch((error) => console.log(error));
