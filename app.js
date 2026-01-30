const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();

// --- খুব গুরুত্বপূর্ণ অংশ (Middleware) ---
// 1. CORS: Frontend থেকে রিকোয়েস্ট নিতে দিবে
app.use(cors());
// 2. Express JSON: JSON ডাটা পড়তে সক্ষম করবে (এটা না থাকলে রেজিস্টার/লগইন হবে না)
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// --- ডেমো ডাটাবেস (Server Restart হলে ডাটা মুছে যাবে) ---
let users = [];

// --- টেস্ট রুট ---
app.get('/', (req, res) => {
    res.send('Ludo Backend is Running!');
});

// --- Register API ---
app.post('/api/register', (req, res) => {
    console.log("Register Request Received:", req.body); // Render Logs এ দেখুন
    
    const { name, mobile, password } = req.body;

    if (!name || !mobile || !password) {
        return res.json({ success: false, message: "All fields required" });
    }

    // ইউজার আগে আছে কিনা চেক করুন
    if (users.find(u => u.mobile === mobile)) {
        return res.json({ success: false, message: "User already exists" });
    }

    // নতুন ইউজার তৈরি
    const user = {
        id: Date.now().toString(),
        name,
        mobile,
        password,
        balance: 1000 // ডিফল্ট ব্যালেন্স
    };
    users.push(user);

    console.log("New User Created:", user);
    res.json({ success: true, message: "Registration Successful!" });
});

// --- Login API ---
app.post('/api/login', (req, res) => {
    console.log("Login Request Received:", req.body); // Render Logs এ দেখুন

    const { mobile, password } = req.body;

    if (!mobile || !password) {
        return res.json({ success: false, message: "Invalid Input" });
    }

    // ইউজার খুঁজুন
    const user = users.find(u => u.mobile === mobile && u.password === password);

    if (user) {
        // ফেক টোকেন তৈরি
        const token = "token_" + Date.now();
        res.json({
            success: true,
            token: token,
            user: {
                _id: user.id,
                name: user.name,
                mobile: user.mobile,
                balance: user.balance
            }
        });
    } else {
        res.json({ success: false, message: "Invalid Mobile or Password" });
    }
});

// --- User Info API ---
app.get('/api/user/me', (req, res) => {
    // ডেমো জন্য সাধারণ ব্যালেন্স দেখাচ্ছে
    res.json({ success: true, user: { balance: 1000 } });
});

// --- Socket.io Connection ---
io.on('connection', (socket) => {
    console.log('New User Connected:', socket.id);

    socket.on('join_queue', (data) => {
        console.log('Player Searching Match:', data);
        
        // ৩ সেকেন্ড পর ম্যাচ দেখাবে (ডেমো)
        setTimeout(() => {
            socket.emit('match_found', { roomId: 'room_demo_' + Date.now() });
        }, 3000);
    });

    socket.on('disconnect', () => {
        console.log('User Disconnected');
    });
});

// --- Server Start ---
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server Running on Port: ${PORT}`);
});
