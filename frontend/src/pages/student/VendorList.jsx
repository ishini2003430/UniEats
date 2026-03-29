import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, Star } from 'lucide-react';
import heroImage from '../../assets/image1.jpg';
import VendorCard from '../vendor/components/VendorCard';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

import api from '../../services/api';

export default function VendorList({ onLogout }) {
    const navigate = useNavigate();
    const [vendors, setVendors] = useState([]);
    const [userProfile, setUserProfile] = useState(null);

    // 1. Fetch User Profile from localStorage (Same as TermsOfService)
    useEffect(() => {
        const savedUser = localStorage.getItem("user");
        if (savedUser) {
            try {
                setUserProfile(JSON.parse(savedUser));
            } catch (error) {
                console.error("Error parsing user data", error);
            }
        }
    }, []);

    // 2. Fetch Vendors from API
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const res = await api.get('/api/users/vendors');
                setVendors(res.data);
            } catch (err) {
                console.error("Failed to fetch vendors", err);
            }
        };
        fetchVendors();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("user");
        if (onLogout) onLogout();
        window.location.href = "/login";
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
            {/* Header now receives userProfile correctly */}
            <Header profile={userProfile} onLogout={handleLogout} />

            {/* Animated Hero Section */}
            <section className="relative w-full bg-gradient-to-br from-amber-400 via-orange-400 to-orange-500 overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32 lg:pt-32 lg:pb-40">
                
                {/* Background decorative elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.5, 0.3] }}
                        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute -top-20 -left-20 w-96 h-96 bg-yellow-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
                    />
                    <motion.div
                        animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
                        transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                        className="absolute top-20 -right-20 w-96 h-96 bg-orange-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30"
                    />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col lg:flex-row items-center justify-between gap-12 lg:gap-8">

                        {/* Left Side: Text Content */}
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left z-10"
                        >
                            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-md">
                                Discover Campus <br className="hidden sm:block" />
                                <span className="text-yellow-100">Cravings</span>
                            </h1>

                            <p className="text-lg sm:text-xl text-white/90 font-medium mb-8 max-w-lg drop-shadow-sm leading-relaxed">
                                Explore a wide variety of meals from the best food vendors on campus. Pre-order to skip the line and enjoy your favorite dishes effortlessly.
                            </p>

                            <motion.button
                                onClick={() => {
                                    document.getElementById("vendors-section")?.scrollIntoView({ behavior: "smooth" });
                                }}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-slate-900 text-white font-bold text-lg shadow-xl hover:bg-slate-800 hover:shadow-2xl transition-all duration-300 group"
                            >
                                Browse Vendors
                                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </motion.div>

                        {/* Right Side: Floating Food Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                            className="w-full lg:w-1/2 flex justify-center lg:justify-end z-10"
                        >
                            <div className="relative w-72 h-72 sm:w-96 sm:h-96 lg:w-[28rem] lg:h-[28rem]">
                                <div className="absolute inset-0 bg-white/20 rounded-full blur-3xl scale-90"></div>
                                <motion.div
                                    animate={{ y: [-15, 15, -15] }}
                                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                    className="relative w-full h-full rounded-full border-[12px] border-white/30 shadow-2xl overflow-hidden backdrop-blur-sm"
                                >
                                    <img
                                        src={heroImage}
                                        alt="Delicious campus food"
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                </motion.div>
                                <motion.div
                                    animate={{ y: [-10, 10, -10] }}
                                    transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                                    className="absolute -bottom-4 -left-4 sm:bottom-4 sm:left-0 bg-white py-3 px-6 rounded-2xl shadow-xl flex items-center gap-3 border border-slate-100"
                                >
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 text-amber-600">
                                        <Star className="w-5 h-5 fill-current" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Top Rated</p>
                                        <p className="text-xs text-slate-500">By Students</p>
                                    </div>
                                </motion.div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 w-full overflow-hidden leading-none z-10 translate-y-[1px]">
                    <svg className="relative block w-full h-[50px] sm:h-[100px]" preserveAspectRatio="none" viewBox="0 0 1200 120" xmlns="http://www.w3.org/2000/svg">
                        <path className="fill-slate-50" d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V120H0V95.8C59.71,118.08,130.83,121.32,201.29,111.4,242.01,105.41,281.86,81.16,321.39,56.44Z"></path>
                    </svg>
                </div>
            </section>

            {/* Main Content Area */}
            <main id="vendors-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-grow w-full">
                <div className="mb-10 text-center sm:text-left">
                    <h2 className="text-3xl font-bold text-slate-900 tracking-tight">Our Campus Vendors</h2>
                    <p className="text-slate-500 mt-2 text-lg">Pick a restaurant and explore their delicious menus.</p>
                </div>

                {vendors.length > 0 ? (
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
                    >
                        {vendors.map((vendor) => (
                            <VendorCard key={vendor._id} vendor={vendor} />
                        ))}
                    </motion.div>
                ) : (
                    <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
                        <p className="text-lg text-slate-500 font-medium">No vendors available at the moment.</p>
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}