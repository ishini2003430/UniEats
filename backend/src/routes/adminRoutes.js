const express = require("express");
const User = require("../models/User");
import ActivityLog from "../models/ActivityLog.js";


const router = express.Router();

/* =====================================================
   DASHBOARD STATS
===================================================== */
router.get("/stats", async (req, res) => {
  try {
    const pendingVendors = await User.countDocuments({
      role: "vendor",
      status: "pending",
    });

    const activeVendors = await User.countDocuments({
      role: "vendor",
      status: "active",
    });

    const students = await User.countDocuments({
      role: "student",
    });

    res.json({
      pendingVendors,
      activeVendors,
      students,
    });
  } catch (err) {
    res.status(500).json({ message: "Failed to load stats" });
  }
});

/* =====================================================
   PENDING VENDORS
===================================================== */
router.get("/vendors/pending", async (req, res) => {
  try {
    const vendors = await User.find({
      role: "vendor",
      status: "pending",
    }).select("-password");

    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch pending vendors" });
  }
});

/* =====================================================
   ACTIVE VENDORS
===================================================== */
router.get("/vendors/active", async (req, res) => {
  try {
    const vendors = await User.find({
      role: "vendor",
      status: "active",
    }).select("-password");

    res.json(vendors);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch active vendors" });
  }
});

/* =====================================================
   STUDENTS
===================================================== */
router.get("/students", async (req, res) => {
  try {
    const students = await User.find({
      role: "student",
    }).select("-password");

    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

/* =====================================================
   APPROVE VENDOR
===================================================== */
router.put("/vendors/approve/:id", async (req, res) => {
  try {
    const vendor = await User.findById(req.params.id);

    if (!vendor || vendor.role !== "vendor") {
      return res.status(404).json({ message: "Vendor not found" });
    }

    vendor.status = "active";
await vendor.save();

/* -------- ACTIVITY LOG -------- */
await ActivityLog.create({
  type: "VENDOR_APPROVED",
  message: `Vendor approved: ${vendor.shopName}`,
  actorRole: "Admin",
});
/* ------------------------------ */

res.json({ message: "Vendor approved successfully" });

  } catch (err) {
    res.status(500).json({ message: "Vendor approval failed" });
  }
});

/* =====================================================
   DELETE USER (VENDOR / STUDENT)
===================================================== */
router.delete("/users/:id", async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    await user.deleteOne();

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "User deletion failed" });
  }
});

// GET recent activity logs
router.get("/activities", adminAuth, async (req, res) => {
  try {
    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(10);

    res.json(activities);
  } catch (error) {
    console.error("Failed to fetch activities", error);
    res.status(500).json({ message: "Failed to load activities" });
  }
});

module.exports = router;
