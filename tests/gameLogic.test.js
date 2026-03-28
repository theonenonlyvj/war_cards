import { describe, it, expect } from 'vitest';
const { distributeDecks } = require('../server/gameLogic');

describe('War Game Logic', () => {
  it('should distribute 52 cards evenly between 2 players', () => {
    const { deck1, deck2 } = distributeDecks();
    expect(deck1.length).toBe(26);
    expect(deck2.length).toBe(26);
    expect([...deck1, ...deck2].length).toBe(52);
  });
});
