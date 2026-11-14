# Working rules

This repo uses Roadmapped for project tracking. The backlog is the source of
truth for what is being worked on and why.

## Task tracking

- Read the current state with `npx roadmapped sitrep`.
- Start work with `npx roadmapped take` (next task) or
  `npx roadmapped start <id>`.
- Create and update tasks through the CLI or the Roadmapped dashboard. Never
  hand-edit YAML under `docs/tasks/`.
- Link each task to the relevant files or spec with `--refs`.
- A product change requires an `in_progress` task. The Roadmapped pre-commit
  guard enforces this for files outside the task log.
- Keep one task per commit. If a change serves two tasks, split it or make one
  task depend on the other.

## Commit format

Every non-merge commit references a Roadmapped task:

```text
<type>(#<id>): <summary>
```

Examples:

```text
feat(#3): parse resume.pdf into typed resume data
design(#7): build the mycelium station materials
chore(#1): record Roadmapped setup delivery
```

Rules:

- `<type>` is one of `feat`, `fix`, `chore`, `docs`, `refactor`, `test`, `build`,
  `ci`, `perf`, `style`, `revert`.
- The task id must exist in `docs/tasks/`.
- Every commit includes at least one `#<id>`, including task-record commits.
- Merge commits and revert commits are exempt from the message format, but their
  PR/merge subject should still reference the task when possible.
- The task must be `in_progress` before product edits, not after.
- Do not use `--no-verify` to skip the guard unless the commit is a recovery
  operation and the reason is recorded in the task.

The `commit-msg` hook installed by `npm install` checks that a task id is present
and that it exists. The Roadmapped pre-commit guard checks task state.

## Delivery record

After the implementation commit:

```sh
npx roadmapped done <id> \
  --commit <sha> \
  --outcome "What shipped, in one sentence" \
  --verification "What was actually run and observed"
```

Commit the delivery record separately:

```text
chore(#<id>): record delivery
```

Do not mark a task done before its implementation commit exists. Do not leave a
finished task without its `commit`, `outcome`, and `verification` fields.

## Quality gates

- `npx roadmapped validate` and `npx roadmapped audit` must be clean.
- `npm run check` must pass.
- `npm run build` must pass.
- `nix build` must pass before merging a user-visible change.
- New dependencies require updating `npmDepsHash` in `flake.nix`.
- The PDF parser is part of the build: parser tests must pass and a parse failure
  must fail the build.
- `/resume` must remain usable without WebGL or JavaScript.

## Branches and deployment

- Work on `task/<id>-<slug>`.
- Keep `main` deployable.
- Do not force-push `main` without an explicit request.
- GitHub Pages deploys from `.github/workflows/deploy.yml` on pushes to `main`.
