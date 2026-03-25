import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signin from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";

import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentOrderProcessPage from "./pages/student/StudentOrderProcessPage";
import MyOrdersPage from "./pages/student/MyOrdersPage";
import HomePage from "./pages/student/HomePage";
import VendorList from "./pages/student/VendorList";
import VendorMenu from "./pages/student/VendorMenu";
import FoodManagement from "./pages/vendor/FoodManagement";

function App() {
  const [user, setUser] = useState(null);

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

 const handleLogin = (nextUser) => {
  setUser(nextUser);
  sessionStorage.setItem("unieatsUser", JSON.stringify(nextUser));
};

  const handleLogout = () => {
  setUser(null);
  sessionStorage.removeItem("unieatsUser");
};

  // =========================
  // ✅ LOGGED USER ROUTES
  // =========================
  if (user) {

    return (
      <Routes>
        {/* ADMIN */}
        {user.role === "admin" && (
          <Route path="*" element={<AdminDashboard user={user} onLogout={handleLogout} />} />
        )}

        {/* VENDOR */}
        {user.role === "vendor" && (
          <Route path="*" element={<VendorDashboard user={user} onLogout={handleLogout} />} />
        )}

        {/* STUDENT */}
        {user.role === "student" && (
          <>
            <Route path="/student/order" element={<StudentOrderProcessPage user={user} />} />
            <Route path="/my-orders" element={<MyOrdersPage user={user} />} />
            <Route path="*" element={<StudentDashboard user={user} onLogout={handleLogout} />} />
          </>
        )}
      </Routes>
    );

    if (user.role === "admin") return <AdminDashboard user={user} onLogout={handleLogout} />;

    if (user.role === "vendor") {
      return (
        <Routes>
          <Route path="/food-management" element={<FoodManagement user={user} />} />
          <Route path="*" element={<Navigate to="/food-management" replace />} />
        </Routes>
      );
    }

    if (user.role === "student") {
      return (
        <Routes>
          <Route path="/home" element={<HomePage user={user} onLogout={handleLogout} />} />
          <Route path="/vendor-list" element={<VendorList />} />
          <Route path="/vendor/:vendorId" element={<VendorMenu user={user} onLogout={handleLogout} />} />
          <Route path="/student/order" element={<StudentOrderProcessPage user={user} />} />
          <Route path="/my-orders" element={<MyOrdersPage user={user} />} />
          <Route path="*" element={<StudentDashboard user={user} onLogout={handleLogout} />} />
        </Routes>
      );
    }

  }

  // =========================
  // ✅ NOT LOGGED ROUTES
  // =========================
  return (
    <Routes>
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Signin onLogin={handleLogin} />} />
      <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />
      <Route path="*" element={<Login onLogin={handleLogin} />} />
    </Routes>
  );
}

export default App;