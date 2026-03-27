import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import Header from '../../src/components/Header';
import Footer from '../../src/components/Footer';

const ProfilePage = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({});
  
  const fileInputRef = useRef(null);
  const historyRef = useRef(null);
  
  const [profileImage, setProfileImage] = useState(null);
  const [showHistory, setShowHistory] = useState(false);

  const dietaryOptions = ['Vegetarian', 'Vegan', 'Halal', 'Gluten-Free', 'Kosher', 'Dairy-Free'];

  const pointsHistory = [
    { id: 1, date: 'Mar 22, 2026', desc: 'Chicken Submarine - Canteen 02', pts: '+45', type: 'earn' },
    { id: 2, date: 'Mar 20, 2026', desc: 'Iced Coffee redemption', pts: '-150', type: 'redeem' },
    { id: 3, date: 'Mar 18, 2026', desc: 'Rice & Curry - Main Hall', pts: '+30', type: 'earn' },
  ];

  useEffect(() => {
    const fetchProfileData = async () => {
      const user = JSON.parse(localStorage.getItem('user'));
      const email = user?.email;

      if (!email) {
        setError("No user logged in found.");
        setLoading(false);
        return;
      }

      try {
        const response = await axios.get(`http://localhost:5000/api/profile/fetch/${email}`);
        setProfile(response.data);
        setFormData(response.data);
        const savedImg = localStorage.getItem(`profile_img_${email}`);
        if (savedImg) setProfileImage(savedImg);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    fetchProfileData();
  }, []);

  const handleImageClick = () => {
    if (isEditing) fileInputRef.current.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProfileImage(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDietaryChange = (pref) => {
    const currentPrefs = formData.dietaryPreferences || [];
    const newPrefs = currentPrefs.includes(pref)
      ? currentPrefs.filter((p) => p !== pref)
      : [...currentPrefs, pref];
    setFormData({ ...formData, dietaryPreferences: newPrefs });
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      const response = await axios.put(`http://localhost:5000/api/profile/update/${profile.email}`, formData);
      setProfile(response.data);
      if (profileImage) localStorage.setItem(`profile_img_${profile.email}`, profileImage);
      setIsEditing(false);
    } catch (err) {
      alert("Update failed");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!profile?.email) return;
    const confirmDelete = window.confirm("Are you sure? This will permanently delete your UniEats account.");
    if (confirmDelete) {
      try {
        setLoading(true);
        const response = await axios.delete(`http://localhost:5000/api/profile/delete/${profile.email}`);
        if (response.status === 200) {
          alert("Account deleted successfully.");
          localStorage.removeItem('user');
          localStorage.removeItem(`profile_img_${profile.email}`);
          window.location.href = "/login"; 
        }
      } catch (err) {
        alert("Delete Failed: " + (err.response?.data?.message || "Server Error"));
      } finally {
        setLoading(false);
      }
    }
  };

  const toggleHistory = () => {
    setShowHistory(!showHistory);
    if (!showHistory) {
      setTimeout(() => historyRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    window.location.href = "/login";
  };

  if (loading) return <div className="flex justify-center items-center h-screen text-orange-600 font-bold tracking-widest uppercase italic animate-pulse">Loading UniEats...</div>;
  if (error) return <div className="text-red-500 text-center mt-10 font-bold">{error}</div>;

  const currentPoints = profile.loyaltyPoints || 0;
  const nextMilestone = 1000;
  const progressWidth = Math.min((currentPoints / nextMilestone) * 100, 100);

  return (
    <div className="min-h-screen bg-[#FDFCFB] flex flex-col">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />

      {/* REPLACED MANUAL NAV WITH MODERN HEADER COMPONENT */}
      <Header profile={profile} onLogout={handleLogout} />

      <main className="flex-grow max-w-7xl mx-auto px-6 sm:px-10 py-10 w-full">
        {/* Profile Banner */}
        <div className="bg-[#FFF8F3] rounded-[2rem] p-10 flex flex-col md:flex-row items-center justify-between mb-10 border border-orange-50/50 shadow-sm">
          <div className="flex items-center gap-8">
            <div 
              onClick={handleImageClick}
              className={`w-28 h-28 bg-orange-500 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-xl ring-8 ring-white overflow-hidden ${isEditing ? 'cursor-pointer hover:opacity-80' : ''}`}
            >
              {profileImage ? (
                <img src={profileImage} alt="profile" className="w-full h-full object-cover" />
              ) : (
                profile.name?.substring(0, 2).toUpperCase()
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
             {/* Personal Info Edit Card */}
             <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm">
                <h2 className="text-xl font-bold text-gray-800 mb-10">Personal Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                   <EditInput label="Full Name" name="name" value={formData.name} onChange={handleInputChange} />
                   <EditInput label="Email" value={formData.email} disabled />
                   <EditInput label="Phone" name="contactNumber" value={formData.contactNumber} onChange={handleInputChange} />
                   <EditInput label="Department" name="department" value={formData.department} onChange={handleInputChange} />
                </div>
             </div>

             {/* Dietary Preferences Edit Card */}
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
                        {formData.dietaryPreferences?.includes(opt) && (
                          <div className="w-3 h-3 bg-orange-500 rounded-full" />
                        )}
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
                    placeholder="e.g. peanuts, shellfish..."
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
              <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm h-full">
                <h2 className="text-xl font-bold text-gray-800 mb-10 tracking-tight">Contact Info</h2>
                <div className="space-y-8">
                  <DisplayItem icon="✉️" label="Email" value={profile.email} iconBg="bg-orange-50" iconColor="text-orange-500" />
                  <div className="h-[1px] bg-gray-50"></div>
                  <DisplayItem icon="📞" label="Phone" value={profile.contactNumber || "+94 77 123 4567"} iconBg="bg-orange-50" iconColor="text-orange-500" />
                </div>
              </div>

              <div className="bg-[#FFF8F3] p-10 rounded-[2rem] border border-orange-100 shadow-sm text-gray-800 flex flex-col justify-between relative overflow-hidden h-full">
                <div className="flex justify-between items-start relative z-10">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-orange-500 text-lg">✨</span>
                      <h2 className="text-xl font-bold text-gray-800 tracking-tight">UniEats Rewards</h2>
                    </div>
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-orange-400/80">Loyalty Points</p>
                  </div>
                  <button onClick={toggleHistory} className="bg-white/80 backdrop-blur-sm p-2 rounded-lg border border-orange-100 hover:bg-orange-500 hover:text-white transition-all duration-300 shadow-sm">
                    📜
                  </button>
                </div>
                <div className="my-6 flex items-baseline gap-2">
                  <span className="text-6xl font-black text-orange-600">{currentPoints}</span>
                  <span className="text-lg font-bold text-orange-400">PTS</span>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-gray-400">
                    <span>Progress to Gold</span>
                    <span className="text-orange-500">{currentPoints} / {nextMilestone}</span>
                  </div>
                  <div className="w-full bg-orange-100/50 h-3 rounded-full overflow-hidden border border-orange-50">
                    <div className="bg-orange-500 h-full transition-all duration-1000" style={{ width: `${progressWidth}%` }}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2rem] border border-gray-100 shadow-sm h-full">
                <h2 className="text-xl font-bold text-gray-800 mb-10 tracking-tight">University Info</h2>
                <div className="space-y-8">
                  <DisplayItem icon="#" label="Student ID" value={profile.email?.split('@')[0] || "STU-2024"} iconBg="bg-orange-50" iconColor="text-orange-500" />
                  <div className="h-[1px] bg-gray-50"></div>
                  <DisplayItem icon="🏢" label="Department" value={profile.department || "Computing"} iconBg="bg-orange-50" iconColor="text-orange-500" />
                </div>
              </div>
            </div>

            {/* Dietary Preferences View Card */}
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

            {/* History Table */}
            {showHistory && (
              <div ref={historyRef} className="bg-white p-10 rounded-[2rem] border border-orange-100 shadow-md animate-in fade-in slide-in-from-bottom-5 duration-500">
                 <div className="flex justify-between items-center mb-8">
                   <h2 className="text-xl font-bold text-gray-800 tracking-tight">Recent Activity</h2>
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
                       {pointsHistory.map((item) => (
                         <tr key={item.id} className="group hover:bg-orange-50/30 transition-colors">
                           <td className="py-5 text-sm font-bold text-gray-400">{item.date}</td>
                           <td className="py-5 text-sm font-extrabold text-gray-700">{item.desc}</td>
                           <td className={`py-5 text-sm font-black text-right ${item.type === 'earn' ? 'text-green-500' : 'text-red-400'}`}>
                             {item.pts}
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

      {/* INCLUDED FOOTER COMPONENT */}
      <Footer />
    </div>
  );
};

// Helper Components
const DisplayItem = ({ icon, label, value, iconBg, iconColor }) => (
  <div className="flex items-center gap-6">
    <div className={`w-14 h-14 ${iconBg} ${iconColor} rounded-2xl flex items-center justify-center text-2xl shadow-sm`}>
      {icon}
    </div>
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
        disabled 
          ? 'bg-gray-50 border-gray-50 text-gray-400 cursor-not-allowed' 
          : 'bg-white border-gray-200 text-gray-800 focus:border-orange-500 focus:ring-4 focus:ring-orange-500/5'
      }`}
    />
  </div>
);

export default ProfilePage;