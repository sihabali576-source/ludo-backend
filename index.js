const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// --------------------
// MIDDLEWARE
// --------------------
app.use(cors());
app.use(express.json());

// --------------------
// SOCKET.IO
// --------------------
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// --------------------
// IN-MEMORY STORAGE
// --------------------
let rooms = {};
let wallets = {};

// --------------------
// HELPERS
// --------------------
function getWallet(userId) {
  if (!wallets[userId]) {
    wallets[userId] = {
      balance: 5000,
      history: []
    };
  }
  return wallets[userId];
}

// --------------------
// ROOT
// --------------------
app.get("/", (req, res) => {
  res.send("🚀 LUDO BACKEND RUNNING");
});

app.get("/api", (req, res) => {
  res.json({ success: true, message: "API working perfectly 🎉" });
});

// ==================================================
// 🧩 ROOM SYSTEM
// ==================================================

// CREATE ROOM
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
    room: rooms[roomId]
  });
});

// JOIN ROOM
app.get("/api/room/join", (req, res) => {
  const { roomId, playerName } = req.query;
  const room = rooms[roomId];

  if (!room) {
    return res.json({ success: false, message: "Room not found" });
  }

  if (room.players.includes(playerName)) {
    return res.json({ success: false, message: "Already joined" });
  }

  if (room.players.length >= 4) {
    return res.json({ success: false, message: "Room full" });
  }

  room.players.push(playerName);
  if (room.players.length >= 2) room.status = "playing";

  io.to(roomId).emit("room-updated", room);

  res.json({ success: true, room });
});

// DICE ROLL
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
    dice,
    nextTurn: room.players[room.turnIndex],
    room
  };

  io.to(roomId).emit("dice-rolled", payload);
  res.json({ success: true, ...payload });
});

// ==================================================
// 💰 WALLET SYSTEM (DEMO BACKEND)
// ==================================================

// GET BALANCE
app.get("/api/wallet", (req, res) => {
  const { userId } = req.query;
  const wallet = getWallet(userId);

  res.json({
    success: true,
    balance: wallet.balance,
    history: wallet.history
  });
});

// DEPOSIT
app.post("/api/wallet/deposit", (req, res) => {
  const { userId, amount } = req.body;

  if (!userId || amount < 100) {
    return res.json({
      success: false,
      message: "Minimum deposit is 100"
    });
  }

  const wallet = getWallet(userId);
  wallet.balance += amount;

  wallet.history.unshift({
    type: "DEPOSIT",
    amount,
    time: new Date().toLocaleString()
  });

  res.json({
    success: true,
    balance: wallet.balance
  });
});

// WITHDRAW
app.post("/api/wallet/withdraw", (req, res) => {
  const { userId, amount } = req.body;
  const wallet = getWallet(userId);

  if (!wallet || wallet.balance < amount) {
    return res.json({
      success: false,
      message: "Insufficient balance"
    });
  }

  wallet.balance -= amount;
  wallet.history.unshift({
    type: "WITHDRAW",
    amount,
    time: new Date().toLocaleString()
  });

  res.json({
    success: true,
    balance: wallet.balance
  });
});

// ==================================================
// 🔌 SOCKET EVENTS
// ==================================================
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`📦 Socket ${socket.id} joined room ${roomId}`);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

// ==================================================
// SERVER START
// ==================================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("🔥 Server running on port", PORT);
});
