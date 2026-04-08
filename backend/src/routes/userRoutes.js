const express = require("express");
const upload = require("../../middleware/upload");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog"); // ✅ ADD THIS

const router = express.Router();

router.post(
  "/register",
  upload.single("vendorLogo"),
  async (req, res) => {
    try {
      const {
        name,
        email,
        password,
        role,
        vendorName,
        vendorPhone,
        vendorLocation,
      } = req.body;

      if (!name || !email || !password || !role) {
        return res.status(400).json({
          message: "Name, email, password and role are required",
        });
      }

      if (!["student", "vendor"].includes(role)) {
        return res.status(400).json({
          message: "Invalid role",
        });
      }

      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({
          message: "Email already exists",
        });
      }

      const user = new User({
        name,
        email,
        password,
        role,

        vendorName: role === "vendor" ? vendorName : null,
        vendorPhone: role === "vendor" ? vendorPhone : null,
        vendorLocation: role === "vendor" ? vendorLocation : null,
        vendorLogo:
          role === "vendor" && req.file
            ? req.file.path
            : null,
      });

      await user.save();

      /* -------- ACTIVITY LOG -------- */
      if (role === "student") {
        await ActivityLog.create({
          type: "STUDENT_SIGNUP",
          message: `New student registered: ${name}`,
          actorRole: "Student",
          relatedUser: user._id,
        });
      }

      if (role === "vendor") {
        await ActivityLog.create({
          type: "VENDOR_REGISTRATION",
          message: `New vendor registration: ${vendorName}`,
          actorRole: "Vendor",
          relatedUser: user._id,
        });
      }
      /* ------------------------------ */

      return res.status(201).json({
        message:
          role === "vendor"
            ? "Vendor registration submitted. Waiting for admin approval."
            : "Student registered successfully. You can now login.",
        user: role === "student" ? {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          status: user.status
        } : null
      });
    } catch (error) {
      console.error("REGISTER ERROR:", error);
      return res.status(500).json({
        message: "Server error during registration",
      });
    }
  }
);

router.get("/vendors/:id", async (req, res) => {
  try {
    const vendor = await User.findOne({ _id: req.params.id, role: "vendor" }).select("-password");
    if (!vendor) {
      return res.status(404).json({ message: "Vendor not found" });
    }
    return res.json(vendor);
  } catch (error) {
    console.error("GET VENDOR ERROR:", error);
    return res.status(500).json({ message: "Server error" });
  }
});


router.get("/vendors", async (req, res) => {
  try {
    const vendors = await User.find({ role: "vendor" }).select("-password");
    res.json(vendors);
  } catch (error) {
    console.error("GET VENDORS ERROR:", error);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
