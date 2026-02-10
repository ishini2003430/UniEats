import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

function ActionCard({
  title,
  description,
  icon: Icon,
  buttonText,
  onClick,
  accentColor,
  delay = 0,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      whileHover={{
        y: -2,
        boxShadow:
          "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
      }}
      className={`bg-white p-6 rounded-xl shadow-sm border border-slate-100 border-l-4 ${accentColor} cursor-pointer group`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-full bg-slate-50 group-hover:bg-slate-100 transition-colors">
          <Icon
            className={`w-6 h-6 ${accentColor.replace(
              "border-",
              "text-"
            )}`}
          />
        </div>
      </div>

      <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">
        {title}
      </h3>

      <p className="text-slate-500 text-sm mb-6 line-clamp-2">
        {description}
      </p>

      <div className="flex items-center text-sm font-medium text-slate-900 group-hover:text-amber-600 transition-colors">
        {buttonText}
        <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
      </div>
    </motion.div>
  );
}

export default ActionCard;
