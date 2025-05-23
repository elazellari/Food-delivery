const mongoose = require("mongoose");
const bcryptjs = require("bcryptjs");
// Create a Schema for our users collection
const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    require: true,
  },

  lastName: {
    type: String,
    require: true,
  },
  email: {
    type: String,
    require: true,
    unique: true,
  },
  password: {
    type: String,
    require: true,
  },
});

//Function for encrypting password
userSchema.pre("save", function (next) {
  let user = this;

  //Generate a unique SALT
  bcryptjs
    .genSalt()
    .then((salt) => {
      // Hash the password using the SALT

      bcryptjs
        .hash(user.password, salt)
        .then((hashedPwd) => {
          user.password = hashedPwd;
          next();
        })
        .catch((err) => {
          console.log(`Error occurred when hashing ... ${err}`);
        });
    })
    .catch((err) => {
      console.log(`Error ocurred when salting ... ${err}`);
    });
});

//Create a model using the nameSchema Schema

const userModel = mongoose.model("users", userSchema);

module.exports = userModel;
