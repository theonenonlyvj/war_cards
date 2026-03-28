# VWar Master Design Document

**Topic:** VWar - A Sci-Fi "Command Center" Card Game  
**Date:** 2026-03-28  
**Status:** Live / Comprehensive Specification

## 1. Overview
VWar is a high-fidelity, web-based implementation of the classic card game "War." The interface is styled as a high-intensity sci-fi "Command Center." The game supports real-time multiplayer ("JOIN SECTOR") and a solo mode against a server-simulated AI ("I'M LONELY").

## 2. Core Mechanics
- **Standard War Rules:** Two players, 26 cards each, Ace high (values 2-14).
- **Deterministic Deck Order:** Won cards are appended to the winner's deck in a fixed order: **[Winner's Card, Loser's Card]**. This prevents unintended reshuffling and maintains the classic "fixed order" nature of the game.
- **The "Incident" (War Escalation):** Ties trigger an `INCIDENT` state. The game pauses, tied cards stay on the table, and the "EMERGENCY" alerts (glitch, shake, siren) trigger.
- **Multi-Stage Escalation:** 
    - Resolving an `INCIDENT` requires an explicit user interaction: **"DEPLOY REINFORCEMENTS"**.
    - Each player commits 3 cards face-down (the "burn") and 1 card face-up.
    - If the new face-up cards tie, the game remains in the `INCIDENT` state, cards pile up, and another reinforcement deployment is required.
- **House Rule (The Last Stand):** If a player has fewer than 4 cards during an escalation:
    - They commit all but one card face-down.
    - Their **very last card** is used as the face-up "Battle Card" for the final comparison.
    - If they win, they take the entire pot and survive. If they lose, they are eliminated.
- **Winning:** One player captures all 52 cards.

## 3. Game Modes
- **Join Sector (Multiplayer):** 
    - Real-time synchronization via Socket.io.
    - Both players must trigger a flip for the round to progress.
    - Automatic room cleanup on disconnect.
- **I'm Lonely (Solo):**
    - Human vs. server-side "Virtual Commander" (AI).
    - **Tactical Delay:** The AI triggers its flip 500ms after the human player, simulating a reactive opponent.
    - **Mode Identification:** Opponent is clearly labeled as "VIRTUAL COMMANDER" and the local user as "COMMANDER YOU".

## 4. Visual & Audio Strategy
- **Aesthetic:** Dark, tactical "Command Center" with Neon Cyan (Player 1) and Neon Magenta (Player 2) accents.
- **Holographic Cards:** Large, transparent cards with glowing borders, neon symbols (&spades;, &hearts;, etc.), and active scanning line animations.
- **Emergency State:** High-intensity feedback loop when `isWar` is true:
    - **Visuals:** Full-screen CSS `glitch` and `shake` animations.
    - **Audio:** Synthetic siren SFX synthesized via Web Audio API (LFO-modulated sawtooth oscillator).
- **Tactical HUD:**
    - **Power Balance Bar:** Real-time visual representation of deck distribution.
    - **Dominance Indicator:** Dynamic status messages based on deck ratios.
    - **Engagement Log:** Scrolling terminal history of all battles and reinforcement deployments.
- **Mobile optimization:** Horizontal "Faceoff" layout using `100dvh` and `safe-area-inset` to ensure full visibility on modern mobile browsers.

## 5. Technical Architecture

### A. Backend State Machine & Room Management
- **Persistence:** A server-side `Map` stores active `rooms`, where each `roomId` maps to a state object containing player IDs, decks, current pot, and interaction logs.
- **Sync Logic:** The backend employs a per-room `flips` map to track individual player interactions. A round only resolves once `flips.size === room.players.length`.
- **Race Condition Prevention:** A server-side `resolving` flag blocks redundant flip events during the 1000ms "visual reveal" window and the 500ms AI tactical delay.
- **Automated AI Actor:** In solo mode, the backend injects a `BOT-AI` entity into the `players` array and uses `setTimeout` to trigger its flip event programmatically after the human actor flips.

### B. Game Logic Engine (`resolveRound`)
- **Recursive Resolution:** The engine uses a tail-recursive `resolveRound` function to handle nested "War" escalations.
- **Pot Accumulation:** The `pot` array is carried through recursive calls, accumulating cards from the initial battle, reinforcements (burn cards), and tie-breaker cards.
- **History Tracking:** Every decision point (battle vs. reinforcements) is recorded into a `history` log, which is serialized and sent to clients for the tactical terminal display.
- **Deterministic Winner Gain:** Upon victory, the `pot` is appended to the winner's deck in a fixed order, ensuring strict deck maintenance.

### C. Frontend Synchronization & Hooks
- **Socket Lifecycle:** The `useWarGame` custom hook manages the persistent Socket.io connection, performing auto-cleanup of listeners on component unmount.
- **Room Handshaking:** The hook handles a two-stage join process (`join-room` or `join-solo`), where the server responds with a `room-id` and `player-index` to ensure the local client is correctly identified.
- **Reactive Updates:** The UI is driven by a single `gameState` object pushed from the server on every state change, ensuring perfect synchronization between players.

### D. Animation & Audio Systems
- **Orchestrated Motion:** Framer Motion handles 3D card flips and layout transitions, triggered by the server's `state-update`.
- **Hybrid Effects Layer:** A PixiJS canvas layer sits above the DOM to render high-performance neon particle systems during victory events, avoiding DOM churn.
- **Procedural Sound Synthesis:** The `AudioManager` uses the Web Audio API to synthesize siren tones. A sawtooth oscillator is modulated by a triangle-wave LFO to create a frequency-sweeping alarm without external assets.

## 6. Strict Testing & Validation Requirements
To ensure the game remains robust, the following tests MUST pass:

### A. Deck Integrity (Automated)
- **Total Count:** Every round resolution must be verified to ensure `deck1 + deck2 + pot` always equals 52.
- **Determinism:** Tests must verify that cards added to the deck follow the `[WinnerCard, LoserCard]` order without random deviation.
- **Distribution:** Shuffle algorithm (Fisher-Yates) must be verified for correct card frequency (4 of each rank).

### B. Logic Verification (Automated & Manual)
- **The Last Stand:** Unit tests for scenarios where players have 0, 1, 2, or 3 cards during a War tie.
- **Epic War Chains:** Verify that the state machine correctly handles 3+ consecutive ties without state corruption.
- **Solo Mode Reactivity:** Verify the 500ms AI delay triggers correctly and that the AI cannot "double-flip."

### C. Network Resilience
- **Room Leakage:** Verify that sockets correctly leave previous rooms and that solo rooms are purged from memory when the player disconnects.
- **Latency Sync:** Ensure the UI doesn't "jump" or flicker when receiving state updates from the server.

### D. Visual/Audio Polish
- **Safe Area Insets:** Manual verification on iOS/Android to ensure HUD elements aren't obscured by notches or home bars.
- **Audio Cleanup:** Verify that the siren oscillator is properly stopped and disconnected to prevent memory leaks and audio artifacts.
