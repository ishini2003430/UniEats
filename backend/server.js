const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

// Load environment variables
dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ Middleware (ORDER MATTERS)
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true })); // ⭐ REQUIRED

// ✅ Serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Check MongoDB URI
if (!process.env.MONGO_URL) {
  console.error("MONGO_URL is not defined in .env file");
  process.exit(1);
}

// Routes
const authRoutes = require("./src/routes/authRoutes");
const userRoutes = require("./src/routes/userRoutes");
const adminRoutes = require("./src/routes/adminRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

// Test route
app.get("/", (req, res) => {
  res.send("UniEats backend running");
});

// Connect to MongoDB and start server
mongoose
  .connect(process.env.MONGO_URL)
  .then(() => {
    console.log("MongoDB connected successfully");
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  });
