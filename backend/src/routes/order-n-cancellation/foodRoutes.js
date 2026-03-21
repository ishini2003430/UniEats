const express = require("express");
const { requireVendor } = require("../../../middleware/order-n-cancellation/requireVendor");
const { createFood, queryFoods } = require("../../controllers/order-n-cancellation/foodController");

const router = express.Router();

router.get("/", queryFoods);
router.post("/", requireVendor, createFood);

module.exports = router;
