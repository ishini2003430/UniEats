const PickupSlot = require("../../models/order-n-cancellation/PickupSlot");

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;

const toDateOnly = (value) => {
  if (!value || typeof value !== "string" || !DATE_RE.test(value)) {
    return null;
  }

  return new Date(`${value}T00:00:00.000Z`);
};

const isHoldActive = (slot) => {
  if (!slot.isHeld) return false;
  if (!slot.holdUntil) return true;
  return new Date(slot.holdUntil).getTime() > Date.now();
};

const toClientSlot = (slot) => ({
  _id: slot._id,
  vendorId: slot.vendorId,
  slotDate: slot.slotDate,
  startTime: slot.startTime,
  endTime: slot.endTime,
  maxCapacity: slot.maxCapacity,
  currentOrders: slot.currentOrders || 0,
  remainingCapacity: Math.max((slot.maxCapacity || 0) - (slot.currentOrders || 0), 0),
  isActive: slot.isActive,
  isHeld: slot.isHeld,
  holdReason: slot.holdReason,
  holdUntil: slot.holdUntil,
  holdActive: isHoldActive(slot),
  createdAt: slot.createdAt,
  updatedAt: slot.updatedAt,
});

const validateSlotInput = ({ slotDate, startTime, endTime, maxCapacity }, isUpdate = false) => {
  if (!isUpdate || slotDate !== undefined) {
    if (!slotDate || !DATE_RE.test(slotDate)) {
      return "slotDate must be in YYYY-MM-DD format";
    }
  }

  if (!isUpdate || startTime !== undefined) {
    if (!startTime || !TIME_RE.test(startTime)) {
      return "startTime must be in HH:mm format";
    }
  }

  if (!isUpdate || endTime !== undefined) {
    if (!endTime || !TIME_RE.test(endTime)) {
      return "endTime must be in HH:mm format";
    }
  }

  if ((startTime !== undefined || endTime !== undefined) && startTime && endTime && startTime >= endTime) {
    return "startTime must be earlier than endTime";
  }

  if (maxCapacity !== undefined) {
    if (!Number.isInteger(maxCapacity) || maxCapacity < 1) {
      return "maxCapacity must be an integer greater than 0";
    }
  }

  return null;
};

exports.createVendorSlot = async (req, res) => {
  try {
    const { slotDate, startTime, endTime, maxCapacity } = req.body;

    const validationError = validateSlotInput({ slotDate, startTime, endTime, maxCapacity });
    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    const parsedDate = toDateOnly(slotDate);
    const slot = await PickupSlot.create({
      vendorId: req.vendor._id,
      slotDate: parsedDate,
      startTime,
      endTime,
      maxCapacity: maxCapacity || 10,
    });

    return res.status(201).json(toClientSlot(slot));
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: "This slot already exists for the selected date" });
    }

    console.error("createVendorSlot error:", error);
    return res.status(500).json({ message: "Failed to create slot" });
  }
};

exports.listVendorSlots = async (req, res) => {
  try {
    const { date, active, held } = req.query;

    const query = { vendorId: req.vendor._id };

    if (date) {
      const parsedDate = toDateOnly(date);
      if (!parsedDate) {
        return res.status(400).json({ message: "date must be in YYYY-MM-DD format" });
      }
      query.slotDate = parsedDate;
    }

    if (active === "true" || active === "false") {
      query.isActive = active === "true";
    }

    if (held === "true" || held === "false") {
      query.isHeld = held === "true";
    }

    const slots = await PickupSlot.find(query).sort({ slotDate: 1, startTime: 1 });
    return res.json(slots.map(toClientSlot));
  } catch (error) {
    console.error("listVendorSlots error:", error);
    return res.status(500).json({ message: "Failed to fetch slots" });
  }
};

exports.getVendorSlotById = async (req, res) => {
  try {
    const slot = await PickupSlot.findOne({
      _id: req.params.id,
      vendorId: req.vendor._id,
    });

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    return res.json(toClientSlot(slot));
  } catch (error) {
    console.error("getVendorSlotById error:", error);
    return res.status(500).json({ message: "Failed to fetch slot" });
  }
};

exports.updateVendorSlot = async (req, res) => {
  try {
    const updates = {};
    const allowed = ["slotDate", "startTime", "endTime", "maxCapacity", "isActive"];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }

    const validationError = validateSlotInput(
      {
        slotDate: updates.slotDate,
        startTime: updates.startTime,
        endTime: updates.endTime,
        maxCapacity: updates.maxCapacity,
      },
      true
    );

    if (validationError) {
      return res.status(400).json({ message: validationError });
    }

    if (updates.slotDate) {
      updates.slotDate = toDateOnly(updates.slotDate);
    }

    const existing = await PickupSlot.findOne({
      _id: req.params.id,
      vendorId: req.vendor._id,
    });

    if (!existing) {
      return res.status(404).json({ message: "Slot not found" });
    }

    Object.assign(existing, updates);
    await existing.save();

    return res.json(toClientSlot(existing));
  } catch (error) {
    if (error && error.code === 11000) {
      return res.status(409).json({ message: "Another slot already exists with this time range" });
    }

    console.error("updateVendorSlot error:", error);
    return res.status(500).json({ message: "Failed to update slot" });
  }
};

