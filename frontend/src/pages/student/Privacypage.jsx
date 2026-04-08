import React, { useState, useEffect } from "react";
import { motion, useScroll, useSpring } from "framer-motion"; // Install using: npm install framer-motion
import Header from '../../../src/components/Header';
import Footer from '../../../src/components/Footer';

const  Privacypage= () => {
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
            Privacy & <span className="text-[#f97316]">Policy</span>
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
            title="Information We Collect" 
            content="We collect personal information you provide when creating an account, including your name, email address, phone number, student ID, department, and dietary preferences. We also collect usage data such as order history, reviews, and interaction logs."
          />
          
          <AnimatedSection 
            variants={itemVariants}
            number="2" 
            title="How We Use Your Information" 
            content="Your information is used to provide and improve our services, process orders, manage your loyalty points, personalize your experience, send important notifications, and ensure the security of your account."         />

          <AnimatedSection 
            variants={itemVariants}
            number="3" 
            title=". Data Sharing" 
            content="We may share your information with trusted partners and vendors to provide our services. We do not sell or rent your personal information to third parties." 
          />

          <AnimatedSection 
            variants={itemVariants}
            number="4" 
            title="Data Security" 
            content="We implement industry-standard security measures to protect your personal information. However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security." 
          />

          <AnimatedSection 
            variants={itemVariants}
            number="5" 
            title= "Your Rights" 
            content="You have the right to access, update, or delete your personal information at any time. You can also withdraw your consent for data processing or file a complaint with the relevant authorities." 
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

export default Privacypage;