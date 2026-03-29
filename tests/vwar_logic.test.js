import { describe, it, expect } from 'vitest';

// Mimic the server's state machine logic for verification
function simulateResolve(room) {
  if (room.deck1.length === 0 || room.deck2.length === 0) {
    room.status = 'game-over';
    return;
  }

  if (room.status === 'incident') {
    // Stage 2: The Burn
    const r1 = room.deck1.splice(0, Math.min(room.deck1.length - 1, 3));
    const r2 = room.deck2.splice(0, Math.min(room.deck2.length - 1, 3));
    room.pot.push(...r1, ...r2);
    room.status = 'deployment';
  } else if (room.status === 'deployment') {
    // Stage 3: The Reveal
    const c1 = room.deck1.shift();
    const c2 = room.deck2.shift();
    room.pot.push(c1, c2);
    if (c1.value === c2.value) {
      room.status = 'incident';
    } else {
      room.winner = c1.value > c2.value ? 1 : 2;
      const winnerDeck = room.winner === 1 ? room.deck1 : room.deck2;
      winnerDeck.push(...room.pot);
      room.pot = [];
      room.status = 'playing';
    }
  } else {
    // Stage 1: Normal Battle
    const c1 = room.deck1.shift();
    const c2 = room.deck2.shift();
    room.pot = [c1, c2];
    if (c1.value === c2.value) {
      room.status = 'incident';
    } else {
      room.winner = c1.value > c2.value ? 1 : 2;
      const winnerDeck = room.winner === 1 ? room.deck1 : room.deck2;
      winnerDeck.push(...room.pot);
      room.pot = [];
      room.status = 'playing';
    }
  }
}

describe('VWar Master Logic Integrity', () => {
  it('should maintain strict deterministic order (Winner takes bottom)', () => {
    const room = {
      deck1: [{ value: 10, suit: 'S' }, { value: 2, suit: 'H' }],
      deck2: [{ value: 5, suit: 'D' }, { value: 3, suit: 'C' }],
      pot: [],
      status: 'playing',
      winner: null
    };

    // Round 1: 10 vs 5. P1 wins.
    simulateResolve(room);
    // Winner (P1) should have: [originalCard, p1won, p2won]
    expect(room.deck1).toEqual([
      { value: 2, suit: 'H' },
      { value: 10, suit: 'S' },
      { value: 5, suit: 'D' }
    ]);
    expect(room.deck2).toEqual([{ value: 3, suit: 'C' }]);
    expect(room.pot).toEqual([]);
  });

  it('should handle multi-stage War (Triple Burn) correctly', () => {
    const room = {
      deck1: [
        { value: 10, suit: 'S' }, 
        { value: 2, suit: 'H' }, { value: 3, suit: 'H' }, { value: 4, suit: 'H' }, 
        { value: 14, suit: 'S' }
      ],
      deck2: [
        { value: 10, suit: 'D' }, 
        { value: 5, suit: 'C' }, { value: 6, suit: 'C' }, { value: 7, suit: 'C' }, 
        { value: 8, suit: 'D' }
      ],
      pot: [],
      status: 'playing'
    };

    // Click 1: The Incident (Tie)
    simulateResolve(room);
    expect(room.status).toBe('incident');
    expect(room.pot).toEqual([{ value: 10, suit: 'S' }, { value: 10, suit: 'D' }]);

    // Click 2: The Deployment (Burn 3)
    simulateResolve(room);
    expect(room.status).toBe('deployment');
    expect(room.pot.length).toBe(8); // 2 ties + 6 burns

    // Click 3: The Reveal (14 vs 8)
    simulateResolve(room);
    expect(room.status).toBe('playing');
    expect(room.winner).toBe(1);
    expect(room.deck1.length).toBe(10);
    expect(room.deck2.length).toBe(0);
  });

  it('should preserve 52 cards throughout an entire automated game simulation', () => {
    const { distributeDecks } = require('../server/gameLogic');
    const { deck1, deck2 } = distributeDecks();
    const room = { deck1, deck2, pot: [], status: 'playing', winner: null };
    
    let iterations = 0;
    while (room.status !== 'game-over' && iterations < 5000) {
      simulateResolve(room);
      const total = room.deck1.length + room.deck2.length + room.pot.length;
      expect(total).toBe(52);
      iterations++;
    }
    
    expect(room.status).toBe('game-over');
  });
});
