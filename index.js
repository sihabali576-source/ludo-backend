// ==========================
// LUDO BACKEND - index.js
// ==========================

const express = require("express");
const cors = require("cors");

const app = express();

// Render automatically provides PORT
const PORT = process.env.PORT || 3000;

// --------------------------
// Middlewares
// --------------------------
app.use(cors());
app.use(express.json());

// --------------------------
// Root Route (IMPORTANT)
// --------------------------
app.get("/", (req, res) => {
  res.send("🎲 LUDO BACKEND RUNNING 🚀");
});

// --------------------------
// Health Check (Render friendly)
// --------------------------
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "ludo-backend",
    time: new Date().toISOString(),
  });
});

// --------------------------
// Mock API (example)
// --------------------------
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API working perfectly 🎉",
  });
});

// --------------------------
// Start Server
// --------------------------
app.listen(PORT, () => {
  console.log("====================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("✅ Available at your primary URL");
  console.log("====================================");
});
