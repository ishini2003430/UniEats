import { useEffect, useState } from "react";
import api from "../services/api";

function AdminOrders({ onBack }) {
  const [month, setMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await api.get("/api/admin/orders", { params: { month } });
        setOrders(Array.isArray(res.data) ? res.data : (res.data.orders || []));
      } catch (err) {
        console.error("Failed to load admin orders by month", err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [month]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-800">Orders</h3>
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border rounded-lg text-sm"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-sm text-slate-500">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="text-sm text-slate-500">No orders for selected month</div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => (
            <li key={o._id} className="flex items-center justify-between bg-slate-50 border rounded-lg p-3">
              <div>
                <div className="text-sm font-medium text-slate-900">{o.orderId}</div>
                <div className="text-xs text-slate-500">{o.student?.name || 'Student'}</div>
                <div className="text-xs text-slate-400 mt-1">{new Date(o.createdAt).toLocaleString()}</div>
              </div>
              <div className="text-sm text-slate-700">{o.status}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default AdminOrders;
