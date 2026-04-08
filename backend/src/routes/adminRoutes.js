const express = require("express");
const User = require("../models/User");
const ActivityLog = require("../models/ActivityLog");

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

    // count today's orders
    const Order = require("../models/order-n-cancellation/Order");
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const ordersToday = await Order.countDocuments({
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    res.json({
      pendingVendors,
      activeVendors,
      students,
      ordersToday,
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

    await ActivityLog.create({
      type: "VENDOR_APPROVED",
      message: `Vendor approved: ${vendor.vendorName || vendor.name}`,
      actorRole: "Admin",
      relatedUser: vendor._id,
    });

    res.json({ message: "Vendor approved successfully" });
  } catch (err) {
    console.error(err);
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

    const userName = user.vendorName || user.name;
    const userRole = user.role;

    await user.deleteOne();

    if (userRole === "student") {
      await ActivityLog.create({
        type: "STUDENT_DELETED",
        message: `Student deleted: ${userName}`,
        actorRole: "Admin",
        relatedUser: user._id,
      });
    }

    if (userRole === "vendor") {
      await ActivityLog.create({
        type: "VENDOR_DELETED",
        message: `Vendor deleted: ${userName}`,
        actorRole: "Admin",
        relatedUser: user._id,
      });
    }

    res.json({ message: "User deleted successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "User deletion failed" });
  }
});

/* =====================================================
   RECENT ACTIVITY (Dashboard - Only 5)
===================================================== */
router.get("/activities", async (req, res) => {
  try {
    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 })
      .limit(5);   // 👈 changed from 10 to 5

    res.json(activities);
  } catch (error) {
    console.error("Failed to fetch activities", error);
    res.status(500).json({ message: "Failed to load activities" });
  }
});

/* =====================================================
   ALL ACTIVITIES (Full History Page)
===================================================== */
router.get("/activities/all", async (req, res) => {
  try {
    const activities = await ActivityLog.find()
      .sort({ createdAt: -1 });

    res.json(activities);
  } catch (error) {
    console.error("Failed to fetch all activities", error);
    res.status(500).json({ message: "Failed to load activities" });
  }
});

/* =====================================================
   ADMIN - ORDERS FOR TRACKING
   Returns recent orders across the system for admin overview
   Optional query: ?limit=20
===================================================== */
router.get("/orders", async (req, res) => {
  try {
    const limit = Math.min(100, Number(req.query.limit) || 20);

    const Order = require("../models/order-n-cancellation/Order");

    // date range support: ?month=YYYY-MM or ?start=YYYY-MM-DD&end=YYYY-MM-DD
    let filter = {};
    if (req.query.month) {
      const [y, m] = String(req.query.month).split("-").map(Number);
      if (y && m) {
        const start = new Date(y, m - 1, 1);
        const end = new Date(y, m, 0, 23, 59, 59, 999);
        filter.createdAt = { $gte: start, $lte: end };
      }
    } else if (req.query.start || req.query.end) {
      const start = req.query.start ? new Date(req.query.start) : new Date(0);
      const end = req.query.end ? new Date(req.query.end) : new Date();
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        filter.createdAt = { $gte: start, $lte: end };
      }
    }

    const orders = await Order.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("vendorOrders.slotId")
      .populate("vendorOrders.foodItemIds")
      .populate("studentId", "name email");

    // map to safer client shape
    const mapped = orders.map((order) => ({
      _id: order._id,
      orderId: order.orderId,
      student: order.studentId ? { _id: order.studentId._id, name: order.studentId.name } : null,
      vendorOrders: (order.vendorOrders || []).map((vo) => ({
        vendorId: vo.vendorId,
        slot: vo.slotId ? { _id: vo.slotId._id, slotDate: vo.slotId.slotDate, startTime: vo.slotId.startTime, endTime: vo.slotId.endTime } : null,
        foods: Array.isArray(vo.foodItemIds) ? vo.foodItemIds.map((f) => ({ _id: f._id, name: f.name, price: f.price })) : [],
        status: vo.status,
      })),
      slot: order.slotId || null,
      foods: Array.isArray(order.foodItemIds) ? order.foodItemIds.map((f) => ({ _id: f._id, name: f.name, price: f.price })) : [],
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
    }));

    res.json(mapped);
  } catch (err) {
    console.error("admin/orders error:", err);
    res.status(500).json({ message: "Failed to fetch orders" });
  }
});

module.exports = router;
