const express = require("express");
const upload = require("../../middleware/upload");
const authMiddleware = require("../../middleware/authMiddleware");
const User = require("../../src/models/User");
const ActivityLog = require("../models/ActivityLog"); // ✅ ADD THIS

const router = express.Router();



router.post("/register/student", async (req, res) => {
  try {
    const { name, email, password, contactNumber } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email, password are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = new User({
      name,
      email,
      password,
      contactNumber,
      role: "student",
    });

    await user.save();

    await ActivityLog.create({
      type: "STUDENT_SIGNUP",
      message: `New student registered: ${name}`,
      actorRole: "Student",
      relatedUser: user._id,
    });

    res.status(201).json({ message: "Student registered successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during student registration" });
  }
});

// ----------------- VENDOR REGISTRATION -----------------
router.post("/register/vendor", upload.single("vendorLogo"), async (req, res) => {
  try {
    const { name, email, password, vendorName, vendorPhone, vendorLocation } = req.body;

    if (!name || !email || !password || !vendorName || !vendorPhone || !vendorLocation) {
      return res.status(400).json({ message: "All vendor fields are required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "Email already exists" });
    }

    const user = new User({
      name,
      email,
      password,
      role: "vendor",
      vendorName,
      vendorPhone,
      vendorLocation,
      vendorLogo: req.file ? req.file.filename : null,
      status: "pending",
    });

    await user.save();

    await ActivityLog.create({
      type: "VENDOR_REGISTRATION",
      message: `New vendor registration: ${vendorName}`,
      actorRole: "Vendor",
      relatedUser: user._id,
    });

    res.status(201).json({
      message: "Vendor registration submitted. Waiting for admin approval."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error during vendor registration" });
  }
});


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


router.get('/vendors', async (req, res) => {
  try {
    // Find all users where role is 'vendor'
    // Select only the fields you need for the dropdown
    const vendors = await User.find({ role: 'vendor' }).select('_id vendorName name');
    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: "Server error fetching vendors" });
  }
});




module.exports = router;

