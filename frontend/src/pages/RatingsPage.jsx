import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
// --- NEW IMPORT ---
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const RatingsPage = () => {
  // --- STATE MANAGEMENT (Unchanged) ---
  const [reviews, setReviews] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [formData, setFormData] = useState({ 
    vendorName: "", 
    vendorId: "", 
    mealName: "", 
    comment: "" 
  });
  const [editingId, setEditingId] = useState(null);

  const user = JSON.parse(localStorage.getItem('user')) || { 
    name: "Alex Johnson", 
    email: "ishinidewmini713@gmail.com" 
  };

  const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Great' };

  // --- EFFECTS (Unchanged) ---
  useEffect(() => {
    fetchVendors();
    fetchReviews();
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [activeTab]);

  // --- LOGIC FUNCTIONS (Unchanged) ---
  const fetchReviews = async () => {
    try {
      setLoading(true);
      const url = activeTab === 'all' 
        ? 'http://localhost:5000/api/reviews/all' 
        : `http://localhost:5000/api/reviews/user/${user.email}`;
      const response = await axios.get(url);
      setReviews(response.data);
    } catch (err) {
      console.error("Failed to fetch reviews", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/vendors');
      setVendors(response.data);
    } catch (err) {
      setVendors([
        { _id: "v1", name: "Campus Grill" },
        { _id: "v2", name: "New Building canteen" },
        { _id: "v3", name: "Basement Canteen" },
        {_id: "v4", name: "Anohana Canteen" },
        {_id: "v5", name: "Fingles" }
      ]);
    }
  };

  const getVendorName = (vendorId, savedName) => {
    const foundVendor = vendors.find(v => v._id === vendorId);
    return foundVendor ? foundVendor.name : (savedName || "Unknown Vendor");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a rating");
    const reviewData = { ...formData, rating, userEmail: user.email, userName: user.name, date: new Date().toISOString() };
    try {
      if (editingId) {
        await axios.put(`http://localhost:5000/api/reviews/update/${editingId}`, reviewData);
        setEditingId(null);
      } else {
        await axios.post('http://localhost:5000/api/reviews/add', reviewData);
      }
      setFormData({ vendorName: "", vendorId: "", mealName: "", comment: "" });
      setRating(0);
      fetchReviews();
    } catch (err) {
      alert("Submission failed. Check backend connection.");
    }
  };

  const handleEdit = (review) => {
    setEditingId(review._id);
    setFormData({ vendorName: review.vendorName, vendorId: review.vendorId, mealName: review.mealName, comment: review.comment });
    setRating(review.rating);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure?")) {
      try {
        await axios.delete(`http://localhost:5000/api/reviews/delete/${id}`);
        fetchReviews();
      } catch (err) {
        alert("Delete failed.");
      }
    }
  };

  const getAverageRatings = () => {
    const vendorRatings = {};
    reviews.forEach((review) => {
      const vendorId = review.vendorId || "unknown";
      if (!vendorRatings[vendorId]) {
        vendorRatings[vendorId] = {
          total: 0,
          count: 0,
          name: getVendorName(review.vendorId, review.vendorName)
        };
      }
      vendorRatings[vendorId].total += review.rating;
      vendorRatings[vendorId].count += 1;
    });

    return Object.keys(vendorRatings).map((vendorId) => ({
      vendorId,
      vendorName: vendorRatings[vendorId].name,
      // Formatting to Number for the Chart
      average: parseFloat((vendorRatings[vendorId].total / vendorRatings[vendorId].count).toFixed(1)),
      count: vendorRatings[vendorId].count
    }));
  };

  const avgRatings = getAverageRatings();

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20 font-sans text-gray-800">
      
      {/* --- NAVBAR (Unchanged) --- */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-orange-500 p-2 rounded-xl shadow-lg shadow-orange-100">
            <span className="text-white text-xl">🍴</span> 
          </div>
          <span className="text-xl font-black tracking-tighter">UniEats</span>
        </div>
        
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-10 h-10 bg-orange-50 rounded-full border border-orange-100 flex items-center justify-center text-orange-600 font-bold text-xs hover:bg-orange-100 transition-all shadow-sm"
          >
            {user.name.split(' ').map(n => n[0]).join('')}
          </button>

          {isDropdownOpen && (
            <div className="absolute right-0 mt-3 w-60 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-50">
              <div className="px-5 py-3 border-b border-gray-50">
                <p className="text-sm font-bold">{user.name}</p>
                <p className="text-[10px] text-gray-400 truncate">{user.email}</p>
              </div>
              <div className="py-2">
                <button onClick={() => window.location.href = "/profile"} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors">
                  <span>👤</span> Profile
                </button>
                <button onClick={() => window.location.href = "/ratings"} className="w-full flex items-center gap-3 px-5 py-3 text-sm font-bold text-gray-600 hover:bg-orange-50 hover:text-orange-500 transition-colors">
                  <span className="text-base text-orange-500">☆</span> Reviews
                </button>
                <button className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-semibold text-gray-300 cursor-not-allowed"><span className="opacity-50">📋</span> Orders</button>
              </div>
              <div className="border-t border-gray-50 mt-1 pt-1">
                <button onClick={() => window.location.href = "/login"} className="w-full flex items-center gap-3 px-5 py-2.5 text-sm font-bold text-red-400 hover:bg-red-50">Log out</button>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* --- HEADER --- */}
      <div className="max-w-4xl mx-auto pt-12 px-6 text-center">
        <h1 className="text-3xl font-extrabold flex items-center justify-center gap-3">
          <span className="text-orange-500 text-2xl">☆</span> Rate Meals & Vendors
        </h1>
        <p className="text-gray-400 font-medium mt-2">Share your food experience with the campus community</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-10">
        
        {/* ✅ NEW CHART SECTION */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-10">
          <h2 className="text-xs font-black uppercase text-gray-400 mb-6 tracking-widest">Vendor Popularity & Ratings</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgRatings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis 
                  dataKey="vendorName" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fontSize: 10, fontWeight: 700}} 
                />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip 
                  cursor={{fill: '#FFF7ED'}}
                  contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}}
                />
                <Bar dataKey="average" radius={[10, 10, 0, 0]} barSize={40}>
                  {avgRatings.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.average >= 4 ? '#f97316' : '#fdba74'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* --- REST OF YOUR UI (Unchanged) --- */}
        {/* Top Vendor Ratings Grid */}
        <div className="mb-10">
          <h2 className="text-lg font-bold mb-4">Top Vendor Ratings</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {avgRatings.length > 0 ? (
              avgRatings.map((vendor) => (
                <div key={vendor.vendorId} className="bg-white p-5 rounded-xl shadow-md">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold">{vendor.vendorName}</h3>
                    <span className="text-xs text-gray-400">{vendor.count} reviews</span>
                  </div>
                  <div className="flex items-center gap-2 mt-2">
                    {[...Array(5)].map((_, i) => (
                      <span key={i} className="text-orange-500">
                        {i < Math.round(vendor.average) ? "★" : "☆"}
                      </span>
                    ))}
                    <span className="text-orange-500 font-bold ml-1">{vendor.average}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-300">No ratings yet</p>
            )}
          </div>
        </div>

        {/* --- INPUT FORM (Unchanged) --- */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-10">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-8">
            <span className="text-orange-500">☆</span> {editingId ? "Update Your Review" : "Rate a Meal"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Vendor</label>
                <select 
                  value={formData.vendorName}
                  onChange={(e) => {
                    const selectedVendor = vendors.find(v => v.name === e.target.value);
                    setFormData({ ...formData, vendorName: e.target.value, vendorId: selectedVendor?._id || "" });
                  }}
                  className="w-full p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 font-semibold text-sm outline-none focus:bg-white focus:border-orange-200 transition-all"
                  required
                >
                  <option value="">Select vendor...</option>
                  {vendors.map(v => <option key={v._id} value={v.name}>{v.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Meal Name</label>
                <input 
                  type="text"
                  placeholder="e.g. Grilled Chicken Wrap"
                  value={formData.mealName}
                  onChange={(e) => setFormData({...formData, mealName: e.target.value})}
                  className="w-full p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 font-semibold text-sm outline-none focus:bg-white focus:border-orange-200 transition-all"
                  required
                />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Rating</label>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    className={`text-3xl transition-all ${star <= (hover || rating) ? 'text-orange-500' : 'text-gray-200'}`}
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHover(star)}
                    onMouseLeave={() => setHover(0)}
                  >★</button>
                ))}
                <span className="ml-3 text-[10px] font-bold text-gray-300 uppercase">{ratingLabels[hover || rating] || 'Select Rating'}</span>
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Your Review</label>
              <textarea 
                className="w-full p-4 rounded-xl border border-gray-100 bg-gray-50/50 min-h-[120px] text-sm outline-none focus:bg-white focus:border-orange-200 transition-all resize-none"
                placeholder="Share your experience..."
                value={formData.comment}
                onChange={(e) => setFormData({...formData, comment: e.target.value})}
                maxLength="500"
                required
              />
            </div>
            <div className="flex justify-end">
                <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg shadow-orange-100 transition-all flex items-center gap-2 active:scale-95 text-[11px] uppercase tracking-widest">
                  <span className="text-sm">🚀</span> {editingId ? "Update Review" : "Submit Review"}
                </button>
            </div>
          </form>
        </div>

        {/* --- TABS & REVIEW LIST (Unchanged) --- */}
        <div className="flex bg-gray-100/50 p-1 rounded-2xl mb-8 border border-gray-100">
          <button onClick={() => setActiveTab('all')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'all' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>≡ All Reviews</button>
          <button onClick={() => setActiveTab('my')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'my' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-400'}`}>👤 My Reviews</button>
        </div>

        <div className="space-y-4">
          {loading ? (
             <div className="text-center py-10 text-orange-400 animate-pulse font-bold text-xs uppercase tracking-widest">Loading Reviews...</div>
          ) : reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review._id} className="bg-white p-6 rounded-3xl border border-gray-50 shadow-sm transition hover:shadow-md group relative">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-50 rounded-full flex items-center justify-center text-orange-500 font-bold text-[10px] border border-orange-100 uppercase">
                    {review.userName?.substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-bold text-sm">{review.userName}</h4>
                      <span className="text-[9px] text-gray-300 font-bold uppercase">{new Date(review.createdAt || review.date).toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex text-orange-500 text-[10px]">
                        {[...Array(5)].map((_, i) => <span key={i}>{i < review.rating ? "★" : "☆"}</span>)}
                      </div>
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-600 text-[8px] font-black rounded-full uppercase border border-orange-100">
                        {getVendorName(review.vendorId, review.vendorName)}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-50 text-gray-400 text-[8px] font-black rounded-full uppercase border border-gray-100">
                        {review.mealName}
                      </span>
                    </div>
                    <p className="text-gray-600 text-xs font-medium leading-relaxed">{review.comment}</p>
                  </div>
                  {user.email === review.userEmail && (
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => handleEdit(review)} className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 rounded-lg transition">✏️</button>
                        <button onClick={() => handleDelete(review._id)} className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition">🗑️</button>
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-gray-200">
              <p className="text-gray-300 font-bold uppercase text-[10px] tracking-widest">No reviews found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RatingsPage;