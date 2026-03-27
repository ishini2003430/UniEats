import { motion } from "framer-motion";

const ORDER_STEPS = ["Pending", "Preparing", "Ready", "Completed"];

const getStepIndex = (status) => {
  const index = ORDER_STEPS.indexOf(status);
  return index === -1 ? 0 : index;
};

export default function OrderTimeline({ status }) {
  const currentIndex = getStepIndex(status);

  return (
    <div className="mt-8 px-2">
      <div className="relative flex items-center justify-between">

        {/* BASE LINE */}
        <div className="absolute top-5 left-0 right-0 h-[3px] bg-slate-200 rounded-full" />

        {/* PROGRESS LINE */}
        <motion.div
  key={currentIndex} // 🔥 IMPORTANT
  initial={{ width: 0 }}
  animate={{
    width: `${(currentIndex / (ORDER_STEPS.length - 1)) * 100}%`,
  }}
  transition={{ duration: 0.8, ease: "easeInOut" }}
  className="absolute top-5 left-0 h-[3px] bg-gradient-to-r from-emerald-400 to-green-600 rounded-full"
/>
        {/* STEPS */}
        {ORDER_STEPS.map((step, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <div key={step} className="flex flex-col items-center w-full z-10">

              {/* CIRCLE */}
              <motion.div
  initial={{ scale: 0.6, opacity: 0 }}
  animate={{
    scale: isCurrent ? 1.3 : 1,
    opacity: 1,
  }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 15,
    delay: index * 0.1, // 🔥 stagger effect
  }}
  className={`relative w-10 h-10 flex items-center justify-center rounded-full text-sm font-bold transition-all duration-300
    ${
      isCompleted
        ? "bg-emerald-500 text-white"
        : isCurrent
        ? "bg-blue-500 text-white shadow-lg"
        : "bg-slate-200 text-slate-500"
    }
  `}
>
  {/* 🔥 Pulse Ring (ONLY for current step) */}
  {isCurrent && (
    <span className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-30"></span>
  )}

  {/* STEP NUMBER */}
  <span className="relative z-10">{index + 1}</span>
</motion.div>

              {/* LABEL */}
              <p
                className={`mt-2 text-xs font-medium text-center
                  ${
                    isCompleted
                      ? "text-emerald-600"
                      : isCurrent
                      ? "text-blue-600"
                      : "text-slate-400"
                  }
                `}
              >
                {step}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}