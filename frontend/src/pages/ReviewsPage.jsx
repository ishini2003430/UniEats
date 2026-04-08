import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import Header from '../../src/components/Header';
import Footer from '../../src/components/Footer';

const ReviewsPage = () => {
  const [profile, setProfile] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [formData, setFormData] = useState({ 
    vendorName: "", 
    vendorId: "", 
    mealName: "", 
    comment: "" 
  });
  const [editingId, setEditingId] = useState(null);

  // Get basic user info from localStorage
  const user = JSON.parse(localStorage.getItem('user')) || { 
    name: "Alex Johnson", 
    email: "student@sliit.lk" 
  };

  const ratingLabels = { 1: 'Poor', 2: 'Fair', 3: 'Good', 4: 'Very Good', 5: 'Great' };

  useEffect(() => {
    fetchProfile();
    fetchVendors();
    fetchReviews();
  }, [activeTab]);

  const fetchProfile = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/profile/fetch/${user.email}`);
      setProfile(response.data);
    } catch (err) {
      setProfile(user);
    }
  };




  
  const fetchVendors = async () => {
    try {
      // Adjusted path to match your Auth Route for vendors
      const response = await axios.get('http://localhost:5000/api/users/vendors'); 
      const formattedVendors = response.data.map(v => ({
        _id: v._id,
        name: v.vendorName || v.name 
      }));
      setVendors(formattedVendors);
    } catch (err) {
      console.error("Failed to fetch vendors from DB, using fallbacks", err);
      setVendors([
        { _id: "v1", name: "Campus Grill (Offline)" },
        { _id: "v2", name: "Basement Canteen (Offline)" }
      ]);
    }
  };

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

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
  };

  const getVendorName = (vendorId, savedName) => {
    const foundVendor = vendors.find(v => v._id === vendorId);
    return foundVendor ? foundVendor.name : (savedName || "Unknown Vendor");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return alert("Please select a rating");
    
    const reviewData = { 
      ...formData, 
      rating, 
      userEmail: user.email, 
      userName: profile?.name || user.name, 
      date: new Date().toISOString() 
    };

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
    setFormData({ 
      vendorName: review.vendorName, 
      vendorId: review.vendorId, 
      mealName: review.mealName, 
      comment: review.comment 
    });
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
      average: parseFloat((vendorRatings[vendorId].total / vendorRatings[vendorId].count).toFixed(1)),
      count: vendorRatings[vendorId].count
    }));
  };

  const avgRatings = getAverageRatings();

  return (
    <div className="min-h-screen bg-[#FDFCFB] pb-20 font-sans text-gray-800">
      <Header profile={profile} onLogout={handleLogout} />

      <div className="max-w-4xl mx-auto pt-12 px-6 text-center">
        <h1 className="text-3xl font-extrabold flex items-center justify-center gap-3">
          <span className="text-orange-500 text-2xl">☆</span> Rate Meals & Vendors
        </h1>
        <p className="text-gray-400 font-medium mt-2">Share your food experience with the campus community</p>
      </div>

      <div className="max-w-4xl mx-auto px-6 mt-10">
        {/* Chart Section */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-10">
          <h2 className="text-xs font-black uppercase text-gray-400 mb-6 tracking-widest">Vendor Popularity & Ratings</h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={avgRatings}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="vendorName" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 700}} />
                <YAxis domain={[0, 5]} axisLine={false} tickLine={false} tick={{fontSize: 10}} />
                <Tooltip cursor={{fill: '#FFF7ED'}} contentStyle={{borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                <Bar dataKey="average" radius={[10, 10, 0, 0]} barSize={40}>
                  {avgRatings.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.average >= 4 ? '#f97316' : '#fdba74'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Input Form */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm mb-10">
          <h2 className="text-lg font-bold flex items-center gap-2 mb-8">
            <span className="text-orange-500">☆</span> {editingId ? "Update Your Review" : "Rate a Meal"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block">Vendor</label>
                <select 
                  value={formData.vendorId} 
                  onChange={(e) => {
                    const selectedId = e.target.value;
                    const selectedVendor = vendors.find(v => v._id === selectedId);
                    setFormData({ 
                      ...formData, 
                      vendorId: selectedId, 
                      vendorName: selectedVendor?.name || "" 
                    });
                  }}
                  className="w-full p-3.5 rounded-xl border border-gray-100 bg-gray-50/50 font-semibold text-sm outline-none focus:bg-white focus:border-orange-200 transition-all"
                  required
                >
                  <option value="">Select vendor...</option>
                  {vendors.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
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
            
            {/* Rating Stars */}
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
                <button type="submit" className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-xl shadow-lg transition-all flex items-center gap-2 active:scale-95 text-[11px] uppercase tracking-widest">
                  <span className="text-sm">🚀</span> {editingId ? "Update Review" : "Submit Review"}
                </button>
            </div>
          </form>
        </div>

        {/* Tabs & Review List */}
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
                    {(review.userName || "U").substring(0, 2)}
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
      <Footer />
    </div>
  );
};

export default ReviewsPage;