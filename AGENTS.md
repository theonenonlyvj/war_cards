# Repository guidance

Treat this repository as public.

- Start with `README.md` and `docs/handoff/START_HERE.md`.
- Keep personal information, secrets, machine-specific paths, private
  infrastructure, and material from unrelated workspaces out of the repo.
- Do not add remotes, push, publish, or deploy without explicit authorization.
- `src/utils/VWarEngine.ts` is the source of truth for local play. Protect rule
  changes with focused tests and do not casually synchronize it with the
  older server implementation.
- Run `npm test -- --run` and `npm run build` after code changes.
- Historical specs and plans record prior decisions; verify their status
  against current code before treating unchecked steps as work to execute.
