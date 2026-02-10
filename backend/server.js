const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");

// Load environment variables
dotenv.config({ quiet: true });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Check MongoDB URI
if (!process.env.MONGO_URL) {
  console.error("MONGO_URL is not defined in .env file");
  process.exit(1);
}

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

// Test route
app.get("/", (req, res) => {
  res.send("UniEats backend running");
});

const authRoutes = require("./src/routes/authRoutes");
app.use("/api/auth", authRoutes);
