const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// In-memory room storage
const rooms = {};

// --------------------
// ROOT
// --------------------
app.get("/", (req, res) => {
  res.send("🎲 LUDO BACKEND RUNNING 🚀");
});

// --------------------
// API HEALTH
// --------------------
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API working perfectly 🎉",
  });
});

// --------------------
// CREATE ROOM (GET – browser test)
// --------------------
app.get("/api/room/create", (req, res) => {
  const playerName = req.query.playerName;

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
    message: "Room created successfully 🎉 (GET)",
    room: rooms[roomId],
  });
});

// --------------------
// JOIN ROOM (GET – browser test)
// --------------------
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
      message: "Player already joined",
    });
  }

  room.players.push(playerName);

  res.json({
    success: true,
    message: "Joined room successfully 🎉",
    room,
  });
});

// --------------------
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
