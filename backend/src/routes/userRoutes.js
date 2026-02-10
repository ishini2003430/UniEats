const express = require("express");
const User = require("../models/User");

const router = express.Router();

// REGISTER
router.post("/register", async (req, res) => {
  const { name, email, password, role, vendorName } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = new User({
      name,
      email,
      password,
      role,
      vendorName: role === "vendor" ? vendorName : null,
      status: role === "vendor" ? "pending" : "active",
    });

    await user.save();

    res.status(201).json({
      message:
        role === "vendor"
          ? "Vendor registered. Waiting for admin approval"
          : "Registration successful",
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;