const express = require("express");
const router = express.Router();

const foodController = require("../../controllers/FoodManagement/foodController");

// CREATE FOOD
router.post("/create", foodController.createFood);

// GET FOODS (all or by vendorId)
router.get("/", foodController.queryFoods);

// UPDATE FOOD
router.put("/:id", foodController.updateFood);

// DELETE FOOD
router.delete("/:id", foodController.deleteFood);

module.exports = router;