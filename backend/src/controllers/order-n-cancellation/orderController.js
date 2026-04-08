const mongoose = require("mongoose");
const Order = require("../../models/order-n-cancellation/Order");
const Food = require("../../models/FoodManagement/Food");
const PickupSlot = require("../../models/order-n-cancellation/PickupSlot");
const User = require("../../models/User");
const Notification = require("../../models/order-n-cancellation/Notification");
const { sendEmail } = require("../../utils/mailer");
const { emitToUser } = require("../../utils/socket");
const {
  buildStudentOrderConfirmationEmail,
  buildVendorNewOrderEmail,
  buildStudentOrderStatusUpdateEmail,
} = require("../../utils/emailTemplates");

const CANCELLATION_WINDOW_MINUTES = Number(process.env.ORDER_CANCELLATION_WINDOW_MINUTES || 10);

const isHoldActive = (slot) => {
  if (!slot.isHeld) return false;
  if (!slot.holdUntil) return true;
  return new Date(slot.holdUntil).getTime() > Date.now();
};

const generateVerificationCode = () => `${Math.floor(1000 + Math.random() * 9000)}`;

const formatSlotLabel = (slot) => {
  const datePart = new Date(slot.slotDate).toISOString().slice(0, 10);
  return `${datePart} ${slot.startTime}-${slot.endTime}`;
};

const deriveOrderStatus = (vendorOrders) => {
  if (!Array.isArray(vendorOrders) || vendorOrders.length === 0) return "Pending";

  const statuses = vendorOrders.map((item) => item.status);

  if (statuses.every((s) => s === "Cancelled")) return "Cancelled";
  if (statuses.every((s) => s === "Completed")) return "Completed";
  if (statuses.some((s) => s === "Preparing")) return "Preparing";
  if (statuses.some((s) => s === "Ready")) return "Ready";
  return "Pending";
};

const getStudentStatusCopy = (nextStatus) => {
  if (nextStatus === "Preparing") {
    return {
      notificationTitle: "Your order is preparing",
      notificationMessage: "Your order is now being prepared by the vendor.",
      emailSubject: "UniEats: Your order is preparing",
      emailHeadline: "Your Order Is Preparing",
      emailSubtitle: "The vendor has started preparing your order.",
      emailMessage: "your order is now being prepared.",
    };
  }

  if (nextStatus === "Ready") {
    return {
      notificationTitle: "Your order is ready",
      notificationMessage: "Your order is ready for pickup.",
      emailSubject: "UniEats: Your order is ready",
      emailHeadline: "Your Order Is Ready",
      emailSubtitle: "Please head to your selected pickup slot.",
      emailMessage: "your order is ready for pickup.",
    };
  }

  if (nextStatus === "Completed") {
    return {
      notificationTitle: "Thank you! Your order is completed",
      notificationMessage: "Your order has been completed. Thank you and come again.",
      emailSubject: "UniEats: Thank you for your order",
      emailHeadline: "Thank You, Your Order Is Completed",
      emailSubtitle: "Your order has been successfully handed over by the vendor.",
      emailMessage: "your order has been completed. Thank you and come again.",
    };
  }

  return {
    notificationTitle: `Your order is ${nextStatus.toLowerCase()}`,
    notificationMessage: `Your order status is now ${nextStatus}.`,
    emailSubject: `UniEats: Your order is ${nextStatus.toLowerCase()}`,
    emailHeadline: "Order Status Update",
    emailSubtitle: "A vendor updated the status of your order.",
    emailMessage: `your order status is now ${nextStatus}.`,
  };
};

