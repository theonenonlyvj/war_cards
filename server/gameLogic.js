const CARD_MIN = 2;
const CARD_MAX = 14;
const SUITS = ['&spades;', '&hearts;', '&diams;', '&clubs;'];
const TOTAL_CARDS = (CARD_MAX - CARD_MIN + 1) * SUITS.length;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function distributeDecks() {
  const cards = [];
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

// deprecated by the state machine in index.js, kept for old tests
function resolveRound(deck1, deck2, pot = [], history = []) {
  const c1 = deck1.shift();
  const c2 = deck2.shift();
  const currentPot = [...pot, c1, c2];
  const roundHistory = [...history, { c1, c2, type: 'battle' }];

  if (c1.value > c2.value) return { winner: 1, pot: currentPot, history: roundHistory };
  if (c2.value > c1.value) return { winner: 2, pot: currentPot, history: roundHistory };

  if (deck1.length === 0 || deck2.length === 0) {
     return { winner: deck1.length === 0 ? 2 : 1, pot: currentPot, history: roundHistory };
  }

  const reinforcements1 = deck1.splice(0, Math.max(0, Math.min(deck1.length - 1, 3)));
  const reinforcements2 = deck2.splice(0, Math.max(0, Math.min(deck2.length - 1, 3)));
  
  const warHistory = [...roundHistory, { 
    r1: reinforcements1, 
    r2: reinforcements2, 
    type: 'war-reinforcements' 
  }];

  return resolveRound(deck1, deck2, [...currentPot, ...reinforcements1, ...reinforcements2], warHistory);
}

module.exports = {
  distributeDecks,
  resolveRound,
  CARD_MIN,
  CARD_MAX,
  SUITS,
  TOTAL_CARDS
};
