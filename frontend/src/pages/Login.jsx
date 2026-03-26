import { useState } from "react";
import { Link, useNavigate } from "react-router-dom"; // Added useNavigate for redirection
import api from "../services/api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // student | vendor
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // Initialize navigate

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/auth/login", { email, password });

      // UX role check (backend is the real authority)
      if (res.data.role !== role) {
        setError(`This account is not registered as a ${role}`);
        setLoading(false);
        return;
      }

      // ✅ ADDED THIS LINE: Save user data to localStorage so Profile can fetch it
      localStorage.setItem("user", JSON.stringify(res.data));

      onLogin(res.data);

      // Redirect student to profile after successful login
      if (res.data.role === "student") {
        navigate("/profile");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center 
      bg-gradient-to-br from-blue-700 via-blue-600 to-red-600 px-4">

      <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-8">

        {/* Header */}
        <h2 className="text-3xl font-bold text-center text-gray-800">
          UniEats
        </h2>
        <p className="text-center text-sm text-gray-500 mt-1">
          Campus Food Ordering System
        </p>

        {/* Error */}
        {error && (
          <p className="mt-4 text-center text-red-600 font-medium">
            {error}
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
          {/* Email */}
          <input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 
              rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 
                rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-xs 
                text-blue-600 hover:text-red-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-blue-600 text-white 
              font-semibold rounded-lg hover:bg-blue-700 transition"
          >
            {loading ? "Signing in..." : `Sign in as ${role}`}
          </button>
        </form>

        {/* Divider */}
        <div className="my-6 flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-300"></div>
          <span className="text-sm text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-300"></div>
        </div>

        {/* Google Sign In (UI only) */}
        <button
          type="button"
          className="w-full py-2 border border-gray-300 
            rounded-lg flex items-center justify-center 
            hover:bg-gray-50 transition"
        >
          <span className="text-sm font-medium text-gray-700">
            Sign in with Google
          </span>
        </button>

        {/* Sign up link */}
        <div className="mt-6 text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <Link
            to="/register"
            className="text-blue-600 font-semibold hover:underline"
          >
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;