exports.deleteVendorSlot = async (req, res) => {
  try {
    const deleted = await PickupSlot.findOneAndDelete({
      _id: req.params.id,
      vendorId: req.vendor._id,
    });

    if (!deleted) {
      return res.status(404).json({ message: "Slot not found" });
    }

    return res.json({ message: "Slot deleted successfully" });
  } catch (error) {
    console.error("deleteVendorSlot error:", error);
    return res.status(500).json({ message: "Failed to delete slot" });
  }
};

exports.holdVendorSlot = async (req, res) => {
  try {
    const { holdReason, holdUntil } = req.body;

    let parsedHoldUntil = null;
    if (holdUntil !== undefined && holdUntil !== null && holdUntil !== "") {
      const candidate = new Date(holdUntil);
      if (Number.isNaN(candidate.getTime())) {
        return res.status(400).json({ message: "holdUntil must be a valid ISO date-time" });
      }
      parsedHoldUntil = candidate;
    }

    const slot = await PickupSlot.findOne({
      _id: req.params.id,
      vendorId: req.vendor._id,
    });

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    slot.isHeld = true;
    slot.holdReason = holdReason || null;
    slot.holdUntil = parsedHoldUntil;

    await slot.save();
    return res.json(toClientSlot(slot));
  } catch (error) {
    console.error("holdVendorSlot error:", error);
    return res.status(500).json({ message: "Failed to hold slot" });
  }
};

exports.releaseVendorSlot = async (req, res) => {
  try {
    const slot = await PickupSlot.findOne({
      _id: req.params.id,
      vendorId: req.vendor._id,
    });

    if (!slot) {
      return res.status(404).json({ message: "Slot not found" });
    }

    slot.isHeld = false;
    slot.holdReason = null;
    slot.holdUntil = null;

    await slot.save();
    return res.json(toClientSlot(slot));
  } catch (error) {
    console.error("releaseVendorSlot error:", error);
    return res.status(500).json({ message: "Failed to release slot" });
  }
};

exports.listPublicSlots = async (req, res) => {
  try {
    const { date, vendorId } = req.query;
    const query = { isActive: true };

    if (date) {
      const parsedDate = toDateOnly(date);
      if (!parsedDate) {
        return res.status(400).json({ message: "date must be in YYYY-MM-DD format" });
      }
      query.slotDate = parsedDate;
    }

    if (vendorId) {
      query.vendorId = vendorId;
    }

    const now = new Date();
    query.$or = [{ isHeld: false }, { holdUntil: { $lte: now } }];

    const slots = await PickupSlot.find(query)
      .select("vendorId slotDate startTime endTime maxCapacity currentOrders isActive isHeld holdUntil")
      .sort({ slotDate: 1, startTime: 1 });

    return res.json(slots.map(toClientSlot));
  } catch (error) {
    console.error("listPublicSlots error:", error);
    return res.status(500).json({ message: "Failed to fetch available slots" });
  }
};

exports.querySlots = async (req, res) => {
  try {
    const { id, date, vendorId, active, held } = req.query;
    const isPublic = String(req.query.public || "").toLowerCase() === "true";

    if (isPublic) {
      const query = { isActive: true };

      if (date) {
        const parsedDate = toDateOnly(date);
        if (!parsedDate) {
          return res.status(400).json({ message: "date must be in YYYY-MM-DD format" });
        }
        query.slotDate = parsedDate;
      }

      if (vendorId) {
        query.vendorId = vendorId;
      }

      if (id) {
        query._id = id;
      }

      const now = new Date();
      query.$or = [{ isHeld: false }, { holdUntil: { $lte: now } }];

      const slots = await PickupSlot.find(query)
        .select("vendorId slotDate startTime endTime maxCapacity currentOrders isActive isHeld holdUntil")
        .sort({ slotDate: 1, startTime: 1 });

      if (id) {
        if (!slots.length) {
          return res.status(404).json({ message: "Slot not found" });
        }
        return res.json(toClientSlot(slots[0]));
      }

      return res.json(slots.map(toClientSlot));
    }

    const query = { vendorId: req.vendor._id };

    if (id) {
      query._id = id;
    }

    if (date) {
      const parsedDate = toDateOnly(date);
      if (!parsedDate) {
        return res.status(400).json({ message: "date must be in YYYY-MM-DD format" });
      }
      query.slotDate = parsedDate;
    }

    if (active === "true" || active === "false") {
      query.isActive = active === "true";
    }

    if (held === "true" || held === "false") {
      query.isHeld = held === "true";
    }

    const slots = await PickupSlot.find(query).sort({ slotDate: 1, startTime: 1 });

    if (id) {
      if (!slots.length) {
        return res.status(404).json({ message: "Slot not found" });
      }
      return res.json(toClientSlot(slots[0]));
    }

    return res.json(slots.map(toClientSlot));
  } catch (error) {
    console.error("querySlots error:", error);
    return res.status(500).json({ message: "Failed to query slots" });
  }
};
