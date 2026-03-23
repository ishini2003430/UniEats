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

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("unieatsUser") || sessionStorage.getItem("unieatsUser");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to restore user session:", error);
    }
  }, []);

  const handleLogin = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem("unieatsUser", JSON.stringify(nextUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("unieatsUser");
    sessionStorage.removeItem("unieatsUser");
  };


  if (user) {
    if (user.role === "admin") return <AdminDashboard user={user} onLogout={handleLogout} />;
    if (user.role === "vendor") return <VendorDashboard user={user} onLogout={handleLogout} />;
    if (user.role === "student") {
      return (
        <Routes>
          <Route path="/student/order" element={<StudentOrderProcessPage user={user} />} />
          <Route path="/my-orders" element={<MyOrdersPage user={user} />} />
          <Route path="*" element={<StudentDashboard user={user} onLogout={handleLogout} />} />
        </Routes>
      );
    }
  }


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
