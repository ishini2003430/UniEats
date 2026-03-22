import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  UserPlus,
  Store,
  AlertCircle,
} from "lucide-react";
import api from "../services/api";

/* -------- Activity UI Mapping -------- */
const ACTIVITY_UI = {
  VENDOR_APPROVED: {
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  VENDOR_REGISTRATION: {
    icon: Store,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  STUDENT_SIGNUP: {
    icon: UserPlus,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  STUDENT_DELETED: {
    icon: UserPlus,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  VENDOR_DELETED: {
    icon: AlertCircle,
    color: "text-red-500",
    bg: "bg-red-50",
  },
  ALERT: {
    icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
};

/* -------- Time Formatter -------- */
function timeAgo(date) {
  const seconds = Math.floor(
    (Date.now() - new Date(date)) / 1000
  );

  if (seconds < 60) return "Just now";
  if (seconds < 3600)
    return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400)
    return `${Math.floor(seconds / 3600)} hours ago`;

  return `${Math.floor(seconds / 86400)} days ago`;
}

function ActivityFeed({ onViewAll }) {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    api
      .get("/api/admin/activities") // already limited to 5
      .then((res) => setActivities(res.data))
      .catch((err) =>
        console.error("Failed to load activities", err)
      );
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden"
    >
      {/* Header */}
      <div className="p-6 border-b border-slate-100">
        <h3 className="text-lg font-bold text-slate-900">
          Recent Activity
        </h3>
      </div>

      {/* Activity List */}
      <div className="divide-y divide-slate-50">
        {activities.map((activity, index) => {
          const ui =
            ACTIVITY_UI[activity.type] ||
            ACTIVITY_UI.ALERT;

          const Icon = ui.icon;

          return (
            <motion.div
              key={activity._id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="p-4 flex items-center hover:bg-slate-50 transition-colors"
            >
              <div
                className={`p-2 rounded-full ${ui.bg} mr-4`}
              >
                <Icon
                  className={`w-4 h-4 ${ui.color}`}
                />
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {activity.message}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {timeAgo(activity.createdAt)}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
        <button
          onClick={onViewAll}
          className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
        >
          View All Activity
        </button>
      </div>
    </motion.div>
  );
}

export default ActivityFeed;
