import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Bell, ShoppingCart, LogOut, User, Star, Package, Heart, ChevronDown, Gift, Zap } from 'lucide-react';

export default function Header({ profile, user, onLogout, cartItemCount = 0 }) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  
  const dropdownRef = useRef(null);


  // fallback to persisted user if props are missing (check sessionStorage first)
  let storedUser = null;
  try {
    if (typeof window !== "undefined") {
      const raw = sessionStorage.getItem("unieatsUser") || localStorage.getItem("unieatsUser");
      storedUser = raw ? JSON.parse(raw) : null;
    }
  } catch (e) {
    storedUser = null;
  }


  const profileData = profile || user || storedUser || {};

  const notifyRef = useRef(null);

  // Defensive: ensure onLogout exists
  const safeLogout = () => {
    try {
      if (typeof onLogout === 'function') onLogout();
    } catch (err) {
      console.error('onLogout handler failed', err);
    }
  };

  const safeNavigate = (to) => {
    try {
      if (!to) return;
      navigate(to);
    } catch (err) {
      console.error('Navigation failed', err, to);
    }
  };
  


  // --- CONSOLIDATED NOTIFICATION LOGIC ---
  useEffect(() => {
    // Guard: only run when we have a populated profile object (avoid empty {} causing loops)
    const points = profile?.loyaltyPoints || user?.loyaltyPoints || (storedUser && storedUser.loyaltyPoints) || 0;
    if (!profile && !user && !storedUser) return;

    const newNotifications = [];

    if (points >= 1000) {
      newNotifications.push({
        id: 'milestone-1000',
        title: '50% Discount Unlocked! 🏆',
        message: `Outstanding! You've reached ${points} points. You can now claim your 50% off voucher in your profile.`,
        icon: <Gift className="w-5 h-5 text-orange-500 fill-orange-500/20" />,
        type: 'milestone'
      });
    }

    if (points > 0) {
      newNotifications.push({
        id: 'loyalty-balance',
        title: 'Points Available ⚡',
        message: `You currently have ${points} UniEats points available in your account.`,
        icon: <Zap className="w-5 h-5 text-amber-500 fill-amber-500/20" />,
        type: 'points'
      });
    }

    // Avoid unnecessary state updates if notifications unchanged
    setNotifications((prev) => {
      if (prev.length === newNotifications.length && prev.every((p, i) => p.id === newNotifications[i]?.id)) return prev;
      return newNotifications;
    });
  }, [profile?.loyaltyPoints, user?.loyaltyPoints, storedUser && storedUser.loyaltyPoints]);

  // --- UI HELPERS ---
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) setIsDropdownOpen(false);
      if (notifyRef.current && !notifyRef.current.contains(event.target)) setIsNotifyOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = useMemo(() => {
    const name = profileData?.name || "Student";
    return name.split(" ").filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "ST";
  }, [profileData]);

  return (
    <header className="border-b border-orange-200/60 bg-gradient-to-r from-orange-50/80 to-amber-50/80 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* LEFT: Logo Section */}
        <div
          className="flex items-center gap-2.5 cursor-pointer group"
          onClick={() => {
            // Navigate to a role-appropriate home instead of always '/'
            const role = profileData?.role || (profileData?.user?.role);
            if (role === 'vendor') return navigate('/dashboard');
            if (role === 'admin') return navigate('/admin');
            return navigate('/');
          }}
        >
          <div className="bg-orange-500 p-2 rounded-xl text-white text-xl shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
            🍴
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-800">
            Uni<span className="text-orange-500">Eats</span>
          </span>
        </div>

        <nav className="hidden lg:flex items-center gap-8">

          <button onClick={() => navigate('/vendor-list')} className="text-sm font-semibold text-slate-600 hover:text-orange-500 transition-colors">Menu</button>
          <button onClick={() => navigate('/student/favorites')} className="text-sm font-semibold text-slate-600 hover:text-orange-500 transition-colors">Favorites</button>
          <button onClick={() => navigate('/my-orders')} className="text-sm font-semibold text-slate-600 hover:text-orange-500 transition-colors">Orders</button>
          <button onClick={() => navigate('/vendor-list')} className="text-sm font-semibold text-slate-600 hover:text-orange-500 transition-colors">Offers</button>

          <button onClick={() => navigate('/')} className="text-[15px] font-bold text-slate-700 hover:text-orange-600 transition-colors">Home</button>
          <button onClick={() => navigate('/vendor-list')} className="text-[15px] font-bold text-slate-700 hover:text-orange-600 transition-colors">Vendors</button>
          <button onClick={() => navigate('/student/favorites')} className="text-[15px] font-bold text-slate-700 hover:text-orange-600 transition-colors">Favorites</button>
          <button onClick={() => navigate('/my-orders')} className="text-[15px] font-bold text-slate-700 hover:text-orange-600 transition-colors">Orders</button>
          <button onClick={() => navigate('/offers')} className="text-[15px] font-bold text-slate-700 hover:text-orange-600 transition-colors">Offers</button>

        </nav>

        {/* RIGHT: Actions & Profile */}
        <div className="flex items-center gap-4">
          
          <div className="flex items-center border-r border-slate-200 pr-4 gap-2">
            {/* Notification Bell with Dropdown */}
            <div className="relative" ref={notifyRef}>
              <button 
                onClick={() => setIsNotifyOpen(!isNotifyOpen)}
                className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 transition-all"
              >
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white animate-pulse"></span>
                )}
              </button>

              {isNotifyOpen && (
                <div className="absolute right-0 mt-3 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 z-[70] animate-in fade-in zoom-in-95 duration-200">
                  <div className="px-4 py-2 border-b border-slate-50">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Notifications</p>
                  </div>
                  {notifications.length > 0 ? (
                    notifications.map((n) => (
                      <div key={n.id} className="px-4 py-3 hover:bg-slate-50 transition-colors flex gap-3 items-start border-b border-slate-50 last:border-0">
                        <div className="mt-0.5">{n.icon}</div>
                        <div>
                          <p className="text-sm font-bold text-slate-800 leading-tight">{n.title}</p>
                          <p className="text-xs text-slate-500 mt-1">{n.message}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <p className="text-xs text-slate-400">No new updates</p>
                    </div>
                  )}
                </div>
              )}
            </div>


            <button onClick={() => safeNavigate("/student/order")} className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 transition-all">
              <ShoppingCart className="w-5 h-5" />

            <button
              onClick={() => navigate("/student/order")}
              className="relative p-2.5 rounded-full text-slate-600 hover:bg-orange-100 transition-all group"
            >
              <ShoppingCart className="w-5 h-5 group-hover:scale-110 transition-transform" />
              {cartItemCount > 0 && (
                <motion.span 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute -top-1 -right-1 w-5 h-5 flex items-center justify-center bg-rose-500 text-white text-[10px] font-black rounded-full border-2 border-white shadow-sm"
                >
                  {cartItemCount}
                </motion.span>
              )}

            </button>
          </div>

          {/* User Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <div 
              className="flex items-center gap-3 pl-2 cursor-pointer group"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-slate-900 leading-none">
                  {profileData?.name || "Student"}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  {profileData?.email || ""}
                </p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold flex items-center justify-center shadow-md group-hover:shadow-lg transition-all active:scale-95">
                {initials}
              </div>
            </div>

            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200 z-[60]">
                <div className="px-5 py-4 border-b border-slate-50 sm:hidden">

                  <p className="text-sm font-bold text-slate-900">{profileData?.name || "Student"}</p>
                  <p className="text-[11px] text-slate-400 truncate">{profileData?.email || ""}</p>

                </div>
                <div className="py-2">
                  <button onClick={() => { safeNavigate('/profile'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-5 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <button onClick={() => { safeNavigate('/reviews'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                    <Star className="w-4 h-4" /> Reviews
                  </button>
                  <button onClick={() => { safeNavigate('/student/favorites'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                    <Heart className="w-4 h-4" /> Favorites
                  </button>
                  <button onClick={() => { safeNavigate('/my-orders'); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors">
                    <Package className="w-4 h-4" /> Orders
                  </button>
                </div>
                <div className="pt-2 border-t border-slate-50">
                  <button onClick={() => { safeLogout(); setIsDropdownOpen(false); }} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors">
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}