import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import heroImage from "../../assets/image1.jpg";
import Header from "../../components/Header";
import Footer from "../../components/Footer";

export default function HomePage({ user, onLogout }) {
  const navigate = useNavigate();

  const studentName = user?.name || "Student";

  const handleBrowseVendors = () => {
    navigate("/vendor-list");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-white">
      <Header profile={user} onLogout={onLogout} />
      
      {/* Hero Section */}
      <section
        className="relative w-full h-[calc(100vh-73px)] bg-cover flex items-center justify-center"
        style={{
          backgroundImage: `url('${heroImage}')`,
          backgroundAttachment: "fixed",
          backgroundPosition: "center top 73px",
        }}
      >
        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40"></div>

        {/* Content */}
        <div className="relative z-10 text-center max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-5xl sm:text-6xl font-bold text-white mb-6 leading-tight drop-shadow-lg">
            Welcome, {studentName}!
          </h1>

          <p className="text-xl sm:text-2xl text-white/90 mb-10 drop-shadow-md font-light">
            Pre-order your favorite campus food quickly
          </p>

          <button
            onClick={handleBrowseVendors}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-amber-500 text-white text-lg font-semibold hover:bg-amber-600 transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-105 active:scale-95"
          >
            Browse Vendors
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Features Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center">
              <span className="text-2xl">🍽️</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Quick Ordering</h3>
            <p className="text-slate-600">Pre-order your meals in just a few clicks</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center">
              <span className="text-2xl">📍</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Convenient Pickup</h3>
            <p className="text-slate-600">Choose your preferred pickup time and location</p>
          </div>

          <div className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-amber-100 flex items-center justify-center">
              <span className="text-2xl">⭐</span>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-2">Best Vendors</h3>
            <p className="text-slate-600">Choose from the best campus food vendors</p>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
}
