// ================================
// LUDO PARTY - PRO AI BACKEND
// ================================

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const http = require("http");
const { Server } = require("socket.io");
require("dotenv").config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

// ================================
// MIDDLEWARE
// ================================
app.use(cors());
app.use(express.json());
app.use(express.static("public")); // index.html serve হবে

// ================================
// MONGODB CONNECT
// ================================
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("🟢 MongoDB Connected"))
  .catch(err => console.error("🔴 Mongo Error", err));

// ================================
// SCHEMAS
// ================================
const UserSchema = new mongoose.Schema({
  name: String,
  mobile: { type: String, unique: true },
  email: String,
  password: String,
  balance: { type: Number, default: 0 }
});

const TxSchema = new mongoose.Schema({
  userId: mongoose.Schema.Types.ObjectId,
  type: String,
  amount: Number,
  status: String,
  time: { type: Date, default: Date.now }
});

const RoomSchema = new mongoose.Schema({
  roomId: String,
  players: [String],
  createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);
const Transaction = mongoose.model("Transaction", TxSchema);
const Room = mongoose.model("Room", RoomSchema);

// ================================
// AUTH APIs
// ================================

// REGISTER
app.post("/api/register", async (req, res) => {
  try {
    const { name, mobile, password, email } = req.body;

    const exists = await User.findOne({ mobile });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    const hash = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      mobile,
      email,
      password: hash,
      balance: 5000 // demo bonus
    });

    res.json({ success: true, userId: user._id });
  } catch (e) {
    res.json({ success: false, message: "Register failed" });
  }
});

// LOGIN
app.post("/api/login", async (req, res) => {
  const { mobile, password } = req.body;

  const user = await User.findOne({ mobile });
  if (!user) {
    return res.json({ success: false, message: "User not found" });
  }

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) {
    return res.json({ success: false, message: "Wrong password" });
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      mobile: user.mobile,
      email: user.email,
      balance: user.balance
    }
  });
});

// ================================
// WALLET APIs
// ================================

// BALANCE
app.get("/api/wallet/:id", async (req, res) => {
  const user = await User.findById(req.params.id);
  res.json({ balance: user.balance });
});

// DEPOSIT REQUEST
app.post("/api/deposit", async (req, res) => {
  const { userId, amount } = req.body;

  await Transaction.create({
    userId,
    type: "DEPOSIT",
    amount,
    status: "PENDING"
  });

  res.json({ success: true });
});

// WITHDRAW REQUEST
app.post("/api/withdraw", async (req, res) => {
  const { userId, amount } = req.body;

  const user = await User.findById(userId);
  if (user.balance < amount) {
    return res.json({ success: false, message: "Insufficient balance" });
  }

  user.balance -= amount;
  await user.save();

  await Transaction.create({
    userId,
    type: "WITHDRAW",
    amount,
    status: "PENDING"
  });

  res.json({ success: true });
});

// TRANSACTIONS
app.get("/api/transactions/:id", async (req, res) => {
  const tx = await Transaction.find({ userId: req.params.id }).sort({ time: -1 });
  res.json(tx);
});

// ================================
// ONLINE ROOM APIs
// ================================
app.get("/api/room/create", async (req, res) => {
  const { playerName } = req.query;

  const roomId = Math.random().toString(36).substring(2, 8);
  const room = await Room.create({
    roomId,
    players: [playerName]
  });

  res.json({ room });
});

// ================================
// SOCKET.IO
// ================================
io.on("connection", socket => {
  console.log("🟢 Socket connected", socket.id);

  socket.on("join-room", async roomId => {
    socket.join(roomId);
    io.to(roomId).emit("room-updated", { roomId });
  });

  socket.on("dice-roll", data => {
    io.to(data.roomId).emit("dice-rolled", data);
  });
});

// ================================
// START SERVER
// ================================
const PORT = process.env.PORT || 3000;
server.listen(PORT, () =>
  console.log("🚀 Server running on port", PORT)
);
