# VWar "I'm Lonely" Mode & Visual Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement solo play mode ("I'm Lonely") and add the missing "Emergency State" visual drama (glitches, shakes) and siren SFX.

**Architecture:** Extend backend for AI automation and update frontend with a new mode, audio manager, and high-intensity CSS animations.

**Tech Stack:** Node.js, Socket.io, React (TypeScript), Framer Motion.

---

### Task 1: Backend - Solo Room & AI logic

**Files:**
- Modify: `server/index.js`

- [ ] **Step 1: Implement `join-solo` and AI auto-flip (0.5s delay)**
```javascript
  socket.on('join-solo', () => {
    const roomId = `SOLO-${socket.id.substring(0, 6)}`;
    socket.join(roomId);
    const { deck1, deck2 } = distributeDecks();
    rooms.set(roomId, { 
      players: [socket.id, 'BOT-AI'], 
      deck1, deck2, 
      flips: new Map(), 
      status: 'playing',
      isSolo: true 
    });
    socket.roomId = roomId;
    socket.playerIndex = 1;
    socket.emit('player-index', 1);
    io.to(roomId).emit('state-update', getPublicState(rooms.get(roomId)));
  });
```

- [ ] **Step 2: Commit backend logic**
```bash
git add server/index.js
git commit -m "feat: implement backend solo mode and AI auto-flip"
```

---

### Task 2: Frontend - "I'm Lonely" UI & Mode Toggle

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/hooks/useWarGame.ts`

- [ ] **Step 1: Update Join Screen with "I'M LONELY" button**
- [ ] **Step 2: Update opponent labels to "VIRTUAL COMMANDER" if `gameState.isSolo`**
- [ ] **Step 3: Commit UI changes**
```bash
git add src/
git commit -m "feat: add 'I'm Lonely' mode to UI and identify AI opponent"
```

---

### Task 3: Emergency State Drama (Glitch, Shake, Siren)

**Files:**
- Modify: `src/index.css`
- Modify: `src/App.tsx`
- Create: `src/utils/AudioManager.ts` (Simulated for now with oscillator or reference)

- [ ] **Step 1: Add Glitch and Shake animations to CSS**
```css
@keyframes glitch {
  0% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
  100% { transform: translate(0); }
}
.emergency-glitch { animation: glitch 0.2s infinite; }
```

- [ ] **Step 2: Implement simple Web Audio API siren in `AudioManager.ts`**
- [ ] **Step 3: Trigger Shake/Glitch and Siren when `gameState.isWar` is true**
- [ ] **Step 4: Final validation and commit**
```bash
git add .
git commit -m "feat: add Emergency state glitches, shakes, and siren SFX"
```
