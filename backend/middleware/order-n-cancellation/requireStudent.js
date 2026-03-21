const mongoose = require("mongoose");
const User = require("../../src/models/User");

const requireStudent = async (req, res, next) => {
  try {
    const studentId = req.headers["x-user-id"];
    const role = String(req.headers["x-user-role"] || "").toLowerCase();

    if (role !== "student") {
      return res.status(403).json({ message: "Student access required" });
    }

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(401).json({ message: "Invalid or missing student id" });
    }

    const student = await User.findOne({
      _id: studentId,
      role: "student",
      status: "active",
    }).select("_id role status name");

    if (!student) {
      return res.status(401).json({ message: "Student account not found or inactive" });
    }

    req.student = student;
    return next();
  } catch (error) {
    console.error("requireStudent middleware error:", error);
    return res.status(500).json({ message: "Server error while authorizing student" });
  }
};

module.exports = { requireStudent };
