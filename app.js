const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const PORT = 3000;

app.use(express.static('public'));

const players = {};
const coins = [];
const numCoins = 10;

function generateRandomPosition() {
    return {
        x: Math.floor(Math.random() * 780) + 10,
        y: Math.floor(Math.random() * 580) + 10
    };
}

// Initialize coins
for (let i = 0; i < numCoins; i++) {
    coins.push({...generateRandomPosition(), collected: false});
}

io.on('connection', (socket) => {
    console.log('New player connected:', socket.id);

    players[socket.id] = {
        x: Math.random() * 780 + 10,
        y: Math.random() * 580 + 10,
        width: 20,
        height: 20,
        score: 0,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`
    };

    socket.emit('init', { id: socket.id, players, coins });
    socket.broadcast.emit('newPlayer', { id: socket.id, player: players[socket.id] });

    socket.on('playerMove', (data) => {
        if (players[socket.id]) {
            players[socket.id].x = data.x;
            players[socket.id].y = data.y;
            checkCoinCollection(socket.id);
            io.emit('gameState', { players, coins });
        }
    });

    socket.on('disconnect', () => {
        console.log('Player disconnected:', socket.id);
        delete players[socket.id];
        io.emit('playerDisconnect', { id: socket.id });
    });
});

function checkCoinCollection(playerId) {
    const player = players[playerId];
    coins.forEach(coin => {
        if (!coin.collected && 
            player.x < coin.x + 10 &&
            player.x + player.width > coin.x &&
            player.y < coin.y + 10 &&
            player.y + player.height > coin.y) {
            coin.collected = true;
            players[playerId].score++;
        }
    });
}

setInterval(() => {
    io.emit('gameState', { players, coins });
}, 1000 / 60); // 60 FPS

server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
