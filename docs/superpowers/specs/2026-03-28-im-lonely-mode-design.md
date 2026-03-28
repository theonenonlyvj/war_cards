# VWar "I'm Lonely" Mode Design Document

**Topic:** VWar Solo Mode (Human vs. AI)  
**Date:** 2026-03-28  
**Status:** Approved

## 1. Overview
The "I'm Lonely" mode allows a single player to play VWar against a Virtual Commander (AI). This mode reuses the existing multiplayer infrastructure by simulating a second player on the server, ensuring that all core game rules (Fixed Order, Last Stand) remain consistent.

## 2. User Experience
- **Entry Screen:** Users now choose between "JOIN SECTOR" (Multiplayer) and "I'M LONELY" (Solo).
- **AI Behavior:** The Virtual Commander "reacts" to the player's flip after a 0.5-second tactical delay.
- **Labeling:** In Solo mode, the opponent is clearly labeled as "VIRTUAL COMMANDER" to distinguish it from a human player.

## 3. Core Mechanics (Solo)
- **Initiation:** Clicking "I'M LONELY" generates a private solo room on the server.
- **Auto-Flip Logic:** When the human player triggers `flip-card`:
    1. Server marks the human as flipped.
    2. Server waits 500ms.
    3. Server automatically triggers a flip for the Virtual Commander.
    4. Server resolves the round and emits the `state-update`.

## 4. Technical Architecture
- **Backend (`server/index.js`):**
    - New `join-solo` event handler.
    - `isSolo` boolean added to the room state.
    - `setTimeout` logic inside the `flip-card` handler to automate the AI's response.
- **Frontend (`src/App.tsx`):**
    - Updated `join-screen` UI with the new "I'M LONELY" button.
    - Conditional rendering for the opponent's label (Enemy vs. Virtual Commander).

## 5. Testing & Validation
- **Logic Sync:** Verify that the AI correctly "responds" after the delay and the round resolves as expected.
- **Mode Separation:** Ensure that joining a Solo room doesn't interfere with existing Multiplayer rooms.
- **Last Stand:** Verify that the AI follows the "Last Stand" rule correctly when it runs low on cards.
