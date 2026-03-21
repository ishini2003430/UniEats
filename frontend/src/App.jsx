import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signin from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";

import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/vendor/VendorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentOrderProcessPage from "./pages/student/StudentOrderProcessPage";

function App() {
  const [user, setUser] = useState(null);

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
          <Route path="*" element={<StudentDashboard user={user} onLogout={handleLogout} />} />
        </Routes>
      );
    }
  }


  return (
    <Routes>
      <Route path="/" element={<Login onLogin={setUser} />} />
      <Route path="/register" element={<Signin />} />
      <Route path="/admin/login" element={<AdminLogin onLogin={setUser} />} />
    </Routes>
  );
}

export default App;
