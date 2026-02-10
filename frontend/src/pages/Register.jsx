import { useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("student"); // student | vendor
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!name || !email || !password) {
      setError("Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const res = await api.post("/api/users/register", {
        name,
        email,
        password,
        role,
      });

      setSuccess(
        role === "vendor"
          ? "Vendor registration submitted. Waiting for admin approval."
          : "Registration successful. You can now login."
      );

      setName("");
      setEmail("");
      setPassword("");
      setRole("student");
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed"
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
          Create Account
        </h2>
        <p className="text-center text-sm text-gray-500 mt-1">
          Student & Vendor Registration
        </p>

        {/* Error / Success */}
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
          {/* Name */}
          <input
            type="text"
            placeholder="Full name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 
              rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

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
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 
              rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
          />

          {/* Button */}
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

        {/* Login link */}
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
