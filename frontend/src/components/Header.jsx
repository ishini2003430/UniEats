import React, { useMemo, useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, LogOut, User, Star, Package, ChevronDown } from 'lucide-react';

export default function Header({ profile, onLogout }) {
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = useMemo(() => {
    const name = profile?.name || "Student";
    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "ST"
    );
  }, [profile]);

  return (
    <header className="border-b border-slate-100 bg-white/90 backdrop-blur-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        
        {/* LEFT: Logo Section */}
        <div 
          className="flex items-center gap-2.5 cursor-pointer group" 
          onClick={() => navigate('/')}
        >
          <div className="bg-orange-500 p-2 rounded-xl text-white text-xl shadow-lg shadow-orange-200 group-hover:scale-110 transition-transform">
            🍴
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-800">
            Uni<span className="text-orange-500">Eats</span>
          </span>
        </div>

        {/* CENTER: Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          <button onClick={() => navigate('/menu')} className="text-sm font-semibold text-slate-600 hover:text-orange-500 transition-colors">Menu</button>
          <button onClick={() => navigate('/my-orders')} className="text-sm font-semibold text-slate-600 hover:text-orange-500 transition-colors">Orders</button>
          <button onClick={() => navigate('/offers')} className="text-sm font-semibold text-slate-600 hover:text-orange-500 transition-colors">Offers</button>
        </nav>

        {/* RIGHT: Actions & Profile */}
        <div className="flex items-center gap-4">
          
          <div className="flex items-center border-r border-slate-200 pr-4 gap-2">
            <button className="relative p-2.5 rounded-full text-slate-500 hover:bg-slate-100 transition-all">
              <Bell className="w-5 h-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-orange-500 rounded-full border-2 border-white"></span>
            </button>

            <button
              onClick={() => navigate("/student/order")}
              className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 transition-all"
            >
              <ShoppingCart className="w-5 h-5" />
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
                  {profile?.name || "Alex Johnson"}
                </p>
                <p className="text-[11px] text-slate-400 font-medium mt-1">
                  {profile?.email || "student@sliit.lk"}
                </p>
              </div>
              
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 text-white font-bold flex items-center justify-center shadow-md group-hover:shadow-lg transition-all active:scale-95">
                {initials}
              </div>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-3 w-64 bg-white rounded-2xl shadow-2xl border border-slate-100 py-2 animate-in fade-in zoom-in-95 duration-200 z-[60]">
                {/* Header Info (Mobile visibility) */}
                <div className="px-5 py-4 border-b border-slate-50 sm:hidden">
                  <p className="text-sm font-bold text-slate-900">{profile?.name || "Alex Johnson"}</p>
                  <p className="text-[11px] text-slate-400 truncate">{profile?.email}</p>
                </div>

                <div className="py-2">
                  <button 
                    onClick={() => { navigate('/profile'); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-5 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    <User className="w-4 h-4" /> Profile
                  </button>

                  <button 
                    onClick={() => { navigate('/reviews'); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    <Star className="w-4 h-4" /> Reviews
                  </button>

                  <button 
                    onClick={() => { navigate('/my-orders'); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-semibold text-slate-600 hover:bg-orange-50 hover:text-orange-600 transition-colors"
                  >
                    <Package className="w-4 h-4" /> Orders
                  </button>
                </div>

                <div className="pt-2 border-t border-slate-50">
                  <button 
                    onClick={() => { onLogout(); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-red-500 hover:bg-red-50 transition-colors"
                  >
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