import React, { useState, useEffect } from "react";
import { 
  Search, 
  ShieldCheck, 
  Truck, 
  CreditCard, 
  Star, 
  User, 
  BookOpen, 
  ChevronDown,
  ChevronUp,
  MessageCircle,
  Mail,
  MapPin,
  ArrowLeft
} from "lucide-react";

// Importing your custom Header and Footer
import Header from '../../../src/components/Header';
import Footer from '../../../src/components/Footer';

const HelpCenter = () => {
  // --- USER AUTH LOGIC ---
  const [userProfile, setUserProfile] = useState(null);

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

  // --- COMPONENT STATE ---
  const [activeCategory, setActiveCategory] = useState("Account & Login");
  const [openFaqIndex, setOpenFaqIndex] = useState(null);
  const [isShowingAll, setIsShowingAll] = useState(false); // State for "Show all"

  // Data for the category buttons
  const categories = [
    { name: "Account & Login", icon: <ShieldCheck />, count: 5 },
    { name: "Order & Pickup", icon: <Truck />, count: 8 },
    { name: "Payments", icon: <CreditCard />, count: 4 },
    { name: "Loyalty & Rewards", icon: <Star />, count: 3 },
    { name: "Profile", icon: <User />, count: 4 },
    { name: "General", icon: <BookOpen />, count: 6 },
  ];

  const faqData = {
    "Account & Login": [
      { 
        question: "How do I create a UniEats account?", 
        tag: "Account & Login",
        answer: "Visit the registration page and sign up using your university email address, student ID, and basic profile information. You'll receive a confirmation to verify your account."
      },
      { 
        question: "I forgot my password. How can I reset it?", 
        tag: "Account & Login",
        answer: "To reset your password, click the 'Forgot Password' link on the login page. Enter your registered university email address, and we will send you a link to create a new password."
      }
    ],
    "Order & Pickup": [
      { 
        question: "How does the food pickup system work?", 
        tag: "Order & Pickup",   
        answer: "Browse available meals from campus vendors, place your order, and receive a pickup notification when your food is ready. Head to the vendors pickup counter and show your order confirmation."
      },
      { question: "Can I cancel or modify my order?", tag: "Order & Pickup", answer: "You can cancel or modify your order within 5 minutes of placing it. After that, the vendor may have already started preparing your meal." },
      { question: "What are the pickup hours?", tag: "Order & Pickup", answer: "Pickup hours vary by vendor. Most campus vendors operate from 7:00 AM to 9:00 PM on weekdays and 9:00 AM to 6:00 PM on weekends." }
    ],
    "Payments": [
      { question: "What payment methods are accepted?", tag: "Payments", answer: "UniEats accepts campus meal plans, credit/debit cards, and digital wallets. You can manage your payment methods in your profile settings." },
      { question: "How do I get a refund?", tag: "Payments", answer: "If your order was cancelled or there was an issue, refunds are processed automatically within 3-5 business days to your original payment method." }
    ],
    "Loyalty & Rewards": [
      { question: "How do I earn points on my orders?", tag: "Loyalty & Rewards", answer: "You earn 10 points for every order placed. Bonus points are awarded for leaving reviews, referring friends, and during special promotional periods." }
    ],
    "Profile": [
      { question: "How can I change my profile picture?", tag: "Profile", answer: "Go to your Profile page, click 'Edit Profile', and update your dietary preferences from the available options including Vegetarian, Vegan, Halal, Gluten-Free, and more." }
    ],
    "General": [
      { question: "What is UniEats?", tag: "General", answer: "UniEats is a campus food delivery platform that connects students with local vendors, offering a convenient way to order and pick up meals." }
    ]
  };

  // Helper to toggle accordion
  const toggleFaq = (uniqueKey) => {
    setOpenFaqIndex(openFaqIndex === uniqueKey ? null : uniqueKey);
  };

  // Logic to get which questions to display
  const displayQuestions = isShowingAll 
    ? Object.values(faqData).flat() 
    : faqData[activeCategory] || [];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <Header profile={userProfile} onLogout={handleLogout} />  

      {/* Search Section */}
      <section className="bg-orange-100 py-24 px-4 text-center">

        <h1 className="text-4xl font-extrabold mb-3 text-slate-800 tracking-tight">
          How can we <span className="text-[#f97316]">help</span> you?
        </h1>
        <p className="text-slate-500 font-medium mb-10 max-w-xl mx-auto">
          Search our knowledge base or browse categories below
        </p>
        <div className="max-w-2xl mx-auto relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#f97316]" size={20} />
          <input 
            type="text" 
            placeholder="Search for help articles..." 
            className="w-full pl-14 pr-6 py-4 rounded-2xl bg-white border border-slate-100 shadow-sm focus:outline-none focus:border-[#f97316] transition-all"
          />
        </div>
      </section>

      <main className="max-w-7xl mx-auto px-6 py-12">
        {!isShowingAll && (
          <>
            <h2 className="text-xl font-bold mb-8 cursor-default">Browse by Category</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-16">
              {categories.map((cat) => (
                <button
                  key={cat.name}
                  onClick={() => {
                    setActiveCategory(cat.name);
                    setOpenFaqIndex(null);
                  }}
                  className={`flex flex-col items-center p-6 rounded-2xl border transition-all ${
                    activeCategory === cat.name 
                    ? "border-[#f97316] bg-orange-50/50 shadow-sm" 
                    : "border-slate-100 bg-white hover:border-orange-200"
                  }`}
                >
                  <div className={`mb-3 ${activeCategory === cat.name ? "text-[#f97316]" : "text-slate-400"}`}>
                    {React.cloneElement(cat.icon, { size: 24 })}
                  </div>
                  <span className={`text-[13px] font-bold text-center leading-tight mb-2 ${activeCategory === cat.name ? "text-[#f97316]" : "text-slate-600"}`}>
                    {cat.name}
                  </span>
                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${activeCategory === cat.name ? "bg-[#f97316] text-white" : "bg-slate-800 text-white"}`}>
                    {cat.count}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}

        {/* Dynamic Question Section */}
        <section className="mb-20">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              {isShowingAll && (
                <button 
                  onClick={() => setIsShowingAll(false)}
                  className="p-2 hover:bg-slate-100 rounded-full transition-colors"
                >
                  <ArrowLeft size={20} className="text-slate-600" />
                </button>
              )}
              <h2 className="text-xl font-bold">
                {isShowingAll ? "All Frequently Asked Questions" : activeCategory}
              </h2>
            </div>
            {!isShowingAll && (
              <button 
                onClick={() => {
                  setIsShowingAll(true);
                  setOpenFaqIndex(null);
                }}
                className="text-[#f97316] text-sm font-bold hover:underline"
              >
                Show all
              </button>
            )}
          </div>
          
          <div className="space-y-4">
            {displayQuestions.map((faq, index) => {
              // Create a unique key for accordion tracking
              const uniqueKey = `${faq.tag}-${index}`;
              const isOpen = openFaqIndex === uniqueKey;
              
              return (
                <div 
                  key={uniqueKey} 
                  className={`border ${isOpen ? 'border-orange-100 bg-white shadow-lg shadow-orange-50' : 'border-slate-100 bg-white hover:border-orange-100'} rounded-2xl transition-all cursor-pointer group`}
                  onClick={() => toggleFaq(uniqueKey)}
                >
                  <div className="flex items-center justify-between p-5">
                    <div className="flex items-center gap-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-lg text-slate-500">
                        {faq.tag}
                      </span>
                      <span className={`font-bold transition-colors ${isOpen ? 'text-[#f97316]' : 'text-slate-700 group-hover:text-[#f97316]'}`}>
                        {faq.question}
                      </span>
                    </div>
                    {isOpen ? <ChevronUp className="text-[#f97316]" size={20} /> : <ChevronDown className="text-slate-300" size={20} />}
                  </div>

                  {isOpen && (
                    <div className="px-5 pb-6 pt-1 border-t border-slate-50">
                      <p className="text-sm text-slate-500 leading-relaxed font-medium pl-[106px] pr-8">
                        {faq.answer}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Contact Support Section */}
        <h2 className="text-xl font-bold mb-8 cursor-default">Still need help?</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <SupportCard icon={<MessageCircle />} title="Live Chat" desc="Chat with our support team in real-time" linkText="Start chat" />
          <SupportCard icon={<Mail />} title="Email Support" desc="support@unieats.edu" linkText="Response within 24 hours" />
          <SupportCard icon={<MapPin />} title="Visit Us" desc="Student Services Building, Room 104" linkText="Mon-Fri, 9AM-5PM" />
        </div>
      </main>

      <Footer />
    </div>
  );
};

const SupportCard = ({ icon, title, desc, linkText }) => (
  <div className="p-6 border border-slate-100 rounded-2xl bg-white hover:shadow-md transition-shadow group cursor-pointer">
    <div className="text-[#f97316] mb-4 bg-orange-50 w-fit p-3 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
    <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
    <p className="text-slate-500 text-sm mb-4 leading-relaxed">{desc}</p>
    <button className="text-[#f97316] text-sm font-bold flex items-center gap-1 hover:gap-2 transition-all">
      {linkText}
    </button>
  </div>
);

export default HelpCenter;