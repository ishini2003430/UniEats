const mongoose = require("mongoose");

const activityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "VENDOR_REGISTRATION",
        "VENDOR_APPROVED",
        "VENDOR_REJECTED",
        "VENDOR_DELETED",
        "STUDENT_SIGNUP",
        "STUDENT_DELETED",
        "ORDER_PLACED",
        "ORDER_STATUS_UPDATED",
        "ALERT",
      ],
      required: true,
    },

    message: {
      type: String,
      required: true,
    },

    actorRole: {
      type: String,
      enum: ["Admin", "Vendor", "Student", "System"],
      required: true,
      default: "System",
    },

    // Optional: store related user id (good for future features)
    relatedUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  {
    timestamps: true, // creates createdAt & updatedAt automatically
  }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);
