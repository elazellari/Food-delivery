const express = require("express");
const router = express.Router();
const userModel = require("../models/userModel"); // require userModel
const bcryptjs = require("bcryptjs"); //added to decrypt password hash
const mealkitsModel = require("../models/mealkitsModel");
const mealKitUtil = require("../modules/mealkit-util");
const sgMail = require("@sendgrid/mail");

sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

router.get("/", (req, res) => {
  mealkitsModel
    .find()
    .then((data) => {
      //Ensure our "data" object contains the returned data (only)
      let mealkits = data.map((value) => value.toObject());
      res.render("general/home", {
        mealkits,
        title: "On The Menu",
      });
    })
    .catch((err) => {
      console.log("Couldn't load mealkits " + err);
      res.status(500).send(err);
    });
});

router.get("/sign-up", (req, res) => {
  res.render("general/sign-up", {
    title: "Sign Up",
    validationMessages: {},
    values: {
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    },
  });
});

router.post("/sign-up", function (req, res) {
  const { firstName, lastName, email, password } = req.body;

  let passedValidation = true;
  let validationMessages = {};
  if (!/^[a-zA-Z]{2,}$/.test(firstName)) {
    passedValidation = false;
    validationMessages.firstName =
      "The first name must have at least two letters and contain only alphabetic characters.";
  }

  if (!/^[a-zA-Z]{2,}$/.test(lastName)) {
    passedValidation = false;
    validationMessages.lastName =
      "The last name must have at least two letters and contain only alphabetic characters.";
  }

  if (!/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/.test(email)) {
    // email validation "johndoe@test.com"

    passedValidation = false;
    validationMessages.email = "Please write a valid email.";
  }

  if (
    !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()\-_=+{};:,<.>]).{8,12}$/.test(
      password
    )
  ) {
    //password validation

    passedValidation = false;
    validationMessages.password =
      "Please select a password that is between 8 to 12 characters and contains at least one lowercase letter, uppercase letter, number and a symbol.";
  }

  if (passedValidation) {
    const newUser = new userModel({
      firstName,
      lastName,
      email,
      password,
    });

    newUser
      .save()
      .then((userSaved) => {
        console.log(
          `Registration Completed ${userSaved.firstName} has been added to the database`
        );
        //const sgMail = require("@sendgrid/mail");
        //sgMail.setApiKey(process.env.SEND_GRID_API_KEY);

        const msg = {
          to: email,
          from: "erilazellari@gmail.com",
          subject: "Sign Up Confirmation",
          html: `Dear ${firstName} ${lastName}, <br>
                  Your account has been created. <br>
                  Thank you for joining us, <br>
                  Erjon Lazellari, <br>
                  Bite Rush<br>`,
        };

        sgMail
          .send(msg)
          .then(() => {
            res.redirect("/welcome");
          })
          .catch((err) => {
            console.log(err);
            res.redirect("/");
          });
      })
      .catch((err) => {
        console.log(`Couldn't save the registration +  ${err}`);
        validationMessages.email =
          "The email you provided is already registered";
        res.render("general/sign-up", {
          title: "Sign Up",
          validationMessages,
          values: req.body,
        });
      });
  } else {
    res.render("general/sign-up", {
      title: "Sign Up",
      validationMessages,
      values: req.body,
    });
  }
});

router.get("/log-in", function (req, res) {
  res.render("general/log-in", {
    title: "Login",
    validationMessages: {},
    values: {
      email: "",
      password: "",
    },
  });
});

router.post("/log-in", function (req, res) {
  const { email, password, userLogin } = req.body;
  req.session.userLogin = userLogin;

  let passedValidation = true;
  let validationMessages = {};

  if (!email) {
    passedValidation = false;
    validationMessages.email = "Please provide an email!";
  }

  if (!password) {
    passedValidation = false;
    validationMessages.password = "Please provide a password!";
  }

  if (passedValidation) {
    //User Authentication

    userModel
      .findOne({
        email,
      })
      .then((user) => {
        if (user) {
          //Found the user document

          //Compare the password submitted with the document
          bcryptjs
            .compare(password, user.password)
            .then((matched) => {
              //Done comparing the passwords.
              if (matched) {
                //password matches.
                //Create a new session.
                req.session.user = user;
                //Check for user selection, clerk or customer
                if (userLogin === "clerk") {
                  console.log(userLogin);
                  res.redirect("/mealkits/list"); // Redirect to meal kit list for clerk
                } else {
                  console.log(userLogin);
                  res.redirect("/cart"); // Redirect to cart for customer
                }
              } else {
                //password didn't match
                validationMessages.password =
                  "Password doesn't match the database";
                res.render("general/log-in", {
                  title: "Login",
                  validationMessages,
                  values: req.body,
                });
              }
            })
            .catch((err) => {
              validationMessages.password = "Couldn't compare the password.";
              res.render("general/log-in", {
                title: "Login",
                validationMessages,
                values: req.body,
              });
            });
        } else {
          validationMessages.password = "User not found";
          res.render("general/log-in", {
            title: "Login",
            validationMessages,
            values: req.body,
          });
        }
      })
      .catch((err) => {
        validationMessages.email = "Couldn't get the document";
        res.render("general/log-in", {
          title: "Login",
          validationMessages,
          values: req.body,
        });
      });
  } else {
    res.render("general/log-in", {
      values: req.body, //added this line to save information
      title: "Login",
      validationMessages,
    });
  }
});

