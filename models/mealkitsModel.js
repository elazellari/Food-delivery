const mongoose = require("mongoose");

const mealkitsSchema = new mongoose.Schema({
  title: String,
  includes: String,
  description: String,
  category: String,
  price: Number,
  cookingTime: Number,
  servings: Number,
  imageUrl: String,
  featuredMealKit: Boolean,
});

const mealkitsModel = mongoose.model("mealkits", mealkitsSchema);

module.exports = mealkitsModel;
