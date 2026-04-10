import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Store, ShoppingCart, Plus, Check, Heart, Flame, MessageCircle, X, Send, Sparkles, Bot, Clock, Star, MapPin } from 'lucide-react';
import heroImage from '../../assets/image1.jpg';
import api from '../../services/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import SmartAssistant from '../../components/SmartAssistant';

// Promo section relocated to dynamic combo engine

const DEFAULT_COMBO_DURATION_MS = 2 * 60 * 60 * 1000;
const URGENCY_ORANGE_MS = 15 * 60 * 1000;
const URGENCY_PULSE_MS = 5 * 60 * 1000;

const hashToInt = (text) => {
  const s = String(text || "");
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h * 31 + s.charCodeAt(i)) >>> 0;
  }
  return h;
};

const clamp = (n, min, max) => Math.min(max, Math.max(min, n));

const toComboCategory = (rawCategory) => {
  const v = String(rawCategory || "").toLowerCase();
  if (v === "meal" || v === "meals" || v.includes("meal") || v.includes("main")) return "Meal";
  if (v === "drink" || v === "drinks" || v.includes("drink") || v.includes("beverage")) return "Drink";
  if (v === "dessert" || v === "desserts" || v.includes("dessert")) return "Dessert";
  return null;
};

const formatHhMmSs = (ms) => {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")} : ${String(m).padStart(2, "0")} : ${String(s).padStart(2, "0")}`;
};

const getPromoType = (index) => {
  const types = ['Flash Deal', 'Lunch Promo', 'Daily Combo', 'Stock-based promo'];
  return types[index % types.length];
};

