const { requireStudent } = require("./requireStudent");
const { requireVendor } = require("./requireVendor");

const requireStudentOrVendor = (req, res, next) => {
  const role = String(req.headers["x-user-role"] || "").toLowerCase();

  if (role === "student") {
    return requireStudent(req, res, next);
  }

  if (role === "vendor") {
    return requireVendor(req, res, next);
  }

  return res.status(403).json({ message: "Only student or vendor can access orders" });
};

module.exports = { requireStudentOrVendor };
