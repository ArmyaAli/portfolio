# Ali Umar — portfolio

Personal site for Ali Umar: selected projects, background, domains, and resume.

Built with [Astro](https://astro.build/) and plain CSS. No client-side framework,
no runtime JavaScript.

## Stack

- Astro 7 (static output)
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

The dev server runs at <http://localhost:4321>. Run `npm run check` for Astro
and TypeScript diagnostics, or `npm run format` to format the source.

## Build

```sh
nix build        # result/ contains the static site
npm run build    # or build directly into dist/
```

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

## Content

- `src/config.ts` — site metadata, nav, social links, Formspree endpoint
- `src/data/projects.ts` — project cards on the home page
- `src/data/domains.ts` — domains listed on `/domains`
- `public/resume.pdf` — resume preview and download
- `public/profile.jpg` — hero portrait

Contact form submissions go to Formspree; replace `formspreeEndpoint` in
`src/config.ts` to use a different form.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, builds the site with
Nix, and publishes it to GitHub Pages. The workflow needs Pages configured to
use GitHub Actions as its source.
