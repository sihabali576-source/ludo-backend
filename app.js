const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();

// ✅ এই লাইনগুলো ছিল না, এজন্য লগইন হচ্ছিল না
app.use(cors()); 
app.use(express.json()); // JSON ডাটা পড়ার জন্য
app.use(express.urlencoded({ extended: true })); 

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// --- ডেমো ডাটাবেস (Server Sleep হলে ডাটা মুছে যাবে) ---
let users = [];

// --- API রাউট ---
app.get('/', (req, res) => {
    res.send('Ludo Server is Running Successfully!');
});

// Register Route
app.post('/api/register', (req, res) => {
    console.log("Register Request:", req.body); // লগ দেখার জন্য

    const { name, mobile, password } = req.body;

    // যদি ইতিমধ্যে ইউজার থাকে
    if (users.find(u => u.mobile === mobile)) {
        return res.json({ success: false, message: "User already exists!" });
    }

    // নতুন ইউজার তৈরি
    const user = { 
        id: Date.now(), 
        name, 
        mobile, 
        password, // রিয়েল অ্যাপে পাসওয়ার্ড হ্যাশ করা জরুরি
        balance: 1000 
    };
    users.push(user);
    
    res.json({ success: true, message: "Registered successfully!" });
});

// Login Route
app.post('/api/login', (req, res) => {
    console.log("Login Request:", req.body); // লগ দেখার জন্য

    const { mobile, password } = req.body;

    // ইউজার খোঁজা
    const user = users.find(u => u.mobile === mobile && u.password === password);

    if (user) {
        // টোকেন তৈরি (ডেমো)
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
        res.json({ success: false, message: "Invalid mobile or password" });
    }
});

// User Info (Wallet Balance)
app.get('/api/user/me', (req, res) => {
    // ডেমো মোডে সবাইকে ব্যালেন্স দেখাবে
    res.json({ success: true, user: { balance: 1000 } });
});

// --- সকেট রিয়েলটাইম কানেকশন ---
io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    socket.on('join_queue', (data) => {
        console.log('Player searching for match:', data.players + ' players');
        
        // ৩ সেকেন্ড পর ম্যাচ ফাউন্ড দেখাবে (ডেমো)
        setTimeout(() => {
            socket.emit('match_found', { roomId: 'room_demo_123' });
        }, 3000);
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected');
    });
});

// রেন্ডারের পোর্ট ব্যবহার করা হচ্ছে
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
