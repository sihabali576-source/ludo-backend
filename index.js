// ===============================
// LUDO BACKEND – FINAL index.js
// ===============================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");

// -------------------------------
// APP & SERVER
// -------------------------------
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

app.use(cors());
app.use(express.json());

// -------------------------------
// IN-MEMORY STORE (for now)
// -------------------------------
const rooms = {}; // { roomId: { players, turnIndex, createdAt } }

// -------------------------------
// HELPERS
// -------------------------------
function generateRoomId() {
  return Math.random().toString(36).substring(2, 6).toUpperCase();
}

// -------------------------------
// BASIC ROUTES
// -------------------------------
app.get("/", (req, res) => {
  res.send("🎲 LUDO BACKEND RUNNING 🚀");
});

app.get("/api", (req, res) => {
  res.json({ success: true, message: "API working perfectly 🚀" });
});

// -------------------------------
// ROOM CREATE
// -------------------------------
app.get("/api/room/create", (req, res) => {
  const { playerName } = req.query;
  if (!playerName) {
    return res.json({ success: false, message: "playerName required" });
  }

  const roomId = generateRoomId();

  rooms[roomId] = {
    roomId,
    players: [playerName],
    turnIndex: 0,
    createdAt: Date.now()
  };

  res.json({
    success: true,
    message: "Room created successfully 🎉 (GET)",
    room: rooms[roomId]
  });
});

// -------------------------------
// ROOM JOIN
// -------------------------------
app.get("/api/room/join", (req, res) => {
  const { roomId, playerName } = req.query;

  if (!roomId || !playerName) {
    return res.json({ success: false, message: "roomId & playerName required" });
  }

  const room = rooms[roomId];
  if (!room) {
    return res.json({ success: false, message: "Room not found" });
  }

  if (room.players.includes(playerName)) {
    return res.json({ success: false, message: "Player already joined" });
  }

  room.players.push(playerName);

  res.json({
    success: true,
    message: "Joined room successfully",
    room
  });

  io.to(roomId).emit("room-updated", room);
});

// -------------------------------
// DICE ROLL
// -------------------------------
app.get("/api/dice/roll", (req, res) => {
  const { roomId, playerName } = req.query;

  const room = rooms[roomId];
  if (!room) {
    return res.json({ success: false, message: "Room not found" });
  }

  const currentPlayer = room.players[room.turnIndex];
  if (playerName !== currentPlayer) {
    return res.json({
      success: false,
      message: `Not your turn. Now playing: ${currentPlayer}`
    });
  }

  const dice = Math.floor(Math.random() * 6) + 1;

  // next turn
  room.turnIndex = (room.turnIndex + 1) % room.players.length;

  io.to(roomId).emit("dice-rolled", {
    dice,
    nextTurn: room.players[room.turnIndex],
    room
  });

  res.json({
    success: true,
    dice,
    nextTurn: room.players[room.turnIndex]
  });
});

// -------------------------------
// SOCKET.IO
// -------------------------------
io.on("connection", (socket) => {
  console.log("🟢 User connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`🔗 Socket joined room ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 User disconnected:", socket.id);
  });
});

// -------------------------------
// 🚨 IMPORTANT: RENDER PORT FIX
// -------------------------------
const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
});
