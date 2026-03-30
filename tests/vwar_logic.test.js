import { describe, it, expect } from 'vitest';
import { resolveStage, distributeDecks } from '../src/utils/VWarEngine';

describe('VWar Master Logic Integrity', () => {
  it('should maintain strict deterministic order (Winner takes bottom)', () => {
    let state = {
      deck1: [{ value: 10, suit: 'S', id: '1' }, { value: 2, suit: 'H', id: '2' }],
      deck2: [{ value: 5, suit: 'D', id: '3' }, { value: 3, suit: 'C', id: '4' }],
      pot: [],
      status: 'playing',
      winner: null,
      p1Card: null,
      p2Card: null,
      isWar: false,
      history: []
    };

    // Round 1: 10 vs 5. P1 wins.
    state = resolveStage(state);
    // Winner (P1) should have: [originalCard, p1won, p2won]
    expect(state.deck1).toEqual([
      { value: 2, suit: 'H', id: '2' },
      { value: 10, suit: 'S', id: '1' },
      { value: 5, suit: 'D', id: '3' }
    ]);
    expect(state.deck2).toEqual([{ value: 3, suit: 'C', id: '4' }]);
    expect(state.pot).toEqual([]);
  });

  it('should handle multi-stage War (Triple Burn) correctly', () => {
    let state = {
      deck1: [
        { value: 10, suit: 'S', id: '1' }, 
        { value: 2, suit: 'H', id: '2' }, { value: 3, suit: 'H', id: '3' }, { value: 4, suit: 'H', id: '4' }, 
        { value: 14, suit: 'S', id: '5' }
      ],
      deck2: [
        { value: 10, suit: 'D', id: '6' }, 
        { value: 5, suit: 'C', id: '7' }, { value: 6, suit: 'C', id: '8' }, { value: 7, suit: 'C', id: '9' }, 
        { value: 8, suit: 'D', id: '10' }
      ],
      pot: [],
      status: 'playing',
      winner: null,
      p1Card: null,
      p2Card: null,
      isWar: false,
      history: []
    };

    // Click 1: The Incident (Tie)
    state = resolveStage(state);
    expect(state.status).toBe('incident');
    expect(state.isWar).toBe(true);
    expect(state.pot).toEqual([{ value: 10, suit: 'S', id: '1' }, { value: 10, suit: 'D', id: '6' }]);

    // Click 2: The Deployment (Burn 3)
    state = resolveStage(state);
    expect(state.status).toBe('deployment');
    expect(state.pot.length).toBe(8); // 2 ties + 6 burns

    // Click 3: The Reveal (14 vs 8)
    state = resolveStage(state);
    expect(state.status).toBe('playing');
    expect(state.winner).toBe(1);
    expect(state.deck1.length).toBe(10);
    expect(state.deck2.length).toBe(0);
  });

  it('should preserve 52 cards throughout an entire automated game simulation', () => {
    const { deck1, deck2 } = distributeDecks();
    let state = { 
        deck1, deck2, pot: [], status: 'playing', winner: null,
        p1Card: null, p2Card: null, isWar: false, history: []
    };
    
    let iterations = 0;
    while (state.status !== 'game-over' && iterations < 5000) {
      state = resolveStage(state);
      const total = state.deck1.length + state.deck2.length + state.pot.length;
      expect(total).toBe(52);
      iterations++;
    }
    
    expect(state.status).toBe('game-over');
  });
});
