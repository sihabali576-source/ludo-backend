const express = require("express");
const http = require("http");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// --------------------
// In-memory game state
// --------------------
let currentRoom = null;

// --------------------
// Base routes
// --------------------
app.get("/", (req, res) => {
  res.send("🎲 LUDO BACKEND RUNNING 🚀");
});

app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API working perfectly 🚀"
  });
});

// --------------------
// Room create
// --------------------
app.get("/api/room/create", (req, res) => {
  const { playerName } = req.query;

  if (!playerName) {
    return res.json({ success: false, message: "playerName required" });
  }

  currentRoom = {
    roomId: Math.random().toString(36).substring(2, 6).toUpperCase(),
    players: [playerName],
    status: "waiting",
    turnIndex: 0,
    createdAt: Date.now()
  };

  res.json({
    success: true,
    message: "Room created successfully 🎉",
    room: currentRoom
  });
});

// --------------------
// Room join
// --------------------
app.get("/api/room/join", (req, res) => {
  const { playerName } = req.query;

  if (!currentRoom) {
    return res.json({ success: false, message: "Room not found" });
  }

  if (currentRoom.players.includes(playerName)) {
    return res.json({ success: false, message: "Player already joined" });
  }

  currentRoom.players.push(playerName);

  res.json({
    success: true,
    message: "Joined room successfully 🎮",
    room: currentRoom
  });
});

// --------------------
// Dice roll
// --------------------
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

// --------------------
// Server start
// --------------------
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
