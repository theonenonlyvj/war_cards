function distributeDecks() {
  const cards = [];
  // Deck consists of cards 2 through 14 (Ace), 4 of each.
  for (let i = 2; i <= 14; i++) {
    for (let j = 0; j < 4; j++) {
      cards.push(i);
    }
  }
  // Shuffle cards
  const shuffled = cards.sort(() => Math.random() - 0.5);
  return {
    deck1: shuffled.slice(0, 26),
    deck2: shuffled.slice(26)
  };
}

module.exports = {
  distributeDecks
};
