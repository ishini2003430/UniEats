import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, ArrowLeft, Loader2, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../services/api";
import OrderCard from "../vendor/components/OrderCard";

export default function MyOrdersPage({ user }) {
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  // ✅ FIXED: Proper modal state
  const [cancelModal, setCancelModal] = useState({
    open: false,
    order: null,
    reason: "",
    error: "",
  });

  /* ---------------- HEADERS ---------------- */
  const studentHeaders = useMemo(() => {
    if (!user?._id) return null;
    return {
      "x-user-role": "student",
      "x-user-id": user._id,
    };
  }, [user]);

  /* ---------------- FETCH ORDERS ---------------- */
  const fetchOrders = async () => {
    if (!studentHeaders) return;

    setLoadingOrders(true);
    setPageError("");

    try {
      const res = await api.get("/api/orders", {
        headers: studentHeaders,
      });
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setPageError("Failed to load orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    if (studentHeaders) fetchOrders();
  }, [studentHeaders]);

  /* ---------------- OPEN CANCEL ---------------- */
  const openCancelFlow = (order) => {
    setCancelModal({
      open: true,
      order,
      reason: "",
      error: "",
    });
  };

  /* ---------------- SUBMIT CANCEL ---------------- */
  const submitCancel = async () => {
    if (!studentHeaders || !cancelModal.order?._id) return;

    setCancelLoading(true);

    try {
      await api.patch(
        `/api/orders/${cancelModal.order._id}/cancel`,
        {
          reason: cancelModal.reason || "Cancelled by student",
        },
        { headers: studentHeaders }
      );

      setPageSuccess("Order cancelled successfully");

      // ✅ CLOSE MODAL PROPERLY
      setCancelModal({
        open: false,
        order: null,
        reason: "",
        error: "",
      });

      await fetchOrders();
    } catch (err) {
      setCancelModal((prev) => ({
        ...prev,
        error:
          err?.response?.data?.message || "Failed to cancel order",
      }));
    } finally {
      setCancelLoading(false);
    }
  };

  /* ---------------- CLOSE MODAL ---------------- */
  const closeModal = () => {
    setCancelModal({
      open: false,
      order: null,
      reason: "",
      error: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* HEADER */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl border bg-white p-6"
        >
          <button onClick={() => navigate("/")} className="flex gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <h1 className="text-3xl font-bold mt-3">My Orders</h1>

          {pageError && (
            <div className="flex gap-2 text-rose-600 mt-2">
              <AlertCircle className="w-4 h-4" /> {pageError}
            </div>
          )}

          {pageSuccess && (
            <div className="text-emerald-600 mt-2">
              {pageSuccess}
            </div>
          )}
        </motion.section>

        {/* ORDERS */}
        <section className="bg-white p-6 rounded-2xl border">
          {loadingOrders ? (
            <div className="flex justify-center py-10">
              <Loader2 className="animate-spin" />
            </div>
          ) : orders.length === 0 ? (
            <p className="text-center text-slate-400 py-10">
              No orders yet
            </p>
          ) : (

            <div className="space-y-6">
              <AnimatePresence>
                {orders.map((order) => (
                  <OrderCard
                    key={order._id}
                    order={order}
                    onCancel={openCancelFlow}
                  />
                ))}
              </AnimatePresence>

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
                      <td className="py-3 flex gap-2">
  {/* Existing Cancel Button */}
  <button
    onClick={() => openCancelFlow(order)}
    disabled={order.status !== "Pending"}
    className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
  >
    Cancel
  </button>

  {/* NEW: Rate Order Button - Only shows when Completed/Collected */}
  {order.status === "Completed" && (
    <button
      onClick={() => navigate("/reviews", { state: { order } })}
      className="px-3 py-1.5 rounded-lg bg-orange-500 text-white hover:bg-orange-600 shadow-sm flex items-center gap-1 transition-all active:scale-95"
    >
      <span className="text-xs">⭐</span> Rate
    </button>
  )}
</td>
                    </tr>
                  ))}
                </tbody>
              </table>

            </div>
          )}
        </section>
      </main>

      {/* MODAL */}
      <AnimatePresence>
        {cancelModal.open && (
          <motion.div
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeModal}
          >
            <motion.div
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold">Cancel Order</h3>
                <button onClick={closeModal}>
                  <X />
                </button>
              </div>

              <textarea
                className="w-full border p-2 rounded"
                placeholder="Reason (optional)"
                value={cancelModal.reason}
                onChange={(e) =>
                  setCancelModal((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
              />

              {cancelModal.error && (
                <div className="text-rose-600 text-sm mt-2">
                  {cancelModal.error}
                </div>
              )}

              <button
                onClick={submitCancel}
                disabled={cancelLoading}
                className="mt-4 w-full bg-rose-600 text-white py-2 rounded-lg"
              >
                {cancelLoading ? "Cancelling..." : "Confirm Cancel"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}