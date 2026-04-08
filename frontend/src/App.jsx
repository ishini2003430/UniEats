import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signin from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";

import { connectRealtime, disconnectRealtime } from "./services/realtime";

import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/vendor/VendorDashboard";

import RatingsPage from "./pages/RatingsPage";
import StudentProfile from "./pages/StudentProfile";
import ReviewsPage from "./pages/ReviewsPage";

import StudentOrderProcessPage from "./pages/student/StudentOrderProcessPage";
import MyOrdersPage from "./pages/student/MyOrdersPage";
import VendorList from "./pages/student/VendorList";
import VendorMenu from "./pages/student/VendorMenu";
import MyFavorites from "./pages/student/MyFavorites";
import HomePage from "./pages/student/HomePage";

import FoodManagement from "./pages/vendor/FoodManagement";

import HelpCenter from "./pages/student/Helpcenter";
import TermsPage from "./pages/student/TermsPage";
import Privacypage from "./pages/student/Privacypage";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Restore user (localStorage ONLY — clean)
  useEffect(() => {
    try {
      // Use sessionStorage so each browser tab can have independent session state.
      const raw = sessionStorage.getItem("unieatsUser") || localStorage.getItem("unieatsUser");
      if (raw) {
        setUser(JSON.parse(raw));
      }
    } catch (err) {
      console.error("Restore error:", err);
    }
    setLoading(false);
  }, []);

  // ✅ Login
  const handleLogin = (nextUser) => {
    setUser(nextUser);
    // Persist to sessionStorage by default so other tabs remain independent.
    try {
      sessionStorage.setItem("unieatsUser", JSON.stringify(nextUser));
    } catch (e) {
      // fallback
      localStorage.setItem("unieatsUser", JSON.stringify(nextUser));
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem("unieatsUser");
    } catch (e) {
      localStorage.removeItem("unieatsUser");
    }
  };

  useEffect(() => {
    if (!user?._id) return;

    const socket = connectRealtime({ role: user.role, userId: user._id });

    const onNewNotification = (notification) => {
      try {
        if (typeof window !== "undefined" && "Notification" in window) {
          if (Notification.permission === "default") {
            Notification.requestPermission().catch(() => {});
          }
          if (Notification.permission === "granted") {
          new Notification(notification.title || "New notification", {
            body: notification.message || "You have a new notification",
          });
          }
        }
      } catch (err) {
        console.error("notification handler error:", err);
      }
    };

    if (socket) socket.on("notification:new", onNewNotification);

    return () => {
      if (socket) socket.off("notification:new", onNewNotification);
      disconnectRealtime();
    };
  }, [user?._id]);

  const location = useLocation();

  if (loading) return <div>Loading...</div>;
  const publicPaths = [
    "/",
    "/login",
    "/register",
    "/admin/login",
    "/helpcenter",
    "/terms",
    "/privacy",
  ];

  if (publicPaths.includes(location.pathname)) {
    return (
      <Routes>
        <Route path="/" element={<Login onLogin={handleLogin} />} />
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/register" element={<Signin />} />

        <Route
          path="/admin/login"
          element={<AdminLogin onLogin={handleLogin} />}
        />

        {/* Public Pages */}
        <Route path="/helpcenter" element={<HelpCenter />} />
        <Route path="/rate-us" element={<ReviewsPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<Privacypage />} />

        {/* Fallback */}
        <Route path="*" element={<Login onLogin={handleLogin} />} />
      </Routes>
    );
  }

  // ================= LOGGED IN =================
  if (user) {
    

    return (
      <Routes>
        {/* ================= ADMIN ================= */}
        {user.role === "admin" && (
          <Route
            path="*"
            element={
              <AdminDashboard user={user} onLogout={handleLogout} />
            }
          />
        )}

        {/* ================= VENDOR ================= */}
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
                <VendorDashboard user={user} onLogout={handleLogout} />
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

        {/* ================= STUDENT ================= */}
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

            {/* Favorites */}
            <Route
              path="/student/favorites"
              element={
                <MyFavorites user={user} onLogout={handleLogout} />
              }
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

            {/* Extra Pages */}
            <Route path="/helpcenter" element={<HelpCenter />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/privacy" element={<Privacypage />} />

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

      {/* Public Pages */}
      <Route path="/helpcenter" element={<HelpCenter />} />
      <Route path="/rate-us" element={<ReviewsPage />} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<Privacypage />} />

      {/* Fallback */}
      <Route path="*" element={<Login onLogin={handleLogin} />} />
    </Routes>
  );
}

export default App;