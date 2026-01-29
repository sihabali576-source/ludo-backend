const express = require("express");
const http = require("http");
const path = require("path");
const { Server } = require("socket.io");
const mongoose = require("mongoose");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

/* =========================
   BASIC MIDDLEWARE
========================= */
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* =========================
   STATIC FILE (index.html)
========================= */
app.use(express.static(__dirname));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* SPA support (important) */
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

/* =========================
   MONGODB CONNECT
========================= */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ MongoDB connected"))
  .catch((err) => console.error("❌ MongoDB error:", err.message));

/* =========================
   SIMPLE MODELS
========================= */
const UserSchema = new mongoose.Schema({
  name: String,
  mobile: String,
  email: String,
  password: String,
});

const User = mongoose.model("User", UserSchema);

/* =========================
   API ROUTES
========================= */

/* Register */
app.post("/api/register", async (req, res) => {
  const { name, mobile, email, password } = req.body;

  if (!mobile || !password) {
    return res.json({ success: false, message: "Missing data" });
  }

  const exists = await User.findOne({ mobile });
  if (exists) {
    return res.json({ success: false, message: "User already exists" });
  }

  await User.create({ name, mobile, email, password });

  res.json({ success: true });
});

/* =========================
   LUDO ROOM (DEMO)
========================= */
let currentRoom = null;

app.get("/api/room/create", (req, res) => {
  const { playerName } = req.query;
  if (!playerName) {
    return res.json({ success: false, message: "playerName required" });
  }

  currentRoom = {
    roomId: Math.random().toString(36).substring(2, 7).toUpperCase(),
    players: [playerName],
    turnIndex: 0,
  };

  res.json({ success: true, room: currentRoom });
});

app.get("/api/room/join", (req, res) => {
  const { playerName } = req.query;

  if (!currentRoom) {
    return res.json({ success: false, message: "Room not found" });
  }

  if (!currentRoom.players.includes(playerName)) {
    currentRoom.players.push(playerName);
  }

  res.json({ success: true, room: currentRoom });
});

/* Dice roll */
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

/* =========================
   SOCKET.IO
========================= */
io.on("connection", (socket) => {
  console.log("🟢 Socket connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    socket.to(roomId).emit("room-updated", currentRoom);
  });

  socket.on("roll-dice", (data) => {
    socket.to(data.roomId).emit("dice-rolled", data);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Socket disconnected:", socket.id);
  });
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 10000;
server.listen(PORT, () => {
  console.log("🚀 Server running on port", PORT);
});
