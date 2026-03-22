import {
  LayoutDashboard,
  Clock,
  Store,
  GraduationCap,
  Settings,
  LogOut,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

function Sidebar({ currentView, setView, isOpen, setIsOpen }) {
  const navItems = [
    { id: "home", label: "Dashboard", icon: LayoutDashboard },
    { id: "vendors", label: "Pending Vendors", icon: Clock },
    { id: "activeVendors", label: "Active Vendors", icon: Store },
    { id: "students", label: "Students", icon: GraduationCap },
  ];

  const handleNavClick = (viewId) => {
    setView(viewId);
    if (window.innerWidth < 1024) {
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        className={`fixed top-0 left-0 z-50 h-full w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Logo */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800">
          <div className="flex items-center space-x-3 text-white">
            <div className="p-1.5 bg-amber-500 rounded-lg">
              <UtensilsCrossed className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight">
              UniEats <span className="text-amber-500">Admin</span>
            </span>
          </div>

          <button
            onClick={() => setIsOpen(false)}
            className="ml-auto lg:hidden text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-6 px-3 space-y-1">
          {navItems.map((item) => {
            const isActive = currentView === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group relative ${
                  isActive
                    ? "bg-slate-800 text-white font-medium"
                    : "hover:bg-slate-800/50 hover:text-white"
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeNav"
                    className="absolute left-0 w-1 h-6 bg-amber-500 rounded-r-full"
                  />
                )}

                <Icon
                  className={`w-5 h-5 ${
                    isActive
                      ? "text-amber-500"
                      : "text-slate-400 group-hover:text-amber-500/80"
                  }`}
                />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Bottom Section */}
        <div className="p-4 border-t border-slate-800">
          <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 hover:text-white transition-colors text-slate-400 mb-2">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>

          <div className="flex items-center p-3 rounded-xl bg-slate-800/50 mt-2">
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
              AD
            </div>
            <div className="ml-3 flex-1 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                Admin User
              </p>
              <p className="text-xs text-slate-500 truncate">
                admin@unieats.com
              </p>
            </div>
            <button className="text-slate-400 hover:text-white transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.aside>
    </>
  );
}

export default Sidebar;
