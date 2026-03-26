import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signin from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";

import AdminDashboard from "./pages/AdminDashboard";

import VendorDashboard from "./pages/Vendor/VendorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import RatingsPage from "./pages/RatingsPage";

import VendorDashboard from "./pages/VendorDashboard";
import StudentOrderProcessPage from "./pages/student/StudentOrderProcessPage";
import MyOrdersPage from "./pages/student/MyOrdersPage";
import HomePage from "./pages/student/HomePage";
import VendorList from "./pages/student/VendorList";
import VendorMenu from "./pages/student/VendorMenu";
import FoodManagement from "./pages/vendor/FoodManagement";


function App() {
  const [user, setUser] = useState(null);

  // =========================
  // 🔄 Restore session
  // =========================
  useEffect(() => {
    try {
      const savedUser = sessionStorage.getItem("unieatsUser");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to restore user session:", error);
    }
  }, []);

  // =========================
  // 🔐 Login
  // =========================
  const handleLogin = (nextUser) => {
    setUser(nextUser);
    sessionStorage.setItem("unieatsUser", JSON.stringify(nextUser));
  };

  // =========================
  // 🚪 Logout
  // =========================
  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem("unieatsUser");
  };

  // =========================
  // ✅ AUTHENTICATED ROUTES
  // =========================
  if (user) {

    if (user.role === "admin") return <AdminDashboard />;
    if (user.role === "vendor") return <VendorDashboard />;
    if (user.role === "student") return <StudentProfile />;

    return (
      <Routes>

        {/* ================= ADMIN ================= */}
        {user.role === "admin" && (
          <Route
            path="*"
            element={<AdminDashboard user={user} onLogout={handleLogout} />}
          />
        )}

        {/* ================= VENDOR ================= */}
        {user.role === "vendor" && (
          <>
            <Route
              path="/dashboard"
              element={<VendorDashboard user={user} onLogout={handleLogout} />}
            />
            <Route
              path="/food-management"
              element={<FoodManagement user={user} />}
            />
            <Route
              path="*"
              element={<VendorDashboard user={user} onLogout={handleLogout} />}
            />
          </>
        )}

        {/* ================= STUDENT ================= */}
        {user.role === "student" && (
          <>
            {/* Default page */}
            <Route
              path="/"
              element={<HomePage user={user} onLogout={handleLogout} />}
            />

            <Route
              path="/home"
              element={<HomePage user={user} onLogout={handleLogout} />}
            />

            <Route
              path="/vendor-list"
              element={<VendorList />}
            />

            <Route
              path="/vendor/:vendorId"
              element={<VendorMenu user={user} onLogout={handleLogout} />}
            />

            <Route
              path="/student/order"
              element={<StudentOrderProcessPage user={user} />}
            />

            <Route
              path="/my-orders"
              element={<MyOrdersPage user={user} />}
            />

            {/* fallback */}
            <Route
              path="*"
              element={<HomePage user={user} onLogout={handleLogout} />}
            />
          </>
        )}

      </Routes>
    );

  }

  // =========================
  // ❌ NOT LOGGED IN ROUTES
  // =========================
  return (
    <Routes>
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Signin />} />

      <Route path="/login" element={<Login onLogin={setUser} />} />
      <Route path="/admin/login" element={<AdminLogin onLogin={setUser} />} />
       <Route path="/ratings" element={<RatingsPage />} />
       <Route path="/profile" element={<StudentProfile />} />

      <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
      <Route path="*" element={<Login onLogin={handleLogin} />} />

    </Routes>
  );
}

export default App;