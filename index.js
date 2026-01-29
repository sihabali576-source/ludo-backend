// ================================
// LUDO BACKEND - FINAL index.js
// ================================

const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// Socket.io
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --------------------
// Middleware
// --------------------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------
// Serve index.html
// --------------------
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// --------------------
// TEST API
// --------------------
app.get("/api", (req, res) => {
  res.json({
    success: true,
    message: "Ludo backend API working ✅"
  });
});

// --------------------
// ROOM SYSTEM (DEMO)
// --------------------
let rooms = {};

app.get("/api/room/create", (req, res) => {
  const { playerName } = req.query;

  if (!playerName) {
    return res.json({ success: false, message: "playerName required" });
  }

  const roomId = Math.random().toString(36).substring(2, 8).toUpperCase();

  rooms[roomId] = {
    roomId,
    players: [playerName],
    turnIndex: 0
  };

  res.json({
    success: true,
    room: rooms[roomId]
  });
});

app.get("/api/room/join", (req, res) => {
  const { roomId, playerName } = req.query;

  if (!rooms[roomId]) {
    return res.json({ success: false, message: "Room not found" });
  }

  if (!rooms[roomId].players.includes(playerName)) {
    rooms[roomId].players.push(playerName);
  }

  res.json({
    success: true,
    room: rooms[roomId]
  });
});

// --------------------
// Dice Roll API (TURN BASED)
// --------------------
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

  room.turnIndex = (room.turnIndex + 1) % room.players.length;

  // socket broadcast
  io.to(roomId).emit("dice-rolled", {
    player: playerName,
    dice,
    nextTurn: room.players[room.turnIndex]
  });

  res.json({
    success: true,
    dice,
    nextTurn: room.players[room.turnIndex]
  });
});

// --------------------
// SOCKET.IO
// --------------------
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// --------------------
// START SERVER
// --------------------
const PORT = process.env.PORT || 10000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
