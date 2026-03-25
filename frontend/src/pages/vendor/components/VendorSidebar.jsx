import {
  ChevronDown,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Settings,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { motion } from "framer-motion";

export default function VendorSidebar({
  activeTab,
  activeOrderSubTab,
  orderSubTabs,
  isSidebarOpen,
  setIsSidebarOpen,
  setTabInUrl,
  setOrderSubTabInUrl,
  onLogout,
  user,
}) {
  const displayName = user?.name || "Vendor User";
  const displayEmail = user?.email || "vendor@unieats.com";
  const initials = (displayName || "VU")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "VU";

  return (
    <motion.aside
      className={`fixed top-0 left-0 z-40 h-full w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 transition-transform duration-300 lg:translate-x-0 ${
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center space-x-3 text-white">
          <div className="p-1.5 bg-amber-500 rounded-lg">
            <UtensilsCrossed className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold tracking-tight">
            UniEats <span className="text-amber-500">Vendor</span>
          </span>
        </div>

        <button
          onClick={() => setIsSidebarOpen(false)}
          className="ml-auto lg:hidden text-slate-400 hover:text-white"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group relative ${
            activeTab === "dashboard"
              ? "bg-slate-800 text-white font-medium"
              : "hover:bg-slate-800/50 hover:text-white"
          }`}
          onClick={() => {
            setTabInUrl("dashboard");
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }}
        >
          {activeTab === "dashboard" && (
            <motion.div
              layoutId="vendorActiveNav"
              className="absolute left-0 w-1 h-6 bg-amber-500 rounded-r-full"
            />
          )}
          <LayoutDashboard
            className={`w-5 h-5 ${
              activeTab === "dashboard"
                ? "text-amber-500"
                : "text-slate-400 group-hover:text-amber-500/80"
            }`}
          />
          <span>Dashboard</span>
        </button>

        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group relative ${
            activeTab === "menu"
              ? "bg-slate-800 text-white font-medium"
              : "hover:bg-slate-800/50 hover:text-white"
          }`}
          onClick={() => {
            setTabInUrl("menu");
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }}
        >
          {activeTab === "menu" && (
            <motion.div
              layoutId="vendorActiveNav"
              className="absolute left-0 w-1 h-6 bg-amber-500 rounded-r-full"
            />
          )}
          <UtensilsCrossed
            className={`w-5 h-5 ${
              activeTab === "menu"
                ? "text-amber-500"
                : "text-slate-400 group-hover:text-amber-500/80"
            }`}
          />
          <span>Menu</span>
        </button>

        <button
          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all group relative ${
            activeTab === "orders"
              ? "bg-slate-800 text-white font-medium"
              : "hover:bg-slate-800/50 hover:text-white"
          }`}
          onClick={() => {
            if (activeTab === "orders") {
              setTabInUrl("dashboard");
            } else {
              setTabInUrl("orders");
            }
            if (window.innerWidth < 1024) setIsSidebarOpen(false);
          }}
        >
          {activeTab === "orders" && (
            <motion.div
              layoutId="vendorActiveNav"
              className="absolute left-0 w-1 h-6 bg-amber-500 rounded-r-full"
            />
          )}
          <ClipboardList
            className={`w-5 h-5 ${
              activeTab === "orders"
                ? "text-amber-500"
                : "text-slate-400 group-hover:text-amber-500/80"
            }`}
          />
          <span>Orders</span>
          <ChevronDown
            className={`w-4 h-4 ml-auto transition-transform ${
              activeTab === "orders" ? "rotate-180 text-amber-500" : "text-slate-400"
            }`}
          />
        </button>

        {activeTab === "orders" && (
          <div className="pl-8 pr-2 py-1 space-y-1">
            {orderSubTabs.map((subTab) => {
              const isSubActive = activeOrderSubTab === subTab.id;

              return (
                <button
                  key={subTab.id}
                  onClick={() => {
                    setOrderSubTabInUrl(subTab.id);
                    if (window.innerWidth < 1024) setIsSidebarOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    isSubActive
                      ? "bg-slate-800/80 text-white"
                      : "text-slate-400 hover:bg-slate-800/50 hover:text-white"
                  }`}
                >
                  {subTab.label}
                </button>
              );
            })}
          </div>
        )}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg hover:bg-slate-800/50 hover:text-white transition-colors text-slate-400 mb-2">
          <Settings className="w-5 h-5" />
          <span>Settings</span>
        </button>

        <div className="flex items-center p-3 rounded-xl bg-slate-800/50 mt-2">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs">
            {initials}
          </div>
          <div className="ml-3 flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">{displayName}</p>
            <p className="text-xs text-slate-500 truncate">{displayEmail}</p>
          </div>
            <button
              onClick={onLogout}
              className="text-slate-400 hover:text-white transition-colors"
              title="Logout"
              aria-label="Logout"
            >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.aside>
  );
}
