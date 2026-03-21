import { useMemo, useState } from "react";
import {
  Bell,
  Menu,
  Search,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import VendorSidebar from "./components/VendorSidebar";
import { orderSubTabs } from "./common/configs/tabs";
import DashboardOverviewTab from "./common/subtabs/DashboardOverviewTab";
import OrdersTabContent from "./common/subtabs/OrdersTabContent";

function VendorDashboard({ user, onLogout }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentTabParam = searchParams.get("tab");
  const activeTab = currentTabParam === "orders" ? "orders" : "dashboard";

  const currentOrderSubTabParam = searchParams.get("ordersTab");
  const isValidOrderSubTab = orderSubTabs.some((tab) => tab.id === currentOrderSubTabParam);
  const activeOrderSubTab = isValidOrderSubTab
    ? currentOrderSubTabParam
    : orderSubTabs[0].id;

  const setTabInUrl = (tabId) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", tabId);

    if (tabId === "orders") {
      if (!next.get("ordersTab")) {
        next.set("ordersTab", orderSubTabs[0].id);
      }
    } else {
      next.delete("ordersTab");
    }

    setSearchParams(next);
  };

  const setOrderSubTabInUrl = (subTabId) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "orders");
    next.set("ordersTab", subTabId);
    setSearchParams(next);
  };

  const pageTitle = useMemo(() => {
    if (activeTab === "orders") return "Orders";
    return "Dashboard";
  }, [activeTab]);

  const userInitials = useMemo(() => {
    const name = user?.name || "Vendor";
    return name
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("") || "VD";
  }, [user]);

  const renderLayoutPanel = () => {
    if (activeTab === "dashboard") {
      return <DashboardOverviewTab />;
    }

    return <OrdersTabContent activeOrderSubTab={activeOrderSubTab} user={user} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <VendorSidebar
        activeTab={activeTab}
        activeOrderSubTab={activeOrderSubTab}
        orderSubTabs={orderSubTabs}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        setTabInUrl={setTabInUrl}
        setOrderSubTabInUrl={setOrderSubTabInUrl}
        onLogout={onLogout}
        user={user}
      />

      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen transition-all duration-300">
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            <h1 className="text-xl font-semibold text-slate-800 hidden sm:block">{pageTitle}</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all w-64"
              />
            </div>

            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>

            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-offset-2 ring-amber-500/20 cursor-pointer">
              {userInitials}
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto space-y-6">
            {renderLayoutPanel()}
          </div>
        </main>
      </div>
    </div>
  );
}

export default VendorDashboard;
