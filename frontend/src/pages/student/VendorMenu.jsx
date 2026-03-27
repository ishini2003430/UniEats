import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShoppingCart, Plus, Tag, Check, Trash2 } from 'lucide-react';
import heroImage from '../../assets/image1.jpg';
import api from '../../services/api';

import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function VendorMenu({ user, onLogout }) {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeCategory, setActiveCategory] = useState('All');
  
  const [vendorDetails, setVendorDetails] = useState(null);
  const [menuItems, setMenuItems] = useState([]);
  
  // Cart state
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const fetchVendorData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch Vendor Profile
        const vendorRes = await api.get(`/api/users/vendors/${vendorId}`);
        setVendorDetails(vendorRes.data);

        // Fetch Vendor Menu Foods
        const foodsRes = await api.get(`/api/foods?vendorId=${vendorId}&available=true`);
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

  const categories = useMemo(() => {
    const uniqueCats = new Set(menuItems.map(item => item.category).filter(Boolean));
    return ['All', ...Array.from(uniqueCats)];
  }, [menuItems]);

  const filteredItems = menuItems.filter(item =>
    activeCategory === 'All' ? true : item.category === activeCategory
  );

  // Cart functions
  const addToCart = (food) => {
  if (!food.isAvailable) return; // 🚫 block invalid

  if (!cartItems.includes(String(food._id))) {
    setCartItems((prev) => [...prev, String(food._id)]);
  }
};

  const removeFromCart = (foodId) => {
    setCartItems((prev) => prev.filter((id) => id !== String(foodId)));
  };

  const startOrderFlow = () => {
    if (!cartItems.length) return;
    navigate(`/student/order?foodIds=${encodeURIComponent(cartItems.join(","))}`);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* 1. Global Header */}
      <Header user={user} onLogout={onLogout} />

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-10 mb-16">

        {/* 2. Vendor Name Hero Banner */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full rounded-3xl bg-gradient-to-r from-amber-400 to-orange-500 overflow-hidden shadow-lg mt-2"
        >
          {/* Decorative pattern using raw SVG via background image (safe Tailwind) */}
          <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTEyIDJMMiAyMmg0bDItNGg4bDItNGg0ek0xMiA0bC00IDhoOGwtNC04eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] pointer-events-none mix-blend-overlay"></div>

          <div className="relative z-10 p-8 sm:p-12 md:p-16 flex flex-col items-center sm:items-start text-center sm:text-left">
            <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold tracking-wider rounded-full backdrop-blur-md mb-4 uppercase border border-white/30">
              Featured Vendor
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
              {vendorDetails?.vendorName || vendorDetails?.name || 'Vendor Details'}
            </h2>
            <p className="text-white/90 text-lg max-w-lg font-medium drop-shadow-sm leading-relaxed">
              Explore our freshly prepared meals made with quality ingredients to fuel your campus day.
            </p>
          </div>
        </motion.section>

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
            {/* 3. Modern Animated Categories */}
            <section className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`relative px-5 py-2.5 rounded-full text-sm font-semibold transition-colors duration-200 outline-none
                    ${activeCategory === cat ? 'text-white shadow-md' : 'text-slate-500 hover:text-slate-800 bg-slate-200/50 hover:bg-slate-200'}
                  `}
                >
                  {activeCategory === cat && (
                    <motion.div
                      layoutId="activeCategory"
                      className="absolute inset-0 bg-slate-900 rounded-full"
                      transition={{ type: "spring", stiffness: 350, damping: 25 }}
                    />
                  )}
                  <span className="relative z-10">{cat}</span>
                </button>
              ))}
            </section>

            {/* Menu Items Grid */}
            <motion.section
              layout
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              <AnimatePresence mode="popLayout">
                {filteredItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="col-span-full py-16 text-center text-slate-500 bg-white rounded-3xl border border-slate-200 border-dashed"
                  >
                    No items found in this category.
                  </motion.div>
                ) : (
                  filteredItems.map((item) => {
                    const isAvailable = item.isAvailable;
                    const inCart = cartItems.includes(String(item._id));
                    
                    return (
                    <motion.div
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.3 }}
                      key={item._id}
                      className={`bg-white rounded-2xl border ${isAvailable ? 'border-slate-200' : 'border-slate-200/60 opacity-75'} shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col group`}
                    >
                      {/* Food Image Area */}
                      <div className="relative h-48 bg-slate-100 overflow-hidden">
                        {item.image || heroImage ? (
                          <img
                            src={(item.image && item.image.startsWith('/uploads')) ? `${api.defaults.baseURL}${item.image}` : (item.image || heroImage)}
                            alt={item.name}
                            className={`w-full h-full object-cover transition-transform duration-500 ${isAvailable ? 'group-hover:scale-105' : 'grayscale-[50%]'}`}
                          />
                        ) : (
                          <div className="w-full h-full flex flex-col items-center justify-center text-slate-300">
                            <span className="text-5xl mb-2">🍽️</span>
                            <span className="text-xs font-semibold uppercase tracking-wider">No Image</span>
                          </div>
                        )}

                        {/* Promo tag */}
                        {item.promotionPercentage > 0 && isAvailable && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-rose-500/90 text-white text-[10px] font-bold tracking-wide uppercase rounded-full shadow-sm backdrop-blur-md border border-rose-400/50">
                            <Tag className="w-3 h-3" />
                            {item.promotionPercentage}% OFF
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="p-5 flex flex-col flex-grow">
                        {/* 4. Availability align with name */}
                        <div className="flex items-start justify-between gap-3 mb-1.5">
                          <h3 className="text-lg font-bold text-slate-900 leading-tight line-clamp-2">
                            {item.name}
                          </h3>
                          {isAvailable ? (
                            <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-emerald-100 text-emerald-700 rounded-full border border-emerald-200 shadow-sm mt-1">
                              Available
                            </span>
                          ) : (
                            <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold tracking-wider uppercase bg-rose-100 text-rose-700 rounded-full border border-rose-200 shadow-sm mt-1">
                              Sold Out
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-slate-500 mb-4 line-clamp-2 min-h-[40px]">
                          {item.description}
                        </p>

                        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                          {/* Price Area */}
                          <div className="flex flex-col">
                            {item.promotionPercentage > 0 ? (
                              <>
                                <span className="text-xs text-slate-400 line-through font-medium">
                                  Rs. {item.originalPrice ? item.originalPrice.toFixed(2) : (item.price / (1 - item.promotionPercentage / 100)).toFixed(2)}
                                </span>
                                <span className="text-lg font-extrabold text-rose-600 leading-none mt-0.5">
                                  Rs. {item.price.toFixed(2)}
                                </span>
                              </>
                            ) : (
                              <span className="text-lg font-extrabold text-slate-900 leading-none">
                                Rs. {item.price.toFixed(2)}
                              </span>
                            )}
                          </div>

                          {/* 5. Add to Cart Button */}
                          <motion.button
                            whileHover={isAvailable ? { scale: 1.05 } : {}}
                            whileTap={isAvailable ? { scale: 0.95 } : {}}
                            disabled={!isAvailable}
                            onClick={() => inCart ? removeFromCart(item._id) : addToCart(item)}
                            className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center transition-all shadow-sm 
                              ${!isAvailable
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : inCart 
                                  ? 'bg-emerald-500 text-white shadow-md hover:bg-emerald-600' 
                                  : 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow-md'
                              }`}
                            title={inCart ? "Remove from Cart" : "Add to Cart"}
                          >
                            {inCart ? <Check className="w-5 h-5" /> : <Plus className="w-6 h-6 mb-[1px]" />}
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                    );
                  })
                )}
              </AnimatePresence>
            </motion.section>
          </>
        )}
      </main>

      {/* Global Footer */}
      <Footer />

      {/* Floating Cart Components */}
      <AnimatePresence>
        {cartItems.length > 0 && (
          <>
            {/* Desktop Cart Preview Box */}
            <motion.aside 
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="fixed left-6 bottom-8 z-40 bg-white border border-slate-200 rounded-2xl shadow-2xl w-80 hidden lg:flex flex-col overflow-hidden"
            >
              <div className="bg-slate-900 text-white px-5 py-4 flex items-center justify-between">
                <p className="font-semibold flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-amber-500"/> 
                  Your Order
                </p>
                <div className="bg-white/10 px-2.5 py-1 rounded-full text-xs font-bold tracking-wide">
                  {cartItems.length} items
                </div>
              </div>
              <div className="p-3 bg-white">
                <div className="max-h-56 overflow-y-auto pr-1 space-y-1 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {cartItems.map((id) => {
                    const fItem = menuItems.find(i => String(i._id) === id);
                    if(!fItem) return null;
                    return (
                      <div key={id} className="flex items-center justify-between text-sm p-3 hover:bg-slate-50 rounded-xl group transition-all border border-transparent hover:border-slate-100">
                        <div className="flex flex-col min-w-0 pr-3">
                          <span className="truncate font-bold text-slate-700">{fItem.name}</span>
                          <span className="text-amber-600 font-semibold text-xs mt-0.5">Rs. {fItem.price.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => removeFromCart(id)}
                          className="w-8 h-8 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-100 shrink-0"
                          title="Remove item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.aside>

            {/* Floating Checkout Button */}
            <motion.button
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startOrderFlow}
              className="fixed bottom-8 right-6 lg:right-8 z-50 rounded-full pl-6 pr-5 py-3.5 bg-amber-500 text-white shadow-xl hover:bg-amber-600 hover:shadow-2xl hover:shadow-amber-500/30 transition-all flex items-center gap-3 font-bold group"
            >
              <div className="flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 group-hover:-rotate-12 transition-transform" />
                <span>Checkout</span>
              </div>
              <div className="bg-white/20 px-2.5 py-0.5 rounded-full text-sm">
                {cartItems.length}
              </div>
            </motion.button>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
