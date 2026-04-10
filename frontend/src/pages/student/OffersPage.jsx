import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Flame, Clock, Ticket, ChevronRight, Search, MapPin } from 'lucide-react';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

// Simulated Global Offers matching the intelligent generation engine
const GLOBAL_OFFERS = [
  {
    id: 1,
    vendorId: '65f1a234b5c6', // Mock or replace with real once aggregated
    vendorName: "Campus Grill",
    title: "⚡ Flash Deal",
    description: "Spicy Chicken Burger + Iced Milo + Brownie",
    originalPrice: 1200,
    price: 890,
    type: "Flash Deal",
    tag: "Ends Soon",
    colors: "from-rose-500 to-orange-500",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 2,
    vendorId: 'mock2',
    vendorName: "Fresh Wraps & Co",
    title: "🍱 Lunch Promo",
    description: "Chicken Shawarma + Lemonade + Fruit Salad",
    originalPrice: 950,
    price: 799,
    type: "Lunch Promo",
    tag: "Today Only",
    colors: "from-emerald-500 to-teal-400",
    image: "https://images.unsplash.com/photo-1626700051175-10eb0a3eddf5?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 3,
    vendorId: 'mock3',
    vendorName: "The Coffee Bean",
    title: "🌙 Daily Combo",
    description: "Cappuccino + Chocolate Muffins (x2)",
    originalPrice: 850,
    price: 650,
    type: "Daily Combo",
    tag: "Until Midnight",
    colors: "from-indigo-600 to-purple-500",
    image: "https://images.unsplash.com/photo-1509042239860-f550ce710b93?q=80&w=600&auto=format&fit=crop"
  },
  {
    id: 4,
    vendorId: 'mock4',
    vendorName: "Noodle Hub",
    title: "🔥 Limited Stock",
    description: "Spicy Seafood Noodles + Coke",
    originalPrice: 1100,
    price: 900,
    type: "Stock-based promo",
    tag: "Until Sold Out",
    colors: "from-amber-500 to-orange-400",
    image: "https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?q=80&w=600&auto=format&fit=crop"
  }
];

export default function OffersPage({ user, onLogout }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState('All');
  
  const categories = ['All', 'Flash Deal', 'Lunch Promo', 'Daily Combo'];
  
  const filteredOffers = filter === 'All' 
    ? GLOBAL_OFFERS 
    : GLOBAL_OFFERS.filter(offer => offer.type === filter);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header user={user} onLogout={onLogout} cartItemCount={0} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-grow w-full space-y-10">
        
        {/* Header Section */}
        <section className="relative w-full rounded-3xl bg-slate-900 overflow-hidden shadow-2xl pb-10 pt-16 px-8 flex flex-col items-center text-center">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=1200&auto=format&fit=crop')] opacity-20 bg-cover bg-center mix-blend-overlay" />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-transparent" />
          
          <div className="relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 backdrop-blur-md text-amber-300 font-bold text-xs uppercase tracking-widest mb-6">
              <Ticket className="w-4 h-4" /> Live Offers Engine
            </div>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight leading-tight mb-4">
              Unlock the best <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500">Combo Deals</span>
            </h1>
            <p className="text-slate-300 max-w-2xl mx-auto font-medium text-lg">
              Smart AI generated discounts across campus. Grab them before the dynamic timers run out!
            </p>
          </div>
        </section>

        {/* Filter Pills */}
        <section className="flex items-center justify-center gap-3 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all ${
                filter === cat 
                  ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' 
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </section>

        {/* Offers Grid */}
        <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-2 gap-8">
          <AnimatePresence mode="popLayout">
            {filteredOffers.map((offer, idx) => (
              <motion.div
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
                whileHover={{ y: -8 }}
                key={offer.id}
                className="bg-white rounded-[2rem] border border-slate-100 shadow-xl shadow-slate-200/50 flex flex-col sm:flex-row overflow-hidden group relative"
              >
                <div className="w-full sm:w-2/5 h-48 sm:h-auto relative overflow-hidden flex-shrink-0">
                  <img src={offer.image} alt={offer.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute inset-0 bg-gradient-to-t sm:bg-gradient-to-r from-black/80 to-transparent flex flex-col justify-end p-5">
                    <span className={`inline-flex w-max items-center gap-1.5 px-2.5 py-1 text-[10px] uppercase font-black tracking-widest text-white bg-gradient-to-r ${offer.colors} rounded-lg shadow-lg`}>
                      {offer.title.includes('⚡') ? <Flame className="w-3 h-3" /> : <Clock className="w-3 h-3" />}
                      {offer.tag}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col justify-center flex-grow">
                  <div className="flex items-center gap-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                    <MapPin className="w-3 h-3" /> {offer.vendorName}
                  </div>
                  <h3 className="text-2xl font-black text-slate-900 leading-tight mb-2">
                    {offer.title}
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mb-6 leading-relaxed line-clamp-2">
                    {offer.description}
                  </p>
                  
                  <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-100">
                    <div className="flex flex-col">
                      <span className="text-xs text-slate-400 line-through font-semibold border-b border-rose-500/30 w-max">Rs. {offer.originalPrice.toFixed(2)}</span>
                      <span className="text-xl font-extrabold text-amber-500">Rs. {offer.price.toFixed(2)}</span>
                    </div>
                    
                    <button 
                      onClick={() => navigate('/vendor-list')}
                      className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center hover:bg-amber-500 transition-colors shadow-md group-hover:animate-pulse"
                    >
                      <ChevronRight className="w-6 h-6" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </section>

      </main>
      <Footer />
    </div>
  );
}