const notifyStudentOrderStatusUpdate = async ({
  order,
  studentId,
  vendorId,
  slotId,
  foodItemIds,
  nextStatus,
}) => {
  try {
    const [studentUser, vendorUser, slot, foods] = await Promise.all([
      User.findById(studentId).select("name email"),
      User.findById(vendorId).select("name vendorName"),
      slotId ? PickupSlot.findById(slotId).select("slotDate startTime endTime") : null,
      Array.isArray(foodItemIds) && foodItemIds.length
        ? Food.find({ _id: { $in: foodItemIds } }).select("name")
        : [],
    ]);

    const studentLabel = studentUser?.name || "Student";
    const vendorLabel = vendorUser?.vendorName || vendorUser?.name || "Vendor";
    const slotLabel = slot ? formatSlotLabel(slot) : "N/A";
    const foodNames = foods.length ? foods.map((item) => item.name).join(", ") : "N/A";

    const statusCopy = getStudentStatusCopy(nextStatus);

    const notificationTitle = statusCopy.notificationTitle;
    const notificationMessage = `${statusCopy.notificationMessage} (Order: ${order.orderId})`;

    const createdNotification = await Notification.create({
      recipientRole: "student",
      recipientId: studentId,
      vendorId,
      studentId,
      orderId: order._id,
      type: "ORDER_STATUS_UPDATED",
      title: notificationTitle,
      message: notificationMessage,
    });

    emitToUser({
      role: "student",
      userId: studentId,
      event: "notification:new",
      payload: {
        _id: createdNotification._id,
        recipientRole: createdNotification.recipientRole,
        recipientId: createdNotification.recipientId,
        vendorId: createdNotification.vendorId,
        studentId: createdNotification.studentId,
        orderId: createdNotification.orderId,
        type: createdNotification.type,
        title: createdNotification.title,
        message: createdNotification.message,
        isRead: createdNotification.isRead,
        createdAt: createdNotification.createdAt,
        updatedAt: createdNotification.updatedAt,
      },
    });

    const studentEmail = buildStudentOrderStatusUpdateEmail({
      studentLabel,
      orderId: order.orderId,
      vendorLabel,
      nextStatus,
      slotLabel,
      foodNames,
      statusHeadline: statusCopy.emailHeadline,
      statusSubtitle: statusCopy.emailSubtitle,
      statusMessage: statusCopy.emailMessage,
    });

    await sendEmail({
      to: studentUser?.email,
      subject: `${statusCopy.emailSubject} (${order.orderId})`,
      text: studentEmail.text,
      html: studentEmail.html,
    });
  } catch (error) {
    console.error("notifyStudentOrderStatusUpdate error:", error);
  }
};

const toClientVendorOrders = (vendorOrders = []) =>
  vendorOrders.map((item) => ({
    vendorId: item.vendorId,
    slotId: item.slotId,
    foodItemIds: item.foodItemIds || [],
    pickupVerificationCode: item.pickupVerificationCode,
    status: item.status,
    cancelledAt: item.cancelledAt,
    cancelReason: item.cancelReason,
  }));

const toClientOrder = (order, role, viewerId) => {
  const vendorOrders = Array.isArray(order.vendorOrders) ? order.vendorOrders : [];

  if (role === "vendor") {
    if (!vendorOrders.length && order.vendorId && String(order.vendorId) === String(viewerId)) {
      return {
  _id: order._id,
  orderId: order.orderId,
  student: order.studentId,
  vendorId: order.vendorId,
  slot: order.slotId,
  foods: order.foodItemIds || [],
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
};
    }

    const segment = vendorOrders.find((item) => String(item.vendorId) === String(viewerId));

    if (!segment) {
      return null;
    }

    return {
  _id: order._id,
  orderId: order.orderId,
  student: order.studentId,
  vendorId: segment.vendorId,
  slot: segment.slotId,
  foods: segment.foodItemIds,
  status: segment.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
};
  }

  return {
    _id: order._id,
    orderId: order.orderId,
    studentId: order.studentId,
    slotId: order.slotId || (vendorOrders[0] ? vendorOrders[0].slotId : null),
    vendorId: order.vendorId || (vendorOrders[0] ? vendorOrders[0].vendorId : null),
    foodItemIds:
      order.foodItemIds && order.foodItemIds.length
        ? order.foodItemIds
        : vendorOrders.flatMap((item) => item.foodItemIds || []),
    status: order.status,
    cancelledAt: order.cancelledAt,
    cancelReason: order.cancelReason,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
    vendorOrders: toClientVendorOrders(vendorOrders),
  };
};

