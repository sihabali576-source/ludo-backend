const express = require("express");
const app = express();
const PORT = process.env.PORT || 3000;

// --------------------
// In-memory room store
// --------------------
let currentRoom = null;

// --------------------
// Root check
// --------------------
app.get("/", (req, res) => {
  res.send("🎲 LUDO BACKEND RUNNING 🚀");
});

// --------------------
// API root
// --------------------
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API working perfectly 🚀"
  });
});

// --------------------
// CREATE ROOM
// --------------------
app.get("/api/room/create", (req, res) => {
  const { playerName } = req.query;

  if (!playerName) {
    return res.json({
      success: false,
      message: "playerName is required"
    });
  }

  const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();

  currentRoom = {
    roomId,
    players: [playerName],
    status: "waiting",
    turnIndex: 0,
    createdAt: Date.now()
  };

  res.json({
    success: true,
    message: "Room created successfully 🎉 (GET)",
    room: currentRoom
  });
});

// --------------------
// JOIN ROOM
// --------------------
app.get("/api/room/join", (req, res) => {
  const { playerName } = req.query;

  if (!currentRoom) {
    return res.json({
      success: false,
      message: "Room not found"
    });
  }

  if (!playerName) {
    return res.json({
      success: false,
      message: "playerName is required"
    });
  }

  if (currentRoom.players.includes(playerName)) {
    return res.json({
      success: false,
      message: "Player already joined"
    });
  }

  currentRoom.players.push(playerName);

  res.json({
    success: true,
    message: "Joined room successfully 🎉",
    room: currentRoom
  });
});

// --------------------
// 🎲 DICE ROLL (TURN BASED)
// --------------------
app.get("/api/dice/roll", (req, res) => {
  const { playerName } = req.query;

  if (!currentRoom) {
    return res.json({
      success: false,
      message: "Room not found"
    });
  }

  const currentPlayer = currentRoom.players[currentRoom.turnIndex];

  if (playerName !== currentPlayer) {
    return res.json({
      success: false,
      message: `Not your turn. Now playing: ${currentPlayer}`
    });
  }

  const dice = Math.floor(Math.random() * 6) + 1;

  // move to next turn
  currentRoom.turnIndex =
    (currentRoom.turnIndex + 1) % currentRoom.players.length;

  res.json({
    success: true,
    dice,
    nextTurn: currentRoom.players[currentRoom.turnIndex]
  });
});

// --------------------
// START SERVER
// --------------------
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
