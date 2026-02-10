import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signin from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";

import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import StudentDashboard from "./pages/StudentDashboard";

function App() {
  const [user, setUser] = useState(null);


  if (user) {
    if (user.role === "admin") return <AdminDashboard />;
    if (user.role === "vendor") return <VendorDashboard />;
    if (user.role === "student") return <StudentDashboard />;
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
