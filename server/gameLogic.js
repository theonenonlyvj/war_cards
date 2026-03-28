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

module.exports = {
  distributeDecks,
  CARD_MIN,
  CARD_MAX,
  SUITS_COUNT,
  TOTAL_CARDS
};
