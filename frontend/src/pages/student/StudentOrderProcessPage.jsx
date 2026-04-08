import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Store,
  Wallet,
} from "lucide-react";
import api from "../../services/api";

const fadeUp = {
  hidden: { opacity: 0, y: 25 },
  visible: { opacity: 1, y: 0 },
};

const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
};

const scaleIn = {
  hidden: { scale: 0.9, opacity: 0 },
  visible: { scale: 1, opacity: 1 },
};
const formatLkr = (value) => `Rs. ${Number(value || 0).toFixed(2)}`;

const buildOrderRef = () => {
  const ts = Date.now().toString().slice(-6);
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `ORD-${ts}-${rand}`;
};

const computePricing = (items) => {
  const subtotal = items.reduce((sum, item) => sum + Number(item.price || 0), 0);
  const discountRate = items.length >= 3 ? 0.1 : 0;
  const discountAmount = subtotal * discountRate;
  return {
    subtotal,
    discountRate,
    discountAmount,
    total: subtotal - discountAmount,
  };
};

export default function StudentOrderProcessPage({ user }) {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [foods, setFoods] = useState([]);
  const [slots, setSlots] = useState([]);
  const [loadingFoods, setLoadingFoods] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);

  const [step, setStep] = useState(1);
  const [selectedSlotByVendor, setSelectedSlotByVendor] = useState({});
  const [checkoutError, setCheckoutError] = useState("");
  const [latestOrderRefs, setLatestOrderRefs] = useState([]);

  const studentHeaders = useMemo(() => {
    if (!user?._id) return null;
    return {
      "x-user-role": "student",
      "x-user-id": user._id,
    };
  }, [user]);

  const orderFoodIds = useMemo(() => {
    const raw = searchParams.get("foodIds") || "";
    return raw
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
  }, [searchParams]);

  const foodMap = useMemo(() => {
    const map = new Map();
    foods.forEach((food) => map.set(String(food._id), food));
    return map;
  }, [foods]);

  const selectedFoods = useMemo(
    () => orderFoodIds.map((id) => foodMap.get(String(id))).filter(Boolean),
    [orderFoodIds, foodMap]
  );

  const vendorGroups = useMemo(() => {
    const grouped = new Map();

    selectedFoods.forEach((food) => {
      const vendorId = String(food.vendorId);
      if (!grouped.has(vendorId)) {
        grouped.set(vendorId, []);
      }
      grouped.get(vendorId).push(food);
    });

    return Array.from(grouped.entries()).map(([vendorId, items]) => ({
      vendorId,
      items,
      pricing: computePricing(items),
    }));
  }, [selectedFoods]);

  const pricing = useMemo(() => computePricing(selectedFoods), [selectedFoods]);

  const availableSlotsByVendor = useMemo(() => {
    const map = new Map();

    vendorGroups.forEach((group) => {
      const groupSlots = slots.filter(
        (slot) =>
          String(slot.vendorId) === group.vendorId &&
          Number(slot.remainingCapacity || 0) > 0 &&
          !slot.holdActive &&
          slot.isActive
      );
      map.set(group.vendorId, groupSlots);
    });

    return map;
  }, [slots, vendorGroups]);

  const unavailableVendorIds = useMemo(() => {
    const ids = new Set();

    vendorGroups.forEach((group) => {
      const groupSlots = availableSlotsByVendor.get(group.vendorId) || [];
      if (!groupSlots.length) {
        ids.add(group.vendorId);
      }
    });

    return ids;
  }, [vendorGroups, availableSlotsByVendor]);

  const hasUnorderableItems = unavailableVendorIds.size > 0;

  useEffect(() => {
    const fetchFoods = async () => {
      setLoadingFoods(true);
      try {
        const res = await api.get("/api/foods", { params: { available: true } });
        setFoods(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        setCheckoutError(err?.response?.data?.message || "Failed to load foods");
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
        setCheckoutError(err?.response?.data?.message || "Failed to load slots");
      } finally {
        setLoadingSlots(false);
      }
    };

    fetchFoods();
    fetchSlots();
  }, []);

  useEffect(() => {
    const initialSlotId = searchParams.get("slotId");
    if (!initialSlotId || !vendorGroups.length) return;

    const firstVendorId = vendorGroups[0].vendorId;
    setSelectedSlotByVendor((prev) => ({
      ...prev,
      [firstVendorId]: initialSlotId,
    }));
  }, [searchParams, vendorGroups]);

  const allVendorsHaveSlot = useMemo(() => {
    if (!vendorGroups.length) return false;
    return vendorGroups.every((group) => Boolean(selectedSlotByVendor[group.vendorId]));
  }, [vendorGroups, selectedSlotByVendor]);

  const placeOrder = async () => {
    if (!studentHeaders || !user?._id) return;

    if (!selectedFoods.length) {
      setCheckoutError("No valid food items found in URL. Use /student/order?foodIds=<id1,id2>");
      return;
    }

    if (!allVendorsHaveSlot) {
      setCheckoutError("Please select a pickup slot for each vendor group");
      return;
    }

    setPlacingOrder(true);
    setCheckoutError("");

    try {
      const orderId = buildOrderRef();

      await api.post(
        "/api/orders",
        {
          studentId: user._id,
          orderId,
          vendorSelections: vendorGroups.map((group) => ({
            vendorId: group.vendorId,
            slotId: selectedSlotByVendor[group.vendorId],
            foodItemIds: group.items.map((f) => f._id),
          })),
        },
        { headers: studentHeaders }
      );

      setLatestOrderRefs([orderId]);
      setStep(4);
    } catch (err) {
      setCheckoutError(err?.response?.data?.message || "Failed to place order");
      setStep(4);
    } finally {
      setPlacingOrder(false);
    }
  };

  if (loadingFoods) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 gap-2">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading order items...
      </div>
    );
  }

  const stepMeta = [
  { title: "Review", desc: "Items and totals" },
  { title: "Slots", desc: "Pick time per vendor" },
  { title: "Confirm", desc: "Place your order" }, 
  { title: "Result", desc: "Order outcome" },
];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 py-8 font-sans">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <section className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="absolute -top-20 -right-16 h-56 w-56 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-sky-200/40 blur-3xl" />
          <div className="relative p-6 sm:p-8">
            <button
              onClick={() => navigate("/")}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Dashboard
            </button>

            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Complete Your Order</h1>
                <p className="text-sm text-slate-600 mt-2 max-w-2xl">
                 
                </p>
              </div>

              <div className="flex items-center gap-2 rounded-xl bg-slate-900 text-white px-3 py-2 text-xs font-medium">
                <ShieldCheck className="w-4 h-4" />
                Secure Demo Flow
              </div>
            </div>

            {!orderFoodIds.length && (
              <div className="mt-5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl px-4 py-3 text-sm">
                Missing required URL parameter: foodIds
              </div>
            )}
          </div>
        </section>

        <section className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-7 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6">
            {stepMeta.map((meta, idx) => {
              const s = idx + 1;
              const active = step === s;
              const done = step > s;

              return (
                <div
                  key={meta.title}
                  className={`rounded-xl border px-3 py-3 ${
                    active
                      ? "border-amber-500 bg-amber-50"
                      : done
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-slate-200 bg-slate-50"
                  }`}
                >
                  <p
                    className={`text-xs font-semibold ${
                      active ? "text-amber-700" : done ? "text-emerald-700" : "text-slate-500"
                    }`}
                  >
                    Step {s}
                  </p>
                  <p
                    className={`text-sm font-semibold mt-1 ${
                      active ? "text-amber-900" : done ? "text-emerald-900" : "text-slate-700"
                    }`}
                  >
                    {meta.title}
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">{meta.desc}</p>
                </div>
              );
            })}
          </div>

          {step === 1 && (
            <div className="grid grid-cols-1 xl:grid-cols-5 gap-5">
              <div className="xl:col-span-3 space-y-4">
                <h3 className="text-lg font-semibold text-slate-900">Review Items, Prices and Discounts</h3>

                {selectedFoods.length === 0 ? (
                  <div className="text-sm text-slate-500">No valid food items found for provided ids.</div>
                ) : (
                  <>
                    {hasUnorderableItems && (
                      <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                        Some selected items cannot be ordered now because their vendor has no available pickup slots.
                      </div>
                    )}

                    <div className="space-y-3">
                      {vendorGroups.map((group) => (
                        <div
                          key={group.vendorId}
                          className={`rounded-xl border p-4 ${
                            unavailableVendorIds.has(group.vendorId)
                              ? "border-rose-300 bg-rose-50/70"
                              : "border-slate-200 bg-slate-50/60"
                          }`}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <p className="text-xs text-slate-500 inline-flex items-center gap-1.5">
                              <Store className="w-3.5 h-3.5" /> Vendor ...{group.vendorId.slice(-5)}
                            </p>
                            {unavailableVendorIds.has(group.vendorId) && (
                              <span className="text-xs font-semibold text-rose-700">Cannot be ordered now</span>
                            )}
                          </div>

                          <div className="space-y-2">
                            {group.items.map((item) => (
                              <div key={item._id} className="flex items-center justify-between text-sm">
                                <span className="font-medium text-slate-800">{item.name}</span>
                                <span className="font-semibold text-slate-900">{formatLkr(item.price)}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <aside className="xl:col-span-2">
                <div className="sticky top-24 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm">
                  <h4 className="font-semibold text-slate-900 mb-3">Order Summary</h4>

                  <div className="space-y-2">
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Subtotal</span>
                      <span>{formatLkr(pricing.subtotal)}</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span className="text-slate-500">Discount</span>
                      <span className="text-emerald-700">
                        {pricing.discountRate ? `-${formatLkr(pricing.discountAmount)} (10%)` : "-"}
                      </span>
                    </div>
                    <div className="flex justify-between py-1 mt-1 pt-2 border-t border-slate-200 font-semibold">
                      <span>Total</span>
                      <span>{formatLkr(pricing.total)}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => setStep(2)}
                    disabled={!selectedFoods.length || hasUnorderableItems}
                    className="w-full mt-4 px-4 py-2.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Continue To Slot Selection
                  </button>
                </div>
              </aside>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Select Pickup Time Slot (Per Vendor)</h3>

              {loadingSlots ? (
                <div className="h-24 flex items-center justify-center text-slate-500 gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" /> Loading slots...
                </div>
              ) : vendorGroups.length === 0 ? (
                <div className="text-sm text-slate-500">No items to map to slots.</div>
              ) : (
                <div className="space-y-4">
                  {vendorGroups.map((group) => {
                    const groupSlots = availableSlotsByVendor.get(group.vendorId) || [];

                    return (
                      <div key={group.vendorId} className="rounded-xl border border-slate-200 p-4 bg-slate-50/50">
                        <p className="text-sm font-semibold text-slate-800 mb-2 inline-flex items-center gap-2">
                          <Store className="w-4 h-4" /> Vendor ...{group.vendorId.slice(-5)} ({group.items.length} items)
                        </p>

                        {groupSlots.length === 0 ? (
                          <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2">
                            No available slots for this vendor.
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {groupSlots.map((slot) => (
                              <label
                                key={slot._id}
                                className={`flex items-center justify-between rounded-xl border p-3 cursor-pointer ${
                                  selectedSlotByVendor[group.vendorId] === slot._id
                                    ? "border-amber-500 bg-amber-50"
                                    : "border-slate-200"
                                }`}
                              >
                                <div>
                                  <p className="font-medium text-slate-800 inline-flex items-center gap-2">
                                    <CalendarClock className="w-4 h-4 text-slate-500" />
                                    {new Date(slot.slotDate).toISOString().slice(0, 10)} | {slot.startTime} - {slot.endTime}
                                  </p>
                                  <p className="text-xs text-slate-500">Remaining: {slot.remainingCapacity}</p>
                                </div>
                                <input
                                  type="radio"
                                  name={`slot-${group.vendorId}`}
                                  value={slot._id}
                                  checked={selectedSlotByVendor[group.vendorId] === slot._id}
                                  onChange={(e) =>
                                    setSelectedSlotByVendor((prev) => ({
                                      ...prev,
                                      [group.vendorId]: e.target.value,
                                    }))
                                  }
                                />
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex justify-between">
                <button
                  onClick={() => setStep(1)}
                  className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                  Back
                </button>
                <button
                  onClick={() => setStep(3)}
                  disabled={!allVendorsHaveSlot}
                  className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Continue
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
  <div className="space-y-4">
    <h3 className="text-lg font-semibold text-slate-900">Confirm Your Order</h3>
    <p className="text-sm text-slate-600">
      You will pay at pickup. No online payment required.
    </p>

    {checkoutError && (
      <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-4 py-3 text-sm inline-flex items-center gap-2">
        <AlertCircle className="w-4 h-4" /> {checkoutError}
      </div>
    )}

    <div className="flex justify-between">
      <button
        onClick={() => setStep(2)}
        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200"
      >
        Back
      </button>

      <motion.button
        onClick={placeOrder}
        disabled={placingOrder}
        whileHover={{ scale: 1.03 }}
        whileTap={{ scale: 0.97 }}
        className="group relative inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold shadow-lg shadow-emerald-500/25 overflow-hidden transition-all disabled:opacity-50"
      >
        <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
        <span className="relative flex items-center gap-2 drop-shadow-sm">
          {placingOrder ? "Placing Order..." : "Place Order"}
        </span>
      </motion.button>
    </div>
  </div>
)}
          {step === 4 && (
            <div className="space-y-4">
              {checkoutError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
                  <p className="font-medium text-rose-700">Order Unsuccessful</p>
                  <p className="text-sm text-rose-700 mt-1">{checkoutError}</p>
                </div>
              ) : (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 inline-flex items-start gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700 mt-0.5" />
                  <div>
                    <p className="font-medium text-emerald-700">Orders Successful</p>
                    <div className="text-sm text-emerald-700 mt-1 space-y-1">
                      {latestOrderRefs.map((ref) => (
                        <p key={ref}>Reference: {ref}</p>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={() => navigate("/")}
                  className="px-4 py-2 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
                >
                  Back to Dashboard
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
