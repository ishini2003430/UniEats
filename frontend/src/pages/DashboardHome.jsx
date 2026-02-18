import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Clock, Store, GraduationCap, ShoppingBag } from "lucide-react";

import api from "../services/api";
import StatsCard from "./StatsCard";
import ActionCard from "./ActionCard";
import ActivityFeed from "./ActivityFeed";

function DashboardHome({ setView }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

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

    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
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
            value="--"
            trend="Coming soon"
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
        <div className="lg:col-span-2">
          <ActivityFeed onViewAll={() => setView("allActivities")} />
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
