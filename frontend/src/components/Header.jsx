import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, ShoppingCart, LogOut } from 'lucide-react';

export default function Header({ user, onLogout }) {
  const navigate = useNavigate();

  const initials = useMemo(() => {
    const name = user?.name || "Student";
    return (
      name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "ST"
    );
  }, [user]);

  return (
    <header className="border-b border-slate-200 bg-white/80 backdrop-blur sticky top-0 z-50 transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center shadow-md">
            {initials}
          </div>
          <div>
            <p className="text-xs text-slate-500">Signed in as</p>
            <p className="font-semibold text-slate-900">{user?.name || "Student"}</p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            className="relative p-2 rounded-full border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
            aria-label="Open notifications"
          >
            <Bell className="w-4 h-4" />
          </button>

          <button
            onClick={() => navigate("/student/order")}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-slate-900 text-white text-sm hover:bg-slate-800 transition-colors"
          >
            <ShoppingCart className="w-4 h-4" />
            <span className="hidden sm:inline">Cart</span>
          </button>
          <button
            onClick={() => navigate("/my-orders")}
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm hover:bg-amber-600 transition-colors"
          >
            My Orders
          </button>
          <button
            onClick={onLogout}
            className="inline-flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-700 text-sm hover:bg-slate-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}
