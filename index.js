const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);

// 🔥 SOCKET.IO SETUP
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// ============================
// IN-MEMORY ROOM STORAGE
// ============================
let rooms = {};

// ============================
// ROOT
// ============================
app.get("/", (req, res) => {
  res.send("🚀 LUDO BACKEND RUNNING");
});

// ============================
// API TEST
// ============================
app.get("/api", (req, res) => {
  res.json({ success: true, message: "API working perfectly 🎉" });
});

// ============================
// CREATE ROOM
// ============================
app.get("/api/room/create", (req, res) => {
  const { playerName } = req.query;

  if (!playerName) {
    return res.json({ success: false, message: "playerName required" });
  }

  const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();

  rooms[roomId] = {
    roomId,
    players: [playerName],
    status: "waiting",
    turnIndex: 0,
    createdAt: Date.now()
  };

  res.json({
    success: true,
    message: "Room created successfully 🎉 (GET)",
    room: rooms[roomId]
  });
});

// ============================
// JOIN ROOM
// ============================
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

  if (room.players.length >= 4) {
    return res.json({ success: false, message: "Room full" });
  }

  room.players.push(playerName);

  if (room.players.length >= 2) {
    room.status = "playing";
  }

  // 🔥 broadcast room update
  io.to(roomId).emit("room-updated", room);

  res.json({
    success: true,
    message: "Joined room successfully",
    room
  });
});

// ============================
// DICE ROLL
// ============================
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

  const payload = {
    success: true,
    dice,
    nextTurn: room.players[room.turnIndex],
    room
  };

  // 🔥 broadcast dice roll
  io.to(roomId).emit("dice-rolled", payload);

  res.json(payload);
});

// ============================
// SOCKET CONNECTION
// ============================
io.on("connection", (socket) => {
  console.log("🟢 New socket connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`📦 Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// ============================
// SERVER START
// ============================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🔥 Server running on port ${PORT}`);
});
