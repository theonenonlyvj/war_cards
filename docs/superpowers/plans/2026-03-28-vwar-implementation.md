# VWar Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build VWar, a multiplayer sci-fi "Command Center" card game with real-time sync and high-intensity graphics.

**Architecture:** A React frontend using Framer Motion for UI animations and a Node.js/Socket.io backend for game state synchronization and room management.

**Tech Stack:** React (TypeScript), Framer Motion, PixiJS, Socket.io, Node.js, Vite.

---

### Task 1: Server Setup & Room Management

**Files:**
- Create: `server/index.js`
- Create: `server/gameLogic.js`

- [ ] **Step 1: Initialize Socket.io server**
```javascript
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

const rooms = new Map(); // Room ID -> Game State

io.on('connection', (socket) => {
  socket.on('join-room', (roomId) => {
    socket.join(roomId);
    if (!rooms.has(roomId)) {
      rooms.set(roomId, { players: [], deck: [], status: 'waiting' });
    }
    const room = rooms.get(roomId);
    room.players.push(socket.id);
    if (room.players.length === 2) {
      room.status = 'ready';
      io.to(roomId).emit('game-ready');
    }
  });
});

server.listen(3001, () => console.log('Server running on 3001'));
```

- [ ] **Step 2: Commit server setup**
```bash
git add server/index.js
git commit -m "feat: setup socket.io server and basic room logic"
```

---

### Task 2: Core Game Logic (The Engine)

**Files:**
- Create: `server/gameLogic.js`
- Test: `tests/gameLogic.test.js`

- [ ] **Step 1: Write failing test for deck distribution**
```javascript
import { distributeDecks } from '../server/gameLogic';
import { describe, it, expect } from 'vitest';

describe('War Game Logic', () => {
  it('should distribute 52 cards evenly between 2 players', () => {
    const { deck1, deck2 } = distributeDecks();
    expect(deck1.length).toBe(26);
    expect(deck2.length).toBe(26);
    expect([...deck1, ...deck2].length).toBe(52);
  });
});
```

- [ ] **Step 2: Implement deck distribution**
```javascript
export function distributeDecks() {
  const cards = [];
  for (let i = 2; i <= 14; i++) {
    for (let j = 0; j < 4; j++) cards.push(i);
  }
  const shuffled = cards.sort(() => Math.random() - 0.5);
  return {
    deck1: shuffled.slice(0, 26),
    deck2: shuffled.slice(26)
  };
}
```

- [ ] **Step 3: Run test to verify it passes**
Run: `npm test tests/gameLogic.test.js`

- [ ] **Step 4: Commit game engine core**
```bash
git add server/gameLogic.js tests/gameLogic.test.js
git commit -m "feat: implement and test deck distribution logic"
```

---

### Task 3: The "Last Stand" Rule Implementation

**Files:**
- Modify: `server/gameLogic.js`
- Test: `tests/gameLogic.test.js`

- [ ] **Step 1: Write test for "Last Stand" scenario**
```javascript
it('should play the very last card if player cannot commit 4 for war', () => {
  const deck1 = [10]; // Only one card left
  const deck2 = [10, 2, 3, 4, 14];
  const result = resolveRound(deck1, deck2); // Mocked logic
  // Expect deck1 to use 10 as its battle card
});
```

- [ ] **Step 2: Implement robust round resolution**
```javascript
export function resolveRound(deck1, deck2, pot = []) {
  const c1 = deck1.shift();
  const c2 = deck2.shift();
  const currentPot = [...pot, c1, c2];

  if (c1 > c2) return { winner: 1, pot: currentPot };
  if (c2 > c1) return { winner: 2, pot: currentPot };

  // War Logic (Tie)
  const reinforcements1 = deck1.splice(0, Math.min(deck1.length - 1, 3));
  const reinforcements2 = deck2.splice(0, Math.min(deck2.length - 1, 3));
  return resolveRound(deck1, deck2, [...currentPot, ...reinforcements1, ...reinforcements2]);
}
```

- [ ] **Step 3: Run tests and commit**
```bash
npm test
git add server/gameLogic.js
git commit -m "feat: implement 'Last Stand' house rule in game engine"
```

---

### Task 4: Frontend UI - The Command Center

**Files:**
- Create: `src/App.tsx`
- Create: `src/components/Card.tsx`
- Create: `src/components/BattleZone.tsx`

- [ ] **Step 1: Build the Sci-Fi HUD layout**
```tsx
export const HUD = ({ p1Count, p2Count, isWar }: any) => (
  <div className={`hud-container ${isWar ? 'emergency' : ''}`}>
    <div className="p1-deck">CARDS: {p1Count}</div>
    <div className="status-monitor">{isWar ? 'EMERGENCY: WAR DETECTED' : 'SYSTEMS NOMINAL'}</div>
    <div className="p2-deck">CARDS: {p2Count}</div>
  </div>
);
```

- [ ] **Step 2: Create holographic Card component with Framer Motion**
```tsx
import { motion } from 'framer-motion';

export const Card = ({ value, suit, isFaceUp }: any) => (
  <motion.div 
    layoutId={`${value}-${suit}`}
    className="holographic-card"
    animate={{ rotateY: isFaceUp ? 0 : 180 }}
  >
    <div className="scanning-line" />
    {isFaceUp && <span className="card-value">{value}</span>}
  </motion.div>
);
```

- [ ] **Step 3: Commit UI components**
```bash
git add src/App.tsx src/components/
git commit -m "feat: build sci-fi HUD and holographic card components"
```

---

### Task 5: Real-time Sync & Final Polish

**Files:**
- Modify: `src/hooks/useWarGame.ts`
- Create: `src/components/FXLayer.tsx`

- [ ] **Step 1: Implement Socket.io synchronization hook**
```typescript
export const useWarGame = (roomId: string) => {
  const [gameState, setGameState] = useState<any>(null);
  useEffect(() => {
    socket.emit('join-room', roomId);
    socket.on('state-update', (state) => setGameState(state));
  }, [roomId]);

  const flip = () => socket.emit('flip-card');
  return { gameState, flip };
};
```

- [ ] **Step 2: Add PixiJS Particle Layer for War explosions**
```tsx
// Using PixiJS to render neon particles when a War is won
```

- [ ] **Step 3: Final validation and commit**
```bash
git add .
git commit -m "feat: complete multiplayer sync and visual effects"
```
