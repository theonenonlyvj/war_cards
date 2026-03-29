const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { distributeDecks } = require('./gameLogic');

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
    history: room.history || [],
    isSolo: room.isSolo || false
  };
}

io.on('connection', (socket) => {
  const leavePreviousRoom = () => {
    if (socket.roomId) {
      socket.leave(socket.roomId);
      const room = rooms.get(socket.roomId);
      if (room) {
        room.players = room.players.filter(id => id !== socket.id);
        if (room.players.length === 0 || (room.isSolo && room.players.length === 1 && room.players[0] === 'BOT-AI')) {
          rooms.delete(socket.roomId);
        } else {
          room.status = 'waiting';
          io.to(socket.roomId).emit('player-left');
        }
      }
      socket.roomId = null;
    }
  };

  socket.on('join-room', (roomId) => {
    if (typeof roomId !== 'string' || roomId.trim() === '') {
      return socket.emit('error', 'Invalid room ID');
    }
    leavePreviousRoom();
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { players: [], deck1: [], deck2: [], status: 'waiting' });
    }
    const room = rooms.get(roomId);
    if (room.players.length >= 2) return socket.emit('error', 'Room is full');
    room.players.push(socket.id);
    socket.roomId = roomId;
    socket.playerIndex = room.players.length; 
    socket.emit('player-index', socket.playerIndex);
    if (room.players.length === 2) {
      const { deck1, deck2 } = distributeDecks();
      room.deck1 = deck1;
      room.deck2 = deck2;
      room.flips = new Map();
      room.status = 'playing';
      room.pot = [];
      room.history = [];
      io.to(roomId).emit('game-ready');
      io.to(roomId).emit('state-update', getPublicState(room));
    }
  });

  socket.on('join-solo', (providedRoomId) => {
    leavePreviousRoom();
    const roomId = providedRoomId || `SOLO-${socket.id.substring(0, 6)}`;
    socket.join(roomId);
    const { deck1, deck2 } = distributeDecks();
    rooms.set(roomId, { 
      players: [socket.id, 'BOT-AI'], 
      deck1, deck2, 
      flips: new Map(), 
      status: 'playing',
      isSolo: true,
      pot: [],
      history: []
    });
    socket.roomId = roomId;
    socket.playerIndex = 1;
    socket.emit('player-index', 1);
    socket.emit('room-id', roomId); 
    io.to(roomId).emit('game-ready');
    io.to(roomId).emit('state-update', getPublicState(rooms.get(roomId)));
  });

  socket.on('flip-card', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.resolving) return;
    const allowed = ['playing', 'incident', 'deployment'].includes(room.status);
    if (!allowed || room.flips.has(socket.id)) return;

    room.flips.set(socket.id, true);

    if (room.flips.size === 1 && room.status === 'playing') {
      room.p1Card = null;
      room.p2Card = null;
      room.winner = null;
      room.isWar = false;
      room.history = [];
    }

    const broadcastState = () => {
      io.to(roomId).emit('state-update', { 
        ...getPublicState(room), 
        p1Flipped: room.flips.has(room.players[0]),
        p2Flipped: room.flips.has(room.players[1])
      });
    };

    broadcastState();

    const resolve = () => {
      room.resolving = true;
      if (room.deck1.length === 0 || room.deck2.length === 0) {
        room.status = 'game-over';
        room.resolving = false;
        return io.to(roomId).emit('state-update', getPublicState(room));
      }

      if (room.status === 'incident') {
        const r1 = room.deck1.splice(0, Math.min(room.deck1.length - 1, 3));
        const r2 = room.deck2.splice(0, Math.min(room.deck2.length - 1, 3));
        room.pot.push(...r1, ...r2);
        room.history.push({ r1, r2, type: 'war-reinforcements' });
        room.p1Card = null; 
        room.p2Card = null;
        room.status = 'deployment';
        room.isWar = false; 
      } else if (room.status === 'deployment') {
        const c1 = room.deck1.shift();
        const c2 = room.deck2.shift();
        room.pot.push(c1, c2);
        room.p1Card = c1; 
        room.p2Card = c2;
        room.history.push({ c1, c2, type: 'battle' });
        if (c1.value === c2.value) {
          room.status = 'incident'; 
          room.isWar = true; 
          room.winner = null;
        } else {
          room.winner = c1.value > c2.value ? 1 : 2;
          const winnerDeck = room.winner === 1 ? room.deck1 : room.deck2;
          winnerDeck.push(...room.pot);
          room.pot = []; 
          room.status = 'playing'; 
          room.isWar = false;
        }
      } else {
        const c1 = room.deck1.shift();
        const c2 = room.deck2.shift();
        room.pot = [c1, c2];
        room.p1Card = c1; 
        room.p2Card = c2;
        room.history = [{ c1, c2, type: 'battle' }];
        if (c1.value === c2.value) {
          room.status = 'incident'; 
          room.isWar = true; 
          room.winner = null;
        } else {
          room.winner = c1.value > c2.value ? 1 : 2;
          const winnerDeck = room.winner === 1 ? room.deck1 : room.deck2;
          winnerDeck.push(...room.pot);
          room.pot = []; 
          room.status = 'playing';
        }
      }

      room.flips.clear();
      setTimeout(() => {
        room.resolving = false;
        io.to(roomId).emit('state-update', getPublicState(room));
        if (room.deck1.length === 0 || room.deck2.length === 0) {
          room.status = 'game-over';
          io.to(roomId).emit('state-update', getPublicState(room));
        }
      }, 1000);
    };

    if (room.isSolo && room.flips.size === 1) {
      room.resolving = true;
      setTimeout(() => {
        room.flips.set('BOT-AI', true);
        broadcastState();
        room.resolving = false;
        resolve();
      }, 500);
    } else if (room.flips.size === 2) {
      resolve();
    }
  });

  socket.on('disconnect', () => leavePreviousRoom());
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
