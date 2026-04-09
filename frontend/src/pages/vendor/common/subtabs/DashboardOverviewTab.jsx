import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Clock,
  CheckCircle,
  Activity,
} from "lucide-react";
import { motion } from "framer-motion";
import api from "../../../../services/api";

export default function DashboardOverviewTab({ user }) {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topItems, setTopItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const vendorHeaders = useMemo(
    () => ({ "x-user-role": "vendor", "x-user-id": user?._id }),
    [user]
  );

  useEffect(() => {
    let mounted = true;
    const fetchData = async () => {
      setLoading(true);
      try {
        // Use existing orders endpoint (vendor-scoped via headers) to derive stats and top items
        const res = await api.get("/api/orders", { headers: vendorHeaders });
        const orders = Array.isArray(res.data) ? res.data : [];

        if (!mounted) return;

        // derive stats
        const today = new Date();
        const isSameDay = (d) => {
          const dt = new Date(d);
          return (
            dt.getFullYear() === today.getFullYear() &&
            dt.getMonth() === today.getMonth() &&
            dt.getDate() === today.getDate()
          );
        };

        const todayOrders = orders.filter((o) => o.createdAt && isSameDay(o.createdAt)).length;
        const pending = orders.filter((o) => o.status === "Pending").length;
        const completed = orders.filter((o) => o.status === "Completed").length;

        // revenue: sum prices of foods in completed orders (if food objects include price)
        let revenue = 0;
        const itemCounts = new Map();

        orders.forEach((o) => {
          const foods = Array.isArray(o.foods) ? o.foods : [];
          if (o.status === "Completed") {
            foods.forEach((f) => {
              const price = f && typeof f.price === "number" ? f.price : 0;
              revenue += price;
            });
          }

          // top items
          foods.forEach((f) => {
            if (!f || !f._id) return;
            const key = String(f._id);
            itemCounts.set(key, { item: f, count: (itemCounts.get(key)?.count || 0) + 1 });
          });
        });

        const top = Array.from(itemCounts.values())
          .sort((a, b) => b.count - a.count)
          .slice(0, 6)
          .map((v) => ({ _id: v.item._id, name: v.item.name, count: v.count }));

        setStats({ todayOrders, pending, completed, revenue });
        setRecentOrders(orders.slice(0, 6));
        setTopItems(top);
      } catch (err) {
        if (!mounted) return;
        console.warn("DashboardOverview: failed to fetch vendor orders, using defaults", err);
        setStats({ todayOrders: 0, pending: 0, completed: 0, revenue: 0 });
        setRecentOrders([]);
        setTopItems([]);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    if (user?._id) fetchData();

    return () => {
      mounted = false;
    };
  }, [user?._id]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Dashboard Overview</h3>
          <p className="text-slate-600 mt-1 text-sm">Quick summary of your shop activity</p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Package className="w-5 h-5 text-amber-600" />}
          label="Orders Today"
          value={loading ? "—" : stats?.todayOrders ?? 0}
        />

        <StatCard
          icon={<Clock className="w-5 h-5 text-sky-600" />}
          label="Pending"
          value={loading ? "—" : stats?.pending ?? 0}
        />

        <StatCard
          icon={<CheckCircle className="w-5 h-5 text-emerald-600" />}
          label="Completed"
          value={loading ? "—" : stats?.completed ?? 0}
        />

        <StatCard
          icon={<div className="text-rose-600 font-semibold">Rs.</div>}
          label="Revenue"
          value={loading ? "—" : `${(stats?.revenue ?? 0).toLocaleString()}`}
        />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="col-span-2 bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <h4 className="text-sm font-medium text-slate-800 mb-3">Recent Orders</h4>

          {loading ? (
            <div className="text-sm text-slate-500">Loading recent orders…</div>
          ) : recentOrders.length === 0 ? (
            <div className="text-sm text-slate-500">No recent orders</div>
          ) : (
            <ul className="space-y-3">
              {recentOrders.map((o) => (
                <motion.li
                  key={o._id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center justify-between bg-white border rounded-lg p-3"
                >
                  <div>
                    <div className="text-sm font-medium text-slate-900">Order {o.orderId}</div>
                    <div className="text-xs text-slate-500">{o.student?.name || o.student || o.studentId}</div>
                    <div className="text-xs text-slate-400 mt-1">{new Date(o.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-slate-600">{o.status}</div>
                </motion.li>
              ))}
            </ul>
          )}
        </section>

        <aside className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <h4 className="text-sm font-medium text-slate-800 mb-3">Top Items</h4>
          {loading ? (
            <div className="text-sm text-slate-500">Loading…</div>
          ) : topItems.length === 0 ? (
            <div className="text-sm text-slate-500">No items yet</div>
          ) : (
            <ol className="space-y-2 text-sm">
              {topItems.map((it, i) => (
                  <motion.li
                    key={it._id}
                    initial={{ opacity: 0, x: 6 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.25, delay: i * 0.03 }}
                    className="flex items-center justify-between"
                  >
                    <div className="truncate pr-2">{i + 1}. {it.name}</div>
                    <div className="text-xs text-slate-500">{it.count}</div>
                  </motion.li>
                ))}
            </ol>
          )}
        </aside>
      </div>

      <div className="mt-6 bg-slate-50 border border-slate-100 rounded-2xl p-4">
        <h4 className="text-sm font-medium text-slate-800 mb-3">Activity / Alerts</h4>
        <div className="text-sm text-slate-500">No recent activity.</div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-white border border-slate-100 rounded-lg p-4 flex items-center gap-3"
    >
      <div className="w-10 h-10 bg-slate-50 rounded-lg flex items-center justify-center">{icon}</div>
      <div>
        <div className="text-xs text-slate-500">{label}</div>
        <div className="text-lg font-semibold text-slate-900">{value}</div>
      </div>
    </motion.div>
  );
}
