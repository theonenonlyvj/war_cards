# VWar Design Document

**Topic:** VWar - A Sci-Fi "Command Center" Card Game (Multiplayer)  
**Date:** 2026-03-28  
**Status:** Approved

## 1. Overview
VWar is a high-fidelity, web-based implementation of the classic card game "War." While the core mechanics follow the traditional, luck-based rules, the interface is styled as a high-intensity sci-fi "Command Center." The goal is to capture all 52 cards through direct confrontation and strategic-looking (but automated) escalations.

## 2. Core Mechanics
- **Standard War Rules:** Two players, 26 cards each, Ace high. Higher card wins the round.
- **The "War" Escalation:** Ties trigger a "War" state. Each player commits 3 cards face-down and 1 card face-up.
- **House Rule (The Last Stand):** If a player runs out of cards during a War, their very last card is played as the "Battle Card" for the final face-up comparison.
- **Winning:** One player captures all 52 cards.

## 3. Visual Strategy: "The Command Center"
- **Aesthetic:** Dark, hi-tech, and neon (cyan/magenta/orange).
- **Holographic Cards:** Transparent-style cards with glowing borders and "scanning" line animations.
- **Emergency State:** When a Tie/War occurs:
    - Background flashes red.
    - Low-frequency siren SFX (simulated or audio).
    - HUD elements shake or glitch.
- **Kinetic Motion:** Cards "dock" into a central BattleZone with high-speed sliding and snapping animations.

## 4. Technical Architecture
- **Framework:** React (TypeScript) for UI and state management.
- **Backend:** Node.js (Express) with **Socket.io** for real-time multiplayer synchronization.
- **Multiplayer Logic:**
    - **Room System:** Unique 4-6 character "Room Code" (e.g., `WAR-1234`) for private matches.
    - **Sync State:** The backend shuffles the deck and distributes cards to ensure both players see the same outcomes simultaneously.
    - **Round Synchronization:** Both players must "flip" their cards before the round progresses.
- **Animations:**
    - **Framer Motion:** For layout transitions, card flips, and "Emergency" screen shakes.
    - **PixiJS (Hybrid):** A dedicated canvas layer for high-impact effects (neon particles, "War" victory explosions).
- **Responsive Design:** CSS Grid/Flexbox to ensure the "Command Center" HUD fits mobile (portrait) and desktop (landscape).

## 5. Components & Data Flow
- `Lobby`: Entry screen for creating or joining a "Room."
- `GameContainer`: Manages the socket connection, deck synchronization, and round result.
- `Card`: A 3D-flippable holographic card component.
- `BattleZone`: The central "Combat" area where cards are compared.
- `HUD`: Displays card counts, player status, and the "Emergency" alert.
- `FXLayer`: A PixiJS overlay for particle systems.

## 6. Testing & Validation
- **Network Resilience:** Test suite for handling player disconnects and reconnects mid-game.
- **Deck Integrity:** Automated tests to ensure the total card count remains 52 at all times.
- **Logic Verification:** Test suite for "Last Stand" scenarios and multi-level "War" chains.
- **Visual Polish:** Manual "feel" tests for animation timing and "Emergency" state impact.
