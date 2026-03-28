# VWar "I'm Lonely" Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement a solo play mode where a human competes against a server-simulated "Virtual Commander" with a 0.5s reaction delay.

**Architecture:** Extend the existing Socket.io backend to handle a `join-solo` event and automate the second player's flips using `setTimeout`. Update the frontend to offer the new mode and identify the AI opponent.

**Tech Stack:** Node.js, Socket.io, React (TypeScript).

---

### Task 1: Backend - Solo Room Logic

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Implement `join-solo` event**
```javascript
  socket.on('join-solo', () => {
    const roomId = `SOLO-${socket.id.substring(0, 6)}`;
    socket.join(roomId);
    
    const { deck1, deck2 } = distributeDecks();
    rooms.set(roomId, { 
      players: [socket.id, 'BOT-VIRTUAL-COMMANDER'], 
      deck1, 
      deck2, 
      flips: new Map(), 
      status: 'playing',
      isSolo: true 
    });
    
    socket.roomId = roomId;
    socket.playerIndex = 1;
    socket.emit('player-index', 1);
    io.to(roomId).emit('game-ready');
    io.to(roomId).emit('state-update', getPublicState(rooms.get(roomId)));
  });
```

- [ ] **Step 2: Update `getPublicState` to include `isSolo` flag**
```javascript
function getPublicState(room) {
  return {
    // ... existing fields
    isSolo: room.isSolo || false,
    history: room.history || []
  };
}
```

- [ ] **Step 3: Commit backend logic**
```bash
git add server/index.js
git commit -m "feat: implement solo room creation logic on backend"
```

---

### Task 2: Backend - AI Automation (The Virtual Commander)

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Implement automated bot flip with 0.5s delay**
```javascript
  socket.on('flip-card', ({ roomId }) => {
    const room = rooms.get(roomId);
    if (!room || room.status !== 'playing') return;

    room.flips.set(socket.id, true);
    
    // Broadcast player flip
    io.to(roomId).emit('state-update', { 
      ...getPublicState(room), 
      p1Flipped: room.flips.has(room.players[0]),
      p2Flipped: room.flips.has(room.players[1])
    });

    if (room.isSolo && room.flips.size === 1) {
      // Simulate Bot Thinking
      setTimeout(() => {
        room.flips.set('BOT-VIRTUAL-COMMANDER', true);
        resolveAndEmit(roomId); // Extract resolution logic to a function
      }, 500);
    } else if (room.flips.size === 2) {
      resolveAndEmit(roomId);
    }
  });
```

- [ ] **Step 2: Refactor resolution logic into `resolveAndEmit(roomId)`**
Ensure both manual and automated paths use the same robust resolution logic.

- [ ] **Step 3: Commit AI behavior**
```bash
git add server/index.js
git commit -m "feat: implement Virtual Commander auto-flip with 0.5s delay"
```

---

### Task 3: Frontend - UI for "I'm Lonely" Mode

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/hooks/useWarGame.ts`

- [ ] **Step 1: Add `joinSolo` to `useWarGame` hook**
```typescript
  const joinSolo = () => socket.emit('join-solo');
  return { gameState, flip, joinSolo, playerIndex };
```

- [ ] **Step 2: Update Join Screen with "I'M LONELY" button**
```tsx
  <button 
    onClick={joinSolo}
    className="neon-button secondary"
    style={{ borderColor: 'var(--neon-magenta)', color: 'var(--neon-magenta)' }}
  >
    I'M LONELY (SOLO)
  </button>
```

- [ ] **Step 3: Update Labels for Solo Mode**
Replace "ENEMY" with "VIRTUAL COMMANDER" if `gameState.isSolo` is true.

- [ ] **Step 4: Final validation and commit**
```bash
git add .
git commit -m "feat: finalize 'I'm Lonely' mode UI and labels"
```
