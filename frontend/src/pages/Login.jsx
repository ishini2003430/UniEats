import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  /* ---------------- VALIDATIONS ---------------- */
  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePassword = (password) =>
    password.length >= 6;

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // BASIC VALIDATION
    if (!email.trim()) return setError("Email is required");
    if (!password.trim()) return setError("Password is required");

    if (!validateEmail(email)) {
      return setError("Invalid email format");
    }

    if (!validatePassword(password)) {
      return setError("Password must be at least 6 characters");
    }

    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", { email, password });

      // ROLE CHECK
      if (res.data.role !== role) {
        setError(`This account is not registered as a ${role}`);
        setLoading(false);
        return;
      }

      // SAVE USER
      localStorage.setItem("user", JSON.stringify(res.data));
      onLogin?.(res.data);

      // REDIRECT (cleaned - no duplicates)
      if (res.data.role === "student") {
        navigate("/home");
      } else if (res.data.role === "vendor") {
        navigate("/dashboard");
      } else if (res.data.role === "admin") {
        navigate("/");
      }

    } catch (err) {
      setError(err.response?.data?.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-[#fff7ed] to-[#fdfcfb] px-4">

      {/* LOGO */}
      <div className="flex flex-col items-center mb-6">
        <div className="bg-gradient-to-tr from-orange-500 to-orange-400 p-2.5 rounded-xl shadow-lg shadow-orange-200 mb-2">
          <svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
            <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
            <path d="M7 2v20"/>
            <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
          </svg>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-800">
          Uni<span className="text-orange-500">Eats</span>
        </h1>
        <p className="text-gray-400 text-xs mt-1">Campus food pickup, simplified.</p>
      </div>

      {/* FORM CARD */}
      <div className="bg-white/80 backdrop-blur-md w-full max-w-sm rounded-2xl shadow-xl border border-orange-100 p-6">

        <h2 className="text-xl font-bold text-center text-gray-800 capitalize">
          {role} Login
        </h2>
        <p className="text-center text-xs text-gray-400 mt-1">
          Sign in with your university email
        </p>

        {/* ERROR */}
        {error && (
          <p className="mt-3 text-center text-red-500 text-sm font-medium">
            {error}
          </p>
        )}

        {/* ROLE SWITCH */}
        <div className="mt-5 flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition
              ${role === "student"
                ? "bg-white text-orange-500 shadow"
                : "text-gray-400"}`}
          >
            Student
          </button>

          <button
            type="button"
            onClick={() => setRole("vendor")}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition
              ${role === "vendor"
                ? "bg-white text-orange-500 shadow"
                : "text-gray-400"}`}
          >
            Vendor
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">

          {/* EMAIL */}
          <div>
            <label className="text-[10px] font-bold text-gray-400">Email</label>
            <input
              type="email"
              placeholder="you@university.edu"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
            />
            {!validateEmail(email) && email && (
              <p className="text-red-400 text-xs mt-1">Invalid email format</p>
            )}
          </div>

          {/* PASSWORD */}
          <div>
            <label className="text-[10px] font-bold text-gray-400">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:border-orange-400 focus:ring-1 focus:ring-orange-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-[10px] font-bold text-orange-500"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {password && password.length < 6 && (
              <p className="text-red-400 text-xs mt-1">
                Password must be at least 6 characters
              </p>
            )}
          </div>

          {/* BUTTON */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition"
          >
            {loading ? "Signing in..." : `Sign in as ${role}`}
          </button>
        </form>

        {/* DIVIDER */}
        <div className="my-4 flex items-center gap-2">
          <div className="flex-1 h-px bg-gray-100"></div>
          <span className="text-[9px] text-gray-300">OR</span>
          <div className="flex-1 h-px bg-gray-100"></div>
        </div>

        {/* GOOGLE */}
        <button className="w-full py-2 border border-gray-200 rounded-lg flex items-center justify-center gap-2 hover:bg-gray-50">
          <span className="text-xs font-semibold text-gray-600">
            Sign in with Google
          </span>
        </button>

        {/* SIGNUP */}
        <div className="mt-5 text-center text-xs text-gray-400">
          Don’t have an account?{" "}
          <Link to="/register" className="text-orange-500 font-bold hover:underline">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
}

export default Login;