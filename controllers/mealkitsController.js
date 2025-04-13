const express = require("express");
const router = express.Router();
const mealkitsModel = require("../models/mealkitsModel");
const mealKit = require("../modules/mealkit-util");
const path = require("path");

//Load data to on-the-menu view directly from the database
router.get("/", (req, res) => {
  mealkitsModel
    .find()
    .then((data) => {
      //Ensure our "data" object contains the returned data (only)
      let mealkits = data.map((value) => value.toObject());
      let groupedMealKits = mealKit.getMealKitsByCategory(mealkits);
      res.render("general/on-the-menu", {
        mealkits: groupedMealKits,
        title: "On The Menu",
      });
    })
    .catch((err) => {
      console.log("Couldn't load mealkits " + err);
      res.status(500).send(err);
    });
});

//Route to /mealkits/list for data entry clerk
router.get("/list", (req, res) => {
  const user = req.session.user;
  const userLogin = req.session.userLogin;
  if (req.session && req.session.user && userLogin === "clerk") {
    mealkitsModel
      .find()
      .then((data) => {
        //Ensure our "data" object contains the returned data (only)
        let mealkits = data.map((value) => value.toObject());
        res.render("mealkits/list", {
          userLogin: userLogin,
          user: user,
          mealkits: mealkits,
          title: "Mealkits List",
        });
      })
      .catch((err) => {
        console.log("Couldn't load mealkits " + err);
        res.status(500).send(err);
      });
  } else {
    res.status(401).render("general/error", {
      title: "Error",
      message: "You are not authorized to view this page",
    });
  }
});

router.post("/add", function (req, res) {
  const {
    title,
    includes,
    description,
    category,
    price,
    cookingTime,
    servings,
    imageUrl,
    featuredMealKit,
  } = req.body;
  let passedValidation = true;
  let validationMessages = {};
  const featuredMealKitBoolean = !!featuredMealKit;

  if (!title) {
    passedValidation = false;
    validationMessages.title = `Title is missing`;
  }
  if (!includes) {
    passedValidation = false;
    validationMessages.includes = `Includes is missing`;
  }

  if (!description) {
    passedValidation = false;
    validationMessages.description = `Description is missing`;
  }

  if (!category) {
    passedValidation = false;
    validationMessages.category = `Category is missing`;
  }

  if (!price) {
    passedValidation = false;
    validationMessages.price = `Price is missing`;
  }
  if (!cookingTime) {
    passedValidation = false;
    validationMessages.cookingTime = `Cooking Time is missing`;
  }
  if (!servings) {
    passedValidation = false;
    validationMessages.servings = `Number of Servings is missing`;
  }
  if (!req.files || !req.files.imageUrl || !req.files.imageUrl.name) {
    passedValidation = false;
    validationMessages.imageUrl = `Image Url is missing`;
  } else {
    //condition to allow only jpg,jpeg,gif,png images
    const imageUrlFile = req.files.imageUrl;
    const allowedExtensions = ["jpg", "jpeg", "gif", "png"];
    const fileExtension = imageUrlFile.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
      passedValidation = false;
      validationMessages.imageUrl = `Invalid file type. Please upload an image with jpg, jpeg, gif, or png extension.`;
    }
  }

  if (passedValidation) {
    const newMealkit = new mealkitsModel({
      title,
      includes,
      description,
      category,
      price,
      cookingTime,
      servings,
      imageUrl,
      featuredMealKit: featuredMealKitBoolean,
    });

    newMealkit
      .save()
      .then((mealkitSaved) => {
        console.log(
          `Registration Completed ${mealkitSaved.title} has been added to the database`
        );

        const imageUrlFile = req.files.imageUrl;
        const uniqueName = `image-url-${mealkitSaved._id}${
          path.parse(imageUrlFile.name).ext
        }`;
        imageUrlFile.mv(`assets/images/${uniqueName}`).then(() => {
          mealkitsModel
            .updateOne(
              {
                _id: mealkitSaved._id,
              },
              {
                imageUrl: `/images/${uniqueName}`,
              }
            )
            .then(() => {
              console.log("Image added");
              res.redirect("/mealkits/list");
            })
            .catch(() => {
              console.log("Error uploading image");
              res.redirect("/mealkits/list");
            });
        });
      })
      .catch((err) => {
        console.log(`Couldn't save the mealkit +  ${err}`);
        validationMessages.title = "Couldn't save the mealkit";
        res.render("mealkits/add", {
          title: "Add Mealkit",
          validationMessages,
          values: req.body,
        });
      });
  } else {
    res.render("mealkits/add", {
      title: "Add",
      validationMessages,
      values: req.body,
    });
  }
});

router.get("/add", (req, res) => {
  res.render("mealkits/add", {
    title: "Add a Mealkit",
    validationMessages: {},
    values: {
      title: "",
      includes: "",
      description: "",
      category: "",
      price: "",
      cookingTime: "",
      servings: "",
      imageUrl: "",
      featuredMealKit: "",
    },
  });
});

router.get("/edit/:id", (req, res) => {
  const mealKitId = req.params.id;

  mealkitsModel
    .findById(mealKitId)
    .then((mealKit) => {
      if (!mealKit) {
        return res.status(404).send("Meal kit not found");
      }

      res.render("mealkits/edit", { title: "Edit Mealkit", mealKit });
    })
    .catch((err) => {
      console.log("Error fetching meal kit: ", err);
      res.status(500).send("Error fetching meal kit");
    });
});

router.post("/edit/:id", (req, res) => {
  const mealKitId = req.params.id;
  const featuredMealKit = req.body.featuredMealKit === "on";
  // const updatedMealKitData = req.body;

  const updatedMealKitData = {
    title: req.body.title,
    includes: req.body.includes,
    description: req.body.description,
    category: req.body.category,
    price: req.body.price,
    cookingTime: req.body.cookingTime,
    servings: req.body.servings,
    imageUrl: req.body.imageUrl,
    featuredMealKit: featuredMealKit, // Assign the converted boolean value
  };
  mealkitsModel
    .findByIdAndUpdate(mealKitId, updatedMealKitData, { new: true })
    .then((updatedMealKit) => {
      if (!updatedMealKit) {
        return res.status(404).send("Meal kit not found");
      }

      res.redirect("mealkits/list");
    })
    .catch((err) => {
      console.log("Error updating meal kit: ", err);
      res.status(500).send("Error updating meal kit");
    });
});

router.get("/remove/:id", (req, res) => {
  const mealKitId = req.params.id;

  mealkitsModel
    .findById(mealKitId)
    .then((mealKit) => {
      if (!mealKit) {
        return res.status(404).send("Meal kit not found");
      }

      console.log(mealKitId);
      res.render("mealkits/confirmation", { title: "Home", mealKitId });
    })
    .catch((err) => {
      console.log("Error fetching meal kit: ", err);
      res.status(500).send("Error fetching meal kit");
    });
});

router.post("/remove/:id", (req, res) => {
  const mealKitId = req.params.id;

  mealkitsModel
    .findByIdAndDelete(mealKitId)
    .then((deletedMealKit) => {
      if (!deletedMealKit) {
        return res.status(404).send("Meal kit not found");
      }

      res.redirect("/");
    })
    .catch((err) => {
      console.log("Error deleting meal kit: ", err);
      res.status(500).send("Error deleting meal kit");
    });
});

module.exports = router;
