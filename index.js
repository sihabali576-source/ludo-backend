// ==========================
// LUDO BACKEND - index.js
// ==========================

const express = require("express");
const cors = require("cors");

const app = express();

// Render provides PORT automatically
const PORT = process.env.PORT || 3000;

// --------------------------
// Middlewares
// --------------------------
app.use(cors());
app.use(express.json());

// --------------------------
// Root Route
// --------------------------
app.get("/", (req, res) => {
  res.send("🎲 LUDO BACKEND RUNNING 🚀");
});

// --------------------------
// Health Check
// --------------------------
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    service: "ludo-backend",
    time: new Date().toISOString(),
  });
});

// --------------------------
// In-memory Game Storage
// --------------------------
const rooms = {};

// --------------------------
// Test API
// --------------------------
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API working perfectly 🎉",
  });
});

// ==================================================
// CREATE ROOM - POST (proper way)
// ==================================================
app.post("/api/room/create", (req, res) => {
  const { playerName } = req.body;

  if (!playerName) {
    return res.status(400).json({
      success: false,
      message: "playerName is required",
    });
  }

  const roomId = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

  rooms[roomId] = {
    roomId,
    players: [playerName],
    status: "waiting",
    createdAt: Date.now(),
  };

  res.json({
    success: true,
    message: "Room created successfully 🎉",
    room: rooms[roomId],
  });
});

// ==================================================
// CREATE ROOM - GET (for browser testing only)
// ==================================================
app.get("/api/room/create", (req, res) => {
  const playerName = req.query.playerName || "Guest";

  const roomId = Math.random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase();

  rooms[roomId] = {
    roomId,
    players: [playerName],
    status: "waiting",
    createdAt: Date.now(),
  };

  res.json({
    success: true,
    message: "Room created successfully 🎉 (GET)",
    room: rooms[roomId],
  });
});

// --------------------------
// Start Server
// --------------------------
app.listen(PORT, () => {
  console.log("====================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("====================================");
});
