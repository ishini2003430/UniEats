import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Vendor-only fields
  const [vendorName, setVendorName] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorLocation, setVendorLocation] = useState("");
  const [vendorLogo, setVendorLogo] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // Basic validation
    if (!name || !email || !password) {
      setError("Please fill in all required fields");
      return;
    }

    // Vendor validation
    if (
      role === "vendor" &&
      (!vendorName || !vendorPhone || !vendorLocation || !vendorLogo)
    ) {
      setError("Please fill in all vendor details including logo");
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("role", role);

      if (role === "vendor") {
        formData.append("vendorName", vendorName);
        formData.append("vendorPhone", vendorPhone);
        formData.append("vendorLocation", vendorLocation);
        formData.append("vendorLogo", vendorLogo);
      }

      const res = await api.post("/api/users/register", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (role === "student" && res.data.user && onLogin) {
        setSuccess("Registration successful! Logging you in...");
        
        setTimeout(() => {
          onLogin(res.data.user);
          navigate("/home");
        }, 1500);
      } else {
        setSuccess(
          role === "vendor"
            ? "Vendor registration submitted. Waiting for admin approval."
            : "Registration successful. You can now login."
        );

        // Reset form
        setName("");
        setEmail("");
        setPassword("");
        setVendorName("");
        setVendorPhone("");
        setVendorLocation("");
        setVendorLogo(null);
        setRole("student");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-blue-700 via-blue-600 to-red-600 px-4">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">

        <h2 className="text-3xl font-bold text-center text-gray-800">
          Create Account
        </h2>
        <p className="text-center text-sm text-gray-500 mt-1">
          Student & Vendor Registration
        </p>

        {error && (
          <p className="mt-4 text-center text-red-600 font-medium">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 text-center text-green-600 font-medium">
            {success}
          </p>
        )}

        {/* Role Selection */}
        <div className="mt-6 flex justify-center gap-4">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`px-4 py-2 rounded-lg font-medium border 
              ${role === "student"
                ? "bg-blue-600 text-white border-blue-600"
                : "bg-white text-gray-600 border-gray-300"}`}
          >
            Student
          </button>

          <button
            type="button"
            onClick={() => setRole("vendor")}
            className={`px-4 py-2 rounded-lg font-medium border 
              ${role === "vendor"
                ? "bg-red-600 text-white border-red-600"
                : "bg-white text-gray-600 border-gray-300"}`}
          >
            Vendor
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
          />

          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-600"
          />

          {/* Vendor-only fields */}
          {role === "vendor" && (
            <>
              <input
                type="text"
                placeholder="Vendor / Shop Name"
                value={vendorName}
                onChange={(e) => setVendorName(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600"
              />

              <input
                type="text"
                placeholder="Contact Number"
                value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600"
              />

              <input
                type="text"
                placeholder="Location / Campus"
                value={vendorLocation}
                onChange={(e) => setVendorLocation(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-red-600"
              />

              <input
                type="file"
                accept="image/*"
                onChange={(e) => setVendorLogo(e.target.files[0])}
                className="w-full px-3 py-2 border rounded-lg"
              />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white 
              font-semibold rounded-lg hover:bg-blue-700 transition
              disabled:opacity-50"
          >
            {loading
              ? "Please wait..."
              : role === "vendor"
              ? "Register as Vendor"
              : "Register as Student"}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-600">
          Already have an account?{" "}
          <Link
            to="/"
            className="text-blue-600 font-semibold hover:underline"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Register;
