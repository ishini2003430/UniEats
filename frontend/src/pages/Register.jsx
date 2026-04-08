import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";

function Register({ onLogin }) {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [contactNumber, setContactNumber] = useState("");

  const [vendorName, setVendorName] = useState("");
  const [vendorPhone, setVendorPhone] = useState("");
  const [vendorLocation, setVendorLocation] = useState("");
  const [vendorLogo, setVendorLogo] = useState(null);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  /* ---------------- VALIDATION FUNCTIONS ---------------- */
  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const validatePhone = (phone) => /^[0-9]{10}$/.test(phone);

  // High-Security Password Validation
  const validatePassword = (password) => {
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    return password.length >= minLength && hasUpperCase && hasLowerCase && hasNumber && hasSpecialChar;
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    // BASIC VALIDATION
    if (!name.trim()) return setError("Full name is required");
    if (!email.trim()) return setError("Email is required");
    if (!password.trim()) return setError("Password is required");

    if (!validateEmail(email)) {
      return setError("Invalid email format");
    }

    if (!validatePassword(password)) {
      return setError("Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.");
    }

    if (contactNumber && !validatePhone(contactNumber)) {
      return setError("Phone number must be 10 digits");
    }

    // VENDOR VALIDATION
    if (role === "vendor") {
      if (!vendorName.trim()) return setError("Vendor name is required");
      if (!vendorPhone.trim()) return setError("Vendor phone is required");
      if (!vendorLocation.trim()) return setError("Vendor location is required");
      if (!vendorLogo) return setError("Vendor logo is required");

      if (!validatePhone(vendorPhone)) {
        return setError("Vendor phone must be 10 digits");
      }
    }

    setLoading(true);

    try {
      if (role === "student") {
        await api.post("/api/users/register", {
          name,
          email,
          password,
          contactNumber,
          role: "student"
        });

        setSuccess("Registration successful. Fetching profile...");

        const encodedEmail = encodeURIComponent(email);
        const profileRes = await api.get(`/api/profile/fetch/${encodedEmail}`);

        onLogin?.(profileRes.data);
        navigate("/home");
      } else {
        const formData = new FormData();
        formData.append("name", name);
        formData.append("email", email);
        formData.append("password", password);
        formData.append("contactNumber", contactNumber);
        formData.append("vendorName", vendorName);
        formData.append("vendorPhone", vendorPhone);
        formData.append("vendorLocation", vendorLocation);
        formData.append("vendorLogo", vendorLogo);
        formData.append("role", "vendor");

        await api.post("/api/users/register", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        setSuccess("Vendor registration submitted. Waiting for admin approval.");

        // RESET FORM
        setName("");
        setEmail("");
        setPassword("");
        setContactNumber("");
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#fff7ed] to-[#fdfcfb] px-4">

      {/* LOGO */}
      <div className="absolute top-10 flex flex-col items-center">
        <div className="bg-gradient-to-tr from-orange-500 to-orange-400 p-2.5 rounded-xl shadow-lg shadow-orange-200 mb-2">
          <span className="text-white text-lg">🍴</span>
        </div>
        <h1 className="text-2xl font-extrabold text-gray-800">
          Uni<span className="text-orange-500">Eats</span>
        </h1>
      </div>

      {/* FORM CARD */}
      <div className="bg-white/80 backdrop-blur-md w-full max-w-sm rounded-2xl shadow-xl border border-orange-100 p-6 mt-20">

        <h2 className="text-xl font-bold text-center text-gray-800">
          Create Account
        </h2>
        <p className="text-center text-xs text-gray-400 mt-1">
          Student & Vendor Registration
        </p>

        {error && (
          <p className="mt-3 text-center text-red-500 text-sm">{error}</p>
        )}
        {success && (
          <p className="mt-3 text-center text-green-500 text-sm">{success}</p>
        )}

        {/* ROLE SWITCH */}
        <div className="mt-5 flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setRole("student")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition
              ${role === "student"
                ? "bg-white text-orange-500 shadow"
                : "text-gray-400"}`}
          >
            Student
          </button>

          <button
            type="button"
            onClick={() => setRole("vendor")}
            className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition
              ${role === "vendor"
                ? "bg-white text-orange-500 shadow"
                : "text-gray-400"}`}
          >
            Vendor
          </button>
        </div>

        {/* FORM */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-3">

          <input type="text" placeholder="Full name" value={name}
            onChange={(e) => setName(e.target.value)} className="input-modern" />

          <input type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)} className="input-modern" />

          {!validateEmail(email) && email && (
            <p className="text-red-400 text-xs">Invalid email format</p>
          )}

          <input type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)} className="input-modern" />

          {password && !validatePassword(password) && (
            <p className="text-red-400 text-[10px] leading-tight">
              Min 8 chars, 1 uppercase, 1 lowercase, 1 number & 1 special char
            </p>
          )}

          <input type="tel" placeholder="Contact Number" value={contactNumber}
            onChange={(e) => setContactNumber(e.target.value)} className="input-modern" />

          {contactNumber && !validatePhone(contactNumber) && (
            <p className="text-red-400 text-xs">Must be 10 digits</p>
          )}

          {role === "vendor" && (
            <>
              <input type="text" placeholder="Vendor Name" value={vendorName}
                onChange={(e) => setVendorName(e.target.value)} className="input-modern" />

              <input type="text" placeholder="Vendor Phone" value={vendorPhone}
                onChange={(e) => setVendorPhone(e.target.value)} className="input-modern" />

              <input type="text" placeholder="Location" value={vendorLocation}
                onChange={(e) => setVendorLocation(e.target.value)} className="input-modern" />

              <input type="file"
                onChange={(e) => setVendorLogo(e.target.files[0])}
                className="text-xs" />
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 text-sm bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold rounded-lg shadow-md hover:shadow-lg transition"
          >
            {loading ? "Please wait..." :
              role === "vendor" ? "Register as Vendor" : "Register as Student"}
          </button>
        </form>

        <div className="mt-5 text-center text-xs text-gray-400">
          Already have an account?{" "}
          <Link to="/" className="text-orange-500 font-bold hover:underline">
            Login
          </Link>
        </div>
      </div>

      {/* GLOBAL INPUT STYLE */}
      <style>{`
        .input-modern {
          width: 100%;
          padding: 10px;
          font-size: 13px;
          border-radius: 8px;
          background: #f9fafb;
          border: 1px solid #e5e7eb;
          outline: none;
        }
        .input-modern:focus {
          border-color: #f97316;
          box-shadow: 0 0 0 2px rgba(249,115,22,0.1);
          background: white;
        }
      `}</style>
    </div>
  );
}

export default Register;