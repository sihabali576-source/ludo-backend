// ================================
// LUDO BACKEND - index.js
// ================================

const express = require("express");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Render uses dynamic PORT
const PORT = process.env.PORT || 3000;

// ================================
// In-memory storage (Mock DB)
// ================================
const rooms = {};

// ================================
// Root route
// ================================
app.get("/", (req, res) => {
  res.send("🎲 LUDO BACKEND RUNNING 🚀");
});

// ================================
// Health check / test API
// ================================
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API working perfectly 🎉",
  });
});

// ================================
// CREATE ROOM
// GET /api/room/create?playerName=Sihab
// ================================
app.get("/api/room/create", (req, res) => {
  const { playerName } = req.query;

  if (!playerName) {
    return res.status(400).json({
      success: false,
      message: "playerName is required",
    });
  }

  // Generate random room id
  const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();

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

// ================================
// JOIN ROOM - GET (for browser test)
// /api/room/join?roomId=ABCD&playerName=Alex
// ================================
app.get("/api/room/join", (req, res) => {
  const { roomId, playerName } = req.query;

  if (!roomId || !playerName) {
    return res.status(400).json({
      success: false,
      message: "roomId and playerName are required",
    });
  }

  const room = rooms[roomId];

  if (!room) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  if (room.players.length >= 4) {
    return res.status(400).json({
      success: false,
      message: "Room is full",
    });
  }

  if (room.players.includes(playerName)) {
    return res.status(400).json({
      success: false,
      message: "Player already in room",
    });
  }

  room.players.push(playerName);

  res.json({
    success: true,
    message: "Joined room successfully 🎉",
    room,
  });
});

// ================================
// GET ROOM INFO
// /api/room/:roomId
// ================================
app.get("/api/room/:roomId", (req, res) => {
  const { roomId } = req.params;
  const room = rooms[roomId];

  if (!room) {
    return res.status(404).json({
      success: false,
      message: "Room not found",
    });
  }

  res.json({
    success: true,
    room,
  });
});

// ================================
// START SERVER
// ================================
app.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("=================================");
});