const getCancelEligibility = (order) => {
  const cancelDeadlineAt = new Date(
    new Date(order.createdAt).getTime() + CANCELLATION_WINDOW_MINUTES * 60 * 1000
  );

  if (order.status !== "Pending") {
    return {
      canCancel: false,
      reason: "status_not_pending",
      message: "Cannot cancel - order is being prepared",
      cancelDeadlineAt,
      remainingSeconds: 0,
    };
  }

  const now = Date.now();
  const remainingMs = cancelDeadlineAt.getTime() - now;

  if (remainingMs <= 0) {
    return {
      canCancel: false,
      reason: "deadline_passed",
      message: "Cancellation window expired",
      cancelDeadlineAt,
      remainingSeconds: 0,
    };
  }

  return {
    canCancel: true,
    reason: "allowed",
    message: "Order can be cancelled",
    cancelDeadlineAt,
    remainingSeconds: Math.floor(remainingMs / 1000),
  };
};

const sendOrderCreatedNotifications = async ({ order, studentId, vendorContexts }) => {
  try {
    const studentUser = await User.findById(studentId).select("name email");
    const studentLabel = studentUser?.name || "Student";

    const vendorUserIds = vendorContexts.map((ctx) => String(ctx.vendorId));
    const vendorUsers = await User.find({ _id: { $in: vendorUserIds } }).select("_id name email vendorName");
    const vendorUserMap = new Map(vendorUsers.map((item) => [String(item._id), item]));

    const vendorNotificationDocs = [];
    const vendorEmailJobs = [];

    vendorContexts.forEach((ctx) => {
      const vendorUser = vendorUserMap.get(String(ctx.vendorId));
      const vendorLabel = vendorUser?.vendorName || vendorUser?.name || "Vendor";
      const foodNames = ctx.foods.map((item) => item.name).join(", ");
      const slotLabel = formatSlotLabel(ctx.slot);
      const vendorEmail = buildVendorNewOrderEmail({
        vendorLabel,
        studentLabel,
        orderId: order.orderId,
        slotLabel,
        foodNames,
      });

      vendorNotificationDocs.push({
        recipientRole: "vendor",
        recipientId: ctx.vendorId,
        vendorId: ctx.vendorId,
        studentId,
        orderId: order._id,
        type: "NEW_ORDER",
        title: "New order received",
        message: `Order ${order.orderId} has been placed by ${studentLabel}.`,
      });

      vendorEmailJobs.push(
        sendEmail({
          to: vendorUser?.email,
          subject: `UniEats: New order ${order.orderId}`,
          text: vendorEmail.text,
          html: vendorEmail.html,
        })
      );
    });
    const summaryLines = vendorContexts.map((ctx, index) => {
      const vendorUser = vendorUserMap.get(String(ctx.vendorId));
      const vendorLabel = vendorUser?.vendorName || vendorUser?.name || "Vendor";
      const slotLabel = formatSlotLabel(ctx.slot);
      const foodNames = ctx.foods.map((item) => item.name).join(", ");
      return `${index + 1}. Vendor: ${vendorLabel} | Slot: ${slotLabel} | Items: ${foodNames}`;
    });

    const studentNotification = {
      recipientRole: "student",
      recipientId: studentId,
      vendorId: vendorContexts[0].vendorId,
      studentId,
      orderId: order._id,
      type: "ORDER_PLACED",
      title: "Order placed successfully",
      message: `Order ${order.orderId} placed:\n${summaryLines.join("\\n")}`,
    };

    const createdNotifications = await Notification.insertMany([...vendorNotificationDocs, studentNotification]);

    createdNotifications.forEach((item) => {
      emitToUser({
        role: item.recipientRole,
        userId: item.recipientId,
        event: "notification:new",
        payload: {
          _id: item._id,
          recipientRole: item.recipientRole,
          recipientId: item.recipientId,
          vendorId: item.vendorId,
          studentId: item.studentId,
          orderId: item.orderId,
          type: item.type,
          title: item.title,
          message: item.message,
          isRead: item.isRead,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        },
      });
    });
    const studentEmail = buildStudentOrderConfirmationEmail({
      studentLabel,
      orderId: order.orderId,
      summaryLines,
    });

    const results = await Promise.allSettled([
      ...vendorEmailJobs,
      sendEmail({
        to: studentUser?.email,
        subject: `UniEats: Order ${order.orderId} confirmed`,
        text: studentEmail.text,
        html: studentEmail.html,
      }),
    ]);

    // Log email send results for debugging (useful when SMTP isn't configured)
    results.forEach((r, idx) => {
      if (r.status === "rejected") {
        console.error(`email job ${idx} failed:`, r.reason || r);
      } else if (r.status === "fulfilled") {
        const val = r.value;
        if (val && val.skipped) {
          console.warn(`email job ${idx} skipped:`, val.reason);
        } else if (val && val.preview) {
          console.info(`email job ${idx} preview URL:`, val.preview);
        } else {
          console.info(`email job ${idx} sent`);
        }
      }
    });
  } catch (notifyError) {
    console.error("sendOrderCreatedNotifications error:", notifyError);
  }
};

