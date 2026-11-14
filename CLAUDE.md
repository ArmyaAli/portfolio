<!-- >>> roadmapped >>> -->
## Roadmapped

This repo uses **Roadmapped** (flat-file project management, agent-driven).

- **At session start**: if the Roadmapped dashboard is not already open, run
  `npx roadmapped dashboard` (idempotent — no-op if it's already running, otherwise opens the browser).
- Every task creation/update goes through the roadmapped skill or `npx roadmapped <cmd>`
  (never edit the YAML files under `docs/tasks/` by hand).
<!-- <<< roadmapped <<< -->

## Project rules

Read [`CONTRIBUTING.md`](./CONTRIBUTING.md) before changing the repo.

- Start a Roadmapped task before editing product files. Keep one task
  `in_progress` at a time.
- Work directly on `main`; no task branches or PRs.
- Every commit references a task id: `feat(#3): ...`.
- Test the change, then wait for Ali to review it. **Do not push `main` before
  review.**
- After approval, record delivery with
  `npx roadmapped done <id> --commit <sha> --outcome ... --verification ...`,
  commit `chore(#<id>): record delivery`, then `git push origin main` and verify
  the Pages deploy.
- Never edit `docs/tasks/*.yaml` by hand; use the Roadmapped CLI or dashboard.
- `npm run check`, `npm run build`, and `nix build` are the quality gates.
