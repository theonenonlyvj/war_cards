import { useState, useEffect, useCallback } from 'react';
import { io } from 'socket.io-client';
import * as VWarEngine from '../utils/VWarEngine';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket = io(SOCKET_URL);

interface CardData {
  value: number;
  suit: string;
}

interface HistoryStep {
  type: 'battle' | 'war-reinforcements';
  c1?: CardData;
  c2?: CardData;
  r1?: CardData[];
  r2?: CardData[];
}

interface GameState {
  p1Count: number;
  p2Count: number;
  p1Card: CardData | null;
  p2Card: CardData | null;
  p1Flipped: boolean;
  p2Flipped: boolean;
  isWar: boolean;
  winner: number | null;
  status: 'waiting' | 'playing' | 'game-over' | 'incident' | 'deployment';
  history: HistoryStep[];
  isSolo?: boolean;
}

export const useWarGame = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  // Task 3: Local Mode Logic
  const [isLocalMode, setIsLocalMode] = useState(false);
  const [localState, setLocalState] = useState<VWarEngine.GameState | null>(null);

  // Sync helper to bridge VWarEngine state to UI GameState
  const updateLocalUI = useCallback((engineState: VWarEngine.GameState, p1Flipped = false, p2Flipped = false) => {
    const uiState: GameState = {
      p1Count: engineState.deck1.length,
      p2Count: engineState.deck2.length,
      p1Card: engineState.p1Card,
      p2Card: engineState.p2Card,
      p1Flipped,
      p2Flipped,
      isWar: engineState.isWar,
      winner: engineState.winner,
      status: engineState.status as any,
      history: engineState.history as any,
      isSolo: true
    };
    setGameState(uiState);
    localStorage.setItem('vwar_local_session', JSON.stringify(engineState));
  }, []);

  // Step 2: Persistence logic - restore local session on load
  useEffect(() => {
    const saved = localStorage.getItem('vwar_local_session');
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as VWarEngine.GameState;
        setLocalState(parsed);
      } catch (e) {
        console.error("Failed to restore local session", e);
        localStorage.removeItem('vwar_local_session');
      }
    }
  }, []);

  useEffect(() => {
    if (isLocalMode) return;

    socket.on('state-update', (state) => setGameState(state));
    socket.on('player-index', (index) => setPlayerIndex(index));
    socket.on('room-id', (id) => setRoomId(id)); 
    socket.on('game-ready', () => console.log('Game Ready!'));
    
    return () => {
      socket.off('state-update');
      socket.off('player-index');
      socket.off('room-id');
      socket.off('game-ready');
    };
  }, [isLocalMode]);

  const startLocalGame = (savedState?: VWarEngine.GameState) => {
    setIsLocalMode(true);
    setPlayerIndex(1);
    setRoomId('LOCAL');

    if (savedState) {
      setLocalState(savedState);
      updateLocalUI(savedState);
    } else {
      const { deck1, deck2 } = VWarEngine.distributeDecks();
      const newState: VWarEngine.GameState = {
        deck1,
        deck2,
        p1Card: null,
        p2Card: null,
        pot: [],
        status: 'playing',
        winner: null,
        isWar: false,
        history: []
      };
      setLocalState(newState);
      updateLocalUI(newState);
    }
  };

  const flipLocal = async () => {
    if (!localState) return;

    // 1. Set local flip flags (p1Flipped, p2Flipped)
    // We simulate player flip first
    updateLocalUI(localState, true, false);

    // 2. setTimeout(500) for AI response
    await new Promise(r => setTimeout(r, 500));
    updateLocalUI(localState, true, true);

    // Wait another 500ms before resolution for visual pacing
    await new Promise(r => setTimeout(r, 500));

    // 3. Call VWarEngine.resolveStage
    const nextState = VWarEngine.resolveStage(localState);
    
    // 4. Update localState and localStorage
    setLocalState(nextState);
    updateLocalUI(nextState, false, false);
  };

  const flip = () => {
    if (isLocalMode) {
      flipLocal();
    } else if (roomId) {
      socket.emit('flip-card', { roomId });
    }
  };

  const joinRoom = (rId: string) => {
    console.log('Joining Room:', rId);
    setIsLocalMode(false);
    setRoomId(rId);
    socket.emit('join-room', rId);
  };

  const joinSolo = (rId?: string) => {
    // Resume if saved state exists, otherwise start fresh
    if (localState) {
      startLocalGame(localState);
    } else {
      startLocalGame();
    }
  };

  return { gameState, flip, playerIndex, joinRoom, joinSolo, roomId };
};
