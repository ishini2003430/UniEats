import React, { useState, useEffect } from "react";
import { Save, Moon, Sun, Globe, Bell, ShieldCheck, Palette } from "lucide-react";
import VendorSidebar from "./components/VendorSidebar";  // Assuming you have an Admin sidebar

const AdminSettingsPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [theme, setTheme] = useState(localStorage.getItem("adminTheme") || "light");
  const [settings, setSettings] = useState({
    siteName: "UniEats Campus",
    contactEmail: "admin@unieats.lk",
    maintenanceMode: false,
    allowNewVendors: true,
  });

  // Apply theme to the document body
  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
    localStorage.setItem("adminTheme", theme);
  }, [theme]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings({
      ...settings,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const saveSettings = () => {
    // Logic to save settings to your backend (e.g., axios.put('/api/admin/settings'))
    alert("Settings saved successfully!");
  };

  return (
    <div className={`flex min-h-screen ${theme === "dark" ? "bg-slate-900 text-white" : "bg-gray-50 text-gray-800"}`}>
      <VendorSidebar isSidebarOpen={isSidebarOpen} setIsSidebarOpen={setIsSidebarOpen} />

      <div className={`flex-1 transition-all duration-300 ${isSidebarOpen ? "ml-64" : "ml-20"} p-8`}>
        <header className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Admin Settings</h1>
            <p className="text-gray-500 dark:text-gray-400">Configure global site preferences and themes</p>
          </div>
          <button 
            onClick={saveSettings}
            className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-xl font-bold transition-all shadow-lg shadow-orange-200 dark:shadow-none"
          >
            <Save size={18} /> Save Changes
          </button>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: THEME & APPEARANCE */}
          <div className="space-y-6">
            <section className={`p-6 rounded-[2rem] shadow-sm border ${theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg"><Palette size={20} /></div>
                <h3 className="font-bold">Appearance</h3>
              </div>

              <div className="space-y-4">
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Select Theme</p>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTheme("light")}
                    className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${theme === "light" ? "border-orange-500 bg-orange-50 text-orange-600" : "border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"}`}
                  >
                    <Sun size={24} className="mb-2" />
                    <span className="font-bold text-sm">Light</span>
                  </button>
                  <button 
                    onClick={() => setTheme("dark")}
                    className={`flex flex-col items-center p-4 rounded-2xl border-2 transition-all ${theme === "dark" ? "border-orange-500 bg-slate-700 text-orange-400" : "border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700"}`}
                  >
                    <Moon size={24} className="mb-2" />
                    <span className="font-bold text-sm">Dark</span>
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* RIGHT COLUMN: SITE CONFIG */}
          <div className="lg:col-span-2 space-y-6">
            <section className={`p-8 rounded-[2rem] shadow-sm border ${theme === "dark" ? "bg-slate-800 border-slate-700" : "bg-white border-gray-100"}`}>
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg"><Globe size={20} /></div>
                <h3 className="font-bold">General Information</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Site Name</label>
                  <input 
                    type="text" 
                    name="siteName"
                    value={settings.siteName}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl outline-none border transition-all ${theme === "dark" ? "bg-slate-900 border-slate-700 focus:border-orange-500" : "bg-gray-50 border-gray-100 focus:border-orange-500"}`}
                  />
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase mb-2">Admin Email</label>
                  <input 
                    type="email" 
                    name="contactEmail"
                    value={settings.contactEmail}
                    onChange={handleInputChange}
                    className={`w-full px-4 py-3 rounded-xl outline-none border transition-all ${theme === "dark" ? "bg-slate-900 border-slate-700 focus:border-orange-500" : "bg-gray-50 border-gray-100 focus:border-orange-500"}`}
                  />
                </div>
              </div>

              <hr className="my-8 border-gray-100 dark:border-slate-700" />

              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg"><ShieldCheck size={20} /></div>
                <h3 className="font-bold">System Status</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl">
                  <div>
                    <p className="font-bold text-sm">Maintenance Mode</p>
                    <p className="text-xs text-gray-400">Disable all frontend access during updates</p>
                  </div>
                  <input 
                    type="checkbox" 
                    name="maintenanceMode"
                    checked={settings.maintenanceMode}
                    onChange={handleInputChange}
                    className="w-10 h-5 accent-orange-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-900 rounded-2xl">
                  <div>
                    <p className="font-bold text-sm">Allow Vendor Registration</p>
                    <p className="text-xs text-gray-400">Let new canteens sign up for accounts</p>
                  </div>
                  <input 
                    type="checkbox" 
                    name="allowNewVendors"
                    checked={settings.allowNewVendors}
                    onChange={handleInputChange}
                    className="w-10 h-5 accent-orange-500 cursor-pointer"
                  />
                </div>
              </div>
            </section>
          </div>

        </div>
      </div>
    </div>
  );
};

export default AdminSettingsPage;