//Route to the logout page
router.get("/logout", (req, res) => {
  //Clear the session from memory.
  req.session.destroy();
  res.redirect("log-in");
});

router.get("/welcome", (req, res) => {
  if (req.session && req.session.user) {
    res.render("general/welcome", {
      title: "Welcome",
    });
  } else {
    res.status(401).render("general/error", {
      title: "Error",
      message: "You are not authorized to view this page",
    });
  }
});

// Route to add a meal kit to the cart
router.post("/cart", (req, res) => {
  const mealKitId = req.body.mealKitId;

  mealkitsModel
    .findById(mealKitId)
    .then((mealKit) => {
      if (!mealKit) {
        return res.status(404).send("Meal kit not found");
      }

      // Get cart from the session or initialize an empty array
      const cart = req.session.cart || [];

      // Check if the meal kit is already in the cart
      const existingMealKit = cart.findIndex((item) => item._id === mealKitId);

      if (existingMealKit !== -1) {
        cart[existingMealKit].quantity++;
      } else {
        req.session.cart = [...cart, { ...mealKit.toObject(), quantity: 1 }];
      }

      res.redirect("/cart");
    })
    .catch((err) => {
      console.log("Error fetching meal kit: ", err);
      res.status(500).send("Error fetching meal kit");
    });
});

// Route to display the cart
router.get("/cart", (req, res) => {
  const userLogin = req.session.userLogin;
  if (req.session && req.session.user && userLogin === "customer") {
    const cart = req.session.cart || [];

    const cartWithPrices = cart.map((mealKit) => {
      const subtotal = mealKit.price * mealKit.quantity;
      const tax = subtotal * 0.1;
      const grandTotal = subtotal + tax;

      return {
        ...mealKit,
        subtotal,
        tax,
        grandTotal,
      };
    });

    const totalSubtotal = cartWithPrices.reduce(
      (acc, mealKit) => acc + mealKit.subtotal,
      0
    );
    const totalTax = cartWithPrices.reduce(
      (acc, mealKit) => acc + mealKit.tax,
      0
    );
    const totalGrandTotal = totalSubtotal + totalTax;

    res.render("users/cart", {
      title: "Cart",
      cart: cartWithPrices,
      totalSubtotal,
      totalTax,
      totalGrandTotal,
    });
  } else {
    res.status(401).render("general/error", {
      title: "Error",
      message: "You are not authorized to view this page",
    });
  }
});

router.get("/remove-from-cart/:id", (req, res) => {
  const mealKitId = req.params.id;
  // Get cart from the session
  const cart = req.session.cart || [];

  const mealKitIndex = cart.findIndex((item) => item._id === mealKitId);

  if (mealKitIndex !== -1) {
    cart.splice(mealKitIndex, 1);
  }

  res.redirect("/cart");
});

router.post("/place-order", (req, res) => {
  const user = req.session.user;
  const cart = req.session.cart || [];
  const emailContent = mealKitUtil.generateEmailContent(
    user.firstName,
    user.lastName,
    user.email,
    cart
  );

  const msg = {
    to: user.email,
    from: "erilazellari@gmail.com",
    subject: "Order Confirmation",
    html: emailContent,
  };

  sgMail
    .send(msg)
    .then(() => {
      // Clear the shopping cart after the email is sent
      req.session.cart = [];
      res.status(200).send("Order placed successfully!");
    })
    .catch((err) => {
      console.error("Error sending email:", err);
      res.status(500).send("Failed to place order");
    });
});

module.exports = router;
