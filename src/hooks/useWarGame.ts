import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

export const useWarGame = (roomId: string) => {
  const [gameState, setGameState] = useState<any>(null);
  useEffect(() => {
    socket.emit('join-room', roomId);
    socket.on('state-update', (state) => setGameState(state));
    socket.on('game-ready', () => console.log('Game Ready!'));
    
    return () => {
      socket.off('state-update');
      socket.off('game-ready');
    };
  }, [roomId]);

  const flip = () => socket.emit('flip-card', { roomId });
  return { gameState, flip };
};
