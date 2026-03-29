import { describe, it, expect } from 'vitest';
const { distributeDecks, CARD_MIN, CARD_MAX, SUITS, TOTAL_CARDS } = require('../server/gameLogic');

describe('War Game Logic', () => {
  it('should distribute 52 cards evenly between 2 players', () => {
    const { deck1, deck2 } = distributeDecks();
    expect(deck1.length).toBe(TOTAL_CARDS / 2);
    expect(deck2.length).toBe(TOTAL_CARDS / 2);
    expect([...deck1, ...deck2].length).toBe(TOTAL_CARDS);
  });

  it('should contain the correct frequency of each card (4 of each value)', () => {
    const { deck1, deck2 } = distributeDecks();
    const allCards = [...deck1, ...deck2];
    const counts = {};
    
    allCards.forEach(card => {
      counts[card.value] = (counts[card.value] || 0) + 1;
    });

    for (let i = CARD_MIN; i <= CARD_MAX; i++) {
      expect(counts[i]).toBe(SUITS.length);
    }
  });

  it('should shuffle cards differently across multiple calls', () => {
    const run1 = distributeDecks();
    const run2 = distributeDecks();
    expect(run1.deck1).not.toEqual(run2.deck1);
  });
});
