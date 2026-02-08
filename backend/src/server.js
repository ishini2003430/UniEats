const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect DB
connectDB();

app.get("/", (req, res) => {
  res.send("UniEats backend running with MongoDB");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
