import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Bell, Loader2, LogOut, Package, ShoppingCart } from "lucide-react";
import api from "../services/api";
import { connectRealtime, disconnectRealtime } from "../services/realtime";

const formatLkr = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

export default function StudentDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  const [foods, setFoods] = useState([]);
  const [slots, setSlots] = useState([]);

  const [loadingFoods, setLoadingFoods] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const [cartItems, setCartItems] = useState([]);

  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const studentHeaders = useMemo(() => {
    if (!user?._id) return null;
    return {
      "x-user-role": "student",
      "x-user-id": user._id,
    };
  }, [user]);

  const initials = useMemo(() => {
    const name = user?.name || "Student";
    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "ST"
    );
  }, [user]);

  const foodMap = useMemo(() => {
    const map = new Map();
    foods.forEach((food) => map.set(String(food._id), food));
    return map;
  }, [foods]);

  const cartFoodItems = useMemo(
    () => cartItems.map((id) => foodMap.get(String(id))).filter(Boolean),
    [cartItems, foodMap]
  );

  const availableVendorIds = useMemo(() => {
    const ids = new Set();

    slots.forEach((slot) => {
      const isAvailable =
        slot &&
        slot.isActive &&
        !slot.holdActive &&
        Number(slot.remainingCapacity || 0) > 0;

      if (isAvailable) {
        ids.add(String(slot.vendorId));
      }
    });

    return ids;
  }, [slots]);

  const canSelectFood = (food) => availableVendorIds.has(String(food.vendorId));

  const canCheckoutCart = useMemo(
    () => cartFoodItems.length > 0 && cartFoodItems.every((food) => canSelectFood(food)),
    [cartFoodItems, availableVendorIds]
  );

  const clearBanner = () => {
    setPageError("");
    setPageSuccess("");
  };

  const fetchFoods = async () => {
    clearBanner();
    setLoadingFoods(true);
    try {
      const res = await api.get("/api/foods", { params: { available: true } });
      setFoods(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load foods");
    } finally {
      setLoadingFoods(false);
    }
  };

  const fetchSlots = async () => {
    setLoadingSlots(true);
    try {
      const res = await api.get("/api/slots", { params: { public: true } });
      setSlots(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load pickup slots");
    } finally {
      setLoadingSlots(false);
    }
  };

  useEffect(() => {
    fetchFoods();
    fetchSlots();
  }, []);

  const fetchNotifications = async () => {
    if (!studentHeaders) return;

    try {
      const res = await api.get("/api/notifications/student", {
        headers: studentHeaders,
        params: { limit: 15 },
      });

      const rows = Array.isArray(res.data?.notifications) ? res.data.notifications : [];
      setNotifications(rows);
      setUnreadCount(Number(res.data?.unreadCount || 0));
    } catch (err) {
      console.error("fetch student notifications error:", err);
    }
  };

  const markAllStudentNotificationsRead = async () => {
    if (!studentHeaders || unreadCount === 0) return;

    try {
      await api.patch("/api/notifications/student/read-all", {}, { headers: studentHeaders });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("mark all student notifications read error:", err);
    }
  };

  useEffect(() => {
    if (!studentHeaders) return;
    fetchNotifications();

    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentHeaders]);

  useEffect(() => {
    if (!studentHeaders) return;

    const socket = connectRealtime({ role: "student", userId: user?._id });
    if (!socket) return;

    const onNewNotification = (notification) => {
      if (!notification?._id) return;

      setNotifications((prev) => {
        const exists = prev.some((item) => String(item._id) === String(notification._id));
        if (exists) return prev;
        return [notification, ...prev].slice(0, 20);
      });

      if (!notification.isRead) {
        setUnreadCount((prev) => prev + 1);
      }

      if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "granted") {
        new Notification(notification.title || "Order notification", {
          body: notification.message || "You have an order update.",
        });
      }
    };

    socket.on("notification:new", onNewNotification);

    return () => {
      socket.off("notification:new", onNewNotification);
      disconnectRealtime();
    };
  }, [studentHeaders, user?._id]);

  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window && Notification.permission === "default") {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  useEffect(() => {
    if (isNotifOpen) {
      markAllStudentNotificationsRead();
    }
  }, [isNotifOpen]);

  const addToCart = (food) => {
    clearBanner();

    if (!canSelectFood(food)) {
      setPageError("This vendor currently has no available pickup slots.");
      return;
    }

    if (!cartItems.length) {
      setCartItems([String(food._id)]);
      return;
    }

    if (!cartItems.includes(String(food._id))) {
      setCartItems((prev) => [...prev, String(food._id)]);
      return;
    }

    setPageSuccess("Item already in cart");
  };

  const removeFromCart = (foodId) => {
    setCartItems((prev) => prev.filter((id) => id !== String(foodId)));
  };

  const startOrderFlow = (foodIds) => {
    const cleanIds = [...new Set(foodIds.map((id) => String(id).trim()).filter(Boolean))];
    if (!cleanIds.length) return;

    const selectedFoods = cleanIds.map((id) => foodMap.get(String(id))).filter(Boolean);
    const hasUnavailableVendor = selectedFoods.some((food) => !canSelectFood(food));
    if (hasUnavailableVendor) {
      setPageError("One or more selected vendors currently have no available pickup slots.");
      return;
    }

    navigate(`/student/order?foodIds=${encodeURIComponent(cleanIds.join(","))}`);
  };


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white text-slate-900">
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center">
              {initials}
            </div>
            <div>
              <p className="text-xs text-slate-500">Signed in as</p>
              <p className="font-semibold text-slate-900">{user?.name || "Student"}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <button
                onClick={() => setIsNotifOpen((prev) => !prev)}
                className="relative p-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                aria-label="Open notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-rose-500 text-white text-[10px] leading-4 text-center border border-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {isNotifOpen && (
                <div className="absolute right-0 mt-2 w-80 rounded-2xl border border-slate-200 bg-white shadow-xl z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-slate-100">
                    <p className="text-sm font-semibold text-slate-900">Notifications</p>
                  </div>

                  <div className="max-h-80 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <div className="px-4 py-6 text-center text-sm text-slate-500">No notifications yet</div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item._id}
                          className={`px-4 py-3 border-b last:border-b-0 border-slate-100 ${
                            item.isRead ? "bg-white" : "bg-amber-50/60"
                          }`}
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

            <button
              onClick={() => startOrderFlow(cartItems)}
              disabled={!cartItems.length}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              Cart ({cartItems.length})
            </button>
            <button
              onClick={() => navigate("/my-orders")}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600"
            >
              My Orders
            </button>
            <button
              onClick={onLogout}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm hover:bg-slate-50"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Student Ordering</h1>
          <p className="text-slate-600 mt-2">
            Single item and cart orders both redirect to one shared order-process page URL.
          </p>
          <p className="text-xs text-slate-500 mt-2">
            Vendors without available pickup slots are shaded and cannot be selected.
          </p>

          {pageError && (
            <div className="mt-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              <span className="text-sm">{pageError}</span>
            </div>
          )}

          {pageSuccess && (
            <div className="mt-4 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-3 text-sm">
              {pageSuccess}
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Available Foods</h2>
            <button
              onClick={() => {
                fetchFoods();
                fetchSlots();
              }}
              className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
            >
              Refresh Foods & Slots
            </button>
          </div>

          {loadingFoods ? (
            <div className="h-24 flex items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading foods...
            </div>
          ) : loadingSlots ? (
            <div className="h-24 flex items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading vendor slot availability...
            </div>
          ) : foods.length === 0 ? (
            <div className="text-sm text-slate-500">No foods available right now.</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {foods.map((food) => {
                const isVendorAvailable = canSelectFood(food);

                return (
                <article
                  key={food._id}
                  className={`rounded-xl border p-4 ${
                    isVendorAvailable
                      ? "border-slate-200 bg-slate-50/40"
                      : "border-slate-300 bg-slate-200/60 opacity-70"
                  }`}
                >
                  <h3 className="font-semibold text-slate-900">{food.name}</h3>
                  <p className="text-sm text-slate-500 mt-1">Vendor: ...{String(food.vendorId).slice(-5)}</p>
                  {!isVendorAvailable && (
                    <p className="text-xs text-rose-700 mt-1 font-medium">Cannot order now: no slots available</p>
                  )}
                  <p className="text-lg font-bold text-slate-900 mt-3">{formatLkr(food.price)}</p>

                  <div className="mt-4 flex items-center gap-2">
                    <button
                      onClick={() => startOrderFlow([String(food._id)])}
                      disabled={!isVendorAvailable}
                      className="flex-1 px-3 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Order Now
                    </button>
                    <button
                      onClick={() => addToCart(food)}
                      disabled={!isVendorAvailable}
                      className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      Add to Cart
                    </button>
                  </div>
                </article>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {cartFoodItems.length > 0 && (
        <aside className="fixed left-4 bottom-6 z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-3 w-72 hidden lg:block">
          <p className="text-sm font-semibold text-slate-800 mb-2">Cart Preview</p>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cartFoodItems.map((item) => (
              <div key={item._id} className="flex items-center justify-between text-sm">
                <span className="truncate pr-2">{item.name}</span>
                <button
                  onClick={() => removeFromCart(item._id)}
                  className="text-rose-600 hover:text-rose-700"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        </aside>
      )}

      <button
        onClick={() => startOrderFlow(cartItems)}
        disabled={!canCheckoutCart}
        className="fixed bottom-6 right-6 z-30 rounded-full px-5 py-3 bg-amber-500 text-white shadow-lg hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-2"
      >
        <ShoppingCart className="w-4 h-4" />
        Checkout ({cartItems.length})
      </button>
    </div>
  );
}
