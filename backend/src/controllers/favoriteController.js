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

    const index = user.favorites.findIndex(
      (fav) => fav && fav.toString() === foodId.toString()
    );

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
    const user = await User.findById(userId).populate({
      path: "favorites",
      populate: { path: "vendorId", select: "name vendorName email" }
    });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Deduplicate favorites (Safeguard against past duplicate bugs breaking React keys)
    const validFavs = user.favorites.filter(item => item && item._id);
    const uniqueFavs = Array.from(
      new Map(validFavs.map((item) => [item._id.toString(), item])).values()
    );

    return res.status(200).json(uniqueFavs);
  } catch (error) {
    console.error("Get Favorites API Error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
