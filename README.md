# VWar

VWar is a sci-fi presentation of the classic card game War. The primary mode
runs entirely in the browser: a player battles a virtual commander, with the
current match saved in `localStorage`.

## Modes

- **Blitz** is the default. The first commander to hold 35 cards wins.
- **Classic** continues until one commander holds the full deck.
- **Sector multiplayer** uses the included Socket.IO server and remains a
  secondary, experimental path.

Ties escalate through the game's incident and deployment sequence before the
next face-up cards decide the accumulated pot.

## Run locally

Install dependencies, then start the client and server together:

```bash
npm install
npm start
```

For browser-only local play, `npm run client` is sufficient. The Vite client
uses `http://localhost:3001` for multiplayer unless `VITE_BACKEND_URL` is set.

## Verify

```bash
npm test -- --run
npm run build
```

## Project map

- `src/utils/VWarEngine.ts` — local game state and War rules.
- `src/hooks/useWarGame.ts` — local persistence and Socket.IO state bridge.
- `src/components/` — cards, battle zone, HUD, and effects.
- `server/` — optional multiplayer server.
- `tests/` — deck, engine, and server behavior.
- `docs/handoff/START_HERE.md` — current maintainer orientation.
