const CARD_MIN = 2;
const CARD_MAX = 14;
const SUITS_COUNT = 4;
const TOTAL_CARDS = (CARD_MAX - CARD_MIN + 1) * SUITS_COUNT;

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

function distributeDecks() {
  const cards = [];
  // Deck consists of cards 2 through 14 (Ace), 4 of each.
  for (let i = CARD_MIN; i <= CARD_MAX; i++) {
    for (let j = 0; j < SUITS_COUNT; j++) {
      cards.push(i);
    }
  }
  
  // Shuffle cards using Fisher-Yates algorithm
  const shuffled = shuffle([...cards]);
  
  return {
    deck1: shuffled.slice(0, TOTAL_CARDS / 2),
    deck2: shuffled.slice(TOTAL_CARDS / 2)
  };
}

function resolveRound(deck1, deck2, pot = []) {
  const c1 = deck1.shift();
  const c2 = deck2.shift();
  const currentPot = [...pot, c1, c2];

  if (c1 > c2) return { winner: 1, pot: currentPot };
  if (c2 > c1) return { winner: 2, pot: currentPot };

  // War Logic (Tie)
  // House Rule: The Last Stand - If not enough cards, use the last one as the battle card
  if (deck1.length === 0 || deck2.length === 0) {
     // One player is out of cards during a tie.
     // Depending on house rules, we might need to handle this.
     // In our case, if they are tied and one has no cards left, 
     // the one with no cards left loses.
     return { winner: deck1.length === 0 ? 2 : 1, pot: currentPot };
  }

  const reinforcements1 = deck1.splice(0, Math.min(deck1.length - 1, 3));
  const reinforcements2 = deck2.splice(0, Math.min(deck2.length - 1, 3));
  return resolveRound(deck1, deck2, [...currentPot, ...reinforcements1, ...reinforcements2]);
}

module.exports = {
  distributeDecks,
  resolveRound,
  CARD_MIN,
  CARD_MAX,
  SUITS_COUNT,
  TOTAL_CARDS
};
