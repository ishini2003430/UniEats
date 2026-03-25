import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, ShoppingCart, LogOut, ChevronRight, Star, Clock, MapPin } from "lucide-react";
import heroImage from "../../assets/image1.jpg";

export default function FoodLandingPage({ user, onLogout }) {
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
    <div className="min-h-screen flex flex-col font-sans bg-white overflow-x-hidden">
      {/* Existing Student Header Component */}
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

      {/* Animated Hero Section (Yellow Gradient) */}
      <main className="flex-grow">
        <section className="relative w-full min-h-[calc(100vh-80px)] bg-gradient-to-br from-amber-50 via-amber-100 to-amber-200 flex items-center overflow-hidden">
          
          {/* Decorative background blobs */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
            <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-amber-300/30 blur-3xl animate-pulse"></div>
            <div className="absolute top-1/2 -right-24 w-[30rem] h-[30rem] rounded-full bg-orange-300/20 blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            <div className="absolute -bottom-32 left-1/3 w-80 h-80 rounded-full bg-yellow-300/30 blur-3xl animate-pulse" style={{ animationDelay: '4s' }}></div>
          </div>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10 py-12 lg:py-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Left side text content */}
              <div className="flex flex-col justify-center text-center lg:text-left animate-[slideInLeft_1s_ease-out]">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 text-amber-700 font-semibold text-sm mb-6 w-fit mx-auto lg:mx-0 border border-amber-500/20 shadow-sm backdrop-blur-sm">
                  <span className="flex h-2 w-2 rounded-full bg-amber-500 animate-ping"></span>
                  Fresh Campus Food Daily
                </div>
                
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-slate-900 leading-tight mb-6 tracking-tight drop-shadow-sm">
                  Crave it? <br className="hidden sm:block"/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">
                    We've got it.
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl text-slate-700 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed font-medium">
                  Experience the best campus dining. Pre-order your favorite meals, skip the lines, and enjoy fresh food prepared just for you.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <button 
                    onClick={() => navigate("/student/order")}
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-slate-900 text-white font-bold text-lg hover:bg-slate-800 transition-all duration-300 shadow-xl hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-1 flex items-center justify-center gap-2 group"
                  >
                    Order Now
                    <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </button>
                  
                  <button 
                    onClick={() => navigate("/vendor-list")}
                    className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-900 font-bold text-lg hover:bg-slate-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-slate-200 hover:-translate-y-1"
                  >
                    Browse Vendors
                  </button>
                </div>

                {/* Quick Stats/Features */}
                <div className="mt-12 grid grid-cols-3 gap-4 sm:gap-6 pt-8 border-t border-amber-500/20 max-w-lg mx-auto lg:mx-0">
                  <div className="text-center lg:text-left">
                    <div className="flex items-center justify-center lg:justify-start gap-1 text-amber-600 mb-1">
                      <Star className="w-5 h-5 fill-current" />
                      <span className="font-bold text-xl">4.9</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">Student Ratings</p>
                  </div>
                  <div className="text-center lg:text-left border-l border-amber-500/20 pl-4 sm:pl-6">
                    <div className="flex items-center justify-center lg:justify-start gap-1 text-amber-600 mb-1">
                      <Clock className="w-5 h-5" />
                      <span className="font-bold text-xl">5m</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">Avg Pickup Time</p>
                  </div>
                  <div className="text-center lg:text-left border-l border-amber-500/20 pl-4 sm:pl-6">
                    <div className="flex items-center justify-center lg:justify-start gap-1 text-amber-600 mb-1">
                      <MapPin className="w-5 h-5" />
                      <span className="font-bold text-xl">10+</span>
                    </div>
                    <p className="text-xs sm:text-sm text-slate-600 font-medium">Campus Stalls</p>
                  </div>
                </div>
              </div>
              
              {/* Right side food image */}
              <div className="relative animate-[slideInRight_1s_ease-out] flex justify-center lg:justify-end">
                {/* Decorative background element for image */}
                <div className="absolute inset-0 bg-gradient-to-tr from-amber-400 to-orange-400 rounded-full blur-[80px] opacity-40"></div>
                
                <div className="relative z-10 w-full max-w-md lg:max-w-lg">
                  <div className="relative aspect-square">
                    {/* Floating elements behind */}
                    <div className="absolute -top-6 -right-6 w-24 h-24 bg-white rounded-2xl shadow-xl rotate-12 flex items-center justify-center animate-[bounce_4s_infinite]">
                       <span className="text-4xl shadow-sm">🍕</span>
                    </div>
                    <div className="absolute top-1/2 -left-8 w-20 h-20 bg-white rounded-full shadow-lg -rotate-12 flex items-center justify-center animate-[bounce_5s_infinite_0.5s]">
                       <span className="text-3xl drop-shadow-sm">🥤</span>
                    </div>
                    <div className="absolute -bottom-4 right-10 w-28 h-28 bg-white rounded-3xl shadow-xl rotate-6 flex items-center justify-center animate-[bounce_6s_infinite_1s]">
                       <span className="text-5xl shadow-md">🍔</span>
                    </div>

                    {/* Main Food Image */}
                    <div className="w-full h-full rounded-full border-8 border-white/50 shadow-2xl overflow-hidden bg-white/80 backdrop-blur-sm p-2">
                       <img 
                         src={heroImage} 
                         alt="Delicious food bowl" 
                         className="w-full h-full object-cover rounded-full hover:scale-105 transition-transform duration-700 ease-in-out"
                       />
                    </div>
                    
                    {/* Floating Review Badge */}
                    <div className="absolute bottom-10 -left-6 bg-white py-3 px-5 rounded-2xl shadow-2xl flex items-center gap-3 animate-[fadeUp_1s_ease-out_1s_both]">
                      <div className="flex -space-x-2">
                        <div className="w-8 h-8 rounded-full bg-blue-100 border-2 border-white flex justify-center items-center text-xs font-bold text-blue-800">S1</div>
                        <div className="w-8 h-8 rounded-full bg-green-100 border-2 border-white flex justify-center items-center text-xs font-bold text-green-800">S2</div>
                        <div className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex justify-center items-center text-xs font-bold text-purple-800">S3</div>
                      </div>
                      <div>
                        <div className="flex text-amber-500">
                          <Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" /><Star className="w-3 h-3 fill-current" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">Loved by students</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              
            </div>
          </div>
        </section>
      </main>

      {/* Tailwind Custom Animations directly injected for self-contained functionality */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInLeft {
          from { opacity: 0; transform: translateX(-50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(50px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}} />
    </div>
  );
}