const buildSelectionsFromPayload = async (body) => {
  if (Array.isArray(body.vendorSelections) && body.vendorSelections.length > 0) {
    return body.vendorSelections;
  }

  if (body.slotId && Array.isArray(body.foodItemIds) && body.foodItemIds.length > 0) {
    const slot = await PickupSlot.findById(body.slotId).select("vendorId");
    if (!slot) {
      throw new Error("SLOT_NOT_FOUND");
    }

    return [
      {
        vendorId: String(slot.vendorId),
        slotId: body.slotId,
        foodItemIds: body.foodItemIds,
      },
    ];
  }

  return [];
};

exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { studentId, orderId } = req.body;
    const selections = await buildSelectionsFromPayload(req.body);

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "studentId must be a valid ObjectId" });
    }

    if (String(studentId) !== String(req.student._id)) {
      return res.status(403).json({ message: "studentId must match logged in student" });
    }

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ message: "orderId is required" });
    }

    if (!Array.isArray(selections) || selections.length === 0) {
      return res.status(400).json({ message: "vendorSelections must be a non-empty array" });
    }

    const existingOrder = await Order.findOne({ orderId: orderId.trim() });
    if (existingOrder) {
      return res.status(409).json({ message: "orderId already exists" });
    }

    const normalizedSelections = [];
    const seenVendors = new Set();

    selections.forEach((item) => {
      const vendorId = String(item.vendorId || "").trim();
      const slotId = String(item.slotId || "").trim();
      const foodItemIds = Array.isArray(item.foodItemIds)
        ? [...new Set(item.foodItemIds.map((id) => String(id).trim()).filter(Boolean))]
        : [];

      if (!mongoose.Types.ObjectId.isValid(vendorId)) {
        throw new Error("INVALID_VENDOR_ID");
      }
      if (!mongoose.Types.ObjectId.isValid(slotId)) {
        throw new Error("INVALID_SLOT_ID");
      }
      if (!foodItemIds.length || !foodItemIds.every((id) => mongoose.Types.ObjectId.isValid(id))) {
        throw new Error("INVALID_FOOD_IDS");
      }
      if (seenVendors.has(vendorId)) {
        throw new Error("DUPLICATE_VENDOR_SELECTION");
      }

      seenVendors.add(vendorId);
      normalizedSelections.push({ vendorId, slotId, foodItemIds });
    });

    const allFoodIds = [...new Set(normalizedSelections.flatMap((item) => item.foodItemIds))];
    const foods = await Food.find({ _id: { $in: allFoodIds }, isAvailable: true });
    if (foods.length !== allFoodIds.length) {
      return res.status(400).json({ message: "One or more food items are invalid or unavailable" });
    }

    const foodMap = new Map(foods.map((item) => [String(item._id), item]));

    const slotIds = normalizedSelections.map((item) => item.slotId);
    const slots = await PickupSlot.find({ _id: { $in: slotIds } });
    if (slots.length !== slotIds.length) {
      return res.status(404).json({ message: "One or more slots not found" });
    }

    const slotMap = new Map(slots.map((item) => [String(item._id), item]));

    const vendorContexts = normalizedSelections.map((selection) => {
      const slot = slotMap.get(selection.slotId);
      if (!slot) {
        throw new Error("SLOT_NOT_FOUND");
      }

      if (String(slot.vendorId) !== selection.vendorId) {
        throw new Error("SLOT_VENDOR_MISMATCH");
      }

      if (!slot.isActive) {
        throw new Error("SLOT_INACTIVE");
      }

      if (isHoldActive(slot)) {
        throw new Error("SLOT_HELD");
      }

      const selectionFoods = selection.foodItemIds.map((id) => foodMap.get(id));
      const hasWrongVendorFood = selectionFoods.some(
        (food) => !food || String(food.vendorId) !== selection.vendorId
      );

      if (hasWrongVendorFood) {
        throw new Error("FOOD_VENDOR_MISMATCH");
      }

      return {
        vendorId: selection.vendorId,
        slot,
        foods: selectionFoods,
        foodItemIds: selection.foodItemIds,
      };
    });

    await session.withTransaction(async () => {
      for (const ctx of vendorContexts) {
        const reservation = await PickupSlot.updateOne(
          {
            _id: ctx.slot._id,
            isActive: true,
            currentOrders: { $lt: ctx.slot.maxCapacity },
            $or: [{ isHeld: false }, { holdUntil: { $lte: new Date() } }],
          },
          {
            $inc: { currentOrders: 1 },
          },
          { session }
        );

        if (!reservation.modifiedCount) {
          throw new Error("SLOT_CAPACITY_REACHED");
        }
      }

      await Order.create(
        [
          {
            orderId: orderId.trim(),
            studentId,
            vendorOrders: vendorContexts.map((ctx) => ({
              vendorId: ctx.vendorId,
              slotId: ctx.slot._id,
              foodItemIds: ctx.foodItemIds,
              pickupVerificationCode: generateVerificationCode(),
              status: "Pending",
            })),
            status: "Pending",
          },
        ],
        { session }
      );
    });

    const created = await Order.findOne({ orderId: orderId.trim() });

    await sendOrderCreatedNotifications({
      order: created,
      studentId,
      vendorContexts,
    });

    return res.status(201).json({
      order: toClientOrder(created, "student", studentId),
    });
  } catch (error) {
    if (error && error.message === "SLOT_CAPACITY_REACHED") {
      return res.status(409).json({ message: "Slot is full or no longer available" });
    }
    if (error && error.message === "INVALID_VENDOR_ID") {
      return res.status(400).json({ message: "vendorSelections contains invalid vendorId" });
    }
    if (error && error.message === "INVALID_SLOT_ID") {
      return res.status(400).json({ message: "vendorSelections contains invalid slotId" });
    }
    if (error && error.message === "INVALID_FOOD_IDS") {
      return res.status(400).json({ message: "vendorSelections must contain valid foodItemIds" });
    }
    if (error && error.message === "DUPLICATE_VENDOR_SELECTION") {
      return res.status(400).json({ message: "Each vendor can appear only once in vendorSelections" });
    }
    if (error && error.message === "SLOT_NOT_FOUND") {
      return res.status(404).json({ message: "One or more slots not found" });
    }
    if (error && error.message === "SLOT_VENDOR_MISMATCH") {
      return res.status(400).json({ message: "slotId vendor does not match vendorId" });
    }
    if (error && error.message === "SLOT_INACTIVE") {
      return res.status(409).json({ message: "One or more slots are inactive" });
    }
    if (error && error.message === "SLOT_HELD") {
      return res.status(409).json({ message: "One or more slots are currently held" });
    }
    if (error && error.message === "FOOD_VENDOR_MISMATCH") {
      return res.status(400).json({ message: "Food items must belong to the selected vendor" });
    }

    if (error && error.code === 11000) {
      return res.status(409).json({ message: "orderId already exists" });
    }

    console.error("createOrder error:", error);
    return res.status(500).json({ message: "Failed to create order" });
  } finally {
    await session.endSession();
  }
};

