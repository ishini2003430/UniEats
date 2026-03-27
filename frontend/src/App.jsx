import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";

import Login from "./pages/Login";
import Signin from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";

import AdminDashboard from "./pages/AdminDashboard";
import VendorDashboard from "./pages/Vendor/VendorDashboard";


import StudentProfile from "./pages/StudentProfile";
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

  // Restoring session logic stays the same...

  const handleLogin = (nextUser) => {
    setUser(nextUser);
    sessionStorage.setItem("unieatsUser", JSON.stringify(nextUser));
  };

  const handleLogout = () => {
    setUser(null);
    sessionStorage.removeItem("unieatsUser");
  };

  if (user) {

    // REMOVE these lines:
    // if (user.role === "admin") return <AdminDashboard />;
    // if (user.role === "vendor") return <VendorDashboard />;
    // if (user.role === "student") return <StudentProfile />;


    return (
      <Routes>
        {/* ADMIN ROUTES */}
        {user.role === "admin" && (
          <Route path="*" element={<AdminDashboard user={user} onLogout={handleLogout} />} />
        )}

        {/* VENDOR ROUTES */}
        {user.role === "vendor" && (
          <>

            <Route path="/dashboard" element={<VendorDashboard user={user} onLogout={handleLogout} />} />
            <Route path="/food-management" element={<FoodManagement user={user} />} />
            <Route path="*" element={<VendorDashboard user={user} onLogout={handleLogout} />} />

            <Route
              path="/dashboard"
              element={<VendorDashboard user={user} onLogout={handleLogout} />}
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
              element={<VendorDashboard user={user} onLogout={handleLogout} />}
            />

          </>
        )}

        {/* STUDENT ROUTES */}
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
              element={<StudentProfile user={user} onLogout={handleLogout} />}
            />

            {/* Vendors */}
            <Route
              path="/vendor-list"
              element={<VendorList user={user} onLogout={handleLogout} />}
            />
            <Route
              path="/vendor/:vendorId"
              element={<VendorMenu user={user} onLogout={handleLogout} />}
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

            {/* Ratings (optional) */}
            <Route
              path="/ratings"
              element={<RatingsPage user={user} />}
            />

            {/* Fallback */}
            <Route
              path="*"
              element={<HomePage user={user} onLogout={handleLogout} />}
            />

            <Route path="/" element={<HomePage user={user} onLogout={handleLogout} />} />
            <Route path="/home" element={<HomePage user={user} onLogout={handleLogout} />} />
            <Route path="/profile" element={<StudentProfile user={user} onLogout={handleLogout} />} />
            <Route path="/reviews" element={<ReviewsPage user={user} onLogout={handleLogout} />} />
            <Route path="/vendor-list" element={<VendorList />} />
            <Route path="/vendor/:vendorId" element={<VendorMenu user={user} onLogout={handleLogout} />} />
            <Route path="/student/order" element={<StudentOrderProcessPage user={user} />} />
            <Route path="/my-orders" element={<MyOrdersPage user={user} />} />
            <Route path="*" element={<HomePage user={user} onLogout={handleLogout} />} />

          </>
        )}
      </Routes>
    );
  }

  // LOGGED OUT ROUTES
  return (
    <Routes>
      <Route path="/" element={<Login onLogin={handleLogin} />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />
      <Route path="/register" element={<Signin />} />
      <Route path="/admin/login" element={<AdminLogin onLogin={handleLogin} />} />


      {/* fallback */}

      <Route path="*" element={<Login onLogin={handleLogin} />} />
    </Routes>
  );
}

export default App;