const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = new Map(); // Room ID -> Game State

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { players: [], deck: [], status: 'waiting' });
    }
    const room = rooms.get(roomId);
    room.players.push(socket.id);
    if (room.players.length === 2) {
      room.status = 'ready';
      io.to(roomId).emit('game-ready');
    }
  });
});

server.listen(3001, () => console.log('Server running on 3001'));
