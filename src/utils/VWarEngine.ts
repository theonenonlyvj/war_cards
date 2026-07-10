export interface Card {
  value: number;
  suit: string;
  id: string;
}

export type GameStatus = 'playing' | 'incident' | 'deployment' | 'game-over';
export type MatchMode = 'blitz' | 'classic';
export type GameOverReason = 'target-cards' | 'all-cards';

export interface HistoryStep {
  type: 'battle' | 'war-reinforcements';
  c1?: Card;
  c2?: Card;
  r1?: Card[];
  r2?: Card[];
}

export interface GameState {
  deck1: Card[];
  deck2: Card[];
  p1Card: Card | null;
  p2Card: Card | null;
  pot: Card[];
  status: GameStatus;
  winner: 1 | 2 | null;
  isWar: boolean;
  history: HistoryStep[];
  matchMode?: MatchMode;
  targetCards?: number | null;
  gameOverReason?: GameOverReason;
}

export interface TacticalIntel {
  modeLabel: 'BLITZ' | 'CLASSIC';
  targetCards: number | null;
  potSize: number;
  possibleSwing: number;
  incidentChain: number;
  isLastStand: boolean;
}

export const CARD_MIN = 2;
export const CARD_MAX = 14;
export const SUITS = ['&spades;', '&hearts;', '&diams;', '&clubs;'];
export const TOTAL_CARDS = (CARD_MAX - CARD_MIN + 1) * SUITS.length;
export const DEFAULT_MATCH_MODE: MatchMode = 'blitz';
export const BLITZ_TARGET_CARDS = 35;

function shuffle<T>(array: T[]): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

export function distributeDecks(): { deck1: Card[], deck2: Card[] } {
  const cards: Card[] = [];
  // Deck consists of cards 2 through 14 (Ace), 1 of each suit per rank.
  for (let i = CARD_MIN; i <= CARD_MAX; i++) {
    for (const suit of SUITS) {
      // Deterministic ID for state reconciliation
      cards.push({ value: i, suit, id: `${i}-${suit}` });
    }
  }
  
  // Shuffle cards using Fisher-Yates algorithm
  const shuffled = shuffle([...cards]);
  
  return {
    deck1: shuffled.slice(0, TOTAL_CARDS / 2),
    deck2: shuffled.slice(TOTAL_CARDS / 2)
  };
}

function targetCardsForMode(matchMode: MatchMode): number | null {
  return matchMode === 'blitz' ? BLITZ_TARGET_CARDS : null;
}

function normalizeMatchMode(state: GameState): MatchMode {
  if (state.matchMode === 'blitz') return 'blitz';
  return 'classic';
}

function normalizeTargetCards(state: GameState, matchMode: MatchMode): number | null {
  if (matchMode === 'classic') return null;
  return typeof state.targetCards === 'number' ? state.targetCards : BLITZ_TARGET_CARDS;
}

function battleSpoils(winner: 1 | 2, pot: Card[], c1: Card, c2: Card): Card[] {
  const priorPot = pot.slice(0, -2);
  const finalPair = winner === 1 ? [c1, c2] : [c2, c1];

  return [...priorPot, ...finalPair];
}

function gameOverWinner(state: GameState): { winner: 1 | 2; reason: GameOverReason } | null {
  if (state.deck1.length === 0) return { winner: 2, reason: 'all-cards' };
  if (state.deck2.length === 0) return { winner: 1, reason: 'all-cards' };

  const matchMode = normalizeMatchMode(state);
  const targetCards = normalizeTargetCards(state, matchMode);

  if (targetCards && state.deck1.length >= targetCards) return { winner: 1, reason: 'target-cards' };
  if (targetCards && state.deck2.length >= targetCards) return { winner: 2, reason: 'target-cards' };

  return null;
}

function applyGameOver(state: GameState): GameState {
  const result = gameOverWinner(state);
  if (!result) return state;

  return {
    ...state,
    status: 'game-over',
    winner: result.winner,
    isWar: false,
    gameOverReason: result.reason
  };
}

