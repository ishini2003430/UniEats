const User = require("../models/User");

// LOGIN
exports.login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    // Invalid email or password
    if (!user || user.password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // 🚫 Block vendor login if not approved
    if (user.role === "vendor" && user.status !== "active") {
      return res.status(403).json({
        message: "Vendor account pending admin approval",
      });
    }

    // ✅ Login success
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
