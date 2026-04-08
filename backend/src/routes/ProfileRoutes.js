// src/routes/profileRoutes.js
const express = require("express");
const User = require("../../src/models/User");
const router = express.Router();

// Fetch student by email
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
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

// src/routes/profileRoutes.js
router.put('/update/:email', async (req, res) => {
  const { name, contactNumber, department, dietaryPreferences } = req.body;
  const { email } = req.params;

  try {
    const user = await User.findOneAndUpdate(
      { email: { $regex: `^${email}$`, $options: "i" } }, 
      { 
        $set: { name, contactNumber, department, dietaryPreferences } 
      },
      { new: true, runValidators: true } // runValidators ensures it matches the schema
    ).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found in database" });
    }

    res.json(user);
  } catch (err) {
    // This sends the REAL error message to Postman so you can see it
    console.error("Update Error:", err.message);
    res.status(500).json({ 
      message: "Database Update Failed", 
      error: err.message 
    });
  }
});

// Delete user by email
// src/routes/profileRoutes.js

router.delete("/delete/:email", async (req, res) => {
  try {
    const { email } = req.params;
    console.log(">>> Backend received delete request for:", email);

    // 1. Attempt to find and delete
    const deletedUser = await User.findOneAndDelete({ 
      email: { $regex: `^${email}$`, $options: "i" } 
    });

    // 2. If user doesn't exist in DB
    if (!deletedUser) {
      console.log(">>> Delete Failed: Email not found in database.");
      return res.status(404).json({ message: "User not found in database" });
    }

    // 3. Success
    console.log(">>> Success: User removed from MongoDB.");
    res.status(200).json({ message: "Account deleted successfully" });

  } catch (error) {
    console.error(">>> CRITICAL SERVER ERROR:", error.message);
    res.status(500).json({ 
      message: "Internal Server Error", 
      error: error.message 
    });
  }
});

module.exports = router;