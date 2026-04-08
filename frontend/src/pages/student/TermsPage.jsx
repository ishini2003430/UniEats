import React, { useState, useEffect } from "react";
import { motion, useScroll, useSpring } from "framer-motion"; // Install using: npm install framer-motion
import Header from '../../../src/components/Header';
import Footer from '../../../src/components/Footer';

const TermsOfService = () => {
  const [userProfile, setUserProfile] = useState(null);

  // Scroll progress bar logic
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      try {
        setUserProfile(JSON.parse(savedUser));
      } catch (error) {
        console.error("Error parsing user data from localStorage", error);
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    window.location.href = "/login";
  };

  // Animation variants for the container
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2 // Elements appear one after another
      }
    }
  };

  // Animation variants for individual sections
  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-[#fffdfb] font-sans text-slate-800 flex flex-col overflow-x-hidden">
      {/* 1. Reading Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-[#f97316] origin-left z-50"
        style={{ scaleX }}
      />

      <Header profile={userProfile} onLogout={handleLogout} />

      <main className="flex-grow max-w-4xl mx-auto px-6 py-20">
        {/* Header Animation */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="border-b border-slate-100 pb-8 mb-12"
        >
          <h1 className="text-5xl font-extrabold mb-4 text-slate-900 tracking-tight">
            Terms of <span className="text-[#f97316]">Service</span>
          </h1>
          <div className="flex items-center gap-2">
            <motion.span 
              initial={{ width: 0 }}
              animate={{ width: 32 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="h-1 bg-[#f97316] rounded-full"
            ></motion.span>
            <p className="text-slate-400 text-sm font-medium">
              Last updated: March 27, 2026
            </p>
          </div>
        </motion.div>

        {/* Staggered Sections */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-12"
        >
          <AnimatedSection 
            variants={itemVariants}
            number="1" 
            title="Acceptance of Terms" 
            content="By accessing and using UniEats, you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our platform. UniEats is designed exclusively for registered university students." 
          />
          
          <AnimatedSection 
            variants={itemVariants}
            number="2" 
            title="User Accounts" 
            content="You must provide accurate and complete information when creating an account. You are responsible for maintaining the confidentiality of your login credentials and for all activities that occur under your account. You must be a currently enrolled student to use this service." 
          />

          <AnimatedSection 
            variants={itemVariants}
            number="3" 
            title="Ordering & Payments" 
            content="All orders placed through UniEats are subject to availability. Prices displayed are in the local currency and may be subject to change. Payment must be completed at the time of order. Refunds are handled on a case-by-case basis per our refund policy." 
          />

          <AnimatedSection 
            variants={itemVariants}
            number="4" 
            title="Reviews & Content" 
            content="Users may submit reviews and ratings for meals and vendors. All content must be truthful, respectful, and free of offensive language. UniEats reserves the right to remove any content that violates these guidelines without prior notice." 
          />

          <AnimatedSection 
            variants={itemVariants}
            number="5" 
            title="Loyalty Program" 
            content="Points earned through the UniEats Loyalty Program have no cash value and are non-transferable. UniEats reserves the right to modify or terminate the rewards system at any time." 
          />
        </motion.div>
      </main>

      <Footer />
    </div>
  );
};

// Animated Section Component
const AnimatedSection = ({ number, title, content, variants }) => (
  <motion.section 
    variants={variants}
    whileHover={{ x: 10 }} // Subtle shift on hover
    className="group cursor-default"
  >
    <div className="flex items-start gap-4">
      <span className="text-2xl font-black text-slate-200 group-hover:text-orange-200 transition-colors duration-300">
        0{number}
      </span>
      <div>
        <h2 className="text-xl font-bold mb-3 text-slate-800 group-hover:text-[#f97316] transition-colors duration-300">
          {title}
        </h2>
        <p className="text-slate-500 leading-relaxed text-base font-normal">
          {content}
        </p>
      </div>
    </div>
  </motion.section>
);

export default TermsOfService;