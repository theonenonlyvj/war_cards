import { useState, useEffect, useCallback, useRef } from 'react';
import { io } from 'socket.io-client';
import * as VWarEngine from '../utils/VWarEngine';

const SOCKET_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
const socket = io(SOCKET_URL);

interface CardData {
  value: number;
  suit: string;
  id?: string;
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
  status: VWarEngine.GameStatus;
  history: VWarEngine.HistoryStep[];
  isSolo?: boolean;
  matchMode?: VWarEngine.MatchMode;
  targetCards?: number | null;
  gameOverReason?: VWarEngine.GameOverReason;
  tacticalIntel?: VWarEngine.TacticalIntel;
}

export const useWarGame = () => {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerIndex, setPlayerIndex] = useState<number | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);

  const [isLocalMode, setIsLocalMode] = useState(false);
  const [localState, setLocalState] = useState<VWarEngine.GameState | null>(null);
  const isResolving = useRef(false);

  const updateLocalUI = useCallback((engineState: VWarEngine.GameState, p1Flipped = false, p2Flipped = false, persist = false) => {
    const uiState: GameState = {
      p1Count: engineState.deck1.length,
      p2Count: engineState.deck2.length,
      p1Card: engineState.p1Card,
      p2Card: engineState.p2Card,
      p1Flipped,
      p2Flipped,
      isWar: engineState.isWar,
      winner: engineState.winner,
      status: engineState.status,
      history: engineState.history,
      isSolo: true,
      matchMode: engineState.matchMode,
      targetCards: engineState.targetCards,
      gameOverReason: engineState.gameOverReason,
      tacticalIntel: VWarEngine.getTacticalIntel(engineState)
    };
    setGameState(uiState);
    if (persist) {
      localStorage.setItem('vwar_local_session', JSON.stringify(engineState));
    }
  }, []);

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

  const startLocalGame = (savedState?: VWarEngine.GameState, matchMode: VWarEngine.MatchMode = VWarEngine.DEFAULT_MATCH_MODE) => {
    setIsLocalMode(true);
    setPlayerIndex(1);
    setRoomId('LOCAL');

    if (savedState) {
      setLocalState(savedState);
      updateLocalUI(savedState, false, false, true);
    } else {
      const newState = VWarEngine.createInitialState(matchMode);
      setLocalState(newState);
      updateLocalUI(newState, false, false, true);
    }
  };

  const flipLocal = async () => {
    if (!localState || isResolving.current) return;
    isResolving.current = true;

    // Reset visuals for a new round if we are in 'playing' state
    let baseState = localState;
    if (localState.status === 'playing') {
      baseState = { ...localState, p1Card: null, p2Card: null, winner: null, isWar: false, history: [] };
    }

    // 1. Simulate player flip
    updateLocalUI(baseState, true, false);

    // 2. Simulate AI response
    await new Promise(r => setTimeout(r, 500));
    updateLocalUI(baseState, true, true);

    // Visual pacing
    await new Promise(r => setTimeout(r, 500));

    // 3. Resolve stage
    const nextState = VWarEngine.resolveStage(baseState);
    
    // 4. Final update
    setLocalState(nextState);
    updateLocalUI(nextState, false, false, true);
    isResolving.current = false;
  };

  const flip = () => {
    if (isLocalMode) {
      flipLocal();
    } else if (roomId) {
      socket.emit('flip-card', { roomId });
    }
  };

  const joinRoom = (rId: string) => {
    setIsLocalMode(false);
    setRoomId(rId);
    socket.emit('join-room', rId);
  };

  const joinSolo = (forceNew = false, matchMode: VWarEngine.MatchMode = VWarEngine.DEFAULT_MATCH_MODE) => {
    if (localState && !forceNew) {
      startLocalGame(localState);
    } else {
      startLocalGame(undefined, matchMode);
    }
  };

  const deleteLocalSession = () => {
    localStorage.removeItem('vwar_local_session');
    setLocalState(null);
  };

  return { gameState, flip, playerIndex, joinRoom, joinSolo, roomId, isLocalMode, localState, deleteLocalSession };
};
