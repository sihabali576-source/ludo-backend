const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

/**
 * In-memory room (Mock server)
 * Free server restart হলে data reset হবে — এটা expected
 */
let currentRoom = null;

/**
 * Utils: random room id
 */
function generateRoomId() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

/**
 * Root check
 */
app.get("/", (req, res) => {
  res.send("🎲 LUDO BACKEND RUNNING 🚀");
});

/**
 * API health
 */
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "API working perfectly 🎉"
  });
});

/**
 * Create room
 * /api/room/create?playerName=Sihab
 */
app.get("/api/room/create", (req, res) => {
  const { playerName } = req.query;

  if (!playerName) {
    return res.json({
      success: false,
      message: "playerName required"
    });
  }

  const roomId = generateRoomId();

  currentRoom = {
    roomId,
    players: [playerName],
    status: "waiting",
    createdAt: Date.now()
  };

  res.json({
    success: true,
    message: "Room created successfully 🎉 (GET)",
    room: currentRoom
  });
});

/**
 * Join room
 * /api/room/join?playerName=Alex
 */
app.get("/api/room/join", (req, res) => {
  const { playerName } = req.query;

  if (!playerName) {
    return res.json({
      success: false,
      message: "playerName required"
    });
  }

  if (!currentRoom) {
    return res.json({
      success: false,
      message: "Room not found"
    });
  }

  // ❌ duplicate block
  if (currentRoom.players.includes(playerName)) {
    return res.json({
      success: false,
      message: "Player already joined"
    });
  }

  // ❌ max 4 players
  if (currentRoom.players.length >= 4) {
    return res.json({
      success: false,
      message: "Room is full"
    });
  }

  currentRoom.players.push(playerName);

  // ▶️ start game when 4 players
  if (currentRoom.players.length === 4) {
    currentRoom.status = "playing";
  }

  res.json({
    success: true,
    message: "Joined room successfully 🎉",
    room: currentRoom
  });
});

/**
 * Dice roll (basic)
 * /api/dice/roll
 */
app.get("/api/dice/roll", (req, res) => {
  const dice = Math.floor(Math.random() * 6) + 1;

  res.json({
    success: true,
    dice
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log("=================================");
  console.log(`🚀 Server running on port ${PORT}`);
  console.log("=================================");
});
