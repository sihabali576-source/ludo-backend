const express = require('express');
const http = require('http');
const { Server } = require("socket.io");
const cors = require('cors');

const app = express();
app.use(cors()); // ফ্রন্টএন্ড থেকে রিকোয়েস্ট নেওয়ার অনুমতি

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // সব URL থেকে সকেট কানেকশন এলাউ
});

// --- ডাটাবেস (ডেমো) ---
let users = [];

// --- API রাউট ---
app.get('/', (req, res) => {
    res.send('Ludo Server is Running Successfully!');
});

app.post('/api/login', (req, res) => {
    // ডেমো লজিক: সব লগইন সফল হবে
    res.json({ success: true, token: "demo_token", user: { name: "Player", balance: 1000 } });
});

app.post('/api/register', (req, res) => {
    res.json({ success: true });
});

// --- সকেট রিয়েলটাইম কানেকশন ---
io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    // খেলোয়াড় খুঁজছে
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
