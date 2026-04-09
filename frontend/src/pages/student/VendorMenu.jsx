import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Store, ShoppingCart, Plus, Check, Heart, Flame, MessageCircle, X, Send, Sparkles, Bot, Clock } from 'lucide-react';
import heroImage from '../../assets/image1.jpg';
import api from '../../services/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

// Promo section relocated to dynamic combo engine

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

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- AI Chat State ---
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState([
    { text: "Hi! I'm your smart assistant. Ask me about 'cheap' foods, 'popular' items, 'drinks', or our 'combo' deals!", sender: 'ai' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatOpen]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if(!chatInput.trim()) return;
    
    const userMsg = chatInput.trim().toLowerCase();
    setChatMessages(prev => [...prev, { text: chatInput, sender: 'user' }]);
    setChatInput('');

    let aiResponse = "I'm not sure how to help with that. Try asking for 'cheap', 'drink', 'popular', or 'combo'.";

    if (userMsg.includes('cheap')) {
      const cheapFoods = menuItems.filter(item => Number(item.price) < 500).slice(0, 3);
      if(cheapFoods.length > 0) {
        aiResponse = "Here are some affordable options: " + cheapFoods.map(f => f.name).join(', ');
      } else {
        aiResponse = "I couldn't find anything extremely cheap right now.";
      }
    } else if (userMsg.includes('drink')) {
      const drinks = menuItems.filter(item => item.category?.toLowerCase().includes('drink') || item.category?.toLowerCase().includes('beverage')).slice(0, 3);
      if(drinks.length > 0) {
        aiResponse = "Hydrate with these: " + drinks.map(f => f.name).join(', ');
      } else {
        aiResponse = "Looks like we're out of drinks!";
      }
    } else if (userMsg.includes('popular')) {
       const pop = [...menuItems].sort((a,b) => Number(b.price) - Number(a.price)).slice(0, 3);
       aiResponse = "Our most popular items are: " + pop.map(f => f.name).join(', ');
    } else if (userMsg.includes('combo')) {
       aiResponse = "Check out our 🔥 Recommended For You section right above the menu! We found a great match for you.";
    }

    setTimeout(() => {
      setChatMessages(prev => [...prev, { text: aiResponse, sender: 'ai' }]);
    }, 500);
  };

  // --- Smart Combos Logic ---
  const recommendedCombos = useMemo(() => {
    const mains = menuItems.filter(f => f.category?.toLowerCase() === 'main' || f.category?.toLowerCase() === 'rice' || Number(f.price) >= 500);
    const drinks = menuItems.filter(f => f.category?.toLowerCase().includes('drink') || f.category?.toLowerCase().includes('beverage'));
    const snacks = menuItems.filter(f => f.category?.toLowerCase().includes('snack') || f.category?.toLowerCase().includes('short'));

    const combos = [];
    let comboItems = [];

    // Attempt 1: Strict Categorical Meal
    if (mains.length > 0 && drinks.length > 0) {
      comboItems = [mains[0], drinks[0]];
      if(snacks.length > 0) comboItems.push(snacks[0]);
    } 
    // Attempt 2: Universal Fallback (Find 2-3 distinct items)
    else if (menuItems.length >= 2) {
      const sortedByPriceDesc = [...menuItems].sort((a,b) => Number(b.price) - Number(a.price));
      const sortedByPriceAsc = [...menuItems].sort((a,b) => Number(a.price) - Number(b.price));
      
      comboItems = [sortedByPriceDesc[0], sortedByPriceDesc[1]];
      if(menuItems.length >= 3 && sortedByPriceAsc[0]._id !== sortedByPriceDesc[0]._id && sortedByPriceAsc[0]._id !== sortedByPriceDesc[1]._id) {
         comboItems.push(sortedByPriceAsc[0]);
      }
    }
    
    if (comboItems.length >= 2) {
      const originalComboPrice = comboItems.reduce((acc, curr) => acc + Number(curr.price), 0);
      const fakeDiscountPrice = originalComboPrice * 0.9;
      
      combos.push({
        id: "combo-1",
        title: "Vendor Special Bundle",
        items: comboItems,
        originalPrice: originalComboPrice,
        discountedPrice: fakeDiscountPrice,
        discountText: "Save 10%",
        expiresAt: Date.now() + 5 * 60 * 1000
      });
    }
    return combos;
  }, [menuItems]);

  const activeCombos = recommendedCombos.filter(
    combo => combo.expiresAt > now
  );

  const getRemainingTime = (expiresAt) => {
    const diff = expiresAt - now;
    if (diff <= 0) return "Expired";

    const minutes = Math.floor(diff / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
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

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full space-y-8">
        
        <style>
          {`
          @keyframes pulseCustom {
            0% { opacity: 1; }
            50% { opacity: 0.6; }
            100% { opacity: 1; }
          }
          `}
        </style>

        {/* 2. Animated hero banner section at top (rounded container, gradient background) */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative overflow-hidden rounded-3xl border border-amber-300/60 bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 shadow-xl shadow-amber-500/10 group"
        >
          <motion.div
            animate={{ backgroundPosition: ['0% 0%', '100% 100%', '0% 0%'] }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0 bg-[linear-gradient(45deg,rgba(251,191,36,0.1)_0%,rgba(249,115,22,0.1)_50%,rgba(244,63,94,0.1)_100%)] opacity-60 bg-[length:200%_200%]"
          />
          <motion.div
            animate={{ x: [0, 20, 0], opacity: [0.15, 0.35, 0.15], scale: [1, 1.2, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-amber-400 blur-3xl pointer-events-none"
          />
          <div className="relative z-10 p-6 sm:p-8 md:p-9">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0">
                <motion.span 
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase bg-gradient-to-r from-amber-200 to-orange-200 text-amber-800 border border-amber-300 shadow-sm"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Featured Vendor
                </motion.span>
                <motion.h2 
                  whileHover={{ scale: 1.02 }}
                  className="mt-3 text-3xl sm:text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 tracking-tight leading-tight truncate"
                >
                  {vendorDetails?.vendorName || vendorDetails?.name || 'Vendor Details'}
                </motion.h2>
                <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed font-medium">
                  Freshly prepared campus favorites with quick pickup and reliable service.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Dynamic promos now rendered via Smart Combo section below loading spinner */}

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
            {/* 🔥 Smart Combos Section */}
            {activeCombos.length > 0 && (
              <section className="mb-8 border-b border-slate-200/50 pb-8">
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
                      className="bg-white/90 backdrop-blur-md rounded-[2rem] border-2 border-amber-300 shadow-xl shadow-amber-500/10 overflow-hidden flex flex-col p-5 group relative"
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
                            className="combo-timer text-[11px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 whitespace-nowrap" 
                            style={{ animation: 'pulseCustom 1.5s infinite' }}
                          >
                            ⏱ Ends in: {getRemainingTime(combo.expiresAt)}
                          </div>
                          {combo.expiresAt - now < 60000 && (
                            <div className="last-minute text-[10px] font-black uppercase text-white bg-red-600 px-2 py-0.5 rounded shadow-sm animate-pulse w-max">
                              🔥 LAST MINUTE DEAL
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
                          {item.availabilityStatus === "Low Stock" && (
                            <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-orange-500/90 text-white rounded-full shadow-sm backdrop-blur-md border border-orange-400/50">
                              Low Stock
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

      {/* 🤖 Smart AI Chat Widget */}
      <AnimatePresence>
        {isChatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-24 right-4 sm:right-6 lg:right-8 z-50 w-80 sm:w-96 rounded-3xl bg-white shadow-2xl flex flex-col overflow-hidden border border-slate-200"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-4 py-3.5 flex items-center justify-between shadow-sm z-10">
              <div className="flex items-center gap-2.5 text-white">
                <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md">
                   <Bot className="w-4 h-4" />
                </div>
                <span className="font-bold text-sm tracking-wide">UniEats Assistant</span>
              </div>
              <button onClick={() => setIsChatOpen(false)} className="text-white/80 hover:text-white hover:bg-white/20 p-1.5 rounded-xl transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            {/* Chat Body */}
            <div className="h-72 overflow-y-auto p-4 bg-slate-50/50 flex flex-col gap-3 custom-scrollbar">
              {chatMessages.map((msg, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${msg.sender === 'user' ? 'bg-indigo-600 text-white rounded-br-sm' : 'bg-white text-slate-700 rounded-bl-sm border border-slate-200/60'}`}>
                    {msg.text}
                  </div>
                </motion.div>
              ))}
              <div ref={chatEndRef} />
            </div>

            {/* Input Footer */}
            <div className="p-3 bg-white border-t border-slate-100 z-10">
              <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                <input 
                  type="text" 
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  placeholder="Ask for 'cheap', 'combos'..." 
                  className="w-full text-sm rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all font-medium text-slate-700"
                />
                <button type="submit" className="p-2.5 rounded-xl bg-indigo-600 text-white shadow-md shadow-indigo-600/20 hover:bg-indigo-700 transition active:scale-95">
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Chat Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsChatOpen(!isChatOpen)}
        className="fixed bottom-6 right-4 sm:right-6 lg:right-8 z-50 w-14 h-14 rounded-full bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-xl shadow-indigo-600/30 flex items-center justify-center border-2 border-white ring-4 ring-indigo-500/20"
      >
        {isChatOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6 animate-pulse" />}
      </motion.button>

      <Footer />
    </div>
  );
}
