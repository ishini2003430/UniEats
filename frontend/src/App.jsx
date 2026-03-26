import { useState } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signin from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";

import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/VendorDashboard";
import StudentDashboard from "./pages/StudentDashboard";
import StudentProfile from "./pages/StudentProfile";
import RatingsPage from "./pages/RatingsPage";

function App() {
  const [user, setUser] = useState(null);


  if (user) {
    if (user.role === "admin") return <AdminDashboard />;
    if (user.role === "vendor") return <VendorDashboard />;
    if (user.role === "student") return <StudentProfile />;
  }


  return (
    <Routes>
      <Route path="/" element={<Login onLogin={setUser} />} />
      <Route path="/register" element={<Signin />} />
      <Route path="/login" element={<Login onLogin={setUser} />} />
      <Route path="/admin/login" element={<AdminLogin onLogin={setUser} />} />
       <Route path="/ratings" element={<RatingsPage />} />
       <Route path="/profile" element={<StudentProfile />} />
    </Routes>
  );
}

export default App;
