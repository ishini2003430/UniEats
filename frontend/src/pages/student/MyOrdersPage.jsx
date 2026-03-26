import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, X } from "lucide-react";
import api from "../../services/api";

const statusClass = (status) => {
  if (status === "Cancelled") return "bg-rose-100 text-rose-700";
  if (status === "Completed") return "bg-emerald-100 text-emerald-700";
  if (status === "Ready") return "bg-blue-100 text-blue-700";
  if (status === "Preparing") return "bg-amber-100 text-amber-700";
  return "bg-slate-200 text-slate-700";
};

const getCodesLabel = (order) => {
  const vendorOrders = Array.isArray(order?.vendorOrders) ? order.vendorOrders : [];
  if (!vendorOrders.length) return "N/A";

  const codes = vendorOrders
    .map((item) => item?.pickupVerificationCode)
    .filter(Boolean);

  if (!codes.length) return "N/A";
  return codes.join(" / ");
};

export default function MyOrdersPage({ user }) {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const [cancelModal, setCancelModal] = useState({
    open: false,
    order: null,
    eligibility: null,
    reason: "",
    error: "",
  });

  const studentHeaders = useMemo(() => {
    if (!user?._id) return null;
    return {
      "x-user-role": "student",
      "x-user-id": user._id,
    };
  }, [user]);

  const fetchOrders = async () => {
    if (!studentHeaders) return;

    setLoadingOrders(true);
    setPageError("");

    try {
      const res = await api.get("/api/orders", { headers: studentHeaders });
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load your orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (studentHeaders) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentHeaders]);

  const openCancelFlow = async (order) => {
    if (!studentHeaders) return;

    setCancelModal({
      open: true,
      order,
      eligibility: null,
      reason: "",
      error: "",
    });

    try {
      const res = await api.get(`/api/orders/${order._id}/cancel-eligibility`, {
        headers: studentHeaders,
      });

      setCancelModal((prev) => ({ ...prev, eligibility: res.data }));
    } catch (err) {
      setCancelModal((prev) => ({
        ...prev,
        error: err?.response?.data?.message || "Failed to check cancellation eligibility",
      }));
    }
  };

  const submitCancel = async () => {
    if (!studentHeaders || !cancelModal.order?._id) return;

    setCancelLoading(true);
    try {
      await api.patch(
        `/api/orders/${cancelModal.order._id}/cancel`,
        { reason: cancelModal.reason || "Cancelled by student" },
        { headers: studentHeaders }
      );

      setPageSuccess("Order cancelled successfully");
      setCancelModal({ open: false, order: null, eligibility: null, reason: "", error: "" });
      await fetchOrders();
    } catch (err) {
      setCancelModal((prev) => ({
        ...prev,
        error: err?.response?.data?.message || "Failed to cancel order",
      }));
    } finally {
      setCancelLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <button
            onClick={() => navigate("/")}
            className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </button>

          <h1 className="text-3xl font-bold tracking-tight text-slate-900 mt-3">My Orders</h1>
          <p className="text-slate-600 mt-2">Track your order statuses and cancel eligible pending orders.</p>

          {pageError && (
            <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{pageError}</span>
            </div>
          )}

          {pageSuccess && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
              {pageSuccess}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Orders & Cancellation</h2>
            <button
              onClick={fetchOrders}
              className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
            >
              Refresh Orders
            </button>
          </div>

          {loadingOrders ? (
            <div className="h-24 flex items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-slate-500">No orders found yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2">Order ID</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Pickup Code</th>
                    <th className="py-2">Created</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-b border-slate-100">
                      <td className="py-3 font-medium text-slate-800">{order.orderId}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${statusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-800 font-semibold tracking-wide">{getCodesLabel(order)}</td>
                      <td className="py-3 text-slate-600">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="py-3">
                        <button
                          onClick={() => openCancelFlow(order)}
                          disabled={order.status !== "Pending"}
                          className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>

      {cancelModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cancel Order</h3>
              <button
                onClick={() => setCancelModal({ open: false, order: null, eligibility: null, reason: "", error: "" })}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-sm text-slate-600">
                Order: <span className="font-medium text-slate-800">{cancelModal.order?.orderId}</span>
              </div>

              {!cancelModal.eligibility ? (
                <div className="text-sm text-slate-500">Checking cancellation eligibility...</div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p>
                    Eligible: <span className="font-medium">{cancelModal.eligibility.canCancel ? "Yes" : "No"}</span>
                  </p>
                  <p className="text-slate-500 mt-1">{cancelModal.eligibility.message}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <textarea
                  rows={3}
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Optional cancellation reason"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
                />
              </div>

              {cancelModal.error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm">
                  {cancelModal.error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setCancelModal({ open: false, order: null, eligibility: null, reason: "", error: "" })}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
                <button
                  onClick={submitCancel}
                  disabled={!cancelModal.eligibility?.canCancel || cancelLoading}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {cancelLoading ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
