const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// In-memory store
let rooms = {};
let lastRoomId = null;

// Utils
function generateRoomId() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// Root
app.get("/", (req, res) => {
  res.send("🎲 LUDO BACKEND RUNNING 🚀");
});

// API health
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API working perfectly 🎉",
  });
});

// Create room
app.get("/api/room/create", (req, res) => {
  const { playerName } = req.query;

  if (!playerName) {
    return res.json({
      success: false,
      message: "playerName is required",
    });
  }

  const roomId = generateRoomId();

  rooms[roomId] = {
    roomId,
    players: [playerName],
    status: "waiting",
    createdAt: Date.now(),
  };

  lastRoomId = roomId;

  res.json({
    success: true,
    message: "Room created successfully 🎉 (GET)",
    room: rooms[roomId],
  });
});

// Join room (AUTO join last room)
app.get("/api/room/join", (req, res) => {
  const { playerName } = req.query;

  if (!playerName) {
    return res.json({
      success: false,
      message: "playerName is required",
    });
  }

  if (!lastRoomId || !rooms[lastRoomId]) {
    return res.json({
      success: false,
      message: "No active room found",
    });
  }

  const room = rooms[lastRoomId];

  if (room.players.length >= 4) {
    return res.json({
      success: false,
      message: "Room is full",
    });
  }

  room.players.push(playerName);

  res.json({
    success: true,
    message: "Joined room successfully 🎉",
    room,
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
