import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom"; // Added for navigation
import OrderTimeline from "./OrderTimeline";

const statusClass = (status) => {
  if (status === "Cancelled") return "bg-rose-100 text-rose-700";
  if (status === "Completed") return "bg-emerald-100 text-emerald-700";
  if (status === "Ready") return "bg-blue-100 text-blue-700";
  if (status === "Preparing") return "bg-amber-100 text-amber-700";
  return "bg-slate-200 text-slate-700";
};

const getCodesLabel = (order) => {
  const vendorOrders = Array.isArray(order?.vendorOrders)
    ? order.vendorOrders
    : [];

  const codes = vendorOrders
    .map((item) => item?.pickupVerificationCode)
    .filter(Boolean);

  return codes.length ? codes.join(" / ") : "N/A";
};

export default function OrderCard({ order, onCancel }) {
  const navigate = useNavigate();

  // Function to handle navigation to the Reviews page
  const handleRateClick = () => {
    // We pass the order details so the Reviews page can auto-fill 
    // the Vendor Name and Meal details if needed.
    navigate("/reviews", { state: { orderData: order } });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.01 }}
      className="border rounded-2xl p-6 bg-white shadow-sm hover:shadow-md transition"
    >
      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <p className="font-bold text-lg">{order.orderId}</p>
          <p className="text-xs text-slate-400">
            {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>

        <span className={`px-3 py-1 text-xs rounded-full font-medium ${statusClass(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* TIMELINE */}
      <OrderTimeline status={order.status} />

      {/* FOOTER & ACTIONS */}
      <div className="flex justify-between items-end mt-6 pt-4 border-t border-slate-50">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Pickup Code</p>
          <p className="font-mono text-sm font-bold text-orange-600">{getCodesLabel(order)}</p>
        </div>

        <div className="flex gap-2">
          {/* SHOW CANCEL ONLY IF PENDING */}
          {order.status === "Pending" && (
            <button
              onClick={() => onCancel(order)}
              className="px-4 py-2 text-xs font-bold bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition"
            >
              Cancel Order
            </button>
          )}

          {/* ✅ NEW: SHOW RATING BUTTON ONLY IF COMPLETED */}
          {order.status === "Completed" && (
            <button
              onClick={handleRateClick}
              className="px-4 py-2 text-xs font-bold bg-orange-500 text-white rounded-lg shadow-md shadow-orange-100 hover:bg-orange-600 transition flex items-center gap-2"
            >
              <span>⭐</span> Rate Order
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}