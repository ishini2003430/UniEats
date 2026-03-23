import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  AlertCircle,
  Check,
  Copy,
  Loader2,
  PauseCircle,
  Pencil,
  PlayCircle,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import api from "../../../../services/api";

const pad2 = (value) => String(value).padStart(2, "0");

const toLocalDateInput = (date) => {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
};

const toLocalTimeInput = (date) => {
  return `${pad2(date.getHours())}:${pad2(date.getMinutes())}`;
};

const combineDateAndTime = (dateStr, timeStr) => {
  if (!dateStr || !timeStr) return null;
  const dt = new Date(`${dateStr}T${timeStr}:00`);
  return Number.isNaN(dt.getTime()) ? null : dt;
};

const getDefaultCreateForm = () => {
  const now = new Date();
  const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);

  return {
    slotDate: toLocalDateInput(now),
    startTime: toLocalTimeInput(now),
    endTime: toLocalTimeInput(oneHourLater),
    maxCapacity: 10,
  };
};

function Modal({ title, onClose, children }) {
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm"
      style={{ zIndex: 2147483647 }}
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white border border-slate-200 shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
          <h4 className="text-lg font-semibold text-slate-900">{title}</h4>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>,
    document.body
  );
}

export default function PickupSlotManagementTab({ user }) {
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [slotError, setSlotError] = useState("");
  const [slotSuccess, setSlotSuccess] = useState("");
  const [slots, setSlots] = useState([]);

  const [slotFilters, setSlotFilters] = useState({
    date: "",
    active: "",
    held: "",
    id: "",
  });

  const [modalType, setModalType] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [nowTick, setNowTick] = useState(Date.now());
  const [copiedSlotId, setCopiedSlotId] = useState("");

  const [createForm, setCreateForm] = useState(() => getDefaultCreateForm());

  const [editForm, setEditForm] = useState({
    slotId: "",
    slotDate: "",
    startTime: "",
    endTime: "",
    maxCapacity: 10,
    isActive: "true",
  });

  const [holdForm, setHoldForm] = useState({
    slotId: "",
    holdReason: "",
    holdUntil: "",
  });

  const vendorHeaders = useMemo(() => {
    if (!user?._id) return null;
    return {
      "x-user-role": "vendor",
      "x-user-id": user._id,
    };
  }, [user]);

  const clearFeedback = () => {
    setSlotError("");
    setSlotSuccess("");
  };

  const handleApiError = (err, fallback) => {
    setSlotError(err?.response?.data?.message || fallback);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedSlot(null);
  };

  const handleCopySlotId = async (slotId) => {
    if (!slotId) return;

    try {
      if (!navigator?.clipboard?.writeText) {
        setSlotError("Clipboard is not available in this browser.");
        return;
      }

      await navigator.clipboard.writeText(slotId);
      setCopiedSlotId(slotId);
      setTimeout(() => setCopiedSlotId(""), 1200);
    } catch (error) {
      setSlotError("Failed to copy slot id.");
    }
  };

  const fetchSlots = async ({ preserveFeedback = false } = {}) => {
    if (!vendorHeaders) {
      setSlotError("Vendor session not found. Please sign in again.");
      return;
    }

    if (!preserveFeedback) clearFeedback();
    setLoadingSlots(true);

    try {
      const params = {};
      if (slotFilters.date) params.date = slotFilters.date;
      if (slotFilters.active) params.active = slotFilters.active;
      if (slotFilters.held) params.held = slotFilters.held;
      if (slotFilters.id) params.id = slotFilters.id;

      const res = await api.get("/api/slots", {
        headers: vendorHeaders,
        params,
      });

      const rows = Array.isArray(res.data) ? res.data : [res.data];
      setSlots(rows.filter(Boolean));
    } catch (err) {
      handleApiError(err, "Failed to fetch slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    if (vendorHeaders) {
      fetchSlots();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorHeaders]);

  useEffect(() => {
    const timer = setInterval(() => setNowTick(Date.now()), 15000);
    return () => clearInterval(timer);
  }, []);

  const currentNow = useMemo(() => new Date(nowTick), [nowTick]);
  const todayDateValue = useMemo(() => toLocalDateInput(currentNow), [currentNow]);

  const getDateTimeValidationError = (form) => {
    const startDateTime = combineDateAndTime(form.slotDate, form.startTime);
    const endDateTime = combineDateAndTime(form.slotDate, form.endTime);

    if (!startDateTime || !endDateTime) return "Please provide a valid date and time.";
    if (startDateTime < currentNow) return "Start date/time cannot be in the past.";
    if (endDateTime <= startDateTime) return "End time must be later than start time.";

    return "";
  };

  const createDateTimeError = useMemo(
    () => getDateTimeValidationError(createForm),
    [createForm, currentNow]
  );

  const editDateTimeError = useMemo(
    () => getDateTimeValidationError(editForm),
    [editForm, currentNow]
  );

  const openCreateModal = () => {
    setCreateForm(getDefaultCreateForm());
    setModalType("create");
  };

  const openEditModal = (slot) => {
    setSelectedSlot(slot);
    setEditForm({
      slotId: slot._id,
      slotDate: new Date(slot.slotDate).toISOString().slice(0, 10),
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxCapacity: slot.maxCapacity,
      isActive: String(Boolean(slot.isActive)),
    });
    setModalType("edit");
  };

  const openHoldModal = (slot) => {
    const defaultUntil = new Date(Date.now() + 30 * 60 * 1000);
    const local = new Date(defaultUntil.getTime() - defaultUntil.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);

    setSelectedSlot(slot);
    setHoldForm({
      slotId: slot._id,
      holdReason: slot.holdReason || "",
      holdUntil: local,
    });
    setModalType("hold");
  };

  const openDeleteModal = (slot) => {
    setSelectedSlot(slot);
    setModalType("delete");
  };

  const openReleaseModal = (slot) => {
    setSelectedSlot(slot);
    setModalType("release");
  };

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    if (!vendorHeaders) return;
    if (createDateTimeError) {
      setSlotError(createDateTimeError);
      return;
    }

    clearFeedback();
    setActionLoading(true);
    try {
      await api.post(
        "/api/slots",
        {
          slotDate: createForm.slotDate,
          startTime: createForm.startTime,
          endTime: createForm.endTime,
          maxCapacity: Number(createForm.maxCapacity),
        },
        { headers: vendorHeaders }
      );

      await fetchSlots({ preserveFeedback: true });
      setSlotSuccess("Slot created successfully");
      closeModal();
    } catch (err) {
      handleApiError(err, "Failed to create slot");
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateSlot = async (e) => {
    e.preventDefault();
    if (!vendorHeaders || !editForm.slotId) return;
    if (editDateTimeError) {
      setSlotError(editDateTimeError);
      return;
    }

    clearFeedback();
    setActionLoading(true);
    try {
      await api.put(
        `/api/slots/${editForm.slotId}`,
        {
          slotDate: editForm.slotDate,
          startTime: editForm.startTime,
          endTime: editForm.endTime,
          maxCapacity: Number(editForm.maxCapacity),
          isActive: editForm.isActive === "true",
        },
        { headers: vendorHeaders }
      );

      await fetchSlots({ preserveFeedback: true });
      setSlotSuccess("Slot updated successfully");
      closeModal();
    } catch (err) {
      handleApiError(err, "Failed to update slot");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteSlot = async () => {
    if (!vendorHeaders || !selectedSlot?._id) return;
    clearFeedback();
    setActionLoading(true);

    try {
      await api.delete(`/api/slots/${selectedSlot._id}`, { headers: vendorHeaders });
      await fetchSlots({ preserveFeedback: true });
      setSlotSuccess("Slot deleted successfully");
      closeModal();
    } catch (err) {
      handleApiError(err, "Failed to delete slot");
    } finally {
      setActionLoading(false);
    }
  };

  const handleHoldSlot = async (e) => {
    e.preventDefault();
    if (!vendorHeaders || !holdForm.slotId) return;

    clearFeedback();
    setActionLoading(true);
    try {
      await api.patch(
        `/api/slots/${holdForm.slotId}/hold`,
        {
          holdReason: holdForm.holdReason,
          holdUntil: holdForm.holdUntil ? new Date(holdForm.holdUntil).toISOString() : null,
        },
        { headers: vendorHeaders }
      );

      await fetchSlots({ preserveFeedback: true });
      setSlotSuccess("Slot held successfully");
      closeModal();
    } catch (err) {
      handleApiError(err, "Failed to hold slot");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseSlot = async () => {
    if (!vendorHeaders || !selectedSlot?._id) return;

    clearFeedback();
    setActionLoading(true);
    try {
      await api.patch(`/api/slots/${selectedSlot._id}/release`, {}, { headers: vendorHeaders });
      await fetchSlots({ preserveFeedback: true });
      setSlotSuccess("Slot released successfully");
      closeModal();
    } catch (err) {
      handleApiError(err, "Failed to release slot");
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {slotError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{slotError}</span>
        </div>
      )}

      {slotSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
          {slotSuccess}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-lg font-semibold text-slate-800">Pickup Slot Management</h3>
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={openCreateModal}
              className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600 flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Slot
            </button>
            <button
              onClick={() => fetchSlots()}
              className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="date"
            value={slotFilters.date}
            onChange={(e) => setSlotFilters((prev) => ({ ...prev, date: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
          />

          <select
            value={slotFilters.active}
            onChange={(e) => setSlotFilters((prev) => ({ ...prev, active: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
          >
            <option value="">All Active States</option>
            <option value="true">Active</option>
            <option value="false">Inactive</option>
          </select>

          <select
            value={slotFilters.held}
            onChange={(e) => setSlotFilters((prev) => ({ ...prev, held: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
          >
            <option value="">All Hold States</option>
            <option value="true">Held</option>
            <option value="false">Not Held</option>
          </select>

          <input
            type="text"
            placeholder="Slot ID"
            value={slotFilters.id}
            onChange={(e) => setSlotFilters((prev) => ({ ...prev, id: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
          />
        </div>

        <div className="mt-4">
          <button
            onClick={() => fetchSlots()}
            className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600"
          >
            Apply Filters
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="mb-4">
          <h4 className="text-2xl font-bold tracking-tight text-slate-900">Pickup Slots Table</h4>
          <p className="text-sm text-slate-500 mt-1">
            Review current slot capacity, status, and manage each slot from the actions column.
          </p>
        </div>

        {loadingSlots ? (
          <div className="h-32 flex items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading slots...
          </div>
        ) : slots.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
            No slots found. Click Create Slot.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 w-[6%]">#</th>
                  <th className="py-2 w-[18%]">Slot ID</th>
                  <th className="py-2 w-[15%]">Date</th>
                  <th className="py-2 w-[18%]">Time</th>
                  <th className="py-2 w-[12%]">Capacity</th>
                  <th className="py-2 w-[12%]">Status</th>
                  <th className="py-2 w-[19%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {slots.map((slot, index) => (
                  <tr key={slot._id} className="border-b border-slate-100">
                    <td className="py-3 pr-2 text-slate-500">{index + 1}</td>
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-600">...{slot?._id?.slice(-5)}</span>
                        <button
                          onClick={() => handleCopySlotId(slot._id)}
                          title="Copy full slot id"
                          aria-label="Copy full slot id"
                          className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          {copiedSlotId === slot._id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-2">{new Date(slot.slotDate).toISOString().slice(0, 10)}</td>
                    <td className="py-3 pr-2">
                      {slot.startTime} - {slot.endTime}
                    </td>
                    <td className="py-3 pr-2">
                      {slot.currentOrders}/{slot.maxCapacity}
                    </td>
                    <td className="py-3 pr-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          slot.isHeld
                            ? "bg-amber-100 text-amber-700"
                            : slot.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {slot.isHeld ? "Held" : slot.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditModal(slot)}
                          title="Update slot"
                          aria-label="Update slot"
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        {!slot.isHeld ? (
                          <button
                            onClick={() => openHoldModal(slot)}
                            title="Hold slot"
                            aria-label="Hold slot"
                            className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200"
                          >
                            <PauseCircle className="w-4 h-4" />
                          </button>
                        ) : (
                          <button
                            onClick={() => openReleaseModal(slot)}
                            title="Release slot"
                            aria-label="Release slot"
                            className="p-2 rounded-lg bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                          >
                            <PlayCircle className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openDeleteModal(slot)}
                          title="Delete slot"
                          aria-label="Delete slot"
                          className="p-2 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalType === "create" && (
        <Modal title="Create Slot" onClose={closeModal}>
          <form onSubmit={handleCreateSlot} className="space-y-3">
            <label htmlFor="create-slot-date" className="block text-sm font-medium text-slate-700">
              Slot Date
            </label>
            <input
              id="create-slot-date"
              type="date"
              min={todayDateValue}
              required
              value={createForm.slotDate}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, slotDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="create-start-time" className="block text-sm font-medium text-slate-700 mb-1">
                  Start Time
                </label>
                <input
                  id="create-start-time"
                  type="time"
                  min={createForm.slotDate === todayDateValue ? toLocalTimeInput(currentNow) : undefined}
                  required
                  value={createForm.startTime}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label htmlFor="create-end-time" className="block text-sm font-medium text-slate-700 mb-1">
                  End Time
                </label>
                <input
                  id="create-end-time"
                  type="time"
                  min={createForm.startTime || undefined}
                  required
                  value={createForm.endTime}
                  onChange={(e) => setCreateForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
                />
              </div>
            </div>
            <label htmlFor="create-max-capacity" className="block text-sm font-medium text-slate-700">
              Max Capacity
            </label>
            <input
              id="create-max-capacity"
              type="number"
              min="1"
              required
              value={createForm.maxCapacity}
              onChange={(e) => setCreateForm((prev) => ({ ...prev, maxCapacity: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
              placeholder="Max capacity"
            />
            {createDateTimeError && (
              <p className="text-sm text-rose-600">{createDateTimeError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || Boolean(createDateTimeError)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                {actionLoading ? "Creating..." : "Create"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modalType === "edit" && (
        <Modal title="Update Slot" onClose={closeModal}>
          <form onSubmit={handleUpdateSlot} className="space-y-3">
            <label htmlFor="edit-slot-date" className="block text-sm font-medium text-slate-700">
              Slot Date
            </label>
            <input
              id="edit-slot-date"
              type="date"
              min={todayDateValue}
              required
              value={editForm.slotDate}
              onChange={(e) => setEditForm((prev) => ({ ...prev, slotDate: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
            />
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-start-time" className="block text-sm font-medium text-slate-700 mb-1">
                  Start Time
                </label>
                <input
                  id="edit-start-time"
                  type="time"
                  min={editForm.slotDate === todayDateValue ? toLocalTimeInput(currentNow) : undefined}
                  required
                  value={editForm.startTime}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, startTime: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
                />
              </div>
              <div>
                <label htmlFor="edit-end-time" className="block text-sm font-medium text-slate-700 mb-1">
                  End Time
                </label>
                <input
                  id="edit-end-time"
                  type="time"
                  min={editForm.startTime || undefined}
                  required
                  value={editForm.endTime}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, endTime: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="edit-max-capacity" className="block text-sm font-medium text-slate-700 mb-1">
                  Max Capacity
                </label>
                <input
                  id="edit-max-capacity"
                  type="number"
                  min="1"
                  required
                  value={editForm.maxCapacity}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, maxCapacity: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
                  placeholder="Max capacity"
                />
              </div>
              <div>
                <label htmlFor="edit-active-state" className="block text-sm font-medium text-slate-700 mb-1">
                  Active State
                </label>
                <select
                  id="edit-active-state"
                  value={editForm.isActive}
                  onChange={(e) => setEditForm((prev) => ({ ...prev, isActive: e.target.value }))}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
                >
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            {editDateTimeError && (
              <p className="text-sm text-rose-600">{editDateTimeError}</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading || Boolean(editDateTimeError)}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                {actionLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modalType === "hold" && (
        <Modal title="Hold Slot" onClose={closeModal}>
          <form onSubmit={handleHoldSlot} className="space-y-3">
            <label htmlFor="hold-reason" className="block text-sm font-medium text-slate-700">
              Hold Reason
            </label>
            <input
              id="hold-reason"
              type="text"
              placeholder="Hold reason"
              value={holdForm.holdReason}
              onChange={(e) => setHoldForm((prev) => ({ ...prev, holdReason: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
            />
            <label htmlFor="hold-until" className="block text-sm font-medium text-slate-700">
              Hold Until
            </label>
            <input
              id="hold-until"
              type="datetime-local"
              value={holdForm.holdUntil}
              onChange={(e) => setHoldForm((prev) => ({ ...prev, holdUntil: e.target.value }))}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg bg-amber-500 text-white hover:bg-amber-600"
              >
                {actionLoading ? "Holding..." : "Hold"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {modalType === "release" && (
        <Modal title="Release Slot" onClose={closeModal}>
          <p className="text-slate-600">
            Release this slot and make it available again?
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleReleaseSlot}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
            >
              {actionLoading ? "Releasing..." : "Release"}
            </button>
          </div>
        </Modal>
      )}

      {modalType === "delete" && (
        <Modal title="Delete Slot" onClose={closeModal}>
          <p className="text-slate-600">
            Delete slot on {selectedSlot ? new Date(selectedSlot.slotDate).toISOString().slice(0, 10) : ""}?
          </p>
          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteSlot}
              disabled={actionLoading}
              className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700"
            >
              {actionLoading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </Modal>
      )}

    </div>
  );
}
