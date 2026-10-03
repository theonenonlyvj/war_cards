# VWar maintainer start here

Read `README.md`, then inspect `git status` and the recent history before
editing.

The supported primary flow is local browser play. `src/utils/VWarEngine.ts`
owns its rules, `src/hooks/useWarGame.ts` owns persistence and presentation
state, and `src/App.tsx` renders card values from each card's numeric `value`
field. The optional Socket.IO path under `server/` is older and is not a
drop-in copy of the local engine.

The implemented current design is documented in:

- `docs/superpowers/specs/2026-07-10-vwar-local-blitz-polish-design.md`
- `docs/superpowers/plans/2026-07-10-vwar-local-blitz-polish-implementation.md`

Earlier March specs and plans are historical. In particular, the screenshot
showing `[object Object]` card labels predates the current code. Confirm any
reported rendering defect against the current UI before changing the engine.

Verification gates:

```bash
npm test -- --run
npm run build
```