exports.queryOrders = async (req, res) => {
  try {
    const { id, orderId, status, slotId } = req.query;
    const query = {};

    const role = String(req.headers["x-user-role"] || "").toLowerCase();
    const userId = req.headers["x-user-id"];

    if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(401).json({ message: "Missing or invalid x-user-id header" });
    }

    if (role === "student") {
      query.studentId = userId;
      if (status) {
        query.status = String(status);
      }
      if (slotId) {
        if (!mongoose.Types.ObjectId.isValid(slotId)) {
          return res.status(400).json({ message: "slotId must be a valid ObjectId" });
        }
        query["vendorOrders.slotId"] = slotId;
      }
    } else if (role === "vendor") {
      const vendorMatch = { vendorId: new mongoose.Types.ObjectId(userId) };
      if (status) vendorMatch.status = String(status);
      if (slotId) {
        if (!mongoose.Types.ObjectId.isValid(slotId)) {
          return res.status(400).json({ message: "slotId must be a valid ObjectId" });
        }
        vendorMatch.slotId = new mongoose.Types.ObjectId(slotId);
      }

      const legacyMatch = { vendorId: new mongoose.Types.ObjectId(userId) };
      if (status) legacyMatch.status = String(status);
      if (slotId) legacyMatch.slotId = new mongoose.Types.ObjectId(slotId);

      query.$or = [
        { vendorOrders: { $elemMatch: vendorMatch } },
        legacyMatch,
      ];
    } else {
      return res.status(403).json({ message: "Only student or vendor can query orders" });
    }

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: "id must be a valid ObjectId" });
      }
      query._id = id;
    }

    if (orderId) {
      query.orderId = String(orderId);
    }

    const orders = await Order.find(query)
  .populate("vendorOrders.slotId")
  .populate("vendorOrders.foodItemIds")
  .populate("studentId", "name email")
  .sort({ "vendorOrders.slotId.startTime": 1 });

    const mapped = orders
      .map((order) => toClientOrder(order, role, userId))
      .filter(Boolean);

    if (id || orderId) {
      if (!mapped.length) {
        return res.status(404).json({ message: "Order not found" });
      }
      return res.json(mapped[0]);
    }

    return res.json(mapped);
  } catch (error) {
    console.error("queryOrders error:", error);
    return res.status(500).json({ message: "Failed to query orders" });
  }
};

