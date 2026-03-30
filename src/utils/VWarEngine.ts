export interface Card {
  value: number;
  suit: string;
  id: string;
}

export type GameStatus = 'playing' | 'incident' | 'deployment' | 'game-over' | 'waiting';

export interface GameState {
  deck1: Card[];
  deck2: Card[];
  p1Card: Card | null;
  p2Card: Card | null;
  pot: Card[];
  status: GameStatus;
  winner: 1 | 2 | null;
  isWar: boolean;
  history: any[];
}

export const CARD_MIN = 2;
export const CARD_MAX = 14;
export const SUITS = ['&spades;', '&hearts;', '&diams;', '&clubs;'];
export const TOTAL_CARDS = (CARD_MAX - CARD_MIN + 1) * SUITS.length;

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
      cards.push({ value: i, suit, id: `${i}-${suit}-${Math.random()}` });
    }
  }
  
  // Shuffle cards using Fisher-Yates algorithm
  const shuffled = shuffle([...cards]);
  
  return {
    deck1: shuffled.slice(0, TOTAL_CARDS / 2),
    deck2: shuffled.slice(TOTAL_CARDS / 2)
  };
}

export function resolveStage(state: GameState): GameState {
  // Create a deep enough copy to avoid mutating the original state arrays
  const newState: GameState = { 
    ...state, 
    deck1: [...state.deck1],
    deck2: [...state.deck2],
    pot: [...state.pot],
    history: [...state.history] 
  };

  if (newState.deck1.length === 0 || newState.deck2.length === 0) {
    newState.status = 'game-over';
    return newState;
  }

  if (newState.status === 'incident') {
    // Burns up to 3 cards from each deck
    const r1 = newState.deck1.splice(0, Math.min(newState.deck1.length - 1, 3));
    const r2 = newState.deck2.splice(0, Math.min(newState.deck2.length - 1, 3));
    newState.pot.push(...r1, ...r2);
    newState.history.push({ r1, r2, type: 'war-reinforcements' });
    newState.p1Card = null;
    newState.p2Card = null;
    newState.status = 'deployment';
    newState.isWar = false;
  } else if (newState.status === 'deployment') {
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
      winnerDeck.push(...newState.pot);
      newState.pot = [];
      newState.status = 'playing';
      newState.isWar = false;
    }
  } else {
    // Standard 'playing' status
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
      winnerDeck.push(...newState.pot);
      newState.pot = [];
      newState.status = 'playing';
    }
  }

  return newState;
}
