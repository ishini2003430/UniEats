const express = require("express");
const { requireStudent } = require("../../../middleware/order-n-cancellation/requireStudent");
const { requireVendor } = require("../../../middleware/order-n-cancellation/requireVendor");
const {
	requireStudentOrVendor,
} = require("../../../middleware/order-n-cancellation/requireStudentOrVendor");
const {
	createOrder,
	queryOrders,
	getCancelEligibility,
	cancelOrder,
	updateOrderStatusByVendor,
} = require("../../controllers/order-n-cancellation/orderController");

const router = express.Router();

router.get("/", requireStudentOrVendor, queryOrders);
router.post("/", requireStudent, createOrder);
router.patch("/:id/status", requireVendor, updateOrderStatusByVendor);
router.get("/:id/cancel-eligibility", requireStudent, getCancelEligibility);
router.patch("/:id/cancel", requireStudent, cancelOrder);

module.exports = router;
