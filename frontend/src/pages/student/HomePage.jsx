import { useNavigate } from "react-router-dom";
import { ChevronRight, UtensilsCrossed, Clock, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import heroImage from "../../assets/image1.jpg";
import Header from "../../components/Header";
import Footer from "../../components/Footer";
import Chatbot from "../../components/Chatbot";

export default function HomePage({ user, onLogout }) {
  const navigate = useNavigate();

  const studentName = user?.name || "Student";

  const handleBrowseVendors = () => {
    navigate("/vendor-list");
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-slate-50 to-slate-100 overflow-x-hidden font-sans">
      <Header profile={user} onLogout={onLogout} />
      
      {/* Hero Section */}
      <section className="relative w-full min-h-[calc(100vh-80px)] flex items-center justify-center overflow-hidden">
        {/* Fancy Background */}
        <div className="absolute inset-0 z-0">
          <div 
            className="absolute inset-0 bg-cover bg-no-repeat"
            style={{
              backgroundImage: `url('${heroImage}')`,
              backgroundAttachment: "fixed",
              backgroundPosition: "center top 80px",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/50" />
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.1, 1] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
            className="absolute -top-32 -left-32 w-96 h-96 bg-amber-500 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"
          />
          <motion.div
            animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1] }}
            transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-600 rounded-full mix-blend-screen filter blur-[120px] opacity-20 pointer-events-none"
          />
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col justify-center pt-20 pb-32">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-3xl"
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 mb-8"
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              </span>
              <span className="text-white text-sm font-medium tracking-wide">Serving Campus Now</span>
            </motion.div>

            <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold text-white leading-[1.1] tracking-tight mb-6">
              Welcome back, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500 drop-shadow-sm">
                {studentName}
              </span>
            </h1>

            <p className="text-lg sm:text-xl md:text-2xl text-slate-300 font-light max-w-2xl mb-10 leading-relaxed">
              Skip the long queues. Pre-order your favorite campus meals instantly and pick them up whenever you want.
            </p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="flex flex-col sm:flex-row gap-4"
            >
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleBrowseVendors}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-lg font-bold shadow-xl shadow-orange-500/25 overflow-hidden transition-all"
              >
                <span className="absolute inset-0 w-full h-full -mt-1 rounded-lg opacity-30 bg-gradient-to-b from-transparent via-transparent to-black"></span>
                <span className="relative flex items-center gap-2 drop-shadow-sm">
                  Browse Vendors
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate('/my-orders')}
                className="inline-flex items-center justify-center px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white text-lg font-bold hover:bg-white/20 transition-all shadow-lg"
              >
                View My Orders
              </motion.button>
            </motion.div>
          </motion.div>
        </div>

        {/* Floating gradient bottom transition */}
        <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-slate-50 to-transparent z-10 pointer-events-none" />
      </section>

      {/* Features Section */}
      <section className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 pb-24">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {[
            {
              icon: <UtensilsCrossed className="w-8 h-8 text-amber-500" />,
              title: "Premium Food",
              desc: "Carefully curated campus food from top-rated student vendors.",
              color: "from-amber-500/20 to-orange-500/5",
              delay: 0.1
            },
            {
              icon: <Clock className="w-8 h-8 text-emerald-500" />,
              title: "Quick Pickup",
              desc: "Choose exactly when you'd like your food to be ready.",
              color: "from-emerald-500/20 to-teal-500/5",
              delay: 0.2
            },
            {
              icon: <Star className="w-8 h-8 text-sky-500" />,
              title: "Earn Rewards",
              desc: "Review meals and earn exclusive discounts for your next purchase.",
              color: "from-sky-500/20 to-blue-500/5",
              delay: 0.3
            }
          ].map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: feature.delay, duration: 0.6, ease: "easeOut" }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="group relative bg-white/80 backdrop-blur-xl border border-slate-200/60 p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 overflow-hidden text-center"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />
              
              <div className="relative z-10">
                <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-white shadow-md border border-slate-100 flex items-center justify-center transform group-hover:rotate-12 transition-transform duration-300">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
                <p className="text-slate-500 font-medium leading-relaxed">
                  {feature.desc}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>
      
      <Footer />
      <Chatbot user={user} />
    </div>
  );
}
