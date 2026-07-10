# VWar Local Blitz And Polish Design

**Date:** 2026-07-10
**Status:** Approved for implementation

## Scope

This pass improves the local/core VWar experience without investing in the current Socket.io multiplayer path. Multiplayer hardening is deferred because a different multiplayer engine is planned.

## Goals

- Make the default game shorter with a Blitz win condition: first player to 35 cards wins.
- Keep Classic full-attrition War available for players who want the original long game.
- Add tactical stakes to the UI: cards at stake, possible swing, incident chain, Last Stand risk, and active win condition.
- Make card reveals feel more responsive with lightweight winner/impact states.
- Improve first-run and brand polish so the app presents as VWar, not generic War.

## Non-Goals

- Do not harden or redesign current Socket.io multiplayer.
- Do not add auto-engage yet.
- Do not add incident doctrine choices, commander personas, stats, or mission achievements yet.
- Do not add new runtime dependencies.

## Design

### Core Rules

`src/utils/VWarEngine.ts` becomes the source of truth for local match setup and Blitz resolution. A local game starts in Blitz mode unless the player explicitly chooses Classic. Blitz ends immediately after a resolved battle or deployment reveal if either deck reaches at least 35 cards. Classic keeps the existing all-cards win condition.

The engine exposes derived tactical intel so UI components do not duplicate rule math. The intel reports pot size, possible swing, incident chain length, Last Stand risk, active mode label, and target cards.

### UI

The join screen makes local play primary:

- `NEW BLITZ BATTLE` starts first-to-35 mode.
- `CLASSIC ATTRITION` starts full War.
- Existing local resume remains available when a saved local session exists.
- Sector-code multiplayer remains present but secondary.

In-game HUD/status display shows the active mode and tactical stakes. The battle zone marks the winning card slot after each resolved engagement and gives incident/deployment states clearer visual copy. The local override badge no longer overlaps the top HUD.

### Data Flow

`useWarGame` passes a match mode into `VWarEngine.createInitialState`. It persists the selected mode in the saved local state. `App` and `HUD` receive engine-derived tactical intel from `gameState`, so UI copy stays consistent with the current local state.

### Error Handling

Malformed saved local sessions fall back to clearing the saved session, matching current behavior. Classic is the compatibility fallback if older saved state lacks a match mode. Network error states are not expanded in this pass because current multiplayer is out of scope.

### Testing

Tests cover:

- Blitz starts by default at first-to-35.
- Classic remains available and does not end at 35.
- Blitz ends immediately when a player reaches the target.
- Tactical intel reports pot size, possible swing, incident chain, and Last Stand risk.
- P2 capture order follows the documented winner-first rule.

Existing build and test gates must pass.
