let mealkits = [
  {
    title: "Salmon Special",
    includes: "Salmon and Mediterrean Salad",
    description:
      " Whether it's a special occasion or just a craving for something truly satisfying, our Salmon Dish is the perfect choice for a delightful dining experience that feels like a warm hug on a plate",
    category: "Special Meals",
    price: 27.99,
    cookingTime: 20,
    servings: 1,
    imageUrl: "/images/salmon.jpg",
    featuredMealKit: true,
  },
  {
    title: "Sushi Rolls",
    includes: "Squid, Tuna, Rice, Nori Seed",
    description:
      "Meticulously crafted rolls of tender, premium seafood nestled within delicate sushi rice and wrapped in crisp, nori seaweed.",
    category: "Special Meals",
    price: 28.99,
    cookingTime: 25,
    servings: 2,
    imageUrl: "/images/pasta.jpg",
    featuredMealKit: true,
  },
  {
    title: "Wagyu",
    includes: "Wagyu A5 Steak, Broccoli, Asparagus, Garlic",
    description:
      "A symphony of flavors with our Wagyu dish, paired with asparagus, broccoli and special onion sauce",
    category: "Special Meals",
    price: 114.99,
    cookingTime: 15,
    servings: 1,
    imageUrl: "/images/wagyu.jpg",
    featuredMealKit: true,
  },
  {
    title: "Filet Mignon Risotto",
    includes: "Filet Mignon, Risotto, Asparagus, Garlic, Pepper",
    description:
      "Perfect harmony of Filet Mignon artfully combined with tender asparagus spears and creamy risotto",
    category: "Special Meals",
    price: 88.99,
    cookingTime: 20,
    servings: 1,
    imageUrl: "/images/filetmignon.jpg",
    featuredMealKit: true,
  },
  {
    title: "Pasta Pesto",
    includes: "High quality Pasta, pesto sauce",
    description:
      "Indulge in al dente pasta coated in a vibrant basil pesto sauce, bursting with fresh herbs, garlic, Parmesan cheese, and pine nuts.",
    category: "Pasta",
    price: 19.99,
    cookingTime: 20,
    servings: 1,
    imageUrl: "/images/pasta.jpg",
    featuredMealKit: true,
  },
  {
    title: "Pasta Ragu",
    includes: "Ground Beef, Bolognese Sauce, Garlic, Pepper",
    description:
      " Tender pasta enveloped in a rich and savory bolognese sauce, simmered to perfection with a medley of tomatoes, garlic, pepper, and tender high quality ground beef",
    category: "Pasta",
    price: 24.99,
    cookingTime: 25,
    servings: 1,
    imageUrl: "/images/ragu.jpg",
    featuredMealKit: true,
  },
];

module.exports.getAllMealKits = function getAllMealKits() {
  return mealkits;
};

module.exports.getFeaturedMealKits = function getFeaturedMealKits(mealkits) {
  let featured = [];

  for (let i = 0; i < mealkits.length; i++) {
    if (mealkits[i].featuredMealKit) {
      featured.push(mealkits[i]);
    }
  }

  return featured;
};

module.exports.getMealKitsByCategory = function getMealKitsByCategory(
  mealkits
) {
  let category = {};

  mealkits.forEach((mealkit) => {
    if (!category[mealkit.category]) {
      category[mealkit.category] = [];
    }

    category[mealkit.category].push(mealkit);
  });

  return category;
};

module.exports.removeFromCart = function removeFromCart(mealKitId) {
  console.log("removeFromCart function called with mealKitId:", mealKitId);
  fetch(`/remove-from-cart/${mealKitId}`, { method: "GET" })
    .then((response) => {
      if (response.ok) {
        window.location.reload();
      } else {
        console.error("Failed to remove item from cart");
      }
    })
    .catch((error) => {
      console.error("Error removing item from cart:", error);
    });
};

module.exports.generateEmailContent = function generateEmailContent(
  firstName,
  lastName,
  email,
  cart
) {
  // Format email content with order details
  let emailBody = `Dear ${firstName} ${lastName},<br><br>`;
  emailBody += "Your order details:<br><br>";
  cart.forEach((item, index) => {
    emailBody += `${index + 1}. ${item.title} - Quantity: ${
      item.quantity
    }, Price: $${item.price.toFixed(2)}<br>`;
  });
  emailBody += `<br>Total Subtotal: $${calculateSubtotal(cart).toFixed(2)}<br>`;
  emailBody += `Total Tax (10%): $${calculateTax(cart).toFixed(2)}<br>`;
  emailBody += `Total Grand Total: $${calculateGrandTotal(cart).toFixed(
    2
  )}<br><br>`;
  emailBody += "Thank you for your order!<br>";
  return emailBody;
};

function calculateSubtotal(cart) {
  return cart.reduce((total, item) => total + item.price * item.quantity, 0);
}

function calculateTax(cart) {
  return calculateSubtotal(cart) * 0.1;
}

function calculateGrandTotal(cart) {
  return calculateSubtotal(cart) + calculateTax(cart);
}
