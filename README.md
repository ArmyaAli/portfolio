# Ali Umar — portfolio

An interactive 3D resume for Ali Umar, generated from `public/resume.pdf`.

The root experience is a mycelium world you move through in a fixed X/Y plane.
A readable, printable resume is always available at `/resume`.

## Stack

- Astro 7 (static output)
- Three.js scene with a fixed-Z 2D camera
- `pdfjs-dist` resume parser running at build time
- `@astrojs/sitemap`
- Nix flake for the Node toolchain, dependency lock, and production build
- Roadmapped for repo-local task tracking
- GitHub Actions → GitHub Pages

## Development

With Nix:

```sh
nix develop
npm ci
npm run dev
```

Without Nix (Node 22.23.4+):

```sh
npm ci
npm run dev
```

The dev server runs at <http://localhost:4321>.

Checks:

```sh
npm run test:resume  # parser tests against public/resume.pdf
npm run check        # Astro + TypeScript
npm run build        # static build
nix build            # reproducible build, output in result/
```

`npm run dev` and `npm run build` regenerate `src/data/resume.generated.json`
from the PDF before Astro starts. To regenerate it manually:

```sh
npm run resume:parse
```

## Routes

- `/` — interactive 3D resume
- `/resume` — semantic text resume plus PDF download
- `/domains` — collected domain names
- `/404` — not found

## Content pipeline

```text
public/resume.pdf
  -> src/lib/resume/extract.ts   positioned text from every page
  -> src/lib/resume/parse.ts     parseResume(pdf) -> ResumeDocument
  -> src/data/resume.generated.json
  -> experience stations + /resume
```

The parser handles the current two-page PDF, including Professional Summary,
Interests, right-aligned dates, and wrapped bullets. A parse failure fails the
build. The parser is build-time only and never ships to the browser.

## Project tracking

The backlog lives in `docs/tasks/` and is managed with
[Roadmapped](https://roadmapped.dev/). Its dashboard is repo-local:

```sh
npx roadmapped sitrep      # current state
npx roadmapped dashboard   # local dashboard
```

Every commit references a task id (`feat(#3): ...`). Start the task before
editing product files. Changes stay local until the task passes its checks and
has been reviewed; promotion is a normal `git push origin main`. After approval,
record the commit, outcome, and verification on the task. The full rules are in
[`CONTRIBUTING.md`](./CONTRIBUTING.md); the interactive 3D resume plan is in
[`docs/specs/2026-11-14-interactive-3d-resume.md`](./docs/specs/2026-11-14-interactive-3d-resume.md).

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, builds the site with
Nix, and publishes it to GitHub Pages. The workflow needs Pages configured to
use GitHub Actions as its source.
