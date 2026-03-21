const mongoose = require("mongoose");

const pickupSlotSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    slotDate: {
      type: Date,
      required: true,
      index: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    maxCapacity: {
      type: Number,
      required: true,
      default: 10,
      min: 1,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isHeld: {
      type: Boolean,
      default: false,
    },
    holdReason: {
      type: String,
      default: null,
    },
    holdUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

pickupSlotSchema.index(
  { vendorId: 1, slotDate: 1, startTime: 1, endTime: 1 },
  { unique: true }
);

module.exports = mongoose.model("PickupSlot", pickupSlotSchema);
