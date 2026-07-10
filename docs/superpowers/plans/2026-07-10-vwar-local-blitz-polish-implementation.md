# VWar Local Blitz And Polish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve VWar local play with Blitz mode, tactical stakes, better reveal feedback, and brand polish while leaving current multiplayer hardening for the future multiplayer engine.

**Architecture:** Add match-mode and tactical-intel support to the existing local `VWarEngine`, then wire those fields through `useWarGame`, `HUD`, and `App`. Keep the current Socket.io server path functionally untouched except for compatibility with shared UI shapes.

**Tech Stack:** React 18, TypeScript, Vite, Vitest, existing CSS/Framer Motion.

## Global Constraints

- Do not harden or redesign current Socket.io multiplayer.
- Do not add auto-engage.
- Do not add incident doctrine choices, commander personas, stats, or mission achievements.
- Do not add new runtime dependencies.
- Use test-first changes for engine behavior.
- Do not commit unless Vijay explicitly asks for a commit.

---

### Task 1: Engine Match Modes And Tactical Intel

**Files:**
- Modify: `src/utils/VWarEngine.ts`
- Modify: `tests/vwar_logic.test.js`

**Interfaces:**
- Produces: `MatchMode = 'blitz' | 'classic'`
- Produces: `createInitialState(matchMode?: MatchMode): GameState`
- Produces: `getTacticalIntel(state: GameState): TacticalIntel`
- Produces: Blitz game-over detection after resolved wins.

- [x] **Step 1: Write failing tests for Blitz, Classic, capture order, and intel**

Add tests in `tests/vwar_logic.test.js` that import `createInitialState`, `resolveStage`, and `getTacticalIntel`.

- [x] **Step 2: Run `npm test -- --run tests/vwar_logic.test.js` and verify the new tests fail**

Expected: failures for missing exports and/or missing Blitz behavior.

- [x] **Step 3: Implement minimal engine changes**

Add match-mode fields to `GameState`, create initial state through the engine, apply winner-first spoils, detect Blitz and Classic game-over, and return tactical intel.

- [x] **Step 4: Run `npm test -- --run tests/vwar_logic.test.js` and verify it passes**

Expected: all VWar logic tests pass.

### Task 2: Local Hook State Wiring

**Files:**
- Modify: `src/hooks/useWarGame.ts`

**Interfaces:**
- Consumes: `createInitialState(matchMode?: MatchMode)`
- Produces: `joinSolo(forceNew?: boolean, matchMode?: MatchMode)`
- Produces: `gameState.tacticalIntel`

- [x] **Step 1: Replace ad hoc local-state creation with `createInitialState`**

Use Blitz as the default for new local games, preserve saved sessions on resume, and include tactical intel on every local UI update.

- [x] **Step 2: Run `npm test -- --run tests/vwar_logic.test.js`**

Expected: logic tests remain green.

### Task 3: UI, Reveal Feedback, And Brand Polish

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/components/HUD.tsx`
- Modify: `src/components/Card.tsx`
- Modify: `src/index.css`
- Modify: `index.html`

**Interfaces:**
- Consumes: `gameState.matchMode`
- Consumes: `gameState.tacticalIntel`

- [x] **Step 1: Make local Blitz the primary first-run action**

Update the join screen copy and buttons to offer `NEW BLITZ BATTLE`, `CLASSIC ATTRITION`, and resume where applicable.

- [x] **Step 2: Show tactical stakes**

Render mode target, cards at stake, possible swing, incident chain, and Last Stand warnings in HUD/status UI.

- [x] **Step 3: Add lightweight reveal feedback**

Apply winner classes to the card slots and card components so the latest winner is visually obvious.

- [x] **Step 4: Fix local badge overlap and update brand metadata**

Move the local badge into normal layout or below the HUD, and update document title/description/social metadata to VWar.

- [x] **Step 5: Run `npm test -- --run` and `npm run build`**

Expected: all tests and production build pass.
