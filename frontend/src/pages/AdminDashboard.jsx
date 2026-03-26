import { useState } from "react";
import { Menu, Bell, Search } from "lucide-react";

import Sidebar from "./Sidebar";
import DashboardHome from "./DashboardHome";
import ManageVendors from "./ManageVendors";
import ManageActiveVendors from "./ManageActiveVendors";
import ManageStudents from "./ManageStudents";
import AllActivities from "./AllActivities"; // ✅ NEW IMPORT

function AdminDashboard({ onLogout, user }) {
  const [view, setView] = useState("home");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const adminInitials = (user?.name || "Admin")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("") || "AD";

  const renderContent = () => {
    switch (view) {
      case "vendors":
        return <ManageVendors onBack={() => setView("home")} />;

      case "activeVendors":
        return <ManageActiveVendors onBack={() => setView("home")} />;

      case "students":
        return <ManageStudents onBack={() => setView("home")} />;

      case "allActivities": // ✅ NEW CASE
        return <AllActivities onBack={() => setView("home")} />;

      default:
        return <DashboardHome setView={setView} />;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans text-slate-900">
      {/* Sidebar */}
      <Sidebar
        currentView={view}
        setView={setView}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        onLogout={onLogout}
        user={user}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:pl-64 min-h-screen transition-all duration-300">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 mr-2 text-slate-500 hover:bg-slate-100 rounded-lg"
            >
              <Menu className="w-6 h-6" />
            </button>

            <h1 className="text-xl font-semibold text-slate-800 hidden sm:block">
              {view === "home"
                ? "Dashboard"
                : view === "vendors"
                ? "Pending Vendors"
                : view === "activeVendors"
                ? "Active Vendors"
                : view === "students"
                ? "Students"
                : view === "allActivities"
                ? "All Activities" // ✅ NEW TITLE
                : "Dashboard"}
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all w-64"
              />
            </div>

            {/* Notifications */}
            <button className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>

            {/* Admin Avatar */}
            <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-bold text-xs ring-2 ring-offset-2 ring-amber-500/20 cursor-pointer">
              {adminInitials}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto">{renderContent()}</div>
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;
