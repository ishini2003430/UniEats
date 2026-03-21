const express = require("express");
const { requireVendor } = require("../../../middleware/order-n-cancellation/requireVendor");
const {
  createVendorSlot,
  updateVendorSlot,
  deleteVendorSlot,
  holdVendorSlot,
  releaseVendorSlot,
  querySlots,
} = require("../../controllers/order-n-cancellation/pickupSlotController");

const router = express.Router();

const requireVendorUnlessPublic = (req, res, next) => {
  const isPublic = String(req.query.public || "").toLowerCase() === "true";
  if (isPublic) {
    return next();
  }

  return requireVendor(req, res, next);
};

// Query endpoint: public=true for student/public reads, otherwise vendor-only reads
router.get("/", requireVendorUnlessPublic, querySlots);

// Vendor-only endpoints
router.use(requireVendor);
router.post("/", createVendorSlot);
router.put("/:id", updateVendorSlot);
router.delete("/:id", deleteVendorSlot);
router.patch("/:id/hold", holdVendorSlot);
router.patch("/:id/release", releaseVendorSlot);

module.exports = router;
