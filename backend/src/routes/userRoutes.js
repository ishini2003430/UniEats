const express = require("express");
const upload = require("../../middleware/upload");
const User = require("../models/User");

const router = express.Router();

router.post(
  "/register",
  upload.single("vendorLogo"), // 🔥 multer MUST be first
  async (req, res) => {
    try {
      // multer ensures req.body exists
      const {
        name,
        email,
        password,
        role,
        vendorName,
        vendorPhone,
        vendorLocation,
      } = req.body;

      // 🔐 Basic validation
      if (!name || !email || !password || !role) {
        return res.status(400).json({
          message: "Name, email, password and role are required",
        });
      }

      // 🔐 Role validation
      if (!["student", "vendor"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role",
        });
      }

      // 🔁 Check existing user
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      // 🧾 Create user
      const user = new User({
        name,
        email,
        password, // ⚠️ (we will hash later – next step)
        role,

        // vendor-only fields
        vendorName: role === "vendor" ? vendorName : null,
        vendorPhone: role === "vendor" ? vendorPhone : null,
        vendorLocation: role === "vendor" ? vendorLocation : null,
        vendorLogo: role === "vendor" && req.file ? req.file.filename : null,

        // status auto-set by schema (pending / active)
      });

      await user.save();

      return res.status(201).json({
        message:
          role === "vendor"
            ? "Vendor registration submitted. Waiting for admin approval."
            : "Student registered successfully. You can now login.",
      });
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      return res.status(500).json({
        message: "Server error during registration",
      });
    }
  }
);

module.exports = router;
