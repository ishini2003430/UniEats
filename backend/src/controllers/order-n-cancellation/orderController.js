const mongoose = require("mongoose");
const Order = require("../../models/order-n-cancellation/Order");
const Food = require("../../models/order-n-cancellation/Food");
const PickupSlot = require("../../models/order-n-cancellation/PickupSlot");

const isHoldActive = (slot) => {
  if (!slot.isHeld) return false;
  if (!slot.holdUntil) return true;
  return new Date(slot.holdUntil).getTime() > Date.now();
};

const toClientOrder = (order) => ({
  _id: order._id,
  orderId: order.orderId,
  studentId: order.studentId,
  slotId: order.slotId,
  vendorId: order.vendorId,
  foodItemIds: order.foodItemIds,
  status: order.status,
  createdAt: order.createdAt,
  updatedAt: order.updatedAt,
});

exports.createOrder = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    const { studentId, slotId, orderId, foodItemIds } = req.body;

    if (!studentId || !mongoose.Types.ObjectId.isValid(studentId)) {
      return res.status(400).json({ message: "studentId must be a valid ObjectId" });
    }

    if (String(studentId) !== String(req.student._id)) {
      return res.status(403).json({ message: "studentId must match logged in student" });
    }

    if (!slotId || !mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(400).json({ message: "slotId must be a valid ObjectId" });
    }

    if (!orderId || typeof orderId !== "string") {
      return res.status(400).json({ message: "orderId is required" });
    }

    if (!Array.isArray(foodItemIds) || foodItemIds.length === 0) {
      return res.status(400).json({ message: "foodItemIds must be a non-empty array" });
    }

    const validFoodIds = foodItemIds.every((id) => mongoose.Types.ObjectId.isValid(id));
    if (!validFoodIds) {
      return res.status(400).json({ message: "foodItemIds must contain valid ObjectIds" });
    }

    const existingOrder = await Order.findOne({ orderId });
    if (existingOrder) {
      return res.status(409).json({ message: "orderId already exists" });
    }

    const slot = await PickupSlot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    if (!slot.isActive) {
      return res.status(409).json({ message: "Slot is inactive" });
    }

    if (isHoldActive(slot)) {
      return res.status(409).json({ message: "Slot is currently held" });
    }

    const foods = await Food.find({ _id: { $in: foodItemIds }, isAvailable: true });
    if (foods.length !== foodItemIds.length) {
      return res.status(400).json({ message: "One or more food items are invalid or unavailable" });
    }

    const hasWrongVendorFood = foods.some(
      (food) => String(food.vendorId) !== String(slot.vendorId)
    );

    if (hasWrongVendorFood) {
      return res.status(400).json({ message: "All food items must belong to the slot vendor" });
    }

    await session.withTransaction(async () => {
      const reservation = await PickupSlot.updateOne(
        {
          _id: slot._id,
          isActive: true,
          currentOrders: { $lt: slot.maxCapacity },
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

      await Order.create(
        [
          {
            orderId: orderId.trim(),
            studentId,
            slotId: slot._id,
            vendorId: slot.vendorId,
            foodItemIds,
            status: "Pending",
          },
        ],
        { session }
      );
    });

    const created = await Order.findOne({ orderId: orderId.trim() });
    const freshSlot = await PickupSlot.findById(slot._id).select("maxCapacity currentOrders");

    return res.status(201).json({
      order: toClientOrder(created),
      slot: {
        _id: slot._id,
        maxCapacity: freshSlot ? freshSlot.maxCapacity : slot.maxCapacity,
        currentOrders: freshSlot ? freshSlot.currentOrders : slot.currentOrders + 1,
      },
    });
  } catch (error) {
    if (error && error.message === "SLOT_CAPACITY_REACHED") {
      return res.status(409).json({ message: "Slot is full or no longer available" });
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
    } else if (role === "vendor") {
      query.vendorId = userId;
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

    if (status) {
      query.status = String(status);
    }

    if (slotId) {
      if (!mongoose.Types.ObjectId.isValid(slotId)) {
        return res.status(400).json({ message: "slotId must be a valid ObjectId" });
      }
      query.slotId = slotId;
    }

    const orders = await Order.find(query).sort({ createdAt: -1 });

    if (id || orderId) {
      if (!orders.length) {
        return res.status(404).json({ message: "Order not found" });
      }
      return res.json(toClientOrder(orders[0]));
    }

    return res.json(orders.map(toClientOrder));
  } catch (error) {
    console.error("queryOrders error:", error);
    return res.status(500).json({ message: "Failed to query orders" });
  }
};
