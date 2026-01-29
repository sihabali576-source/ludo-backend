const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// আপনার গেমের ফাইলগুলো দেখানোর জন্য
app.use(express.static(path.join(__dirname, './')));

let onlinePlayers = {};

io.on('connection', (socket) => {
    console.log('একজন প্লেয়ার যুক্ত হয়েছে:', socket.id);

    // ম্যাচ মেকিং এবং রুম জয়েনিং
    socket.on('joinGame', (data) => {
        socket.join(data.room);
        onlinePlayers[socket.id] = data;
        console.log(`${data.playerName} রুম ${data.room}-এ যুক্ত হয়েছে`);
    });

    // ডাইস রোল শেয়ার করা
    socket.on('diceRoll', (data) => {
        io.to(data.room).emit('broadcastDice', data);
    });

    // গুটি চাল শেয়ার করা
    socket.on('moveToken', (data) => {
        io.to(data.room).emit('broadcastMove', data);
    });

    socket.on('disconnect', () => {
        delete onlinePlayers[socket.id];
        console.log('প্লেয়ার চলে গেছে');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`সার্ভার চলছে পোর্টে: ${PORT}`);
});
