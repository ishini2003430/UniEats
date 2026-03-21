const express = require("express");
const { requireStudent } = require("../../../middleware/order-n-cancellation/requireStudent");
const { requireVendor } = require("../../../middleware/order-n-cancellation/requireVendor");
const { createOrder, queryOrders } = require("../../controllers/order-n-cancellation/orderController");

const router = express.Router();

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

router.get("/", requireStudentOrVendor, queryOrders);
router.post("/", requireStudent, createOrder);

module.exports = router;
