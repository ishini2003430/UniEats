const express = require("express");
const router = express.Router();
const favoriteController = require("../controllers/favoriteController");

// Get favorites
router.get("/", favoriteController.getFavorites);

// Toggle (add/remove) favorite
router.post("/toggle", favoriteController.toggleFavorite);

module.exports = router;
