import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, LogOut, ShoppingCart, X } from "lucide-react";
import api from "../services/api";

const formatLkr = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const statusClass = (status) => {
  if (status === "Cancelled") return "bg-rose-100 text-rose-700";
  if (status === "Completed") return "bg-emerald-100 text-emerald-700";
  if (status === "Ready") return "bg-blue-100 text-blue-700";
  if (status === "Preparing") return "bg-amber-100 text-amber-700";
  return "bg-slate-200 text-slate-700";
};

export default function StudentDashboard({ user, onLogout }) {
  const navigate = useNavigate();

  const [foods, setFoods] = useState([]);
  const [slots, setSlots] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loadingFoods, setLoadingFoods] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);

  const [pageError, setPageError] = useState("");
  const [pageSuccess, setPageSuccess] = useState("");

  const [cartItems, setCartItems] = useState([]);

  const [cancelModal, setCancelModal] = useState({
    open: false,
    order: null,
    eligibility: null,
    reason: "",
    error: "",
  });

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

  const fetchOrders = async () => {
    if (!studentHeaders) return;

    setLoadingOrders(true);
    try {
      const res = await api.get("/api/orders", { headers: studentHeaders });
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setPageError(err?.response?.data?.message || "Failed to load your orders");
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    fetchFoods();
    fetchSlots();
  }, []);

  useEffect(() => {
    if (studentHeaders) {
      fetchOrders();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentHeaders]);

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

  const openCancelFlow = async (order) => {
    if (!studentHeaders) return;

    setCancelModal({
      open: true,
      order,
      eligibility: null,
      reason: "",
      error: "",
    });

    try {
      const res = await api.get(`/api/orders/${order._id}/cancel-eligibility`, {
        headers: studentHeaders,
      });

      setCancelModal((prev) => ({ ...prev, eligibility: res.data }));
    } catch (err) {
      setCancelModal((prev) => ({
        ...prev,
        error: err?.response?.data?.message || "Failed to check cancellation eligibility",
      }));
    }
  };

  const submitCancel = async () => {
    if (!studentHeaders || !cancelModal.order?._id) return;

    setCancelLoading(true);
    try {
      await api.patch(
        `/api/orders/${cancelModal.order._id}/cancel`,
        { reason: cancelModal.reason || "Cancelled by student" },
        { headers: studentHeaders }
      );

      setPageSuccess("Order cancelled successfully");
      setCancelModal({ open: false, order: null, eligibility: null, reason: "", error: "" });
      await fetchOrders();
    } catch (err) {
      setCancelModal((prev) => ({
        ...prev,
        error: err?.response?.data?.message || "Failed to cancel order",
      }));
    } finally {
      setCancelLoading(false);
    }
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
            <button
              onClick={() => startOrderFlow(cartItems)}
              disabled={!cartItems.length}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <ShoppingCart className="w-4 h-4" />
              Cart ({cartItems.length})
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

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Orders & Cancellation</h2>
            <button
              onClick={fetchOrders}
              className="px-3 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800"
            >
              Refresh Orders
            </button>
          </div>

          {loadingOrders ? (
            <div className="h-24 flex items-center justify-center text-slate-500 gap-2">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading orders...
            </div>
          ) : orders.length === 0 ? (
            <div className="text-sm text-slate-500">No orders found yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500 border-b border-slate-200">
                    <th className="py-2">Order ID</th>
                    <th className="py-2">Status</th>
                    <th className="py-2">Created</th>
                    <th className="py-2">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-b border-slate-100">
                      <td className="py-3 font-medium text-slate-800">{order.orderId}</td>
                      <td className="py-3">
                        <span className={`px-2 py-1 rounded text-xs ${statusClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-slate-600">{new Date(order.createdAt).toLocaleString()}</td>
                      <td className="py-3">
                        <button
                          onClick={() => openCancelFlow(order)}
                          disabled={order.status !== "Pending"}
                          className="px-3 py-1.5 rounded-lg bg-rose-100 text-rose-700 hover:bg-rose-200 disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          Cancel
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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

      {cancelModal.open && (
        <div className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-sm p-4 flex items-center justify-center">
          <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Cancel Order</h3>
              <button
                onClick={() => setCancelModal({ open: false, order: null, eligibility: null, reason: "", error: "" })}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="text-sm text-slate-600">
                Order: <span className="font-medium text-slate-800">{cancelModal.order?.orderId}</span>
              </div>

              {!cancelModal.eligibility ? (
                <div className="text-sm text-slate-500">Checking cancellation eligibility...</div>
              ) : (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">
                  <p>
                    Eligible: <span className="font-medium">{cancelModal.eligibility.canCancel ? "Yes" : "No"}</span>
                  </p>
                  <p className="text-slate-500 mt-1">{cancelModal.eligibility.message}</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Reason</label>
                <textarea
                  rows={3}
                  value={cancelModal.reason}
                  onChange={(e) => setCancelModal((prev) => ({ ...prev, reason: e.target.value }))}
                  placeholder="Optional cancellation reason"
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50"
                />
              </div>

              {cancelModal.error && (
                <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm">
                  {cancelModal.error}
                </div>
              )}

              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setCancelModal({ open: false, order: null, eligibility: null, reason: "", error: "" })}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Close
                </button>
                <button
                  onClick={submitCancel}
                  disabled={!cancelModal.eligibility?.canCancel || cancelLoading}
                  className="px-4 py-2 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {cancelLoading ? "Cancelling..." : "Confirm Cancel"}
                </button>
              </div>
            </div>
          </div>
        </div>
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
