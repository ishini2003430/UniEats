import { motion } from "framer-motion";
import { ArrowUpRight, ArrowDownRight } from "lucide-react";

function StatsCard({
  title,
  value,
  trend,
  trendDirection,
  icon: Icon,
  color,
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow"
    >
      <div className="flex justify-between items-start">
        <div>
          <p className="text-sm font-medium text-slate-500 mb-1">
            {title}
          </p>
          <h3 className="text-2xl font-bold text-slate-900">
            {value}
          </h3>
        </div>

        <div className={`p-2 rounded-lg ${color} bg-opacity-10`}>
          <Icon
            className={`w-5 h-5 ${color.replace(
              "bg-",
              "text-"
            )}`}
          />
        </div>
      </div>

      <div className="mt-4 flex items-center text-sm">
        <span
          className={`flex items-center font-medium ${
            trendDirection === "up"
              ? "text-emerald-600"
              : "text-rose-600"
          }`}
        >
          {trendDirection === "up" ? (
            <ArrowUpRight className="w-4 h-4 mr-1" />
          ) : (
            <ArrowDownRight className="w-4 h-4 mr-1" />
          )}
          {trend}
        </span>

        <span className="text-slate-400 ml-2">
          vs last month
        </span>
      </div>
    </motion.div>
  );
}

export default StatsCard;
