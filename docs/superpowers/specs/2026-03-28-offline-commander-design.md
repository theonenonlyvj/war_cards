# VWar "Offline Commander" Mode Design Document

**Topic:** Serverless Solo Play with Persistence  
**Date:** 2026-03-28  
**Status:** Approved / Design Phase

## 1. Overview
The "Offline Commander" mode allows VWar to run entirely in the browser for single-player games. This eliminates the dependency on a backend server for solo play while maintaining the exact same "Triple Burn" and "Virtual Commander" experience. It also introduces local persistence to save game progress.

## 2. Architecture: The Unified Engine
To ensure logic consistency, the core game mechanics will be extracted into a shared TypeScript module: `src/utils/VWarEngine.ts`.

- **Shared State Machine:** Implements the `playing` -> `incident` -> `deployment` -> `reveal` cycle.
- **Shared Logic:** Handles Fisher-Yates shuffling, deterministic deck order (winner takes bottom), and the "Last Stand" rule.
- **Portability:** This module will be imported by both the client (for local play) and the Node.js server (for multiplayer rooms).

## 3. Local Persistence
In Offline mode, the game state will be mirrored to `localStorage`:
- **Storage Key:** `vwar_local_session`
- **Data Points:** `deck1`, `deck2`, `pot`, `status`, `history`.
- **Auto-Resume:** On launch, if a local session exists, the UI will offer a "RESUME LOCAL BATTLE" option alongside the standard "JOIN SECTOR" and "NEW SOLO BATTLE" buttons.

## 4. Hook Strategy: The Smart Bridge
The `useWarGame` hook will be refactored to support two drivers:
1.  **Network Driver (Socket.io):** Emits events to the server and listens for `state-update`.
2.  **Local Driver (VWarEngine):** Calls engine methods directly and updates local React state. It will include a `setTimeout(500)` to simulate the AI's tactical delay.

## 5. User Interface Updates
- **Entry Screen:** Added "RESUME LOCAL" (if applicable) and "NEW LOCAL MISSION" (replaces "I'M LONELY").
- **Visuals:** Identical to current implementation. 
- **Offline Indicator:** A subtle UI cue (e.g., "LOCAL OVERRIDE ACTIVE") to reassure the user that no server is required.

## 6. Testing & Validation
- **Engine Consistency:** Run the `vwar_logic.test.js` suite against the new TypeScript module to ensure no regressions during the port.
- **Persistence Integrity:** Manually verify that refreshing the browser mid-War preserves the exact cards in the pot and decks.
- **Zero-Latency Simulation:** Verify that the 500ms AI delay feels identical to the current production behavior.
