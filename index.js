const express = require("express");
const path = require("path");
const mongoose = require("mongoose");

const app = express();
app.use(express.json());

// =======================
// MongoDB Connect
// =======================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB Connected"))
  .catch((err) => console.error("❌ MongoDB Error:", err.message));

// =======================
// Serve index.html (ROOT FIX)
// =======================
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// =======================
// TEMP ROOM STATE (simple)
// =======================
let currentRoom = null;

// =======================
// CREATE ROOM
// =======================
app.get("/api/room/create", (req, res) => {
  const { playerName } = req.query;
  if (!playerName) {
    return res.json({ success: false, message: "playerName required" });
  }

  const roomId = Math.random().toString(36).substring(2, 7).toUpperCase();

  currentRoom = {
    roomId,
    players: [playerName],
    turnIndex: 0,
  };

  res.json({ success: true, room: currentRoom });
});

// =======================
// JOIN ROOM
// =======================
app.get("/api/room/join", (req, res) => {
  const { playerName } = req.query;

  if (!currentRoom) {
    return res.json({ success: false, message: "Room not found" });
  }

  if (currentRoom.players.includes(playerName)) {
    return res.json({ success: false, message: "Player already joined" });
  }

  currentRoom.players.push(playerName);
  res.json({ success: true, room: currentRoom });
});

// =======================
// DICE ROLL
// =======================
app.get("/api/dice/roll", (req, res) => {
  const { playerName } = req.query;

  if (!currentRoom) {
    return res.json({ success: false, message: "Room not found" });
  }

  const currentPlayer = currentRoom.players[currentRoom.turnIndex];

  if (playerName !== currentPlayer) {
    return res.json({
      success: false,
      message: `Not your turn. Now playing: ${currentPlayer}`,
    });
  }

  const dice = Math.floor(Math.random() * 6) + 1;

  currentRoom.turnIndex =
    (currentRoom.turnIndex + 1) % currentRoom.players.length;

  res.json({
    success: true,
    dice,
    nextTurn: currentRoom.players[currentRoom.turnIndex],
  });
});

// =======================
// START SERVER (Render)
// =======================
const PORT = process.env.PORT || 10000;
app.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
});
