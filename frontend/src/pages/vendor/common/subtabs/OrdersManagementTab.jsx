import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import {
  AlertCircle,
  Check,
  Copy,
  Eye,
  Loader2,
  Pencil,
  Search,
  X,
} from "lucide-react";
import api from "../../../../services/api";

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

const STATUS_OPTIONS = ["Pending", "Preparing", "Ready", "Completed", "Cancelled"];

export default function OrdersManagementTab({ user }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [orders, setOrders] = useState([]);
  const [orderError, setOrderError] = useState("");
  const [orderSuccess, setOrderSuccess] = useState("");
  const [copiedId, setCopiedId] = useState("");

  const [filters, setFilters] = useState({
    id: "",
    orderId: "",
    status: "",
    slotId: "",
  });

  const [modalType, setModalType] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [statusForm, setStatusForm] = useState({
    status: "Pending",
  });

  const notificationOrderId = searchParams.get("notifyOrderId") || "";

  const vendorHeaders = useMemo(() => {
    if (!user?._id) return null;

    return {
      "x-user-role": "vendor",
      "x-user-id": user._id,
    };
  }, [user]);

  const clearFeedback = () => {
    setOrderError("");
    setOrderSuccess("");
  };

  const handleApiError = (err, fallback) => {
    setOrderError(err?.response?.data?.message || fallback);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedOrder(null);
  };

  const fetchOrders = async ({ preserveFeedback = false } = {}) => {
    if (!vendorHeaders) {
      setOrderError("Vendor session not found. Please sign in again.");
      return;
    }

    if (!preserveFeedback) clearFeedback();
    setLoadingOrders(true);

    try {
      const params = {};
      if (filters.id) params.id = filters.id.trim();
      if (filters.orderId) params.orderId = filters.orderId.trim();
      if (filters.status) params.status = filters.status;
      if (filters.slotId) params.slotId = filters.slotId.trim();

      const res = await api.get("/api/orders", {
        headers: vendorHeaders,
        params,
      });

      const rows = Array.isArray(res.data) ? res.data : [res.data];
      setOrders(rows.filter(Boolean));
    } catch (err) {
      handleApiError(err, "Failed to fetch orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  const focusOrderFromNotification = async (mongoOrderId) => {
    if (!mongoOrderId || !vendorHeaders) return;

    clearFeedback();
    setLoadingOrders(true);

    try {
      const res = await api.get("/api/orders", {
        headers: vendorHeaders,
        params: { id: mongoOrderId },
      });

      const row = res.data && !Array.isArray(res.data) ? [res.data] : [];
      setOrders(row);
      setFilters((prev) => ({
        ...prev,
        id: mongoOrderId,
        orderId: "",
        status: "",
        slotId: "",
      }));
      setOrderSuccess("Focused order from notification");
    } catch (err) {
      handleApiError(err, "Failed to open order from notification");
    } finally {
      setLoadingOrders(false);
      const next = new URLSearchParams(searchParams);
      next.delete("notifyOrderId");
      setSearchParams(next);
    }
  };

  useEffect(() => {
    if (vendorHeaders) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vendorHeaders]);

  useEffect(() => {
    if (!notificationOrderId || !vendorHeaders) return;
    focusOrderFromNotification(notificationOrderId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notificationOrderId, vendorHeaders]);

  const openViewModal = (order) => {
    setSelectedOrder(order);
    setModalType("view");
  };

  const openStatusModal = (order) => {
    setSelectedOrder(order);
    setStatusForm({ status: order.status || "Pending" });
    setModalType("status");
  };

  const handleCopyId = async (id) => {
    if (!id) return;

    try {
      if (!navigator?.clipboard?.writeText) {
        setOrderError("Clipboard is not available in this browser.");
        return;
      }

      await navigator.clipboard.writeText(id);
      setCopiedId(id);
      setTimeout(() => setCopiedId(""), 1200);
    } catch (error) {
      setOrderError("Failed to copy id.");
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    if (!vendorHeaders || !selectedOrder?._id) return;

    clearFeedback();
    setActionLoading(true);

    try {
      await api.patch(
        `/api/orders/${selectedOrder._id}/status`,
        { status: statusForm.status },
        { headers: vendorHeaders }
      );

      await fetchOrders({ preserveFeedback: true });
      setOrderSuccess("Order status updated successfully");
      closeModal();
    } catch (err) {
      handleApiError(err, "Failed to update order status");
    } finally {
      setActionLoading(false);
    }
  };

  const isStatusEditable = (order) => order.status !== "Cancelled" && order.status !== "Completed";

  return (
    <div className="space-y-6">
      {orderError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{orderError}</span>
        </div>
      )}

      {orderSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl px-4 py-3 text-sm">
          {orderSuccess}
        </div>
      )}

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4 gap-3 flex-wrap">
          <h3 className="text-lg font-semibold text-slate-800">Orders Management</h3>
          <button
            onClick={() => fetchOrders()}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
          >
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            placeholder="Mongo _id"
            value={filters.id}
            onChange={(e) => setFilters((prev) => ({ ...prev, id: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
          />

          <input
            type="text"
            placeholder="Order ID"
            value={filters.orderId}
            onChange={(e) => setFilters((prev) => ({ ...prev, orderId: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
          />

          <select
            value={filters.status}
            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
          >
            <option value="">All Statuses</option>
            {STATUS_OPTIONS.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>

          <input
            type="text"
            placeholder="Slot ID"
            value={filters.slotId}
            onChange={(e) => setFilters((prev) => ({ ...prev, slotId: e.target.value }))}
            className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
          />
        </div>

        <div className="mt-4">
          <button
            onClick={() => fetchOrders()}
            className="px-4 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600 inline-flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            Apply Filters
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl p-6">
        <div className="mb-4">
          <h4 className="text-2xl font-bold tracking-tight text-slate-900">Orders Table</h4>
          <p className="text-sm text-slate-500 mt-1">
            Review incoming orders, inspect details, and update order status from row actions.
          </p>
        </div>

        {loadingOrders ? (
          <div className="h-32 flex items-center justify-center text-slate-500 gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="h-32 flex items-center justify-center text-slate-500 text-sm">
            No orders found. Adjust filters or refresh.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full table-fixed text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-200">
                  <th className="py-2 w-[5%]">#</th>
                  <th className="py-2 w-[17%]">Mongo ID</th>
                  <th className="py-2 w-[14%]">Order ID</th>
                  <th className="py-2 w-[15%]">Slot ID</th>
                  <th className="py-2 w-[12%]">Status</th>
                  <th className="py-2 w-[17%]">Created</th>
                  <th className="py-2 w-[20%]">Actions</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => (
                  <tr key={order._id} className="border-b border-slate-100">
                    <td className="py-3 pr-2 text-slate-500">{index + 1}</td>
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-600">...{order?._id?.slice(-5)}</span>
                        <button
                          onClick={() => handleCopyId(order._id)}
                          title="Copy full Mongo ID"
                          aria-label="Copy full Mongo ID"
                          className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          {copiedId === order._id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-2 font-medium text-slate-800 truncate">{order.orderId}</td>
                    <td className="py-3 pr-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-slate-600">...{order?.slotId?.slice(-5)}</span>
                        <button
                          onClick={() => handleCopyId(order.slotId)}
                          title="Copy full Slot ID"
                          aria-label="Copy full Slot ID"
                          className="p-1.5 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          {copiedId === order.slotId ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="py-3 pr-2">
                      <span
                        className={`px-2 py-1 rounded text-xs ${
                          order.status === "Cancelled"
                            ? "bg-rose-100 text-rose-700"
                            : order.status === "Completed"
                              ? "bg-emerald-100 text-emerald-700"
                              : order.status === "Ready"
                                ? "bg-blue-100 text-blue-700"
                                : order.status === "Preparing"
                                  ? "bg-amber-100 text-amber-700"
                                  : "bg-slate-200 text-slate-700"
                        }`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 pr-2 text-slate-600">
                      {new Date(order.createdAt).toLocaleString()}
                    </td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openViewModal(order)}
                          title="View details"
                          aria-label="View details"
                          className="p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openStatusModal(order)}
                          disabled={!isStatusEditable(order)}
                          title="Update status"
                          aria-label="Update status"
                          className="p-2 rounded-lg bg-amber-100 text-amber-700 hover:bg-amber-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Pencil className="w-4 h-4" />
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

      {modalType === "view" && selectedOrder && (
        <Modal title="Order Details" onClose={closeModal}>
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-slate-500">Order ID</p>
                <p className="font-medium text-slate-800 break-all">{selectedOrder.orderId}</p>
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
                <p className="text-slate-500">Status</p>
                <p className="font-medium text-slate-800">{selectedOrder.status}</p>
              </div>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-slate-500">Mongo ID</p>
              <p className="font-mono text-slate-700 break-all">{selectedOrder._id}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-slate-500">Slot ID</p>
              <p className="font-mono text-slate-700 break-all">{selectedOrder.slotId}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-slate-500">Student ID</p>
              <p className="font-mono text-slate-700 break-all">{selectedOrder.studentId}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-3">
              <p className="text-slate-500">Food Item IDs</p>
              <div className="mt-1 space-y-1">
                {(selectedOrder.foodItemIds || []).map((id) => (
                  <p key={id} className="font-mono text-xs text-slate-700 break-all">
                    {id}
                  </p>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}

      {modalType === "status" && selectedOrder && (
        <Modal title="Update Order Status" onClose={closeModal}>
          <form onSubmit={handleUpdateStatus} className="space-y-3">
            <label htmlFor="order-status" className="block text-sm font-medium text-slate-700">
              Order Status
            </label>
            <select
              id="order-status"
              value={statusForm.status}
              onChange={(e) => setStatusForm({ status: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
            >
              <option value="Pending">Pending</option>
              <option value="Preparing">Preparing</option>
              <option value="Ready">Ready</option>
              <option value="Completed">Completed</option>
            </select>

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
                className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800"
              >
                {actionLoading ? "Updating..." : "Update"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
