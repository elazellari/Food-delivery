const path = require("path");
const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const mongoose = require("mongoose"); // require mongoose
const session = require("express-session"); // require session for login
const fileUpload = require("express-fileupload"); // require fileupload for uploading files

//Set up dotenv
const dotenv = require("dotenv");
dotenv.config({ path: "./config/keys.env" });
const app = express();

//Set up EJS
app.set("view engine", "ejs");
app.set("layout", "layouts/main");
app.use(expressLayouts);

//Set up body-parser

app.use(express.urlencoded({ extended: true })); //it was false initially

//Set up express-fileupload
app.use(fileUpload());

//Configure session
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
  })
);

app.use((req, res, next) => {
  // Save the user to the global variable "locals".
  res.locals.user = req.session.user;
  res.locals.userLogin = req.session.userLogin; //added this line to make userLogin available globally
  next();
});

// Add your routes here
// e.g. app.get() { ... }
app.use(express.static(path.join(__dirname, "/assets")));

//Load the Controllers into express.
const generalController = require("./controllers/generalController");
const mealkitsController = require("./controllers/mealkitsController");
const loadDataController = require("./controllers/loadDataController");
app.use("/", generalController);
app.use("/mealkits", mealkitsController);
app.use("/load-data", loadDataController); //Adding loadDataController to load mealkits

/*
app.get("/welcome", (req, res) => {
  res.render("general/welcome")
});*/

// This use() will not allow requests to go beyond it
// so we place it at the end of the file, after the other routes.
// This function will catch all other requests that don't match
// any other route handlers declared before it.
// This means we can use it as a sort of 'catch all' when no route match is found.
// We use this function to handle 404 requests to pages that are not found.
app.use((req, res) => {
  res.status(404).send("Page Not Found");
});

// This use() will add an error handler function to
// catch all errors.
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send("Something broke!");
  return; // added this because of error ERR_HTTP_HEADERS_SENT: Cannot set headers after they are sent to the client
});

// *** DO NOT MODIFY THE LINES BELOW ***

// Define a port to listen to requests on.
const HTTP_PORT = process.env.PORT || 8080;

// Call this function after the http server starts listening for requests.
function onHttpStart() {
  console.log("Express http server listening on: " + HTTP_PORT);
}

// Listen on port 8080. The default port for http is 80, https is 443. We use 8080 here
// because sometimes port 80 is in use by other applications on the machine

//Connect to the mongodb
mongoose
  .connect(process.env.MONGODB_CONNECTION_STRING)
  .then(() => {
    app.listen(HTTP_PORT, onHttpStart);
  })
  .catch((err) => {
    console.log(`Can't connect to the MongoDB database: ${err}`);
  });
