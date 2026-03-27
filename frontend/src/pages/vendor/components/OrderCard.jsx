import { motion } from "framer-motion";
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
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

        <span className={`px-3 py-1 text-xs rounded-full ${statusClass(order.status)}`}>
          {order.status}
        </span>
      </div>

      {/* TIMELINE */}
      <OrderTimeline status={order.status} />

      {/* FOOTER */}
      <div className="flex justify-between items-center mt-6">
        <div>
          <p className="text-xs text-slate-500">Pickup Code</p>
          <p className="font-semibold">{getCodesLabel(order)}</p>
        </div>

        <button
          onClick={() => onCancel(order)}
          disabled={order.status !== "Pending"}
          className="px-4 py-2 bg-rose-500 text-white rounded-lg disabled:opacity-40"
        >
          Cancel
        </button>
      </div>
    </motion.div>
  );
}