import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket = io(SOCKET_URL);

interface HistoryStep {
  type: 'battle' | 'war-reinforcements';
  c1?: number;
  c2?: number;
  r1?: number[];
  r2?: number[];
}

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
  history: HistoryStep[];
  isSolo?: boolean;
}

export const useWarGame = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  useEffect(() => {
    socket.on('state-update', (state) => setGameState(state));
    socket.on('player-index', (index) => setPlayerIndex(index));
    socket.on('game-ready', () => console.log('Game Ready!'));
    
    return () => {
      socket.off('state-update');
      socket.off('player-index');
      socket.off('game-ready');
    };
  }, []);

  const flip = () => {
    if (roomId) {
      socket.emit('flip-card', { roomId });
    }
  };

  const joinRoom = (rId: string) => {
    setRoomId(rId);
    socket.emit('join-room', rId);
  };

  const joinSolo = (rId: string) => {
    setRoomId(rId);
    socket.emit('join-solo', rId);
  };

  return { gameState, flip, playerIndex, joinRoom, joinSolo, roomId };
};
