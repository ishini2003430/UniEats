import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ShoppingCart, Plus, Heart, HeartOff } from 'lucide-react';
import heroImage from '../../assets/image1.jpg';
import api from '../../services/api';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

export default function MyFavorites({ user, onLogout }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user?._id) return;
      try {
        setLoading(true);
        const res = await api.get("/api/favorites", { headers: { "x-user-id": user._id } });
        // res.data will be the populated Food array
        setFavorites(res.data);
      } catch (err) {
        console.error("Failed to load favorites", err);
        setError("Failed to load your favorite items.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();
  }, [user]);

  const removeFavorite = async (foodId) => {
    try {
      // Optimitic UI removal
      setFavorites(prev => prev.filter(f => f._id !== foodId));
      await api.post("/api/favorites/toggle", { foodId }, { headers: { "x-user-id": user._id } });
    } catch (err) {
      console.error("Failed to remove favorite", err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      <Header user={user} onLogout={onLogout} />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex-grow w-full space-y-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 mb-2">My Favorites</h1>
          <p className="text-slate-500 text-lg">Your curated collection of campus meals.</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-rose-500" />
            <p className="font-medium text-slate-600">Loading your favorites...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 gap-3">
            <p className="font-medium text-rose-500">{error}</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center bg-white rounded-3xl border border-slate-200/60 border-dashed">
            <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-4">
               <HeartOff className="w-10 h-10 text-rose-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-800 mb-2">No favorites yet</h3>
            <p className="text-slate-500 max-w-sm mb-6">
              Start exploring the campus menus and tap the heart icon to save your favorite meals here!
            </p>
            <button
              onClick={() => navigate('/vendor-list')}
              className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl shadow-md active:scale-95 transition-all"
            >
              Browse Vendors
            </button>
          </div>
        ) : (
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {favorites.map((item) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.3 }}
                  key={item._id}
                  className={`bg-white rounded-2xl border ${item.quantity > 0 ? 'border-slate-200' : 'border-slate-200/60 opacity-75'} shadow-sm hover:shadow-lg transition-shadow overflow-hidden flex flex-col group`}
                >
                  {/* Food Image Area */}
                  <div className="relative h-48 bg-slate-100 overflow-hidden cursor-pointer" onClick={() => navigate(`/vendor/${item.vendorId}`)}>
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
                      {item.quantity > 0 ? (
                        <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-emerald-500/90 text-white rounded-full shadow-sm backdrop-blur-md border border-emerald-400/50">
                          Available
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-slate-800/80 text-white rounded-full shadow-sm backdrop-blur-md border border-slate-700/50">
                          Sold Out
                        </span>
                      )}
                    </div>
                    
                    {/* View Vendor Tag */}
                    <div className="absolute top-3 left-3">
                        <span className="px-2.5 py-1 text-[10px] font-bold tracking-wide uppercase bg-white/90 text-slate-700 rounded-full shadow-sm backdrop-blur-md border border-slate-200/50">
                          View Menu
                        </span>
                    </div>
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

                      <div className="flex items-center gap-2">
                        {/* Remove Favorite Button */}
                        <button
                          onClick={() => removeFavorite(item._id)}
                          className="w-10 h-10 rounded-full flex items-center justify-center transition-colors bg-rose-50 text-rose-500 hover:bg-slate-100 hover:text-slate-400"
                          title="Remove from Favorites"
                        >
                          <Heart className="w-5 h-5 fill-rose-500" />
                        </button>

                        {/* Add to Cart Button */}
                        <button
                          disabled={item.quantity <= 0}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-sm ${item.quantity > 0
                              ? 'bg-amber-500 text-white hover:bg-amber-600 hover:shadow active:scale-95'
                              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          title="Add to Cart"
                        >
                          <Plus className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </section>
        )}
      </main>
      
      <Footer />
    </div>
  );
}
