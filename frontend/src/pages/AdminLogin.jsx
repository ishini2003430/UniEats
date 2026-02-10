import { useState } from "react";
import api from "../services/api";

function AdminLogin({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/api/auth/login", {
        email,
        password,
      });

      // 🔒 Only allow admin
      if (res.data.role !== "admin") {
        setError("You are not authorized as admin");
        return;
      }

      onLogin(res.data);
    } catch {
      setError("Invalid admin credentials");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-xl w-full max-w-md">
        <h2 className="text-2xl text-white text-center mb-6">
          Admin Login 🔒
        </h2>

        {error && <p className="text-red-400 mb-4">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Admin Email"
            className="w-full px-4 py-2 rounded bg-gray-700 text-white"
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            className="w-full px-4 py-2 rounded bg-gray-700 text-white"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button className="w-full bg-red-600 py-2 rounded text-white font-bold">
            Login as Admin
          </button>
        </form>
      </div>
    </div>
  );
}

export default AdminLogin;