export function createInitialState(matchMode: MatchMode = DEFAULT_MATCH_MODE): GameState {
  const { deck1, deck2 } = distributeDecks();

  return {
    deck1,
    deck2,
    p1Card: null,
    p2Card: null,
    pot: [],
    status: 'playing',
    winner: null,
    isWar: false,
    history: [],
    matchMode,
    targetCards: targetCardsForMode(matchMode)
  };
}

export function getTacticalIntel(state: GameState): TacticalIntel {
  const matchMode = normalizeMatchMode(state);
  const targetCards = normalizeTargetCards(state, matchMode);
  const incidentChain = state.history.filter(step => step.type === 'war-reinforcements').length;
  const pendingBattleCards = ['playing', 'incident', 'deployment'].includes(state.status) ? 2 : 0;

  return {
    modeLabel: matchMode === 'blitz' ? 'BLITZ' : 'CLASSIC',
    targetCards,
    potSize: state.pot.length,
    possibleSwing: state.pot.length + pendingBattleCards,
    incidentChain,
    isLastStand: ['incident', 'deployment'].includes(state.status) && (
      state.deck1.length < 4 || state.deck2.length < 4
    )
  };
}

export function resolveStage(state: GameState): GameState {
  // Create a deep enough copy to avoid mutating the original state arrays
  const matchMode = normalizeMatchMode(state);
  const newState: GameState = { 
    ...state, 
    deck1: [...state.deck1],
    deck2: [...state.deck2],
    pot: [...state.pot],
    history: [...state.history],
    matchMode,
    targetCards: normalizeTargetCards(state, matchMode)
  };

  const initialGameOver = applyGameOver(newState);
  if (initialGameOver.status === 'game-over') return initialGameOver;

  if (newState.status === 'incident') {
    // Stage 2: Deployment (The Burn)
    // Safety check: Use Math.max to prevent negative splice count
    const r1 = newState.deck1.splice(0, Math.max(0, Math.min(newState.deck1.length - 1, 3)));
    const r2 = newState.deck2.splice(0, Math.max(0, Math.min(newState.deck2.length - 1, 3)));
    newState.pot.push(...r1, ...r2);
    newState.history.push({ r1, r2, type: 'war-reinforcements' });
    newState.p1Card = null;
    newState.p2Card = null;
    newState.status = 'deployment';
    newState.isWar = false; // Stop siren and visuals during deployment
  } else if (newState.status === 'deployment') {
    // Stage 3: The Reveal
    const c1 = newState.deck1.shift()!;
    const c2 = newState.deck2.shift()!;
    newState.pot.push(c1, c2);
    newState.p1Card = c1;
    newState.p2Card = c2;
    newState.history.push({ c1, c2, type: 'battle' });
    
    if (c1.value === c2.value) {
      newState.status = 'incident';
      newState.isWar = true;
      newState.winner = null;
    } else {
      newState.winner = c1.value > c2.value ? 1 : 2;
      const winnerDeck = newState.winner === 1 ? newState.deck1 : newState.deck2;
      winnerDeck.push(...battleSpoils(newState.winner, newState.pot, c1, c2));
      newState.pot = [];
      newState.status = 'playing';
      newState.isWar = false;
    }
  } else {
    // Stage 1: Standard Battle (playing)
    const c1 = newState.deck1.shift()!;
    const c2 = newState.deck2.shift()!;
    newState.pot = [c1, c2];
    newState.p1Card = c1;
    newState.p2Card = c2;
    newState.history = [{ c1, c2, type: 'battle' }];
    
    if (c1.value === c2.value) {
      newState.status = 'incident';
      newState.isWar = true;
      newState.winner = null;
    } else {
      newState.winner = c1.value > c2.value ? 1 : 2;
      const winnerDeck = newState.winner === 1 ? newState.deck1 : newState.deck2;
      winnerDeck.push(...battleSpoils(newState.winner, newState.pot, c1, c2));
      newState.pot = [];
      newState.status = 'playing';
      newState.isWar = false; // Explicitly reset
    }
  }

  return applyGameOver(newState);
}
