import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:3001');

interface GameState {
  p1Count: number;
  p2Count: number;
  p1Card: number | null;
  p2Card: number | null;
  p1Flipped: boolean;
  p2Flipped: boolean;
  isWar: boolean;
  winner: number | null;
  status: 'waiting' | 'playing' | 'game-over';
  history: any[];
}

export const useWarGame = (roomId: string) => {
  const [gameState, setGameState] = useState<GameState | null>(null);
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
