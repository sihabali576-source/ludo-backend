const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" }
});

// স্ট্যাটিক ফাইল পরিবেশন (HTML, CSS, JS)
app.use(express.static(path.join(__dirname, './')));

io.on('connection', (socket) => {
    console.log('প্লেয়ার কানেক্ট হয়েছে:', socket.id);

    // রুমে জয়েন করা
    socket.on('joinGame', (data) => {
        socket.join(data.room);
        console.log(`${data.playerName} রুম ${data.room}-এ আছে`);
    });

    // ডাইস রোল শেয়ার করা
    socket.on('diceRoll', (data) => {
        socket.to(data.room).emit('broadcastDice', data);
    });

    // গুটি মুভমেন্ট শেয়ার করা
    socket.on('moveToken', (data) => {
        socket.to(data.room).emit('broadcastMove', data);
    });

    socket.on('disconnect', () => {
        console.log('প্লেয়ার ডিসকানেক্ট হয়েছে');
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`সার্ভার চলছে পোর্টে: ${PORT}`);
});
