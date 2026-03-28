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
      isSolo: true 
    });
    
    socket.roomId = roomId;
    socket.playerIndex = 1;
    socket.emit('player-index', 1);
    socket.emit('room-id', roomId); // Tell client the actual ID used
    io.to(roomId).emit('game-ready');
    io.to(roomId).emit('state-update', getPublicState(rooms.get(roomId)));
  });

  socket.on('flip-card', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || (room.status !== 'playing' && room.status !== 'incident') || room.resolving) return;

    if (room.flips.has(socket.id)) return; // Prevents double flip

    room.flips.set(socket.id, true);

    // Clear previous cards if this is the start of a new round
    if (room.flips.size === 1) {
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

      // Check if we are currently in a Tie situation (War pending)
      if (room.status === 'incident') {
        const result = resolveRound(room.deck1, room.deck2, room.pot, room.history);
        
        room.p1Card = room.deck1[0] || null; // The NEW face up card
        room.p2Card = room.deck2[0] || null;
        room.winner = result.winner;
        room.isWar = result.pot.length > room.pot.length + 2;
        room.history = result.history;
        room.pot = result.pot;

        if (result.winner !== 0) {
          room.status = 'playing'; // Back to normal play for next round
          if (result.winner === 1) room.deck1.push(...result.pot);
          else if (result.winner === 2) room.deck2.push(...result.pot);
          room.pot = [];
        } else {
          room.status = 'incident'; // Another tie!
        }
      } else {
        // Normal round
        const c1 = room.deck1.shift();
        const c2 = room.deck2.shift();
        const currentPot = [c1, c2];
        const currentHistory = [{ c1, c2, type: 'battle' }];

        room.p1Card = c1;
        room.p2Card = c2;
        room.pot = currentPot;
        room.history = currentHistory;

        if (c1 === c2) {
          room.status = 'incident'; // Trigger Emergency
          room.winner = null;
          room.isWar = true;
        } else {
          room.winner = c1 > c2 ? 1 : 2;
          if (room.winner === 1) room.deck1.push(...currentPot);
          else room.deck2.push(...currentPot);
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
      room.resolving = true; // Block further flips until bot "thinks"
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
