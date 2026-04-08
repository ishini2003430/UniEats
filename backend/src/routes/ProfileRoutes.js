const express = require("express");
const User = require("../models/User"); // Ensure this path correctly points to your User model
const router = express.Router();

/**
 * @route   GET /api/profile/fetch/:email
 * @desc    Fetch student profile by email
 */
router.get("/fetch/:email", async (req, res) => {
  try {
    const { email } = req.params;
    const student = await User.findOne({
      email: { $regex: `^${email}$`, $options: "i" },
      role: "student"
    }).select("-password");

    if (!student) return res.status(404).json({ message: "Student not found" });
    res.status(200).json(student);
  } catch (error) {
    console.error("Fetch Error:", error);
    res.status(500).json({ message: "Server error" });
  }
});

/**
 * @route   PUT /api/profile/update/:email
 * @desc    Update profile information
 */
router.put('/update/:email', async (req, res) => {
  const { name, contactNumber, department, dietaryPreferences, allergies } = req.body;
  const { email } = req.params;

  try {
    const user = await User.findOneAndUpdate(
      { email: { $regex: `^${email}$`, $options: "i" } }, 
      { 
        $set: { name, contactNumber, department, dietaryPreferences, allergies } 
      },
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (err) {
    console.error("Update Error:", err.message);
    res.status(500).json({ message: "Database Update Failed", error: err.message });
  }
});

/**
 * @route   POST /api/profile/add-points
 * @desc    Handle both Earning (10%) and Redeeming (Fixed amount)
 */
router.post('/add-points', async (req, res) => {
  try {
    const { email, orderAmount, description } = req.body;
    
    // Find user (Case-insensitive)
    const user = await User.findOne({ email: { $regex: `^${email}$`, $options: "i" } });
    if (!user) return res.status(404).json({ message: "User not found" });

    let pointsToChange;

    // REDEMPTION LOGIC (If orderAmount is negative, e.g., -1000)
    if (orderAmount < 0) {
      pointsToChange = orderAmount; 
      
      // Validation: Check if user has enough points to prevent negative balance
      if ((user.loyaltyPoints || 0) + pointsToChange < 0) {
        return res.status(400).json({ message: "Insufficient points balance for this reward." });
      }
    } else {
      // EARNING LOGIC (Standard food purchase)
      // Example: 10% points logic (1000 LKR = 100 points)
      pointsToChange = Math.floor(orderAmount / 10); 
    }

    // Update Database and add to Recent Activity
    const updatedUser = await User.findOneAndUpdate(
      { email: { $regex: `^${email}$`, $options: "i" } },
      { 
        $inc: { loyaltyPoints: pointsToChange },
        $push: { 
          recentActivity: { 
            $each: [{
              description: description || "Points Transaction", 
              points: Math.abs(pointsToChange), 
              type: pointsToChange > 0 ? 'earn' : 'redeem', 
              date: new Date() 
            }],
            $position: 0 // Keep newest activity at the top
          } 
        }
      },
      { new: true }
    );

    // Emit via Socket.io if initialized in app.js
    if (req.io) {
      req.io.emit(`pointsUpdated_${email}`, { 
        newBalance: updatedUser.loyaltyPoints,
        activity: updatedUser.recentActivity[0]
      });
    }

    res.status(200).json({
      success: true,
      newBalance: updatedUser.loyaltyPoints,
      recentActivity: updatedUser.recentActivity
    });

  } catch (err) {
    console.error("Points Error:", err.message);
    res.status(500).json({ message: "Server Error", error: err.message });
  }
});

/**
 * @route   DELETE /api/profile/delete/:email
 * @desc    Delete user account
 */
router.delete("/delete/:email", async (req, res) => {
  try {
    const { email } = req.params;

    const deletedUser = await User.findOneAndDelete({ 
      email: { $regex: `^${email}$`, $options: "i" } 
    });

    if (!deletedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Account deleted successfully" });
  } catch (error) {
    console.error("Delete Error:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

module.exports = router;