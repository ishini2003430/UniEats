const express = require("express");
const router = express.Router();

const foodController = require("../../controllers/FoodManagement/foodController");
const upload = require("../../../middleware/upload");

// CREATE FOOD
router.post("/create", upload.single("image"), foodController.createFood);

// GET FOODS (all or by vendorId)
router.get("/", foodController.queryFoods);

// UPDATE FOOD
router.put("/:id", upload.single("image"), foodController.updateFood);

// DELETE FOOD
router.delete("/:id", foodController.deleteFood);

module.exports = router;