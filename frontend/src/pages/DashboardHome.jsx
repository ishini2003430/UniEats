import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Store, GraduationCap, ShoppingBag } from "lucide-react";

import api from "../services/api";
import StatsCard from "./StatsCard";
import ActionCard from "./ActionCard";
import ActivityFeed from "./ActivityFeed";
import { useCallback } from "react";

function DashboardHome({ setView }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  const fetchRecentOrders = useCallback(async (limit = 8) => {
    setOrdersLoading(true);
    try {
      const res = await api.get("/api/admin/orders", { params: { limit } });
      let payload = res.data;
      // support `{ orders: [...] }` or raw array
      if (payload && payload.orders) payload = payload.orders;

      if (Array.isArray(payload)) {
        // normalize entries to expected shape for UI
        const mapped = payload.map((o) => {
          const status = o.status || (Array.isArray(o.vendorOrders) && o.vendorOrders[0]?.status) || "Pending";
          const student = o.student || (o.studentId ? (typeof o.studentId === 'object' ? o.studentId : { _id: o.studentId }) : null);
          const createdAt = o.createdAt || (o.createdAt === 0 ? 0 : o.createdAt) || (o.createdAt ? o.createdAt : o.createdAt);
          return {
            _id: o._id,
            orderId: o.orderId || o._id,
            student,
            status,
            createdAt: o.createdAt || (o.createdAt === 0 ? 0 : o.createdAt) || new Date().toISOString(),
            raw: o,
          };
        });
        setOrders(mapped);
      } else {
        setOrders([]);
      }
    } catch (err) {
      console.error("Failed to load admin orders", err);
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }, []);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.get("/api/admin/stats");
        setStats(res.data);
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    fetchRecentOrders(8);

    const interval = setInterval(fetchStats, 15000);
    const ordersInterval = setInterval(() => fetchRecentOrders(8), 15000);
    return () => {
      clearInterval(interval);
      clearInterval(ordersInterval);
    };
  }, []);

  const systemHealthy =
    stats?.pendingVendors >= 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900">
          Dashboard Overview
        </h2>
        <p className="text-slate-500">
          Welcome back, Admin. Here's what's happening today.
        </p>
      </div>

      {/* Stats Grid */}
      {loading ? (
        <p className="text-slate-500">Loading statistics...</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard
            title="Pending Vendors"
            value={stats?.pendingVendors}
            trend="Live"
            trendDirection="up"
            icon={Clock}
            color="bg-amber-500"
            delay={0.1}
          />

          <StatsCard
            title="Active Vendors"
            value={stats?.activeVendors}
            trend="Live"
            trendDirection="up"
            icon={Store}
            color="bg-blue-500"
            delay={0.2}
          />

          <StatsCard
            title="Total Students"
            value={stats?.students}
            trend="Live"
            trendDirection="up"
            icon={GraduationCap}
            color="bg-emerald-500"
            delay={0.3}
          />

          <StatsCard
            title="Orders Today"
            value={typeof stats?.ordersToday === 'number' ? stats.ordersToday : '--'}
            trend="Today"
            trendDirection="up"
            icon={ShoppingBag}
            color="bg-rose-500"
            delay={0.4}
          />
        </div>
      )}

      {/* Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ActionCard
          title="Pending Vendors"
          description="Review and approve new vendor registration requests."
          icon={Clock}
          buttonText="Review Requests"
          onClick={() => setView("vendors")}
          accentColor="border-amber-500"
          delay={0.5}
        />

        <ActionCard
          title="Active Vendors"
          description="Manage existing vendors, menus, and operating status."
          icon={Store}
          buttonText="Manage Vendors"
          onClick={() => setView("activeVendors")}
          accentColor="border-blue-500"
          delay={0.6}
        />

        <ActionCard
          title="Students"
          description="View student accounts and manage profiles."
          icon={GraduationCap}
          buttonText="View Students"
          onClick={() => setView("students")}
          accentColor="border-emerald-500"
          delay={0.7}
        />
      </div>

      {/* Activity Feed + System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <ActivityFeed onViewAll={() => setView("allActivities")} />

          <div className="bg-white border border-slate-100 rounded-2xl p-4">
            <h3 className="text-sm font-medium text-slate-800 mb-3">Order Tracking</h3>

            {ordersLoading ? (
              <div className="text-sm text-slate-500">Loading recent orders…</div>
            ) : orders.length === 0 ? (
              <div className="text-sm text-slate-500">No recent orders</div>
            ) : (
              <ul className="space-y-3">
                {orders.map((o) => (
                  <li key={o._id} className="flex items-center justify-between bg-slate-50 border rounded-lg p-3">
                    <div>
                      <div className="text-sm font-medium text-slate-900">{o.orderId}</div>
                      <div className="text-xs text-slate-500">{o.student?.name || 'Student'}</div>
                      <div className="text-xs text-slate-400 mt-1">{new Date(o.createdAt).toLocaleString()}</div>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-sm text-slate-700">{o.status}</div>
                      <div className={`text-xs px-2 py-1 rounded-full ${
                        o.status === 'Pending' ? 'bg-amber-100 text-amber-700' :
                        o.status === 'Preparing' ? 'bg-sky-100 text-sky-700' :
                        o.status === 'Ready' ? 'bg-emerald-100 text-emerald-700' :
                        o.status === 'Completed' ? 'bg-emerald-200 text-emerald-800' : 'bg-slate-100 text-slate-700'
                      }`}>{o.status}</div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.8 }}
          className="bg-slate-900 rounded-xl p-6 text-white flex flex-col justify-between"
        >
          <div>
            <h3 className="text-lg font-bold mb-4">
              System Status
            </h3>

            <div className="flex items-center mb-6">
              <div
                className={`w-2 h-2 rounded-full mr-2 animate-pulse ${
                  systemHealthy
                    ? "bg-emerald-400"
                    : "bg-red-400"
                }`}
              ></div>
              <span className="text-slate-300 text-sm">
                {systemHealthy
                  ? "All services operational"
                  : "System requires attention"}
              </span>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">
                  Active Vendors
                </span>
                <span className="font-semibold">
                  {stats?.activeVendors}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">
                  Pending Approvals
                </span>
                <span className="font-semibold">
                  {stats?.pendingVendors}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-slate-400">
                  Registered Students
                </span>
                <span className="font-semibold">
                  {stats?.students}
                </span>
              </div>
            </div>
          </div>

          {/* 🔥 Updated Button */}
          <button
            onClick={() => setView("reports")}
            className="mt-6 w-full py-2 bg-amber-500 hover:bg-amber-600 rounded-lg text-sm font-medium transition-colors"
          >
            View Detailed Reports
          </button>
        </motion.div>
      </div>
    </div>
  );
}

export default DashboardHome;
