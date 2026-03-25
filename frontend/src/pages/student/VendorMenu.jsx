import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Loader2, Store, ShoppingCart, Plus, Tag } from 'lucide-react';
import heroImage from '../../assets/image1.jpg';

export default function VendorMenu({ user, onLogout }) {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  
  // Mock data for UI presentation
  const categories = ['All', 'Popular', 'Meals', 'Snacks', 'Beverages'];
  
  const mockMenuItems = [
    {
      id: 1,
      name: 'Spicy Chicken Bowl',
      category: 'Meals',
      price: 450,
      originalPrice: 500, // Promotion exists
      available: true,
      image: heroImage,
      description: 'A hearty bowl of spicy chicken, rice, and fresh vegetables.'
    },
    {
      id: 2,
      name: 'Vegetarian Wrap',
      category: 'Snacks',
      price: 250,
      originalPrice: null,
      available: true,
      image: null,
      description: 'Fresh grilled veggies wrapped in a soft tortilla.'
    },
    {
      id: 3,
      name: 'Iced Coffee',
      category: 'Beverages',
      price: 150,
      originalPrice: 200, // Promotion exists
      available: false, // unavailable
      image: null,
      description: 'Chilled coffee brewed to perfection.'
    },
    {
      id: 4,
      name: 'Campus Burger Meal',
      category: 'Meals',
      price: 600,
      originalPrice: null,
      available: true,
      image: heroImage,
      description: 'Classic burger served with crispy fries.'
    }
  ];

  useEffect(() => {
    // Simulate API fetch delay
    const timer = setTimeout(() => {
      setLoading(false);
    }, 800);
    return () => clearTimeout(timer);
  }, [vendorId]);

  const filteredItems = mockMenuItems.filter(item => 
    activeCategory === 'All' ? true : item.category === activeCategory
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans mb-10">
      {/* 1. Student header stays unchanged */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/vendor-list')}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shadow-sm">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 leading-tight">Vendor Menu</h1>
                <p className="text-xs font-mono text-slate-500">ID: {vendorId}</p>
              </div>
            </div>
          </div>
          
          <button
            onClick={() => navigate("/student/order")}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 text-white text-sm hover:bg-slate-800 transition-colors shadow-sm"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Cart (0)</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-grow w-full space-y-8">
        
        {/* 2. Animated hero banner section at top (rounded container, gradient background) */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="relative w-full rounded-3xl bg-gradient-to-r from-amber-400 to-orange-500 overflow-hidden shadow-lg"
        >
          {/* Decorative pattern using raw SVG via background image (safe Tailwind) */}
          <div className="absolute inset-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyNCIgaGVpZ2h0PSIyNCI+PHBhdGggZD0iTTEyIDJMMiAyMmg0bDItNGg4bDItNGg0ek0xMiA0bC00IDhoOGwtNC04eiIgZmlsbD0iI2ZmZiIvPjwvc3ZnPg==')] pointer-events-none mix-blend-overlay"></div>
          
          <div className="relative z-10 p-8 sm:p-12 md:p-16 flex flex-col items-center sm:items-start text-center sm:text-left">
            <span className="inline-block px-3 py-1 bg-white/20 text-white text-xs font-bold tracking-wider rounded-full backdrop-blur-md mb-4 uppercase border border-white/30">
              Featured Vendor
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-white mb-4 tracking-tight drop-shadow-md">
              Delicious Bites & More
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
        ) : (
          <>
            {/* 3. Category filter buttons row */}
            <section className="flex items-center gap-3 overflow-x-auto pb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2 p-1.5 bg-slate-100 rounded-full border border-slate-200/60 shadow-inner w-max">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`whitespace-nowrap px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200 ${
                      activeCategory === cat 
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
                      key={item.id} 
                      className={`bg-white rounded-2xl border ${item.available ? 'border-slate-200' : 'border-slate-200/60 opacity-75'} shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col group`}
                    >
                      {/* Food Image Area */}
                      <div className="relative h-48 bg-slate-100 overflow-hidden">
                        {item.image ? (
                          <img 
                            src={item.image} 
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
                          {item.available ? (
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
                        {item.originalPrice && item.available && (
                          <div className="absolute top-3 left-3 flex items-center gap-1 px-2.5 py-1 bg-rose-500/90 text-white text-[10px] font-bold tracking-wide uppercase rounded-full shadow-sm backdrop-blur-md border border-rose-400/50">
                            <Tag className="w-3 h-3" />
                            Promo
                          </div>
                        )}
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
                                  Rs. {item.originalPrice.toFixed(2)}
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
                          
                          {/* Add to Cart Button */}
                          <motion.button 
                            whileHover={item.available ? { scale: 1.05 } : {}}
                            whileTap={item.available ? { scale: 0.95 } : {}}
                            disabled={!item.available}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${
                              item.available 
                                ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow' 
                                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                            title="Add to Cart"
                          >
                            <Plus className="w-5 h-5" />
                          </motion.button>
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
    </div>
  );
}
