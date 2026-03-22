const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["student", "vendor", "admin"],
      required: true,
    },

    // Vendor-specific fields
    vendorName: {
      type: String,
      default: null,
    },
    vendorPhone: {
      type: String,
      default: null,
    },
    vendorLocation: {
      type: String,
      default: null,
    },
    vendorLogo: {
      type: String, // filename or URL
      default: null,
    },

    // Account status
    status: {
      type: String,
      enum: ["active", "pending"],
      default: function () {
        // vendors start as pending, others active
        return this.role === "vendor" ? "pending" : "active";
      },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
