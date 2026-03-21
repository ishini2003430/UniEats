const express = require("express");
const { requireStudent } = require("../../../middleware/order-n-cancellation/requireStudent");
const {
	requireStudentOrVendor,
} = require("../../../middleware/order-n-cancellation/requireStudentOrVendor");
const {
	createOrder,
	queryOrders,
	getCancelEligibility,
	cancelOrder,
} = require("../../controllers/order-n-cancellation/orderController");

const router = express.Router();

router.get("/", requireStudentOrVendor, queryOrders);
router.post("/", requireStudent, createOrder);
router.get("/:id/cancel-eligibility", requireStudent, getCancelEligibility);
router.patch("/:id/cancel", requireStudent, cancelOrder);

module.exports = router;
