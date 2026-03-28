const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = new Map(); // Room ID -> Game State

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    if (typeof roomId !== 'string' || roomId.trim() === '') {
      return socket.emit('error', 'Invalid room ID');
    }

    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { players: [], deck: [], status: 'waiting' });
    }
    
    const room = rooms.get(roomId);
    
    if (room.players.length >= 2) {
      return socket.emit('error', 'Room is full');
    }

    room.players.push(socket.id);
    socket.roomId = roomId; // Store room ID on socket for disconnect handling

    if (room.players.length === 2) {
      room.status = 'ready';
      io.to(roomId).emit('game-ready');
    }
  });

  socket.on('disconnect', () => {
    if (socket.roomId && rooms.has(socket.roomId)) {
      const room = rooms.get(socket.roomId);
      room.players = room.players.filter(id => id !== socket.id);
      
      if (room.players.length === 0) {
        rooms.delete(socket.roomId);
      } else {
        room.status = 'waiting';
        io.to(socket.roomId).emit('player-left');
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
