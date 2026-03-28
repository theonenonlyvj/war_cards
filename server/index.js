const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { distributeDecks, resolveRound } = require('./gameLogic');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { 
  cors: { 
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST"]
  } 
});

const rooms = new Map(); // Room ID -> Game State

function getPublicState(room) {
  return {
    p1Count: room.deck1 ? room.deck1.length : 0,
    p2Count: room.deck2 ? room.deck2.length : 0,
    p1Card: room.p1Card || null,
    p2Card: room.p2Card || null,
    p1Flipped: room.flips ? room.flips.has(room.players[0]) : false,
    p2Flipped: room.flips ? room.flips.has(room.players[1]) : false,
    isWar: room.isWar || false,
    winner: room.winner || null,
    status: room.status,
    history: room.history || []
  };
}

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    if (typeof roomId !== 'string' || roomId.trim() === '') {
      return socket.emit('error', 'Invalid room ID');
    }

    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { players: [], deck1: [], deck2: [], status: 'waiting' });
    }
    
    const room = rooms.get(roomId);
    
    if (room.players.length >= 2) {
      return socket.emit('error', 'Room is full');
    }

    room.players.push(socket.id);
    socket.roomId = roomId;
    socket.playerIndex = room.players.length; // 1 or 2
    socket.emit('player-index', socket.playerIndex);

    if (room.players.length === 2) {
      const { deck1, deck2 } = distributeDecks();
      room.deck1 = deck1;
      room.deck2 = deck2;
      room.flips = new Map(); // Track which player has flipped
      room.status = 'playing';
      io.to(roomId).emit('game-ready');
      io.to(roomId).emit('state-update', getPublicState(room));
    }
  });

  socket.on('join-solo', () => {
    const roomId = `SOLO-${socket.id.substring(0, 6)}`;
    socket.join(roomId);
    const { deck1, deck2 } = distributeDecks();
    rooms.set(roomId, { 
      players: [socket.id, 'BOT-AI'], 
      deck1, deck2, 
      flips: new Map(), 
      status: 'playing',
      isSolo: true 
    });
    socket.roomId = roomId;
    socket.playerIndex = 1;
    socket.emit('player-index', 1);
    io.to(roomId).emit('state-update', getPublicState(rooms.get(roomId)));
  });

  socket.on('flip-card', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'playing') return;

    if (room.flips.has(socket.id)) return; // Prevents double flip

    room.flips.set(socket.id, true);

    const broadcastState = () => {
      // Update all clients that a player has flipped
      io.to(roomId).emit('state-update', { 
        ...getPublicState(room), 
        p1Flipped: room.flips.has(room.players[0]),
        p2Flipped: room.flips.has(room.players[1])
      });
    };

    broadcastState();

    const resolve = () => {
      if (room.deck1.length === 0 || room.deck2.length === 0) {
        room.status = 'game-over';
        io.to(roomId).emit('state-update', getPublicState(room));
        return;
      }

      // Keep track of cards for UI
      const c1 = room.deck1[0];
      const c2 = room.deck2[0];
      
      const result = resolveRound(room.deck1, room.deck2);
      
      room.p1Card = c1;
      room.p2Card = c2;
      room.winner = result.winner;
      room.isWar = result.pot.length > 2;
      room.history = result.history;

      if (result.winner === 1) {
        room.deck1.push(...result.pot);
      } else if (result.winner === 2) {
        room.deck2.push(...result.pot);
      }

      // Reset flips for next round
      room.flips.clear();

      // Delay the result slightly for visual effect
      setTimeout(() => {
        io.to(roomId).emit('state-update', getPublicState(room));

        if (room.deck1.length === 0 || room.deck2.length === 0) {
          room.status = 'game-over';
          io.to(roomId).emit('state-update', getPublicState(room));
        }
      }, 1000);
    };

    if (room.isSolo && room.flips.size === 1) {
      setTimeout(() => {
        room.flips.set('BOT-AI', true);
        broadcastState();
        resolve();
      }, 500);
    } else if (room.flips.size === 2) {
      resolve();
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
