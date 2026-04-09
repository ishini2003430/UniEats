import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';
import Header from '../../src/components/Header';
import Footer from '../../src/components/Footer';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [pointsHistory, setPointsHistory] = useState([]);
  
  const fileInputRef = useRef(null);
  const historyRef = useRef(null);
  const [voucherCode, setVoucherCode] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-Free', 'Kosher', 'Dairy-Free'];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('user'));
    const email = user?.email;

    if (!email) {
      setError("No user logged in found.");
      setLoading(false);
      return;
    }

    const fetchProfileData = async () => {
      try {
        const response = await axios.get(`http://localhost:5000/api/profile/fetch/${email}`);
        setProfile(response.data);
        setFormData(response.data);
        setPointsHistory(response.data.recentActivity || response.data.pointsHistory || []);
        
        const savedImg = localStorage.getItem(`profile_img_${email}`);
        if (savedImg) setProfileImage(savedImg);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfileData();

    const socket = io("http://localhost:5000");
    socket.on(`pointsUpdated_${email}`, (data) => {
      // This ensures the Header notification updates in real-time via socket
      setProfile(prev => ({ ...prev, loyaltyPoints: data.newBalance }));
      if (data.activity) {
        setPointsHistory(prev => [data.activity, ...prev]);
      }
    });

    return () => socket.disconnect();
  }, []);

  const handleClaimFreeMeal = async () => {
    if (window.confirm("Redeem 1000 points for a 50% Discount Voucher?")) {
      try {
        setLoading(true);
        const response = await axios.post(`http://localhost:5000/api/profile/add-points`, {
          email: profile.email,
          orderAmount: -1000, 
          description: "Redeemed: 50% Discount Voucher"
        });

        // Trigger immediate state update for Header notifications
        const newBalance = response.data?.newBalance ?? (profile.loyaltyPoints - 1000);
        setProfile(prev => ({ ...prev, loyaltyPoints: newBalance }));
        
        const randomCode = `EATS-50OFF-${Math.random().toString(36).toUpperCase().slice(2, 7)}`;
        setVoucherCode(randomCode);
        
        alert("Points Redeemed! Your notification and balance have been updated.");
      } catch (err) {
        alert(err.response?.data?.message || "Error redeeming points.");
      } finally {
        setLoading(false);
      }
    }
  };

  const handleImageClick = () => { if (isEditing) fileInputRef.current.click(); };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result;
        setProfileImage(base64String);
        if (profile?.email) localStorage.setItem(`profile_img_${profile.email}`, base64String);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => { setFormData({ ...formData, [e.target.name]: e.target.value }); };

  const handleDietaryChange = (pref) => {
    const currentPrefs = formData.dietaryPreferences || [];
    const newPrefs = currentPrefs.includes(pref) ? currentPrefs.filter((p) => p !== pref) : [...currentPrefs, pref];
    setFormData({ ...formData, dietaryPreferences: newPrefs });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await axios.put(`http://localhost:5000/api/profile/update/${profile.email}`, formData);
      setProfile(response.data);
      setIsEditing(false);
    } catch (err) { alert("Update failed"); } finally { setLoading(false); }
  };

  const handleDeleteAccount = async () => {
    if (!profile?.email) return;
    if (window.confirm("Are you sure? This will permanently delete your account.")) {
      try {
        setLoading(true);
        await axios.delete(`http://localhost:5000/api/profile/delete/${profile.email}`);
        localStorage.removeItem('user');
        window.location.href = "/login"; 
      } catch (err) { alert("Delete Failed"); } finally { setLoading(false); }
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory) setTimeout(() => historyRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = "/login";
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-orange-600 font-bold animate-pulse">Loading...</div>;
  if (error) return <div className="text-red-500 text-center mt-10 font-bold">{error}</div>;

  const currentPoints = profile.loyaltyPoints || 0;

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col text-left">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

      {/* The profile prop here sends the updated points to the Header */}
      <Header profile={profile} onLogout={handleLogout} />

      <div className="max-w-7xl mx-auto px-10 py-10 w-full">
        <main className="flex-grow w-full">
          {/* Profile Header Card */}
          <div className="bg-[#FFF8F3] rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between mb-10 border border-orange-50/50 shadow-sm">
            <div className="flex items-center gap-8">
              <div 
                onClick={handleImageClick}
                className={`w-28 h-28 bg-orange-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl ring-8 ring-white overflow-hidden transition-all ${isEditing ? 'cursor-pointer hover:scale-105 active:scale-95 group relative' : ''}`}
              >
                {profileImage ? (
                  <img src={profileImage} alt="profile" className="w-full h-full object-cover" />
                ) : (
                  profile.name?.substring(0, 2).toUpperCase()
                )}
                {isEditing && (
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-sm">📸</span>
                  </div>
                )}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-800 mb-1">{profile.name}</h1>
                <p className="text-gray-400 font-medium text-lg">
                  {profile.department || "Computing"} · {profile.email?.split('@')[0]}
                </p>
              </div>
            </div>
            
            {!isEditing && (
              <div className="flex gap-4 mt-6 md:mt-0">
                <button 
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-3 rounded-xl font-bold transition shadow-lg shadow-orange-200"
                >
                  ✏️ Edit Profile
                </button>
                <button onClick={handleDeleteAccount} className="p-3 border border-red-100 text-red-400 rounded-xl hover:bg-red-100 hover:text-red-600 transition-all duration-200 active:scale-95">
                  🗑️
                </button>
              </div>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-8 animate-in fade-in duration-300">
               <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-10">Personal Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                     <EditInput label="Full Name" name="name" value={formData.name} onChange={handleInputChange} />
                     <EditInput label="Email" value={formData.email} disabled />
                     <EditInput label="Phone" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} />
                     <EditInput label="Department" name="department" value={formData.department} onChange={handleInputChange} />
                  </div>
               </div>

               <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm">
                  <h2 className="text-xl font-bold text-gray-800 mb-10">Dietary Preferences</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-y-6 mb-8">
                    {dietaryOptions.map((opt) => (
                      <label key={opt} className="flex items-center gap-3 cursor-pointer group">
                        <div 
                          onClick={() => handleDietaryChange(opt)}
                          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                            formData.dietaryPreferences?.includes(opt) ? 'border-orange-500 bg-orange-50' : 'border-gray-200'
                          }`}
                        >
                          {formData.dietaryPreferences?.includes(opt) && <div className="w-3 h-3 bg-orange-500 rounded-full" />}
                        </div>
                        <span className="text-sm font-bold text-gray-600 group-hover:text-gray-900">{opt}</span>
                      </label>
                    ))}
                  </div>
                  <div className="mt-10">
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block ml-1">Allergies / Other Notes</label>
                    <textarea 
                      name="allergies"
                      value={formData.allergies || ""}
                      onChange={handleInputChange}
                      className="w-full p-5 rounded-2xl border border-gray-200 bg-[#F9FAFB] text-lg font-bold focus:bg-white focus:border-orange-500 outline-none transition-all min-h-[150px] resize-none"
                    />
                  </div>
               </div>

               <div className="flex justify-end gap-4 mt-8">
                  <button onClick={() => setIsEditing(false)} className="px-10 py-3 bg-gray-100 text-gray-500 rounded-xl font-bold hover:bg-gray-200 transition">Cancel</button>
                  <button onClick={handleSave} className="px-10 py-3 bg-orange-500 text-white rounded-xl font-bold shadow-lg shadow-orange-100 hover:bg-orange-600 transition">Save Changes</button>
               </div>
            </div>
          ) : (
            <div className="space-y-10">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Contact Card */}
                <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm h-full">
                  <h2 className="text-xl font-bold text-gray-800 mb-10 tracking-tight">Contact Info</h2>
                  <div className="space-y-8">
                    <DisplayItem icon="✉️" label="Email" value={profile.email} iconBg="bg-orange-50" iconColor="text-orange-500" />
                    <div className="h-[1px] bg-gray-50"></div>
                    <DisplayItem icon="📞" label="Phone" value={profile.contactNumber || "+94 77 123 4567"} iconBg="bg-orange-50" iconColor="text-orange-500" />
                  </div>
                </div>

                {/* Rewards Card */}
                <div className="flex flex-col gap-6">
                  <div className="bg-[#FFF8F3] p-10 rounded-[2rem] border border-orange-100 shadow-sm text-gray-800 relative overflow-hidden">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-orange-500 text-lg">✨</span>
                      <h2 className="text-xl font-bold text-gray-800">Rewards</h2>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-orange-400/80">Loyalty Points</p>
                    <div className="my-6 flex items-baseline gap-2">
                      <span className={`text-6xl font-black transition-colors duration-500 ${currentPoints >= 1000 ? 'text-yellow-500' : 'text-orange-600'}`}>
                        {currentPoints}
                      </span>
                      <span className="text-lg font-bold text-orange-400">PTS</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex justify-between text-[10px] font-bold text-gray-400">
                        <span>{currentPoints >= 1000 ? "🏆 DISCOUNT UNLOCKED" : "Progress to 50% Off"}</span>
                        <span className="text-orange-500">{currentPoints} / 1000</span>
                      </div>
                      
                      <div className="w-full bg-orange-100/50 h-3 rounded-full overflow-hidden">
                        <div 
                          className={`h-full transition-all duration-1000 ${currentPoints >= 1000 ? 'bg-yellow-400 shadow-[0_0_15px_#facc15]' : 'bg-orange-500'}`} 
                          style={{ width: `${Math.min((currentPoints / 1000) * 100, 100)}%` }}
                        ></div>
                      </div>

                      {currentPoints >= 1000 && !voucherCode && (
                        <button 
                          className="w-full mt-4 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-black text-xs uppercase tracking-widest rounded-xl shadow-lg hover:scale-[1.02] transition-transform animate-pulse"
                          onClick={handleClaimFreeMeal}
                        >
                          🎁 Claim 50% Off Meal
                        </button>
                      )}

                      {voucherCode && (
                        <div className="mt-4 p-4 bg-white border-2 border-dashed border-yellow-500 rounded-2xl text-center shadow-inner animate-in zoom-in duration-300">
                           <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">Apply Voucher</p>
                           <p className="text-xl font-black text-orange-600 tracking-widest mt-1">{voucherCode}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Recent Points History */}
                  <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex-grow">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Recent Points</h3>
                      <button onClick={toggleHistory} className="text-[10px] font-bold text-orange-500 hover:underline">View All</button>
                    </div>
                    <div className="space-y-4">
                      {pointsHistory.length > 0 ? pointsHistory.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 border-b border-gray-50 last:border-0">
                          <div className="flex flex-col">
                            <span className="text-sm font-extrabold text-gray-700">{item.description || "Food Order"}</span>
                            <span className="text-[10px] text-gray-400 font-bold">{item.date ? new Date(item.date).toLocaleDateString() : 'Recent'}</span>
                          </div>
                          <span className={`text-sm font-black ${(item.points || item.pts) > 0 ? 'text-green-500' : 'text-red-400'}`}>
                            {(item.points || item.pts) > 0 ? '+' : ''}{item.points || item.pts || 0}
                          </span>
                        </div>
                      )) : <p className="text-center text-gray-400 text-xs py-4 font-bold">No points activity yet</p>}
                    </div>
                  </div>
                </div>

                {/* University Card */}
                <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm h-full">
                  <h2 className="text-xl font-bold text-gray-800 mb-10 tracking-tight">University Info</h2>
                  <div className="space-y-8">
                    <DisplayItem icon="#" label="Student ID" value={profile.email?.split('@')[0] || "STU-2024"} iconBg="bg-orange-50" iconColor="text-orange-500" />
                    <div className="h-[1px] bg-gray-50"></div>
                    <DisplayItem icon="🏢" label="Department" value={profile.department || "Computing"} iconBg="bg-orange-50" iconColor="text-orange-500" />
                  </div>
                </div>
              </div>

              {/* Dietary Preferences Card */}
              <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm">
                 <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-3">
                   <span className="text-orange-500">🍃</span> Dietary Preferences
                 </h2>
                 <div className="flex flex-wrap gap-3">
                   {profile.dietaryPreferences?.length > 0 ? (
                     profile.dietaryPreferences.map((pref, i) => (
                       <span key={i} className="px-6 py-2.5 bg-orange-50 text-orange-700 text-sm font-bold rounded-full border border-orange-100 shadow-sm uppercase tracking-wide">
                         {pref}
                       </span>
                     ))
                   ) : (
                     <span className="px-6 py-2.5 bg-orange-50 text-orange-700 text-sm font-bold rounded-full border border-orange-100 shadow-sm uppercase tracking-wide">Standard</span>
                   )}
                 </div>
              </div>

              {/* Full History Table */}
              {showHistory && (
                <div ref={historyRef} className="bg-white p-10 rounded-[2rem] border border-orange-100 shadow-md animate-in fade-in slide-in-from-bottom-5 duration-500">
                   <div className="flex justify-between items-center mb-8">
                     <h2 className="text-xl font-bold text-gray-800 tracking-tight">Full Point Activity</h2>
                     <button onClick={() => setShowHistory(false)} className="text-gray-400 hover:text-orange-500 font-bold text-sm transition">Close ×</button>
                   </div>
                   <div className="overflow-x-auto">
                     <table className="w-full text-left">
                       <thead>
                         <tr className="border-b border-gray-50">
                           <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Date</th>
                           <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400">Description</th>
                           <th className="pb-4 text-[10px] font-black uppercase tracking-widest text-gray-400 text-right">Points</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-50">
                         {pointsHistory.map((item, index) => (
                           <tr key={index} className="group hover:bg-orange-50/30 transition-colors">
                             <td className="py-5 text-sm font-bold text-gray-400">{item.date ? new Date(item.date).toLocaleDateString() : 'Recent'}</td>
                             <td className="py-5 text-sm font-extrabold text-gray-700">{item.description || item.desc}</td>
                             <td className={`py-5 text-sm font-black text-right ${(item.points || item.pts) > 0 ? 'text-green-500' : 'text-red-400'}`}>
                               {(item.points || item.pts) > 0 ? '+' : ''}{item.points || item.pts || 0}
                             </td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>
      <Footer />
    </div>
  );
};

// Helper Components
const DisplayItem = ({ icon, label, value, iconBg, iconColor }) => (
  <div className="flex items-center gap-6">
    <div className={`w-14 h-14 ${iconBg} ${iconColor} rounded-2xl flex items-center justify-center text-2xl shadow-sm`}>{icon}</div>
    <div>
      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{label}</p>
      <p className="text-gray-800 font-extrabold text-lg leading-tight">{value}</p>
    </div>
  </div>
);

const EditInput = ({ label, value, name, onChange, disabled, className }) => (
  <div className={className}>
    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block ml-1">{label}</label>
    <input 
      type="text" name={name} value={value || ""} onChange={onChange} disabled={disabled}
      className={`w-full p-4 rounded-2xl border transition duration-200 text-lg font-bold ${
        disabled ? 'bg-gray-50 border-gray-50 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-200 text-gray-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5'
      }`}
    />
  </div>
);

export default ProfilePage;