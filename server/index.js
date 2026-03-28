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
      deck1, 
      deck2, 
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
    if (!room || (room.status !== 'playing' && room.status !== 'incident' && room.status !== 'deployment') || room.resolving) return;

    if (room.flips.has(socket.id)) return; // Prevents double flip

    room.flips.set(socket.id, true);

    // Reset card visuals at the start of a new flip cycle (unless in deployment)
    if (room.flips.size === 1 && room.status !== 'incident' && room.status !== 'deployment') {
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
        io.to(roomId).emit('state-update', getPublicState(room));
        return;
      }

      if (room.status === 'incident') {
        // Stage 2: Deployment (The Burn)
        const r1 = room.deck1.splice(0, Math.min(room.deck1.length - 1, 3));
        const r2 = room.deck2.splice(0, Math.min(room.deck2.length - 1, 3));
        room.pot.push(...r1, ...r2);
        room.history.push({ r1, r2, type: 'war-reinforcements' });
        
        room.p1Card = null; 
        room.p2Card = null;
        room.status = 'deployment';
      } else if (room.status === 'deployment') {
        // Stage 3: The Face-off
        const c1 = room.deck1.shift();
        const c2 = room.deck2.shift();
        room.pot.push(c1, c2);
        room.history.push({ c1, c2, type: 'battle' });
        
        room.p1Card = c1;
        room.p2Card = c2;

        if (c1 === c2) {
          room.status = 'incident';
          room.winner = null;
          room.isWar = true;
        } else {
          room.winner = c1 > c2 ? 1 : 2;
          if (room.winner === 1) room.deck1.push(...room.pot);
          else room.deck2.push(...room.pot);
          room.status = 'playing';
          room.pot = [];
        }
      } else {
        // Stage 1: Standard Battle
        const c1 = room.deck1.shift();
        const c2 = room.deck2.shift();
        room.pot = [c1, c2];
        room.history = [{ c1, c2, type: 'battle' }];
        room.p1Card = c1;
        room.p2Card = c2;

        if (c1 === c2) {
          room.status = 'incident';
          room.winner = null;
          room.isWar = true;
        } else {
          room.winner = c1 > c2 ? 1 : 2;
          if (room.winner === 1) room.deck1.push(...room.pot);
          else room.deck2.push(...room.pot);
          room.status = 'playing';
          room.pot = [];
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

  socket.on('disconnect', () => {
    leavePreviousRoom();
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => console.log(`Server running on ${PORT}`));
