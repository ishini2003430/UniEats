import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signin from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";

import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import StudentOrderProcessPage from "./pages/student/StudentOrderProcessPage";
import MyOrdersPage from "./pages/student/MyOrdersPage";
import VendorList from "./pages/student/VendorList";
import VendorMenu from "./pages/student/VendorMenu";
import MyFavorites from "./pages/student/MyFavorites";
import HomePage from "./pages/student/HomePage";

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
              element={<VendorDashboard user={user} onLogout={handleLogout} />}
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
              element={<VendorList user={user} onLogout={handleLogout} />}
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
              path="/student/favorites"
              element={<MyFavorites user={user} onLogout={handleLogout} />}
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
      <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
      <Route path="*" element={<Login onLogin={handleLogin} />} />
    </Routes>
  );
}

export default App;