import { describe, it, expect } from 'vitest';
const { distributeDecks, resolveRound, CARD_MIN, CARD_MAX, SUITS_COUNT, TOTAL_CARDS } = require('../server/gameLogic');

describe('War Game Logic', () => {
  it('should distribute 52 cards evenly between 2 players', () => {
    const { deck1, deck2 } = distributeDecks();
    expect(deck1.length).toBe(TOTAL_CARDS / 2);
    expect(deck2.length).toBe(TOTAL_CARDS / 2);
    expect([...deck1, ...deck2].length).toBe(TOTAL_CARDS);
  });

  it('should contain the correct frequency of each card (4 of each from 2 to 14)', () => {
    const { deck1, deck2 } = distributeDecks();
    const allCards = [...deck1, ...deck2];
    const counts = {};
    
    allCards.forEach(card => {
      counts[card] = (counts[card] || 0) + 1;
    });

    for (let i = CARD_MIN; i <= CARD_MAX; i++) {
      expect(counts[i]).toBe(SUITS_COUNT);
    }
  });

  it('should shuffle cards differently across multiple calls', () => {
    const run1 = distributeDecks();
    const run2 = distributeDecks();
    // It's technically possible but extremely unlikely they'll match perfectly if shuffled.
    expect(run1.deck1).not.toEqual(run2.deck1);
  });

  it('should play the very last card if player cannot commit 4 for war', () => {
    const deck1 = [10]; // Only one card left
    const deck2 = [10, 2, 3, 4, 14];
    const result = resolveRound(deck1, deck2);
    // If deck1 has 10 and deck2 has 10, it's a tie.
    // deck1.shift() makes deck1 empty.
    // In resolveRound, if c1 === c2 and deck1.length === 0, winner is 2.
    expect(result.winner).toBe(2);
  });

  it('should handle "The Last Stand" where a player has just enough cards for war', () => {
    // Player 1 has 2 cards: [10, 5]
    // Player 2 has many: [10, 2, 3, 4, 8]
    // 1. shift: c1=10, c2=10. decks: [5], [2, 3, 4, 8]. pot: [10, 10]
    // 2. tie: deck1.length=1. min(1-1, 3) = 0. reinforcements1 = [].
    // 3. reinforcements2 = [2, 3, 4]. deck2: [8].
    // 4. resolveRound([5], [8], [10, 10, 2, 3, 4])
    // 5. shift: c1=5, c2=8. winner=2.
    const deck1 = [10, 5];
    const deck2 = [10, 2, 3, 4, 8];
    const result = resolveRound(deck1, deck2);
    expect(result.winner).toBe(2);
    expect(result.pot).toContain(5);
    expect(result.pot).toContain(8);
  });
});
