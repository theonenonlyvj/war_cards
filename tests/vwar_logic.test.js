import { describe, it, expect } from 'vitest';
import { createInitialState, resolveStage, distributeDecks, getTacticalIntel } from '../src/utils/VWarEngine';

const makeCard = (value, id) => ({ value, suit: 'S', id: String(id) });
const makeDeck = (length, startId = 1, value = 2) =>
  Array.from({ length }, (_, index) => makeCard(value, startId + index));

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
    expect(state.status).toBe('game-over');
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

  it('should create Blitz games by default with a 35 card target', () => {
    const state = createInitialState();
    const intel = getTacticalIntel(state);

    expect(state.matchMode).toBe('blitz');
    expect(state.targetCards).toBe(35);
    expect(intel.modeLabel).toBe('BLITZ');
    expect(intel.targetCards).toBe(35);
    expect(intel.possibleSwing).toBe(2);
  });

  it('should end Blitz immediately when a commander reaches 35 cards', () => {
    let state = {
      deck1: [makeCard(14, 'winning-card'), ...makeDeck(33, 100)],
      deck2: [makeCard(2, 'losing-card'), ...makeDeck(17, 200)],
      pot: [],
      status: 'playing',
      winner: null,
      p1Card: null,
      p2Card: null,
      isWar: false,
      history: [],
      matchMode: 'blitz',
      targetCards: 35
    };

    state = resolveStage(state);

    expect(state.status).toBe('game-over');
    expect(state.winner).toBe(1);
    expect(state.deck1.length).toBe(35);
  });

  it('should keep Classic attrition running when a commander reaches 35 cards', () => {
    let state = {
      deck1: [makeCard(14, 'winning-card'), ...makeDeck(33, 100)],
      deck2: [makeCard(2, 'losing-card'), ...makeDeck(17, 200)],
      pot: [],
      status: 'playing',
      winner: null,
      p1Card: null,
      p2Card: null,
      isWar: false,
      history: [],
      matchMode: 'classic',
      targetCards: null
    };

    state = resolveStage(state);

    expect(state.status).toBe('playing');
    expect(state.winner).toBe(1);
    expect(state.deck1.length).toBe(35);
  });

  it('should append spoils winner first when player 2 wins', () => {
    let state = {
      deck1: [makeCard(5, 'p1-loser'), makeCard(2, 'p1-next')],
      deck2: [makeCard(10, 'p2-winner'), makeCard(3, 'p2-next')],
      pot: [],
      status: 'playing',
      winner: null,
      p1Card: null,
      p2Card: null,
      isWar: false,
      history: [],
      matchMode: 'classic',
      targetCards: null
    };

    state = resolveStage(state);

    expect(state.deck2).toEqual([
      makeCard(3, 'p2-next'),
      makeCard(10, 'p2-winner'),
      makeCard(5, 'p1-loser')
    ]);
  });

  it('should append the final reveal pair winner first when player 2 wins a war', () => {
    let state = {
      deck1: [makeCard(5, 'p1-reveal')],
      deck2: [makeCard(13, 'p2-reveal')],
      pot: [
        makeCard(10, 'tie-p1'),
        makeCard(10, 'tie-p2'),
        makeCard(2, 'burn-p1'),
        makeCard(3, 'burn-p2')
      ],
      status: 'deployment',
      winner: null,
      p1Card: null,
      p2Card: null,
      isWar: false,
      history: [
        { type: 'battle', c1: makeCard(10, 'tie-p1'), c2: makeCard(10, 'tie-p2') },
        { type: 'war-reinforcements', r1: [makeCard(2, 'burn-p1')], r2: [makeCard(3, 'burn-p2')] }
      ],
      matchMode: 'classic',
      targetCards: null
    };

    state = resolveStage(state);

    expect(state.deck2).toEqual([
      makeCard(10, 'tie-p1'),
      makeCard(10, 'tie-p2'),
      makeCard(2, 'burn-p1'),
      makeCard(3, 'burn-p2'),
      makeCard(13, 'p2-reveal'),
      makeCard(5, 'p1-reveal')
    ]);
  });

  it('should report tactical intel for incidents and Last Stand risk', () => {
    const state = {
      deck1: [makeCard(7, 'p1-last')],
      deck2: [makeCard(9, 'p2-last'), makeCard(2, 'p2-extra')],
      pot: [makeCard(10, 'tie-1'), makeCard(10, 'tie-2')],
      status: 'incident',
      winner: null,
      p1Card: makeCard(10, 'tie-1'),
      p2Card: makeCard(10, 'tie-2'),
      isWar: true,
      history: [
        { type: 'battle', c1: makeCard(10, 'tie-1'), c2: makeCard(10, 'tie-2') },
        { type: 'war-reinforcements', r1: [makeCard(3, 'r1')], r2: [makeCard(4, 'r2')] }
      ],
      matchMode: 'blitz',
      targetCards: 35
    };

    const intel = getTacticalIntel(state);

    expect(intel.potSize).toBe(2);
    expect(intel.possibleSwing).toBe(4);
    expect(intel.incidentChain).toBe(1);
    expect(intel.isLastStand).toBe(true);
  });
});
