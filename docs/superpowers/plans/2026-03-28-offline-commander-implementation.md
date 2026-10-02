# Offline Commander Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable serverless solo play by moving game logic to a shared client/server module and implementing local persistence via `localStorage`.

**Architecture:** 
1. **Shared Engine:** Centralize all game rules and state transitions in `src/utils/VWarEngine.ts`.
2. **Driver-Based Hook:** Refactor `useWarGame` to switch between `NetworkDriver` (Socket.io) and `LocalDriver` (direct Engine calls).
3. **Persistence Layer:** Automatically save/load `LocalDriver` state from `localStorage`.

**Tech Stack:** TypeScript, React, localStorage, Vitest.

---

### Task 1: The Shared Engine

**Files:**
- Create: `src/utils/VWarEngine.ts`
- Modify: `tests/vwar_logic.test.js`

- [ ] **Step 1: Implement core logic in `VWarEngine.ts`**
Extract `distributeDecks` and the 3-stage resolution logic from `server/index.js` and `server/gameLogic.js`.
```typescript
export interface Card {
  value: number;
  suit: string;
  id: string;
}

export interface GameState {
  deck1: Card[];
  deck2: Card[];
  pot: Card[];
  status: 'playing' | 'incident' | 'deployment' | 'game-over';
  winner: number | null;
  isWar: boolean;
  history: any[];
}

export const VWarEngine = {
  distributeDecks: () => { /* ... Fisher-Yates ... */ },
  resolveStage: (state: GameState): GameState => { /* ... 3-stage logic ... */ }
};
```

- [ ] **Step 2: Update existing tests to use the shared engine**
Modify `tests/vwar_logic.test.js` to import from the new TS module (using `ts-node` or equivalent if needed, or simply verifying the logic remains identical).

- [ ] **Step 3: Commit engine**
```bash
git add src/utils/VWarEngine.ts
git commit -m "feat: extract core game logic into shared VWarEngine module"
```

---

### Task 2: Backend Integration

**Files:**
- Modify: `server/index.js`
- Modify: `server/gameLogic.js`

- [ ] **Step 1: Point server logic to the shared engine**
Update `server/index.js` to use `VWarEngine.resolveStage` instead of inline logic. (Note: May require minor adjustments for JS/TS interop or duplicating the file if build setup is complex).

- [ ] **Step 2: Commit backend refactor**
```bash
git add server/
git commit -m "refactor: backend now uses the shared VWarEngine"
```

---

### Task 3: The "Local Driver" Hook

**Files:**
- Modify: `src/hooks/useWarGame.ts`

- [ ] **Step 1: Implement Local Mode logic**
Update the hook to maintain local state and bypass sockets when `mode === 'local'`.
```typescript
  const [localState, setLocalState] = useState<GameState | null>(null);
  
  const flipLocal = () => {
    // 1. Set local flip flags
    // 2. setTimeout(500) for AI
    // 3. Call VWarEngine.resolveStage
    // 4. Update state and localStorage
  };
```

- [ ] **Step 2: Add Persistence logic**
Inside `useEffect`, check for `localStorage.getItem('vwar_local_session')`.

- [ ] **Step 3: Commit hook updates**
```bash
git add src/hooks/useWarGame.ts
git commit -m "feat: implement LocalDriver and localStorage persistence in useWarGame hook"
```

---

### Task 4: UI - Local Mission Control

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Update Join Screen UI**
Add "RESUME LOCAL MISSION" and "NEW LOCAL MISSION" buttons.
Add a "LOCAL OVERRIDE" status indicator in the game HUD when offline.

- [ ] **Step 2: Implement "Resume" handler**
Call `joinLocal(savedState)` in the hook.

- [ ] **Step 3: Final validation and commit**
```bash
git add src/App.tsx
git commit -m "feat: complete Offline Commander UI with session management"
```
