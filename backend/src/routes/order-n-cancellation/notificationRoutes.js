const express = require("express");
const { requireVendor } = require("../../../middleware/order-n-cancellation/requireVendor");
const { requireStudent } = require("../../../middleware/order-n-cancellation/requireStudent");
const {
  getVendorNotifications,
  markVendorNotificationRead,
  markAllNotificationsRead,
  getStudentNotifications,
  markStudentNotificationRead,
  markAllStudentNotificationsRead,
} = require("../../controllers/order-n-cancellation/notificationController");

const router = express.Router();

router.get("/vendor", requireVendor, getVendorNotifications);
router.patch("/vendor/:id/read", requireVendor, markVendorNotificationRead);
router.patch("/vendor/read-all", requireVendor, markAllNotificationsRead);
router.get("/student", requireStudent, getStudentNotifications);
router.patch("/student/:id/read", requireStudent, markStudentNotificationRead);
router.patch("/student/read-all", requireStudent, markAllStudentNotificationsRead);

module.exports = router;
