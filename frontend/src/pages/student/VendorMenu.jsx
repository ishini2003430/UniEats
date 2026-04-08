import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Store, ShoppingCart, Plus, Check, Heart, Flame, Clock } from 'lucide-react';
import heroImage from '../../assets/image1.jpg';
import api from '../../services/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

const PromoCountdown = () => {
  const [timeLeft, setTimeLeft] = useState({ h: 6, m: 45, s: 30 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.s > 0) return { ...prev, s: prev.s - 1 };
        if (prev.m > 0) return { h: prev.h, m: prev.m - 1, s: 59 };
        if (prev.h > 0) return { h: prev.h - 1, m: 59, s: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="inline-flex items-center gap-2 text-amber-100 font-mono text-sm bg-white/10 px-3 py-1.5 rounded-xl border border-white/15 shadow-inner backdrop-blur-md">
      <Clock className="w-3.5 h-3.5 text-amber-200" />
      <span className="font-bold">{String(timeLeft.h).padStart(2, '0')}</span>
      <span className="text-amber-200/80">:</span>
      <span className="font-bold">{String(timeLeft.m).padStart(2, '0')}</span>
      <span className="text-amber-200/80">:</span>
      <span className="font-bold">{String(timeLeft.s).padStart(2, '0')}</span>
    </div>
  );
};

export default function VendorMenu({ user, onLogout }) {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');

  const [vendorDetails, setVendorDetails] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedFoodIds, setSelectedFoodIds] = useState([]);

  const categories = ['All', ...Array.from(new Set(
    menuItems
      .map((item) => item.category)
      .filter((category) => typeof category === 'string' && category.trim())
  ))];

  useEffect(() => {
    if (user?._id) {
      api.get("/api/favorites", { headers: { "x-user-id": user._id } })
         .then(res => setFavorites(res.data.map(f => f._id || f)))
         .catch(err => console.error("Failed to load favorites", err));
    }
  }, [user]);

  const toggleFavorite = async (foodId) => {
    if (!user?._id) return;
    try {
      const res = await api.post("/api/favorites/toggle", { foodId }, { headers: { "x-user-id": user._id } });
      setFavorites(res.data.favorites);
    } catch (err) {
      console.error("Failed to toggle favorite", err);
    }
  };

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Vendor Profile
        const vendorRes = await api.get(`/api/users/vendors/${vendorId}`);
        setVendorDetails(vendorRes.data);

        // Fetch Vendor Menu Foods
        const foodsRes = await api.get(`/api/foods?vendorId=${vendorId}`);
        setMenuItems(foodsRes.data);
      } catch (err) {
        console.error("Failed to fetch vendor or menu:", err);
        setError("Failed to load vendor details or menus.");
      } finally {
        setLoading(false);
      }
    };

    if (vendorId) {
      fetchVendorData();
    }
  }, [vendorId]);

  const filteredItems = menuItems.filter(item =>
    activeCategory === 'All' ? true : item.category === activeCategory
  );

  const isItemAvailable = (item) => (
    (item.quantity !== undefined && item.quantity !== null)
      ? Number(item.quantity) > 0
      : Boolean(item.isAvailable ?? true)
  );

  const toggleCartItem = (item) => {
    if (!isItemAvailable(item)) return;
    setSelectedFoodIds((prev) => {
      const id = String(item._id);
      return prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
    });
  };

  const goToCheckout = () => {
    if (!selectedFoodIds.length) return;
    navigate(`/student/order?foodIds=${encodeURIComponent(selectedFoodIds.join(","))}`);
  };

  const selectedItems = menuItems.filter((item) => selectedFoodIds.includes(String(item._id)));
  const selectedTotal = selectedItems.reduce((sum, item) => sum + Number(item.price || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header user={user} onLogout={onLogout} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full space-y-8">

        {/* 2. Animated hero banner section at top (rounded container, gradient background) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-orange-50 to-amber-100/60 shadow-md"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-amber-50/60 via-orange-50/70 to-amber-100/50" />
          <motion.div
            animate={{ x: [0, 10, 0], opacity: [0.18, 0.28, 0.18] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-amber-300/70 blur-3xl"
          />
          <div className="relative z-10 p-6 sm:p-8 md:p-9">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <span className="inline-flex items-center px-3 py-1 rounded-full text-[11px] font-semibold tracking-wide uppercase bg-amber-100 text-amber-700 border border-amber-200">
                  Featured Vendor
                </span>
                <h2 className="mt-3 text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight leading-tight truncate">
                  {vendorDetails?.vendorName || vendorDetails?.name || 'Vendor Details'}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
                  Freshly prepared campus favorites with quick pickup and reliable service.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* FLASH PROMO (static marketing card) */}
        {!loading && !error && (
          <motion.section
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.15, duration: 0.55, ease: "easeOut" }}
            className="relative overflow-hidden rounded-3xl border border-amber-300/40 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-white shadow-xl"
          >
            <motion.div
              animate={{ opacity: [0.35, 0.85, 0.35] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute inset-0 rounded-3xl ring-2 ring-amber-400/70 ring-inset"
            />
            <motion.div
              animate={{ opacity: [0.08, 0.22, 0.08], scale: [0.99, 1.01, 0.99] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -inset-[2px] rounded-3xl border border-amber-300/50"
            />
            <motion.div
              animate={{ opacity: [0.12, 0.3, 0.12], scale: [1, 1.08, 1], y: [0, -6, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -top-20 -right-20 h-64 w-64 rounded-full bg-amber-400 blur-3xl"
            />
            <motion.div
              animate={{ opacity: [0.08, 0.18, 0.08], x: [0, -10, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="pointer-events-none absolute -bottom-16 -left-10 h-56 w-56 rounded-full bg-orange-400 blur-3xl"
            />

            <div className="relative z-10 p-6 sm:p-7 md:p-8 grid grid-cols-1 md:grid-cols-[1fr_auto] gap-6 md:gap-8 items-center">
              <div>
                <motion.div
                  animate={{ y: [0, -2, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex items-center gap-2 rounded-full border border-amber-300/40 bg-amber-400/10 px-3 py-1 text-[11px] font-semibold tracking-wider uppercase text-amber-200"
                >
                  <Flame className="w-3.5 h-3.5" />
                  Flash Promo
                </motion.div>
                <h3 className="mt-3 text-xl sm:text-2xl font-bold leading-tight">
                  Limited-time Student Combo
                </h3>
                <p className="mt-2 text-sm sm:text-[15px] text-slate-200 max-w-2xl leading-relaxed">
                  A balanced campus meal bundle for quick pickup. Offer ends soon.
                </p>
                <div className="mt-3">
                  <PromoCountdown />
                </div>
              </div>

              <motion.div
                whileHover={{ y: -3, scale: 1.01 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="w-full md:w-[280px] rounded-2xl border border-white/15 bg-white/10 backdrop-blur-md p-4"
              >
                <p className="text-xs uppercase tracking-wide text-slate-300 font-semibold">Bundle Deal</p>
                <h4 className="mt-1 text-sm font-semibold text-white">Main + Side + Drink</h4>
                <div className="mt-3 flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-300 line-through">Rs. 950.00</p>
                    <p className="text-2xl font-extrabold text-amber-300 leading-none">Rs. 690.00</p>
                  </div>
                  <span className="rounded-lg bg-emerald-400/20 border border-emerald-300/40 px-2 py-1 text-xs font-bold text-emerald-200">
                    Save 27%
                  </span>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 280, damping: 18 }}
                  className="mt-4 w-full rounded-xl bg-amber-500 text-slate-950 font-semibold py-2.5 hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/25"
                >
                  Add Combo
                </motion.button>
              </motion.div>
            </div>
          </motion.section>
        )}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
            <p className="font-medium text-slate-600">Loading delicious menu...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <p className="font-medium text-rose-500">{error}</p>
          </div>
        ) : (
          <>
            {/* 3. Category filter buttons row */}
            <section className="flex items-center gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-full border border-slate-200/60 shadow-inner w-max">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${activeCategory === cat
                        ? 'bg-white text-amber-600 shadow border border-slate-200/50'
                        : 'text-slate-500 hover:text-slate-800 hover:bg-slate-200/50'
                      }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* 4. Menu items grid cards */}
            <motion.section
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence>
                {filteredItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-full py-12 text-center text-slate-500"
                  >
                    No items found in this category.
                  </motion.div>
                ) : (
                  filteredItems.map((item) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      key={item._id}
                      className={`bg-white rounded-2xl border ${
                        isItemAvailable(item)
                          ? 'border-slate-200'
                          : 'border-slate-200/60 opacity-75'
                      } shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col group`}
                    >
                      {/* Food Image Area */}
                      <div className="relative h-48 bg-slate-100 overflow-hidden">
                        {item.image || heroImage ? (
                          <img
                            src={item.image || heroImage}
                            alt={item.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                            <span className="text-5xl mb-2">🍽️</span>
                            <span className="text-xs font-semibold uppercase tracking-wider">No Image</span>
                          </div>
                        )}

                        {/* Availability text badge */}
                        <div className="absolute top-3 right-3">
                          {isItemAvailable(item) ? (
                            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-emerald-500/90 text-white rounded-full shadow-sm backdrop-blur-md border border-emerald-400/50">
                              Available
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-slate-800/80 text-white rounded-full shadow-sm backdrop-blur-md border border-slate-700/50">
                              Sold Out
                            </span>
                          )}
                        </div>

                        {/* Promo tag */}
                        {(() => {
                          const original = Number(item.originalPrice || 0);
                          const current = Number(item.price || 0);
                          const explicitPromo = Number(item.promotionPercentage || 0);
                          const isAvailable = isItemAvailable(item);
                          const computedPromo =
                            original > current && original > 0
                              ? Math.round(((original - current) / original) * 100)
                              : 0;
                          const promoPercentage = explicitPromo > 0 ? Math.round(explicitPromo) : computedPromo;
                          return promoPercentage > 0 && isAvailable ? (
                          <div className="absolute top-3 left-3 flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-tr from-rose-600 to-red-500 text-white font-extrabold rounded-full shadow-lg shadow-rose-500/40 backdrop-blur-md border border-white/20 z-10 animate-pulse">
                            <span className="text-base leading-none tracking-tight">{promoPercentage}%</span>
                            <span className="text-[9px] leading-none uppercase tracking-widest mt-1 opacity-90">OFF</span>
                          </div>
                          ) : null;
                        })()}
                      </div>

                      {/* Item Details */}
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="text-lg font-bold text-slate-900 mb-1 leading-tight line-clamp-2">
                          {item.name}
                        </h3>
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                          {item.description}
                        </p>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                          {/* Price Area */}
                          <div className="flex flex-col">
                            {item.originalPrice ? (
                              <>
                                <span className="text-xs text-slate-400 line-through font-medium">
                                  Rs. {Number(item.originalPrice || 0).toFixed(2)}
                                </span>
                                <span className="text-lg font-extrabold text-rose-600 leading-none mt-0.5">
                                  Rs. {Number(item.price || 0).toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-extrabold text-slate-900 leading-none">
                                Rs. {Number(item.price || 0).toFixed(2)}
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Favorite Button */}
                            <button
                              onClick={() => toggleFavorite(item._id)}
                              className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-slate-50 text-slate-400 hover:bg-rose-50 hover:text-rose-500"
                              title="Toggle Favorite"
                            >
                              <Heart className={`w-5 h-5 ${favorites.includes(item._id) ? 'fill-rose-500 text-rose-500' : ''}`} />
                            </button>

                            {/* Add to Cart Button */}
                            <motion.button
                              whileHover={isItemAvailable(item) ? { scale: 1.05 } : {}}
                              whileTap={isItemAvailable(item) ? { scale: 0.95 } : {}}
                              disabled={!isItemAvailable(item)}
                              onClick={() => toggleCartItem(item)}
                              className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                                isItemAvailable(item)
                                  ? selectedFoodIds.includes(String(item._id))
                                    ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:shadow'
                                    : 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow'
                                  : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                }`}
                              title={selectedFoodIds.includes(String(item._id)) ? "Added" : "Add to Cart"}
                            >
                              {selectedFoodIds.includes(String(item._id)) ? (
                                <Check className="w-5 h-5" />
                              ) : (
                                <Plus className="w-5 h-5" />
                              )}
                            </motion.button>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </motion.section>
          </>
        )}
      </main>
      <AnimatePresence>
        {selectedFoodIds.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: -24, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: -24, y: 16, scale: 0.96 }}
            transition={{ duration: 0.28, ease: "easeOut" }}
            className="fixed bottom-5 left-4 sm:left-6 lg:left-8 z-50"
          >
            <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 text-white backdrop-blur-xl shadow-2xl shadow-slate-950/40 p-4 min-w-[340px] max-w-[420px]">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-300 flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] uppercase tracking-wide text-slate-300 font-semibold">Added Items</p>
                    <p className="text-sm font-bold text-white">{selectedFoodIds.length} selected</p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={goToCheckout}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 text-slate-950 text-sm font-bold hover:bg-amber-400 transition-colors"
                >
                  Checkout
                </motion.button>
              </div>
              <div className="mt-3 rounded-xl bg-slate-800/80 border border-slate-700/70 p-3 space-y-2 max-h-36 overflow-y-auto">
                {selectedItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-100 truncate">{item.name}</span>
                    <span className="text-amber-300 font-semibold whitespace-nowrap">Rs. {Number(item.price || 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-2 border-t border-slate-700 flex items-center justify-between text-sm">
                <span className="text-slate-300 font-medium">Total</span>
                <span className="text-amber-300 text-base font-extrabold">Rs. {selectedTotal.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
