import { describe, test, beforeAll, afterAll, afterEach } from 'vitest';
const { io } = require('socket.io-client');
const { Server } = require('socket.io');
const http = require('http');
const express = require('express');

describe('Server Connectivity and Room Logic', () => {
  let ioServer, server, client1, client2;
  const PORT = 3002;

  beforeAll((done) => {
    const app = express();
    server = http.createServer(app);
    ioServer = new Server(server);

    const rooms = new Map();

    ioServer.on('connection', (socket) => {
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
        socket.roomId = roomId;
        if (room.players.length === 2) {
          room.status = 'ready';
          ioServer.to(roomId).emit('game-ready');
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
            ioServer.to(socket.roomId).emit('player-left');
          }
        }
      });
    });

    server.listen(PORT, done);
  });

  afterAll(() => {
    ioServer.close();
    server.close();
  });

  afterEach(() => {
    if (client1) client1.disconnect();
    if (client2) client2.disconnect();
  });

  test('should emit game-ready when two players join a room', (done) => {
    client1 = io(`http://localhost:${PORT}`);
    client2 = io(`http://localhost:${PORT}`);

    client1.emit('join-room', 'test-room');
    client2.emit('join-room', 'test-room');

    client1.on('game-ready', () => {
      done();
    });
  });

  test('should emit player-left when a player disconnects', (done) => {
    client1 = io(`http://localhost:${PORT}`);
    client2 = io(`http://localhost:${PORT}`);

    client1.emit('join-room', 'test-room-2');
    client2.emit('join-room', 'test-room-2');

    client1.on('game-ready', () => {
      client2.disconnect();
    });

    client1.on('player-left', () => {
      done();
    });
  });
});
