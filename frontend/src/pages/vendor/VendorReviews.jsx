import React, { useEffect, useState } from "react";
import axios from "axios";
import { Trash2, Star, Send, MessageSquare } from "lucide-react";
import VendorSidebar from "./components/VendorSidebar"; // Ensure this path is correct
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Cell,
} from "recharts";

const VendorReviewsPage = () => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [filter, setFilter] = useState(0);
  const [replyText, setReplyText] = useState({});
  const [avgRating, setAvgRating] = useState(0);

  // ✅ Get vendor info from storage
  const userRaw = localStorage.getItem("user") || sessionStorage.getItem("unieatsUser");
  const user = userRaw ? JSON.parse(userRaw) : null;
  const vendorId = user?._id;

  useEffect(() => {
    if (vendorId) {
      fetchReviews();
      const interval = setInterval(() => {
        fetchReviews(); 
      }, 15000); // Auto refresh every 15s
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [vendorId]);

  const fetchReviews = async () => {
  try {
    const res = await axios.get(`http://localhost:5000/api/reviews/vendor/${vendorId}`);
    console.log("Fetched Reviews:", res.data); // CHECK THIS IN BROWSER CONSOLE
    setReviews(res.data);
    calculateAvg(res.data);
  } catch (err) {
    console.error("API Error:", err);
  } finally {
    setLoading(false);
  }
};

  const calculateAvg = (data) => {
    if (data.length === 0) return setAvgRating(0);
    const sum = data.reduce((acc, r) => acc + r.rating, 0);
    setAvgRating((sum / data.length).toFixed(1));
  };

  const filteredReviews = filter === 0 
    ? reviews 
    : reviews.filter((r) => r.rating === filter);

  const ratingData = [5, 4, 3, 2, 1].map((star) => ({
    name: `${star}★`,
    count: reviews.filter((r) => r.rating === star).length,
  }));

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this review?")) {
      await axios.delete(`http://localhost:5000/api/reviews/delete/${id}`);
      fetchReviews();
    }
  };

  const handleReply = async (id) => {
    if (!replyText[id]) return;
    try {
      await axios.put(`http://localhost:5000/api/reviews/update/${id}`, {
        reply: replyText[id],
      });
      setReplyText({ ...replyText, [id]: "" });
      fetchReviews();
      alert("Reply sent!");
    } catch (err) {
      console.error(err);
    }
  };

  if (!vendorId) return <div className="p-10 text-center">Error: Vendor ID not found. Please log in again.</div>;

  return (
    <div className="flex min-h-screen bg-[#FDFCFB]">
      {/* SIDEBAR */}
      <VendorSidebar
        activeTab="reviews"
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
        user={user}
        onLogout={() => {
          localStorage.clear();
          sessionStorage.clear();
          window.location.href = "/login";
        }}
      />

      {/* MAIN CONTENT */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"} p-8`}>
        
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Review Management</h1>
          <p className="text-gray-500">See what students are saying about your meals</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* ⭐ STATS CARD */}
          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col justify-center items-center">
            <span className="text-gray-400 uppercase text-[10px] font-black tracking-widest mb-2">Overall Rating</span>
            <div className="text-5xl font-black text-orange-500 mb-2">{avgRating}</div>
            <div className="flex text-orange-400 gap-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} size={18} fill={i < Math.round(avgRating) ? "currentColor" : "none"} />
              ))}
            </div>
            <p className="text-gray-400 text-xs mt-4 font-bold">{reviews.length} Total Reviews</p>
          </div>

          {/* ⭐ CHART CARD */}
          <div className="lg:col-span-2 bg-white p-6 rounded-[2rem] shadow-sm border border-gray-100">
            <h3 className="text-xs font-black uppercase text-gray-400 mb-4 tracking-widest">Rating Distribution</h3>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={ratingData} layout="vertical">
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" radius={[0, 10, 10, 0]}>
                  {ratingData.map((entry, index) => (
                    <Cell key={index} fill={entry.count > 0 ? "#f97316" : "#f3f4f6"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ⭐ FILTER TOGGLES */}
        <div className="flex gap-2 mb-6">
          {[0, 5, 4, 3, 2, 1].map((star) => (
            <button
              key={star}
              onClick={() => setFilter(star)}
              className={`px-5 py-2 rounded-xl font-bold text-xs transition-all ${
                filter === star ? "bg-orange-500 text-white shadow-lg shadow-orange-200" : "bg-white text-gray-400 border border-gray-100 hover:bg-gray-50"
              }`}
            >
              {star === 0 ? "All Reviews" : `${star} Star`}
            </button>
          ))}
        </div>

        {/* REVIEW LIST */}
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center p-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div></div>
          ) : filteredReviews.length === 0 ? (
            <div className="bg-white p-10 rounded-[2rem] text-center border border-dashed border-gray-200">
              <MessageSquare className="mx-auto text-gray-200 mb-4" size={48} />
              <p className="text-gray-400 font-bold uppercase text-[10px] tracking-widest">No matching reviews found</p>
            </div>
          ) : (
            filteredReviews.map((r) => (
              <div key={r._id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 transition-hover hover:shadow-md group">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-600 font-bold text-xs uppercase">
                        {r.userName?.substring(0, 2)}
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-800 text-sm">{r.userName}</h4>
                        <p className="text-[10px] text-gray-400 font-bold uppercase">{r.mealName} • {new Date(r.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="flex text-orange-400 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} fill={i < r.rating ? "currentColor" : "none"} />
                      ))}
                    </div>

                    <p className="text-gray-600 text-sm font-medium mb-4 italic">"{r.comment}"</p>

                    {/* VENDOR REPLY SECTION */}
                    <div className="mt-4">
                      {r.reply ? (
                        <div className="bg-orange-50/50 p-4 rounded-2xl border border-orange-100">
                          <p className="text-[9px] font-black text-orange-500 uppercase tracking-widest mb-1">Your Response</p>
                          <p className="text-gray-700 text-xs font-semibold">{r.reply}</p>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <input
                            value={replyText[r._id] || ""}
                            onChange={(e) => setReplyText({ ...replyText, [r._id]: e.target.value })}
                            className="flex-1 bg-gray-50 border-none rounded-xl px-4 py-2 text-xs font-medium focus:ring-2 focus:ring-orange-200 outline-none"
                            placeholder="Write a polite response..."
                          />
                          <button
                            onClick={() => handleReply(r._id)}
                            className="bg-gray-800 text-white p-2 rounded-xl hover:bg-black transition-colors"
                          >
                            <Send size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => handleDelete(r._id)}
                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default VendorReviewsPage;