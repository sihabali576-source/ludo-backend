// ================================
// 🔥 LUDO PARTY - BACKEND SERVER
// ================================

const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// ================================
// 🔧 APP & SERVER SETUP
// ================================
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// ================================
// 🔧 MIDDLEWARE
// ================================
app.use(cors());
app.use(express.json());

// ================================
// 🌐 SERVE FRONTEND (FIX FOR Cannot GET /)
// ================================
app.use(express.static(path.join(__dirname)));

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});

// ================================
// 🌍 ENV & DB CONNECT
// ================================
const PORT = process.env.PORT || 10000;
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
    .then(() => console.log("🟢 MongoDB connected"))
    .catch(err => console.error("🔴 MongoDB error:", err));

// ================================
// 🧠 USER MODEL
// ================================
const UserSchema = new mongoose.Schema({
    name: String,
    mobile: { type: String, unique: true },
    email: String,
    password: String,
    balance: { type: Number, default: 5000 }
});

const User = mongoose.model("User", UserSchema);

// ================================
// 🔐 AUTH API
// ================================

// ✅ REGISTER
app.post("/api/register", async (req, res) => {
    try {
        const { name, mobile, email, password } = req.body;

        if (!mobile || !password) {
            return res.json({ success: false, message: "Missing fields" });
        }

        const exists = await User.findOne({ mobile });
        if (exists) {
            return res.json({ success: false, message: "User already exists" });
        }

        const user = await User.create({
            name,
            mobile,
            email,
            password
        });

        res.json({
            success: true,
            user: {
                id: user._id,
                name: user.name,
                mobile: user.mobile,
                email: user.email
            }
        });

    } catch (err) {
        res.json({ success: false, message: "Register error" });
    }
});

// ✅ LOGIN
app.post("/api/login", async (req, res) => {
    try {
        const { mobile, password } = req.body;

        const user = await User.findOne({ mobile, password });
        if (!user) {
            return res.json({ success: false, message: "Invalid login" });
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

    } catch (err) {
        res.json({ success: false, message: "Login error" });
    }
});

// ================================
// 🎮 ROOM API
// ================================
const rooms = {};

app.get("/api/room/create", (req, res) => {
    const { playerName } = req.query;
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

// ================================
// 🔌 SOCKET.IO
// ================================
io.on("connection", socket => {
    console.log("🟢 Socket connected:", socket.id);

    socket.on("join-room", roomId => {
        socket.join(roomId);
        socket.to(roomId).emit("room-updated", rooms[roomId]);
    });

    socket.on("dice-roll", data => {
        socket.to(data.roomId).emit("dice-rolled", data);
    });

    socket.on("disconnect", () => {
        console.log("🔴 Socket disconnected:", socket.id);
    });
});

// ================================
// 🚀 START SERVER
// ================================
server.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
});