const getOrCreatePromoWindow = ({ vendorId, comboId, promoType }) => {
  const key = `unieats:comboPromo:${vendorId}:${comboId}:${promoType}`;
  const now = Date.now();
  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed.promoEndTime > now || promoType === 'Stock-based promo') {
        return parsed;
      }
    } catch {
      // ignore
    }
  }

  const promoStartTime = now;
  let promoEndTime = now;

  const date = new Date(now);
  
  if (promoType === 'Flash Deal') {
    promoEndTime = now + (45 * 60 * 1000); // 45 mins Fast urgency
  } else if (promoType === 'Lunch Promo') {
    date.setHours(14, 0, 0, 0); // 2:00 PM
    if (now > date.getTime()) {
       date.setDate(date.getDate() + 1); // Bump to tomorrow if past 2PM today
    }
    promoEndTime = date.getTime();
  } else if (promoType === 'Daily Combo') {
    date.setHours(23, 59, 59, 999); // Midnight end
    promoEndTime = date.getTime();
  } else if (promoType === 'Stock-based promo') {
    promoEndTime = Number.POSITIVE_INFINITY;
  } else {
    promoEndTime = now + (2 * 60 * 60 * 1000); // Fallback: 2 Hours
  }

  const result = { promoStartTime, promoEndTime, promoType };
  localStorage.setItem(key, JSON.stringify(result));
  return result;
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

  // --- Real-Time Countdown State ---
  const [now, setNow] = useState(Date.now());

  // --- Modal State ---
  const [showPromoModal, setShowPromoModal] = useState(true);

  // --- Trending carousel auto-scroll ---
  const trendingScrollRef = useRef(null);
  const [trendingIndex, setTrendingIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- Trending Items Logic ---
  const trendingItems = useMemo(() => {
    const nowTs = Date.now();
    const dayBucket = Math.floor(nowTs / (24 * 60 * 60 * 1000));

    return [...menuItems]
      .map((item) => {
        const base = hashToInt(item?._id || item?.name || "");
        const orderCount = (base % 180) + 1; // 1..180 (fake backend field)
        const favoriteCount = (Math.floor(base / 7) % 120) + 1; // 1..120 (fake backend field)
        const recentSeed = hashToInt(`${item?._id || item?.name}-${dayBucket}`);
        const recentOrders = recentSeed % 60; // 0..59 (last 24h simulation)
        const recencyBoost = clamp(recentOrders * 1.7, 0, 100);

        const popularityScore = (orderCount * 0.6) + (favoriteCount * 0.3) + (recencyBoost * 0.1);

        let badge = "👍 Popular";
        let badgeColor = "from-slate-800 to-slate-900";
        if (popularityScore > 80) {
          badge = "🔥 Hot";
          badgeColor = "from-rose-500 to-red-600";
        } else if (popularityScore > 50) {
          badge = "⭐ Trending";
          badgeColor = "from-amber-500 to-orange-500";
        }

        return { ...item, orderCount, favoriteCount, recentOrders, recencyBoost, popularityScore, badge, badgeColor };
      })
      .sort((a, b) => (b.popularityScore || 0) - (a.popularityScore || 0))
      .slice(0, 5);
  }, [menuItems]);

  useEffect(() => {
    if (!trendingItems.length) return;
    const el = trendingScrollRef.current;
    if (!el) return;

    const id = setInterval(() => {
      setTrendingIndex((prev) => (prev + 1) % trendingItems.length);
    }, 4000);

    return () => clearInterval(id);
  }, [trendingItems.length]);

  useEffect(() => {
    const el = trendingScrollRef.current;
    if (!el || !trendingItems.length) return;

    const cardWidth = 280; // matches min widths below (approx, includes gap)
    const targetLeft = trendingIndex * (cardWidth + 16);
    el.scrollTo({ left: targetLeft, behavior: "smooth" });
  }, [trendingIndex, trendingItems.length]);

  // --- Smart Combos Logic ---
  const recommendedCombos = useMemo(() => {
    if (!vendorId) return [];

    const grouped = { Meal: [], Drink: [], Dessert: [] };
    menuItems.forEach((food) => {
      const kind = toComboCategory(food.category);
      if (!kind) return;
      grouped[kind].push(food);
    });

    // Show combo only if all 3 categories exist
    if (!grouped.Meal.length || !grouped.Drink.length || !grouped.Dessert.length) return [];

    const combinations = [];
    for (const meal of grouped.Meal) {
      for (const drink of grouped.Drink) {
        for (const dessert of grouped.Dessert) {
          const items = [meal, drink, dessert];
          const totalOriginalPrice = items.reduce(
            (sum, i) => sum + Number(i.originalPrice || i.price || 0),
            0
          );
          const total = items.reduce((sum, i) => sum + Number(i.price || 0), 0);
          const comboPrice = total * 0.9;
          const trendingScore = items.reduce(
            (sum, i) => sum + Number(i.popularityScore || 0),
            0
          );
          const id = `combo-${String(meal._id)}-${String(drink._id)}-${String(dessert._id)}`;

          const { promoStartTime, promoEndTime } = getOrCreatePromoWindow({ vendorId, comboId: id });

            combinations.push({
              id,
              items,
              originalPrice: totalOriginalPrice,
              discountedPrice: comboPrice,
              discountText: "Save 10%",
              trendingScore,
            });
          }
        }
      }

    // Pick top 3 cheapest (tie-break by trending)
    let finalCombos = combinations
      .sort((a, b) => (a.discountedPrice - b.discountedPrice) || (b.trendingScore - a.trendingScore))
      .slice(0, 3);

    // Fallback if no combos were found (e.g. strict category rules failed), but we have some food available.
    // This safely ensures the design is always visible.
    if (finalCombos.length === 0 && menuItems.length >= 3) {
      const items = menuItems.slice(0, 3);
      const totalOriginalPrice = items.reduce((s, i) => s + Number(i.originalPrice || i.price || 0), 0);
      const comboPrice = items.reduce((s, i) => s + Number(i.price || 0), 0) * 0.9;
      
      finalCombos.push({
        id: 'mock-combo-display',
        items,
        originalPrice: totalOriginalPrice,
        discountedPrice: comboPrice,
        discountText: "Save 10%",
        trendingScore: 100,
      });
    }

    // Apply Real-World Intelligent Promo Distribution
    return finalCombos.map((combo, index) => {
      const pType = getPromoType(index);
      const { promoStartTime, promoEndTime, promoType } = getOrCreatePromoWindow({ 
          vendorId: vendorId || 'mock', 
          comboId: combo.id, 
          promoType: pType 
      });

      let title = "Campus Special";
      if (promoType === 'Flash Deal') title = "⚡ Flash Deal";
      else if (promoType === 'Lunch Promo') title = "🍱 Lunch Promo";
      else if (promoType === 'Daily Combo') title = "🌙 Daily Combo";
      else if (promoType === 'Stock-based promo') title = "🔥 Limited Stock";

      return {
        ...combo,
        title,
        promoStartTime,
        promoEndTime,
        promoType
      };
    });
  }, [menuItems, vendorId]);

  const activeCombos = recommendedCombos.filter(
    combo => combo.promoEndTime > now
  );

  const getRemainingTime = (promoEndTime) => {
    if (promoEndTime === Number.POSITIVE_INFINITY) return "Until Sold Out";
    const diff = promoEndTime - now;
    return formatHhMmSs(diff);
  };

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

  const isItemAvailable = (item) => {
    return item.availabilityStatus !== "Out of Stock";
  };

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
      <Header user={user} onLogout={onLogout} cartItemCount={selectedFoodIds.length} />

        <style>
          {`
          @keyframes pulseCustom {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          @keyframes softBreathingGlow {
            0% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.1); }
            50% { box-shadow: 0 0 35px rgba(245, 158, 11, 0.5); }
            100% { box-shadow: 0 0 15px rgba(245, 158, 11, 0.1); }
          }
          .combo-glow {
            animation: softBreathingGlow 3s infinite ease-in-out;
          }
          `}
        </style>

      {/* FULL WIDTH HERO BANNER */}
      <section className="relative w-full overflow-hidden bg-gradient-to-br from-orange-400 via-amber-300 to-orange-100 shadow-sm min-h-[320px] flex items-end drop-shadow-sm mb-6">
        <motion.div
          animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 bg-[linear-gradient(45deg,rgba(251,191,36,0.15)_0%,rgba(249,115,22,0.15)_50%,rgba(255,255,255,0.3)_100%)] bg-[length:200%_200%]"
        />
        {/* Right side illustration / blur */}
        <div className="absolute right-0 top-0 w-1/2 h-full hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10 z-10 mix-blend-overlay" />
          <motion.div 
             animate={{ scale: [1, 1.05, 1], rotate: [0, 1, -1, 0] }}
             transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
             className="h-full w-full opacity-70 mix-blend-multiply origin-right filter blur-[1px]"
          >
             <img src={heroImage} className="w-full h-full object-cover rounded-l-[100px]" alt="Background" />
          </motion.div>
          <motion.div 
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-10 right-10 z-20 bg-white/90 backdrop-blur px-4 py-2 rounded-2xl shadow-xl border border-white flex items-center gap-2"
          >
            <span className="text-xl">🔥</span>
            <span className="font-bold text-slate-800">Campus Favorite</span>
          </motion.div>
        </div>

        {/* Constrained Inner container so text aligns with the rest of the page */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
          <div className="p-6 sm:p-10 w-full bg-gradient-to-t from-white/90 via-white/80 to-white/40 backdrop-blur-[2px] mt-12 mb-4 rounded-t-[24px]">
            <div className="flex flex-col sm:flex-row sm:items-end gap-6">
              <motion.div 
                whileHover={{ scale: 1.05, rotate: -2 }}
                className="w-24 h-24 sm:w-28 sm:h-28 bg-white rounded-full shadow-2xl p-2 z-20 shrink-0 border border-slate-100"
              >
                <div className="w-full h-full rounded-full bg-slate-100 flex items-center justify-center overflow-hidden">
                  <Store className="w-10 h-10 text-orange-400" />
                </div>
              </motion.div>
              
              <div className="flex-1 pb-1">
                <div className="flex items-center gap-3 mb-2">
                  <motion.span 
                    animate={{ scale: [1, 1.03, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="px-3 py-1 bg-emerald-500/10 text-emerald-700 rounded-full text-xs font-bold uppercase tracking-wide flex items-center gap-1.5 backdrop-blur-md border border-emerald-500/20"
                  >
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    Open Now
                  </motion.span>
                  <span className="flex items-center gap-1 text-sm font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg backdrop-blur-md border border-amber-200/50">
                    <Star className="w-4 h-4 fill-amber-500" />
                    4.8 (120+)
                  </span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight mb-2 relative inline-block">
                  <span className="relative z-10">{vendorDetails?.vendorName || vendorDetails?.name || 'Premium Vendor'}</span>
                </h1>
                
                <p className="text-slate-700 font-medium flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-slate-500" /> Fast campus pickup • Top Rated
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow w-full space-y-8 pb-10">

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
            {/* 🔥 Trending Popular Items Carousel */}
            {trendingItems.length > 0 && (
              <section className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Flame className="w-6 h-6 text-rose-500" />
                  <h3 className="text-xl font-bold text-slate-900 tracking-tight">Trending Now</h3>
                </div>
                <div ref={trendingScrollRef} className="flex gap-4 overflow-x-auto pb-6 pt-2 custom-scrollbar snap-x px-1 scroll-smooth">
                  {trendingItems.map((item, i) => (
                    <motion.div 
                      key={item._id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.03, y: -4 }}
                      className="snap-start min-w-[240px] md:min-w-[280px] bg-white rounded-2xl border border-slate-100 shadow-md hover:shadow-xl transition-all overflow-hidden flex flex-col group cursor-pointer"
                      onClick={() => { if(isItemAvailable(item) && !selectedFoodIds.includes(String(item._id))) toggleCartItem(item) }}
                    >
                      <div className="h-32 bg-slate-100 overflow-hidden relative">
                        {item.image || heroImage ? (
                          <img src={item.image || heroImage} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={item.name} />
                        ) : null}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className={`absolute top-2 left-2 px-2.5 py-1 rounded-full bg-gradient-to-r ${item.badgeColor} text-white text-[10px] uppercase font-black tracking-widest shadow-lg shadow-black/20`}>
                          {item.badge}
                        </div>
                      </div>
                      <div className="p-4 flex-1 flex flex-col">
                        <h4 className="font-bold text-slate-900 line-clamp-1 group-hover:text-amber-600 transition-colors">{item.name}</h4>
                        <div className="mt-auto pt-3 flex justify-between items-center">
                          <span className="font-black text-slate-900">Rs. {Number(item.price).toFixed(2)}</span>
                          <div className="w-8 h-8 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                            <Plus className="w-4 h-4" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}
            {/* 🔥 Smart Combos Section */}
            {activeCombos.length > 0 && (
              <section id="recommended-combos" className="mb-8 border-b border-slate-200/50 pb-8">
                <div className="flex items-center gap-2 mb-6">
                  <Flame className="w-7 h-7 text-orange-500" />
                  <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight">Recommended For You</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {activeCombos.map(combo => (
                    <motion.div 
                      key={combo.id}
                      whileHover={{ y: -8, scale: 1.02 }}
                      transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      className="bg-white/90 backdrop-blur-md rounded-[2rem] border-2 border-amber-300 shadow-xl shadow-amber-500/20 overflow-hidden flex flex-col p-5 group relative combo-glow"
                    >
                      <motion.div 
                        animate={{ rotate: [0, 15, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-4 -right-4 text-5xl opacity-40 blur-[2px] pointer-events-none"
                      >
                        ✨
                      </motion.div>
                      <div className="flex justify-between items-start mb-4">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/10 text-orange-600 h-max">
                          <Sparkles className="w-3.5 h-3.5" />
                          {combo.title}
                        </span>
                        <div className="flex flex-col items-end gap-1.5">
                          <span className="px-2 py-1 rounded-lg bg-rose-500 text-white text-[10px] font-bold uppercase shadow-sm">
                            {combo.discountText}
                          </span>
                          <div
                            className={`combo-timer text-[11px] font-bold px-2 py-1 rounded border whitespace-nowrap ${
                              combo.promoEndTime === Number.POSITIVE_INFINITY 
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-600'
                                : (combo.promoEndTime - now) <= URGENCY_PULSE_MS
                                  ? 'bg-orange-50 border-orange-200 text-orange-600 animate-pulse'
                                  : (combo.promoEndTime - now) <= URGENCY_ORANGE_MS
                                    ? 'bg-orange-50 border-orange-200 text-orange-600'
                                    : 'bg-rose-50 border-rose-200 text-rose-600'
                            }`}
                          >
                            {combo.promoEndTime === Number.POSITIVE_INFINITY 
                              ? getRemainingTime(combo.promoEndTime) 
                              : `Ends in: ${getRemainingTime(combo.promoEndTime)}`}
                          </div>
                          {combo.promoEndTime !== Number.POSITIVE_INFINITY && (combo.promoEndTime - now) <= URGENCY_PULSE_MS && (
                            <div className="last-minute text-[10px] font-black uppercase text-white bg-red-600 px-2 py-0.5 rounded shadow-sm w-max animate-pulse">
                              🔥 HURRY! ENDING SOON
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar items-end">
                        {combo.items.map(food => (
                          <div key={food._id} className="min-w-[70px] flex flex-col items-center flex-shrink-0">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-4 border-slate-50 shadow-sm mb-2 relative group-hover:scale-105 transition-transform">
                              {food.image || heroImage ? (
                                <img src={food.image || heroImage} alt={food.name} className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full bg-slate-100 flex items-center justify-center text-xl">🍽️</div>
                              )}
                            </div>
                            <span className="text-[11px] font-semibold text-slate-700 text-center line-clamp-1 w-full">{food.name}</span>
                          </div>
                        ))}
                      </div>

                      <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between">
                        <div className="flex flex-col">
                          <span className="text-[10px] uppercase font-bold text-slate-400">Total Price</span>
                          <div className="flex items-baseline gap-2">
                            <span className="text-xs text-slate-400 line-through">Rs. {combo.originalPrice.toFixed(2)}</span>
                            <span className="text-lg font-extrabold text-amber-600">Rs. {combo.discountedPrice.toFixed(2)}</span>
                          </div>
                        </div>
                        <motion.button 
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => combo.items.forEach(item => { if(isItemAvailable(item) && !selectedFoodIds.includes(String(item._id))) toggleCartItem(item) })}
                          className="px-5 py-2.5 rounded-xl bg-slate-900 text-white text-sm font-bold shadow-md hover:bg-slate-800 transition shadow-slate-900/20"
                        >
                          Add Combo
                        </motion.button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

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
                  filteredItems.map((item, index) => (
                    <motion.div
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      whileHover={{ y: -6, scale: 1.03 }}
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
                            className={`w-full h-full object-cover transition-transform duration-500 ${isItemAvailable(item) ? 'group-hover:scale-105' : 'opacity-60 grayscale'}`}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                            <span className="text-5xl mb-2">🍽️</span>
                            <span className="text-xs font-semibold uppercase tracking-wider">No Image</span>
                          </div>
                        )}

                        {/* Availability text badge */}
                        <div className="absolute top-3 right-3">
                          {item.availabilityStatus === "Available" && (
                            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-emerald-500/90 text-white rounded-full shadow-sm backdrop-blur-md border border-emerald-400/50">
                              Available
                            </span>
                          )}

                          {item.availabilityStatus === "Out of Stock" && (
                            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-rose-500/90 text-white rounded-full shadow-sm backdrop-blur-md border border-rose-400/50">
                              Out of Stock
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
                              onClick={(e) => { e.stopPropagation(); toggleFavorite(item._id); }}
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

      {/* 🍔 AI Assistant Modal Proposition */}
      <AnimatePresence>
        {showPromoModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowPromoModal(false)}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 cursor-pointer"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm w-full relative overflow-hidden flex flex-col cursor-default"
            >
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-100 rounded-full blur-[40px] opacity-60 pointer-events-none" />
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setShowPromoModal(false);
                }}
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-full transition-colors z-50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              
              <div className="p-8 pb-6 flex flex-col items-center text-center relative z-10 pointer-events-auto">
                <div className="w-16 h-16 rounded-full bg-amber-100 flex flex-shrink-0 items-center justify-center text-3xl shadow-inner mb-5">
                  🍔
                </div>
                <h3 className="text-xl font-extrabold text-slate-900 leading-tight mb-2">Not sure what to eat?</h3>
                <p className="text-sm text-slate-500 font-medium leading-relaxed">
                  Try our trending combo! Handpicked AI recommendations just for you.
                </p>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowPromoModal(false);
                    setTimeout(() => navigate('/offers'), 50);
                  }}
                  className="mt-6 w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white rounded-xl font-bold shadow-md hover:shadow-lg hover:shadow-orange-500/30 transition-all text-sm flex items-center justify-center gap-2 cursor-pointer relative z-50"
                >
                  <Sparkles className="w-5 h-5 pointer-events-none" /> 
                  <span className="pointer-events-none">View Combo Offers</span>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <SmartAssistant foods={menuItems} />

      <Footer />
    </div>
  );
}
