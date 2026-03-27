import { useEffect, useMemo, useRef, useState } from "react";
import {
  Bell,
  Menu,
  Package,
  Search,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useSearchParams, useNavigate } from "react-router-dom";
import VendorSidebar from "./components/VendorSidebar";
import { orderSubTabs } from "./common/configs/tabs";
import DashboardOverviewTab from "./common/subtabs/DashboardOverviewTab";
import OrdersTabContent from "./common/subtabs/OrdersTabContent";
import FoodManagement from "./FoodManagement";
import api from "../../services/api";
import { connectRealtime, disconnectRealtime } from "../../services/realtime";

function VendorDashboard({ user, onLogout, forceTab }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const seenNotificationIdsRef = useRef(new Set());

  const currentTabParam = searchParams.get("tab");
  const activeTab =
  forceTab ||
  (["dashboard", "orders", "menu"].includes(currentTabParam)
    ? currentTabParam
    : "dashboard");

  const currentOrderSubTabParam = searchParams.get("ordersTab");
  const isValidOrderSubTab = orderSubTabs.some((tab) => tab.id === currentOrderSubTabParam);
  const activeOrderSubTab = isValidOrderSubTab
    ? currentOrderSubTabParam
    : orderSubTabs[0].id;

  const setTabInUrl = (tabId) => {
    navigate(`/?tab=${tabId}`);
  };

  const setOrderSubTabInUrl = (subTabId) => {
    navigate(`/?tab=orders&ordersTab=${subTabId}`);
  };

  const pageTitle = useMemo(() => {
    if (activeTab === "orders") return "Orders";
    if (activeTab === "menu") return "Food Management";
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

  const vendorHeaders = useMemo(
    () => ({
      "x-user-role": "vendor",
      "x-user-id": user?._id,
    }),
    [user]
  );

  const fetchNotifications = async ({ silent = false } = {}) => {
    if (!user?._id) return;

    if (!silent) {
      setLoadingNotifs(true);
    }

    try {
      const res = await api.get("/api/notifications/vendor", {
        params: { limit: 15 },
        headers: vendorHeaders,
      });

      const serverNotifications = Array.isArray(res.data?.notifications)
        ? res.data.notifications
        : [];

      setNotifications(serverNotifications);
      setUnreadCount(Number(res.data?.unreadCount || 0));

      if (typeof window !== "undefined" && "Notification" in window) {
        serverNotifications.forEach((notif) => {
          const notifId = String(notif._id);
          if (seenNotificationIdsRef.current.has(notifId)) return;

          seenNotificationIdsRef.current.add(notifId);

          if (!notif.isRead && Notification.permission === "granted") {
            new Notification(notif.title || "New order", {
              body: notif.message || "You have a new order.",
            });
          }
        });
      }
    } catch (error) {
      console.error("fetchNotifications error:", error);
    } finally {
      if (!silent) {
        setLoadingNotifs(false);
      }
    }
  };

  const markAllNotificationsRead = async () => {
    if (!user?._id || unreadCount === 0) return;

    try {
      await api.patch(
        "/api/notifications/vendor/read-all",
        {},
        {
          headers: vendorHeaders,
        }
      );

      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error("markAllNotificationsRead error:", error);
    }
  };

  const markSingleNotificationRead = async (notificationId) => {
    if (!notificationId) return;

    try {
      await api.patch(
        `/api/notifications/vendor/${notificationId}/read`,
        {},
        {
          headers: vendorHeaders,
        }
      );

      setNotifications((prev) =>
        prev.map((item) =>
          String(item._id) === String(notificationId) ? { ...item, isRead: true } : item
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error("markSingleNotificationRead error:", error);
    }
  };

  const openOrderFromNotification = async (notification) => {
    if (!notification) return;

    setIsNotifOpen(false);

    if (notification.orderId) {
      navigate(`/?tab=orders&ordersTab=orders-management&notifyOrderId=${notification.orderId}`);
    } else {
      navigate(`/?tab=orders&ordersTab=orders-management`);
    }

    if (!notification.isRead) {
      await markSingleNotificationRead(notification._id);
    }
  };

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  useEffect(() => {
    fetchNotifications();

    const interval = setInterval(() => {
      fetchNotifications({ silent: true });
    }, 15000);

    return () => clearInterval(interval);
  }, [user?._id]);

  useEffect(() => {
    if (!user?._id) return;

    const socket = connectRealtime({ role: "vendor", userId: user._id });
    if (!socket) return;

    const onNewNotification = (notification) => {
      if (!notification?._id) return;

      const notifId = String(notification._id);
      seenNotificationIdsRef.current.add(notifId);

      setNotifications((prev) => {
        const exists = prev.some((item) => String(item._id) === notifId);
        if (exists) return prev;
        return [notification, ...prev].slice(0, 20);
      });

      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title || "New order", {
          body: notification.message || "You have a new order.",
        });
      }
    };

    socket.on("notification:new", onNewNotification);

    return () => {
      socket.off("notification:new", onNewNotification);
      disconnectRealtime();
    };
  }, [user?._id]);

  useEffect(() => {
    if (isNotifOpen) {
      markAllNotificationsRead();
    }
  }, [isNotifOpen]);

  const renderLayoutPanel = () => {
    if (activeTab === "dashboard") {
      return <DashboardOverviewTab />;
    }
    if (activeTab === "menu") {
      return <FoodManagement user={user} />;
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

            <div className="relative">
              <button
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="relative p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
                aria-label="Open notifications"
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] leading-4 text-center border border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                    {loadingNotifs ? <span className="text-xs text-slate-500">Loading...</span> : null}
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet</div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item._id}
                          onClick={() => openOrderFromNotification(item)}
                          className={`px-4 py-3 border-b last:border-b-0 border-slate-100 ${
                            item.isRead ? "bg-white" : "bg-amber-50/60"
                          } cursor-pointer hover:bg-slate-50`}
                        >
                          <div className="flex items-start gap-2">
                            <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-600">
                              <Package className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-slate-900 truncate">{item.title}</p>
                              <p className="text-xs text-slate-600 mt-0.5">{item.message}</p>
                              <p className="text-[11px] text-slate-400 mt-1">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

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
