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
import VendorReviews from "./pages/vendor/VendorReviews";
import VendorSettingsPage from "./pages/vendor/AdminSettingsPage";




// (duplicates removed) ReviewsPage and StudentProfile already imported above

import HelpCenter from "./pages/student/Helpcenter";
import TermsPage from "./pages/student/TermsPage";
import Privacypage from "./pages/student/Privacypage";
import OffersPage from "./pages/student/OffersPage";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ Restore user (localStorage ONLY — clean)
  useEffect(() => {
    try {
      // Strict per-tab sessions: restore only from sessionStorage.
      const raw = sessionStorage.getItem("unieatsUser");
      if (raw) setUser(JSON.parse(raw));
    } catch (err) {
      console.error("Restore error:", err);
    }
    setLoading(false);

    // Listen for cross-tab logout events to clear state if another tab logged out.
    const onStorage = (e) => {
      if (!e) return;
      if (e.key === "unieats-logout") {
        setUser(null);
        try { sessionStorage.removeItem("unieatsUser"); } catch (e) {}
      }
      // Optional: if another tab explicitly set a session for this tab, we can pick it up.
      if (e.key === "unieatsUser" && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          // Only auto-apply if it was set in sessionStorage (not a persistent cross-tab save)
          if (e.storageArea === sessionStorage) setUser(payload);
        } catch (err) {}
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // ✅ Login
  const handleLogin = (nextUser) => {
    setUser(nextUser);
    // Persist to sessionStorage by default so other tabs remain independent.
    try {
      sessionStorage.setItem("unieatsUser", JSON.stringify(nextUser));
    } catch (e) {
      console.error("Failed to persist session to sessionStorage", e);
    }
  };

  // ✅ Logout
  const handleLogout = () => {
    setUser(null);
    try {
      sessionStorage.removeItem("unieatsUser");
    } catch (e) {}
    try {
      localStorage.removeItem("unieatsUser");
    } catch (e) {}

    // Broadcast logout to other tabs
    try {
      localStorage.setItem("unieats-logout", String(Date.now()));
      // remove the key to avoid accumulating history; storage event still fires
      localStorage.removeItem("unieats-logout");
    } catch (e) {}
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

  // If the current path is public and the user is NOT logged in, render public routes.
  // If a user is logged in, prefer the logged-in route handling so refresh doesn't force the login page.
  if (publicPaths.includes(location.pathname) && !user) {
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
              path="/review"
              element={
                <VendorReviews user={user} onLogout={handleLogout} />
              }
            />
            <Route
              path="*"
              element={
                <VendorDashboard user={user} onLogout={handleLogout} />
              }
            />
            <Route
              path="/settings"
              element={
                <VendorSettingsPage user={user} onLogout={handleLogout} />
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

            <Route
              path="/offers"
              element={<OffersPage user={user} onLogout={handleLogout} />}
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

  // ================= LOGGED OUT =================
  return (
    <Routes>
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Signin />} />
      <Route path="/review" element={<VendorReviews />} />
      <Route path="/settings" element={<VendorSettingsPage />} />

      <Route
        path="/admin/login"
        element={<AdminLogin onLogin={handleLogin} />}
      />

      {/* Public Pages */}
      <Route path="/helpcenter" element={<HelpCenter />} />
      <Route path="/rate-us" element={<div className="text-center p-10 font-bold">Reviews Page Coming Soon</div>} />
      <Route path="/terms" element={<TermsPage />} />
      <Route path="/privacy" element={<Privacypage />} />



      {/* Fallback */}
      <Route path="*" element={<Login onLogin={handleLogin} />} />


    </Routes>
  );
}

export default App;