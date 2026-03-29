import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signin from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";

import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/Vendor/VendorDashboard";

import RatingsPage from "./pages/RatingsPage";

import StudentProfile from "./pages/StudentProfile";
import ReviewsPage from "./pages/ReviewsPage";

import StudentOrderProcessPage from "./pages/student/StudentOrderProcessPage";
import MyOrdersPage from "./pages/student/MyOrdersPage";
import HomePage from "./pages/student/HomePage";
import VendorList from "./pages/student/VendorList";
import VendorMenu from "./pages/student/VendorMenu";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ RESTORE USER FROM LOCAL STORAGE
  useEffect(() => {
    const storedUser = localStorage.getItem("unieatsUser");

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  // ✅ LOGIN
  const handleLogin = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem("unieatsUser", JSON.stringify(nextUser));
  };

  // ✅ LOGOUT
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("unieatsUser");
  };

  // ✅ PREVENT FLICKER ON REFRESH
  if (loading) return null;

  // ================= LOGGED IN =================
  if (user) {
    return (
      <Routes>
        {/* ADMIN */}
        {user.role === "admin" && (
          <Route
            path="*"
            element={
              <AdminDashboard user={user} onLogout={handleLogout} />
            }
          />
        )}

        {/* VENDOR */}
        {user.role === "vendor" && (
          <>
            <Route
              path="/dashboard"
              element={
                <VendorDashboard user={user} onLogout={handleLogout} />
              }
            />

            <Route
              path="/food-management"
              element={
                <VendorDashboard
                  user={user}
                  onLogout={handleLogout}
                  forceTab="menu"
                />
              }
            />

            <Route
              path="*"
              element={
                <VendorDashboard user={user} onLogout={handleLogout} />
              }
            />
          </>
        )}

        {/* STUDENT */}
        {user.role === "student" && (
          <>
            {/* Home */}
            <Route
              path="/"
              element={<HomePage user={user} onLogout={handleLogout} />}
            />
            <Route
              path="/home"
              element={<HomePage user={user} onLogout={handleLogout} />}
            />

            {/* Profile */}
            <Route
              path="/profile"
              element={
                <StudentProfile user={user} onLogout={handleLogout} />
              }
            />

            {/* Vendors */}
            <Route
              path="/vendor-list"
              element={
                <VendorList user={user} onLogout={handleLogout} />
              }
            />
            <Route
              path="/vendor/:vendorId"
              element={
                <VendorMenu user={user} onLogout={handleLogout} />
              }
            />

            {/* Orders */}
            <Route
              path="/student/order"
              element={<StudentOrderProcessPage user={user} />}
            />
            <Route
              path="/my-orders"
              element={<MyOrdersPage user={user} />}
            />

            {/* Ratings */}
            <Route
              path="/ratings"
              element={<RatingsPage user={user} />}
            />

            {/* Reviews */}
            <Route
              path="/reviews"
              element={
                <ReviewsPage user={user} onLogout={handleLogout} />
              }
            />

            {/* Fallback */}
            <Route
              path="*"
              element={<HomePage user={user} onLogout={handleLogout} />}
            />
          </>
        )}
      </Routes>
    );
  }

  // ================= LOGGED OUT =================
  return (
    <Routes>
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Signin />} />
      <Route
        path="/admin/login"
        element={<AdminLogin onLogin={handleLogin} />}
      />

      {/* fallback */}
      <Route path="*" element={<Login onLogin={handleLogin} />} />
    </Routes>
  );
}

export default App;