const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");

const profileRoutes = require("./src/routes/ProfileRoutes"); // ✅ ADD THIS

const http = require("http");
const { Server } = require("socket.io");
const { initSocket } = require("./src/utils/socket");


// Load environment variables
dotenv.config({ quiet: true });

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"],
  },
});

initSocket(io);

// start auto-cancel monitor for unapproved orders
try {
  const { startAutoCancelMonitor } = require("./src/utils/autoCancel");
  startAutoCancelMonitor();
} catch (err) {
  console.error("Failed to start auto-cancel monitor:", err);
}

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

const reviewRoutes = require('./src/routes/reviewRoutes'); // ✅ ADD THIS

const pickupSlotRoutes = require("./src/routes/order-n-cancellation/pickupSlotRoutes");
const orderRoutes = require("./src/routes/order-n-cancellation/orderRoutes");
const notificationRoutes = require("./src/routes/order-n-cancellation/notificationRoutes");
const foodRoutes = require("./src/routes/FoodManagement/foodRoutes");


app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);

app.use("/api/profile", profileRoutes); // ✅ ADD THIS
app.use("/api/reviews", reviewRoutes); // ✅ ADD THIS

app.use("/api/slots", pickupSlotRoutes);
app.use("/api/foods", foodRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/notifications", notificationRoutes);


// Test route
app.get("/", (req, res) => {
  res.send("UniEats backend running");
});

// Connect to MongoDB and start server
const connectWithRetry = async (retries = 3, delayMs = 5000) => {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {

      await mongoose.connect(process.env.MONGO_URL);

      console.log("MongoDB connected successfully");
      server.listen(PORT, () => {
        console.log(`Server running on http://localhost:${PORT}`);
      });
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${attempt} failed:`);
      console.error(err && err.message ? err.message : err);

      if (attempt < retries) {
        console.log(`Retrying in ${delayMs / 1000}s... (${attempt}/${retries})`);
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        console.error("Could not connect to MongoDB after several attempts.");
        console.error("Common fixes:");
        console.error(" - Ensure your Atlas cluster allows connections from your IP (Network Access -> Add IP Address).");
        console.error(" - If developing locally, you may temporarily allow access from anywhere (0.0.0.0/0).");
        console.error(" - Verify the connection string in backend/.env (MONGO_URL) is correct.");
        console.error(" - Check that your machine can resolve DNS and reach the cluster (outbound port 27017/443).");
        process.exit(1);
      }
    }
  }
};

connectWithRetry().catch((err) => {
  console.error("Unexpected error while connecting to MongoDB:", err);
  process.exit(1);
});
