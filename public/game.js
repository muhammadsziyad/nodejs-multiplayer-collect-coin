const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const socket = io();

let playerId;
let player = {
    x: canvas.width / 2,
    y: canvas.height / 2,
    width: 20,
    height: 20
};
let players = {};
let coins = [];

socket.on('init', (data) => {
    playerId = data.id;
    players = data.players;
    coins = data.coins;
});

socket.on('newPlayer', (data) => {
    players[data.id] = data.player;
});

socket.on('gameState', (data) => {
    players = data.players;
    coins = data.coins;
    draw();
});

socket.on('playerDisconnect', (data) => {
    delete players[data.id];
});

function drawPlayer(p, color) {
    ctx.fillStyle = color;
    ctx.fillRect(p.x, p.y, p.width, p.height);
}

function drawCoin(coin) {
    if (!coin.collected) {
        ctx.beginPath();
        ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
        ctx.fillStyle = 'gold';
        ctx.fill();
        ctx.closePath();
    }
}

function drawScore() {
    ctx.font = '20px Arial';
    ctx.fillStyle = 'black';
    ctx.textAlign = 'center';
    for (let id in players) {
        const player = players[id];
        ctx.fillText(`Player ${id.substring(0, 5)}: ${player.score}`, player.x + player.width / 2, player.y - 10);
    }
}

function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let id in players) {
        drawPlayer(players[id], players[id].color);
    }
    coins.forEach(drawCoin);
    drawScore();
}

function updatePlayerPosition() {
    socket.emit('playerMove', { x: player.x, y: player.y });
}

function handleKeydown(event) {
    switch(event.key) {
        case 'ArrowUp':
            player.y -= 5;
            break;
        case 'ArrowDown':
            player.y += 5;
            break;
        case 'ArrowLeft':
            player.x -= 5;
            break;
        case 'ArrowRight':
            player.x += 5;
            break;
    }
    updatePlayerPosition();
}

document.addEventListener('keydown', handleKeydown);

function gameLoop() {
    draw();
    requestAnimationFrame(gameLoop);
}

gameLoop();