exports.getCancelEligibility = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Order id must be a valid ObjectId" });
    }

    const order = await Order.findOne({
      _id: id,
      studentId: req.student._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.json(getCancelEligibility(order));
  } catch (error) {
    console.error("getCancelEligibility error:", error);
    return res.status(500).json({ message: "Failed to check cancellation eligibility" });
  }
};

exports.cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { id } = req.params;
    const reason = req.body && typeof req.body.reason === "string" ? req.body.reason.trim() : "";

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Order id must be a valid ObjectId" });
    }

    const order = await Order.findOne({
      _id: id,
      studentId: req.student._id,
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const eligibility = getCancelEligibility(order);
    if (!eligibility.canCancel) {
      return res.status(422).json(eligibility);
    }

    const hasVendorOrders = Array.isArray(order.vendorOrders) && order.vendorOrders.length > 0;

    const vendorOrders = hasVendorOrders
      ? order.vendorOrders
      : [
          {
            slotId: order.slotId,
          },
        ];

    await session.withTransaction(async () => {
      const updateSet = {
        status: "Cancelled",
        cancelledAt: new Date(),
        cancelReason: reason || "Cancelled by student",
      };

      if (hasVendorOrders) {
        updateSet["vendorOrders.$[].status"] = "Cancelled";
        updateSet["vendorOrders.$[].cancelledAt"] = new Date();
        updateSet["vendorOrders.$[].cancelReason"] = reason || "Cancelled by student";
      }

      const orderUpdate = await Order.updateOne(
        {
          _id: order._id,
          studentId: req.student._id,
          status: "Pending",
        },
        {
          $set: updateSet,
        },
        { session }
      );

      if (!orderUpdate.modifiedCount) {
        throw new Error("ORDER_STATE_CHANGED");
      }

      for (const vo of vendorOrders) {
        if (!vo.slotId) continue;

        await PickupSlot.updateOne(
          {
            _id: vo.slotId,
            currentOrders: { $gt: 0 },
          },
          {
            $inc: { currentOrders: -1 },
          },
          { session }
        );
      }
    });

    const updatedOrder = await Order.findById(order._id);
    return res.json({
      message: "Order cancelled successfully",
      order: toClientOrder(updatedOrder, "student", req.student._id),
    });
  } catch (error) {
    if (error && error.message === "ORDER_STATE_CHANGED") {
      return res.status(409).json({ message: "Order status changed, please refresh and try again" });
    }

    console.error("cancelOrder error:", error);
    return res.status(500).json({ message: "Failed to cancel order" });
  } finally {
    await session.endSession();
  }
};

const STATUS_FLOW = ["Pending", "Preparing", "Ready", "Completed"];

