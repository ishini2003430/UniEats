const mongoose = require("mongoose");
const User = require("../../src/models/User");

const requireVendor = async (req, res, next) => {
  try {
    const vendorId = req.headers["x-user-id"];
    const role = String(req.headers["x-user-role"] || "").toLowerCase();

    if (role !== "vendor") {
      return res.status(403).json({ message: "Vendor access required" });
    }

    if (!vendorId || !mongoose.Types.ObjectId.isValid(vendorId)) {
      return res.status(401).json({ message: "Invalid or missing vendor id" });
    }

    const vendor = await User.findOne({
      _id: vendorId,
      role: "vendor",
      status: "active",
    }).select("_id role status name vendorName");

    if (!vendor) {
      return res.status(401).json({ message: "Vendor account not found or inactive" });
    }

    req.vendor = vendor;
    next();
  } catch (error) {
    console.error("requireVendor middleware error:", error);
    res.status(500).json({ message: "Server error while authorizing vendor" });
  }
};

module.exports = { requireVendor };
