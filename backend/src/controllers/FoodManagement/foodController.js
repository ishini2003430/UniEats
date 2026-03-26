const Food = require("../../models/FoodManagement/Food");

/*
 Helper Functions
*/

const calculatePromotion = (price, originalPrice) => {
  if (!originalPrice || originalPrice <= price) return 0;

  return Math.round(((originalPrice - price) / originalPrice) * 100);
};

const calculateStockStatus = (quantity) => {
  if (quantity <= 0) return "Out of Stock";
  if (quantity <= 5) return "Low Stock";
  return "Available";
};

/*
 CREATE FOOD
*/
exports.createFood = async (req, res) => {
  try {
    const vendorId = req.headers["x-user-id"];

    if (!vendorId)
      return res.status(400).json({ message: "Vendor ID missing" });

    const {
      name,
      description,
      price,
      category,
      quantity,
      imageUrl,
      originalPrice,
    } = req.body;

    const promotionPercentage = calculatePromotion(price, originalPrice);

    const food = await Food.create({
      name,
      description,
      price,
      category,
      quantity,
      image: imageUrl,
      promotionPercentage,
      vendorId,
    });

    const result = food.toObject();
    result.stockStatus = calculateStockStatus(food.quantity);

    res.status(201).json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create food" });
  }
};

/*
 GET FOODS (Vendor Filter Supported)
*/
exports.queryFoods = async (req, res) => {
  try {
    const { vendorId } = req.query;

    const filter = vendorId ? { vendorId } : {};

    const foods = await Food.find(filter).sort({ createdAt: -1 });

    const result = foods.map((food) => {
      const obj = food.toObject();
      obj.stockStatus = calculateStockStatus(food.quantity);
      return obj;
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch foods" });
  }
};

/*
 UPDATE FOOD
*/
exports.updateFood = async (req, res) => {
  try {
    const { id } = req.params;

    const {
      name,
      description,
      price,
      category,
      quantity,
      imageUrl,
      originalPrice,
    } = req.body;

    const promotionPercentage = calculatePromotion(price, originalPrice);

    const updated = await Food.findByIdAndUpdate(
      id,
      {
        name,
        description,
        price,
        category,
        quantity,
        image: imageUrl,
        promotionPercentage,
      },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ message: "Food not found" });

    const obj = updated.toObject();
    obj.stockStatus = calculateStockStatus(updated.quantity);

    res.json(obj);
  } catch (error) {
    res.status(500).json({ message: "Failed to update food" });
  }
};

/*
 DELETE FOOD
*/
exports.deleteFood = async (req, res) => {
  try {
    const { id } = req.params;

    await Food.findByIdAndDelete(id);

    res.json({ message: "Food deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete food" });
  }
};