exports.updateOrderStatusByVendor = async (req, res) => {
  try {
    const { id } = req.params;
    const nextStatus =
      req.body && typeof req.body.status === "string"
        ? req.body.status.trim()
        : "";
    const verificationCode =
      req.body && typeof req.body.verificationCode === "string"
        ? req.body.verificationCode.trim()
        : "";

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Order id must be a valid ObjectId" });
    }

    const allowedStatuses = ["Pending", "Preparing", "Ready", "Completed"];
    if (!allowedStatuses.includes(nextStatus)) {
      return res.status(400).json({
        message: "status must be one of: Pending, Preparing, Ready, Completed",
      });
    }

    const order = await Order.findOne({
      _id: id,
      $or: [
        { "vendorOrders.vendorId": req.vendor._id },
        { vendorId: req.vendor._id },
      ],
    });

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const vendorOrders = Array.isArray(order.vendorOrders) ? order.vendorOrders : [];

const segmentIndex = vendorOrders.findIndex(
  (item) => String(item.vendorId) === String(req.vendor._id)
);

    // ===============================
    // ✅ CASE 1: NO SEGMENT (LEGACY ORDER)
    // ===============================
    if (segmentIndex === -1) {
      if (order.vendorId && String(order.vendorId) === String(req.vendor._id)) {
        
        // ❌ block invalid states
        if (order.status === "Cancelled") {
          return res.status(409).json({ message: "Cancelled order status cannot be changed" });
        }

        if (order.status === "Completed") {
          return res.status(409).json({ message: "Completed order status cannot be changed" });
        }

        // ✅ validate flow
        const currentStatus = order.status;
        const currentIndex = STATUS_FLOW.indexOf(currentStatus);
        const nextIndex = STATUS_FLOW.indexOf(nextStatus);

        if (nextIndex !== currentIndex + 1) {
          return res.status(400).json({
            message: `Invalid status transition: ${currentStatus} → ${nextStatus}`,
          });
        }

        if (nextStatus === "Completed") {
          return res.status(422).json({
            message: "Completion verification code is required for new orders",
          });
        }

        order.status = nextStatus;
        await order.save();

        await notifyStudentOrderStatusUpdate({
          order,
          studentId: order.studentId,
          vendorId: order.vendorId,
          slotId: order.slotId,
          foodItemIds: order.foodItemIds,
          nextStatus,
        });

        return res.json({
          message: "Order status updated successfully",
          order: toClientOrder(order, "vendor", req.vendor._id),
        });
      }

      return res.status(404).json({ message: "Order not found" });
    }

    // ===============================
    // ✅ CASE 2: NORMAL MULTI-VENDOR ORDER
    // ===============================
    const segment = vendorOrders[segmentIndex];

    // ❌ block invalid states FIRST
    if (segment.status === "Cancelled") {
      return res.status(409).json({ message: "Cancelled order status cannot be changed" });
    }

    if (segment.status === "Completed") {
      return res.status(409).json({ message: "Completed order status cannot be changed" });
    }

    // ✅ validate flow
    const currentStatus = segment.status;
    const currentIndex = STATUS_FLOW.indexOf(currentStatus);
    const nextIndex = STATUS_FLOW.indexOf(nextStatus);

    if (nextIndex !== currentIndex + 1) {
      return res.status(400).json({
        message: `Invalid status transition: ${currentStatus} → ${nextStatus}`,
      });
    }

    // ✅ verification check
    if (nextStatus === "Completed") {
      if (!/^\d{4}$/.test(verificationCode)) {
        return res.status(422).json({
          message: "verificationCode must be a 4-digit code",
        });
      }

      if (verificationCode !== String(segment.pickupVerificationCode || "")) {
        return res.status(422).json({
          message: "Invalid pickup verification code",
        });
      }
    }

    // ✅ update segment + order
    order.vendorOrders[segmentIndex].status = nextStatus;
    order.status = deriveOrderStatus(order.vendorOrders);

    await order.save();

    await notifyStudentOrderStatusUpdate({
      order,
      studentId: order.studentId,
      vendorId: segment.vendorId,
      slotId: segment.slotId,
      foodItemIds: segment.foodItemIds,
      nextStatus,
    });

    return res.json({
      message: "Order status updated successfully",
      order: toClientOrder(order, "vendor", req.vendor._id),
    });

  } catch (error) {
    console.error("updateOrderStatusByVendor error:", error);
    return res.status(500).json({ message: "Failed to update order status" });
  }
};

