const mongoose = require("mongoose");
const Food = require("../../models/order-n-cancellation/Food");

exports.createFood = async (req, res) => {
  try {
    const { name, price, isAvailable } = req.body;

    if (!name || typeof name !== "string") {
      return res.status(400).json({ message: "name is required" });
    }

    if (typeof price !== "number" || price < 0) {
      return res.status(400).json({ message: "price must be a non-negative number" });
    }

    const food = await Food.create({
      vendorId: req.vendor._id,
      name: name.trim(),
      price,
      isAvailable: isAvailable !== undefined ? Boolean(isAvailable) : true,
    });

    return res.status(201).json(food);
  } catch (error) {
    console.error("createFood error:", error);
    return res.status(500).json({ message: "Failed to create food item" });
  }
};

exports.queryFoods = async (req, res) => {
  try {
    const { id, vendorId, available } = req.query;
    const query = {};

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "id must be a valid ObjectId" });
      }
      query._id = id;
    }

    if (vendorId) {
      if (!mongoose.Types.ObjectId.isValid(vendorId)) {
        return res.status(400).json({ message: "vendorId must be a valid ObjectId" });
      }
      query.vendorId = vendorId;
    }

    if (available === "true" || available === "false") {
      query.isAvailable = available === "true";
    }

    const foods = await Food.find(query).sort({ createdAt: -1 });

    if (id) {
      if (!foods.length) {
        return res.status(404).json({ message: "Food item not found" });
      }
      return res.json(foods[0]);
    }

    return res.json(foods);
  } catch (error) {
    console.error("queryFoods error:", error);
    return res.status(500).json({ message: "Failed to query food items" });
  }
};
