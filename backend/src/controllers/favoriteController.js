const User = require("../models/User");

exports.toggleFavorite = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    const { foodId } = req.body;

    if (!userId || !foodId) {
      return res.status(400).json({ message: "userId and foodId are required" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const index = user.favorites.indexOf(foodId);
    if (index > -1) {
      // already exists -> remove
      user.favorites.splice(index, 1);
    } else {
      // not exists -> add
      user.favorites.push(foodId);
    }

    await user.save();
    return res.status(200).json({ favorites: user.favorites });
  } catch (error) {
    console.error("Toggle Favorite API Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.getFavorites = async (req, res) => {
  try {
    const userId = req.headers["x-user-id"];
    if (!userId) {
      return res.status(400).json({ message: "userId headers required" });
    }

    // populate favorites logic pulls the entire 'Food' reference graph
    const user = await User.findById(userId).populate("favorites");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json(user.favorites);
  } catch (error) {
    console.error("Get Favorites API Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
