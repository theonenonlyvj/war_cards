import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket = io(SOCKET_URL);

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
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);

  useEffect(() => {
    socket.emit('join-room', roomId);
    socket.on('state-update', (state) => setGameState(state));
    socket.on('player-index', (index) => setPlayerIndex(index));
    socket.on('game-ready', () => console.log('Game Ready!'));
    
    return () => {
      socket.off('state-update');
      socket.off('player-index');
      socket.off('game-ready');
    };
  }, [roomId]);

  const flip = () => socket.emit('flip-card', { roomId });
  return { gameState, flip, playerIndex };
};
