const mongoose = require("mongoose");
const Notification = require("../../models/order-n-cancellation/Notification");

const toClientNotification = (notification) => ({
  _id: notification._id,
  recipientRole: notification.recipientRole,
  recipientId: notification.recipientId,
  vendorId: notification.vendorId,
  studentId: notification.studentId,
  orderId: notification.orderId,
  type: notification.type,
  title: notification.title,
  message: notification.message,
  isRead: notification.isRead,
  createdAt: notification.createdAt,
  updatedAt: notification.updatedAt,
});

const getNotifications = async ({ role, userId, query }) => {
  const unreadOnly = String(query.unread || "false").toLowerCase() === "true";
  const limitRaw = Number(query.limit || 20);
  const limit = Number.isFinite(limitRaw) ? Math.min(Math.max(limitRaw, 1), 100) : 20;

  const filter = {
    recipientRole: role,
    recipientId: userId,
  };

  if (unreadOnly) {
    filter.isRead = false;
  }

  const [notifications, unreadCount] = await Promise.all([
    Notification.find(filter).sort({ createdAt: -1 }).limit(limit),
    Notification.countDocuments({ recipientRole: role, recipientId: userId, isRead: false }),
  ]);

  return {
    notifications: notifications.map(toClientNotification),
    unreadCount,
  };
};

const markNotificationRead = async ({ role, userId, id }) => {
  return Notification.findOneAndUpdate(
    {
      _id: id,
      recipientRole: role,
      recipientId: userId,
    },
    { $set: { isRead: true } },
    { new: true }
  );
};

const markAllRead = async ({ role, userId }) => {
  await Notification.updateMany(
    {
      recipientRole: role,
      recipientId: userId,
      isRead: false,
    },
    { $set: { isRead: true } }
  );

  return Notification.countDocuments({
    recipientRole: role,
    recipientId: userId,
    isRead: false,
  });
};

exports.getVendorNotifications = async (req, res) => {
  try {
    const result = await getNotifications({
      role: "vendor",
      userId: req.vendor._id,
      query: req.query,
    });

    return res.json(result);
  } catch (error) {
    console.error("getVendorNotifications error:", error);
    return res.status(500).json({ message: "Failed to get notifications" });
  }
};

exports.getStudentNotifications = async (req, res) => {
  try {
    const result = await getNotifications({
      role: "student",
      userId: req.student._id,
      query: req.query,
    });

    return res.json(result);
  } catch (error) {
    console.error("getStudentNotifications error:", error);
    return res.status(500).json({ message: "Failed to get notifications" });
  }
};

exports.markVendorNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Notification id must be a valid ObjectId" });
    }

    const updated = await markNotificationRead({
      role: "vendor",
      userId: req.vendor._id,
      id,
    });

    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ notification: toClientNotification(updated) });
  } catch (error) {
    console.error("markVendorNotificationRead error:", error);
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const unreadCount = await markAllRead({
      role: "vendor",
      userId: req.vendor._id,
    });

    return res.json({ message: "All notifications marked as read", unreadCount });
  } catch (error) {
    console.error("markAllNotificationsRead error:", error);
    return res.status(500).json({ message: "Failed to mark notifications as read" });
  }
};

exports.markStudentNotificationRead = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Notification id must be a valid ObjectId" });
    }

    const updated = await markNotificationRead({
      role: "student",
      userId: req.student._id,
      id,
    });

    if (!updated) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ notification: toClientNotification(updated) });
  } catch (error) {
    console.error("markStudentNotificationRead error:", error);
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

exports.markAllStudentNotificationsRead = async (req, res) => {
  try {
    const unreadCount = await markAllRead({
      role: "student",
      userId: req.student._id,
    });

    return res.json({ message: "All notifications marked as read", unreadCount });
  } catch (error) {
    console.error("markAllStudentNotificationsRead error:", error);
    return res.status(500).json({ message: "Failed to mark notifications as read" });
  }
};
