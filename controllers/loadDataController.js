const express = require("express");
const router = express.Router();
const mealkitsModel = require("../models/mealkitsModel");
const mealKit = require("../modules/mealkit-util");

// Add a route to copy the data from the fake database
// to the mongo db.
router.get("/mealkits", (req, res) => {
  // Protect this route, so only "data clerks" are able to access it.
  // if (req.session && req.session.user && req.session.isClerk) {
  // Clerk is signed in.
  const userLogin = req.session.userLogin;
  if (req.session && req.session.user && userLogin === "clerk") {
    mealkitsModel
      .countDocuments()
      .then((count) => {
        if (count === 0) {
          // There are no documents, proceed with the data load.

          mealkitsModel
            .insertMany(mealKit.getAllMealKits()) //mealkitsToAdd
            .then(() => {
              res.send("Added meal kits to the database");
            })
            .catch((err) => {
              res.send("Couldn't insert the documents: " + err);
            });
        } else {
          // There are already documents, don't duplicate them.
          res.send("Meal kits have already been added to the database");
        }
      })
      .catch((err) => {
        res.status(500).send("Error counting documents: " + err);
      });
  } else {
    res
      .status(403)
      .render("general/error", {
        title: "Error",
        message: "You are not authorized",
      });
  }
});

module.exports = router;
