const mongoose = require("mongoose");


const activityLogSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: [
        "VENDOR_REGISTRATION",
        "VENDOR_APPROVED",
        "VENDOR_REJECTED",
        "STUDENT_SIGNUP",
        "STUDENT_DELETED",
        "ORDER_PLACED",
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
      default: "System",
    },
  },
  {
    timestamps: true, // creates createdAt & updatedAt
  }
);

module.exports = mongoose.model("ActivityLog", activityLogSchema);





