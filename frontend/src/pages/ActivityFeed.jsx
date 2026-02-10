import { motion } from "framer-motion";
import {
  CheckCircle2,
  UserPlus,
  Store,
  AlertCircle,
} from "lucide-react";

const activities = [
  {
    id: 1,
    type: "vendor_registration",
    message: "New vendor registration: Campus Bites",
    time: "2 hours ago",
    icon: Store,
    color: "text-blue-500",
    bg: "bg-blue-50",
  },
  {
    id: 2,
    type: "student_signup",
    message: "Student account created: Alex Johnson",
    time: "4 hours ago",
    icon: UserPlus,
    color: "text-green-500",
    bg: "bg-green-50",
  },
  {
    id: 3,
    type: "vendor_approved",
    message: "Vendor approved: Taco Hub",
    time: "Yesterday",
    icon: CheckCircle2,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
  },
  {
    id: 4,
    type: "alert",
    message: "High order volume detected in North Campus",
    time: "Yesterday",
    icon: AlertCircle,
    color: "text-amber-500",
    bg: "bg-amber-50",
  },
  {
    id: 5,
    type: "student_signup",
    message: "Student account created: Sarah Williams",
    time: "2 days ago",
    icon: UserPlus,
    color: "text-green-500",
    bg: "bg-green-50",
  },
];

function ActivityFeed() {
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
          const Icon = activity.icon;

          return (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + index * 0.1 }}
              className="p-4 flex items-center hover:bg-slate-50 transition-colors"
            >
              <div
                className={`p-2 rounded-full ${activity.bg} mr-4`}
              >
                <Icon
                  className={`w-4 h-4 ${activity.color}`}
                />
              </div>

              <div className="flex-1">
                <p className="text-sm font-medium text-slate-800">
                  {activity.message}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  {activity.time}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-center">
        <button className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors">
          View All Activity
        </button>
      </div>
    </motion.div>
  );
}

export default ActivityFeed;
