import { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../services/api";

function AdminLogin({ onLogin }) {
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ✅ validation
    if (!email || !password) {
      setError("Please fill all fields");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      console.log("ADMIN LOGIN RESPONSE:", res.data); // 🔍 debug

      // 🔒 Only allow admin
      if (res.data.role !== "admin") {
        setError("You are not authorized as admin");
        setLoading(false);
        return;
      }

      // ✅ save user
      onLogin(res.data);

      // ✅ redirect
      navigate("/admin");

    } catch (err) {
      console.error("LOGIN ERROR:", err); // 🔍 debug

      if (err.response?.data?.message) {
        setError(err.response.data.message);
      } else {
        setError("Invalid admin credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl w-full max-w-md shadow-lg">
        <h2 className="text-2xl text-white text-center mb-6 font-bold">
          Admin Login 🔒
        </h2>

        {error && (
          <p className="text-red-400 mb-4 text-center">{error}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            value={email}
            className="w-full px-4 py-2 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-red-500"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            className="w-full px-4 py-2 rounded bg-gray-700 text-white outline-none focus:ring-2 focus:ring-red-500"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 transition py-2 rounded text-white font-bold disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Login as Admin"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;