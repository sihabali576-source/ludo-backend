const express = require("express");
const path = require("path");
const app = express();

app.use(express.json());

// ============================
// In-memory room store (demo)
// ============================
let currentRoom = null;

// ============================
// Serve index.html (ROOT)
// ============================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ============================
// Health check
// ============================
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ============================
// CREATE ROOM
// ============================
app.get("/api/room/create", (req, res) => {
  const { playerName } = req.query;

  if (!playerName) {
    return res.json({
      success: false,
      message: "playerName required"
    });
  }

  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

  currentRoom = {
    roomId,
    players: [playerName],
    turnIndex: 0
  };

  res.json({
    success: true,
    roomId,
    players: currentRoom.players
  });
});

// ============================
// JOIN ROOM
// ============================
app.get("/api/room/join", (req, res) => {
  const { playerName } = req.query;

  if (!currentRoom) {
    return res.json({
      success: false,
      message: "No active room"
    });
  }

  if (!playerName) {
    return res.json({
      success: false,
      message: "playerName required"
    });
  }

  if (currentRoom.players.length >= 4) {
    return res.json({
      success: false,
      message: "Room full"
    });
  }

  if (!currentRoom.players.includes(playerName)) {
    currentRoom.players.push(playerName);
  }

  res.json({
    success: true,
    roomId: currentRoom.roomId,
    players: currentRoom.players
  });
});

// ============================
// DICE ROLL
// ============================
app.get("/api/dice/roll", (req, res) => {
  const { playerName } = req.query;

  if (!currentRoom) {
    return res.json({ success: false, message: "Room not found" });
  }

  const currentPlayer = currentRoom.players[currentRoom.turnIndex];

  if (playerName !== currentPlayer) {
    return res.json({
      success: false,
      message: `Not your turn. Now playing: ${currentPlayer}`
    });
  }

  const dice = Math.floor(Math.random() * 6) + 1;

  currentRoom.turnIndex =
    (currentRoom.turnIndex + 1) % currentRoom.players.length;

  res.json({
    success: true,
    dice,
    nextTurn: currentRoom.players[currentRoom.turnIndex]
  });
});

// ============================
// Start server (Render ready)
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
