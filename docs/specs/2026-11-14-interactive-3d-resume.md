# Interactive 3D Resume — Plan

Status: implemented — deployment pending
Owner: Ali Umar
Epic: `interactive-resume`

## Goal

Replace the traditional home page with an interactive 3D resume that users travel
through in a fixed 2D plane. `public/resume.pdf` is the single source of truth: a
parser turns the PDF into typed resume data, and that data drives both the 3D
experience and the accessible static resume.

The existing Nix build and GitHub Pages deployment stay.

The current source PDF (updated from the USB on 2026-11-14) is two pages and adds
a **Professional Summary**, quantified impact bullets, updated projects, and an
**Interests** section. The parser must handle this structure, not the older
one-page layout.

## Hard constraints

- Camera moves on X/Y only at a fixed Z. No orbit, rotation, first-person look, or
  free 3D camera.
- All readable resume content is DOM text, not WebGL text.
- The experience must have a usable static fallback at `/resume`.
- No client-side framework. Use vanilla Three.js.
- The PDF is parsed at build time. The parser is not shipped to the browser.
- A parser failure fails the build; it must never silently produce an empty resume.

## Experience

Visual direction: **Mycelium** — a dark ink-green world, warm off-white type,
amber/rust accents, a glowing path, spore-like depth particles, and floating
station cards.

User journey:

1. Land on the origin station with name, role, and a one-line pitch.
2. Move with drag, wheel/trackpad, or WASD/arrows.
3. Pass five stations: Experience, Projects, Skills, Education, Contact.
4. Click/tap a station to open a readable panel; use next/previous to move through
   the resume sequentially.
5. Leave at any time through “Read as text” → `/resume`.

Suggested layout, top to bottom:

| Node | Content | Position |
|---|---|---|
| 00 Origin | Name, current role, professional summary, resume link | `(0, 0)` |
| 01 Experience | Three roles from the PDF, dates, location, bullets | `(-6, -12)` |
| 02 Projects | gratitude.forum, BMinor compiler, homelab | `(6, -24)` |
| 03 Skills | Fundamentals, tools, infrastructure familiarity | `(-5, -36)` |
| 04 Education | York, Seneca, certifications, interests | `(5, -48)` |
| 05 Contact | Email, GitHub, LinkedIn, PDF download | `(0, -60)` |

Camera bounds are soft-clamped around `x ±14`, `y -68…8`. A thermometer-style
minimap shows the path, station states, current station, and animated progress:
vertical on desktop, horizontal on mobile.

## Interaction contract

- Drag: pan camera in X/Y.
- Wheel/trackpad: pan; native keyboard pairs with W/A/S/D and arrows.
- Click/tap station or its thermometer node: focus station.
- `Enter`: open focused station.
- `Esc`: close the station dialog.
- Next/previous inside the dialog: sequential resume reading.
- Auto tour starts at the origin and advances every nine seconds. Pause/resume
  controls the tour; Next steps immediately; manual movement pauses auto and it
  resumes 6.5 seconds after the user stops.
- The thermometer fill animates to the active station; labels appear on hover or
  active state, and the current tick pulses.
- URL hash sync: `/#experience`, `/#projects`, `/#skills`, `/#education`,
  `/#contact`; browser back closes an open station.
- Intro hint: “Drag to move · click a node to open”; fades after first input.
- No hover-only information. No modal without a close path.
- Mobile: one-finger drag, tap station, bottom-sheet dialog.

## Parser pipeline

```
public/resume.pdf
        │
        ▼
extractResumeLines(pdf)        # pdfjs-dist text items → lines with x/y
        │
        ▼
parseResume(pdf)               # public API: Uint8Array → ResumeDocument
        │
        ▼
src/data/resume.generated.json # committed, deterministic artifact
        │
        ├──> index.astro         # 3D stations and dialog content
        └──> resume.astro        # static accessible resume
```

### Parser API

```ts
export type ResumeDocument = {
  contact: {
    name: string;
    phone?: string;
    email: string;
    website?: string;
    linkedin?: string;
    github?: string;
  };
  summary?: string;
  education: EducationEntry[];
  experience: ExperienceEntry[];
  projects: ProjectEntry[];
  skills: SkillGroup[];
  certifications: Certification[];
  interests?: string[];
  meta: {
    source: "resume.pdf";
    sourceSha256: string;
    warnings: string[];
  };
};

export async function parseResume(pdf: Uint8Array): Promise<ResumeDocument>;
```

`parseResume` is the one public function. `extractResumeLines` and the section
handlers stay private. The script wrapper reads the PDF and writes the JSON.

### Extraction

Use `pdfjs-dist` (legacy Node build) rather than plain PDF text. The PDF has
right-aligned dates and locations that a flat text extractor collapses into the
left column. Extract every page, not only page 1. Reconstruct lines from text
items:

- Iterate pages in order and keep the page number on each line.
- Group items by rounded Y within a small tolerance.
- Sort by X.
- Join adjacent items with a space when their gap warrants it.
- Keep the starting X of each line so the parser can distinguish headers,
  entries, bullets, and right-aligned dates.
- Drop repeated page headers/contact blocks after page 1.
- Do not treat page breaks as section boundaries; sections continue across pages.

### Parsing rules

- Normalize unicode dashes, quotes, and whitespace before parsing.
- Contact block: first line is the name; the next line is pipe-separated phone,
  email, website, LinkedIn, GitHub.
- Section headings: `Professional Summary`, `Experience`, `Education`,
  `Projects`, `Technical Skills`, `Certifications`, `Interests`.
- Sections are discovered by heading, not fixed order. The current PDF puts
  Experience before Education.
- `Professional Summary` is paragraph text, not bullets.
- Dates: `Mon YYYY – Present`, `Mon YYYY – Mon YYYY`, `Month YYYY`.
- A right-aligned date marks the end of an entry header; the following line is the
  organization plus location.
- Bullets begin with `•` or a bullet-indent X; wrapped lines merge into the
  previous bullet until the next bullet or entry.
- Projects: `Title | Tech list` plus a right-aligned date.
- Skills: `Label: value` with continuation lines merged.
- Education: degree line, school line, right-aligned dates/locations.
- Certifications: name plus right-aligned date.
- Interests: comma-separated list, possibly wrapped.
- Preserve source URLs and text. The current PDF prints
  `linkedin.com/in/aliumardev1`; the site's canonical contact actions use
  `src/config.ts` until the PDF source is corrected.

Failures:

- Missing required section or contact fields → throw with section/line context.
- Unknown lines → collect in `meta.warnings` and keep building.
- The generator writes warnings to stdout and includes them in JSON.

### Build integration

- Add `parseResume` in `src/lib/resume/`.
- Add `scripts/generate-resume.ts` using the parser and `node:crypto` for the
  source hash.
- `package.json`:
  - `"resume:parse": "tsx scripts/generate-resume.ts"`
  - `"predev": "npm run resume:parse"`
  - `"prebuild": "npm run resume:parse"`
  - `"test:resume": "tsx --test src/lib/resume/*.test.ts"`
- Commit `src/data/resume.generated.json` for editor/typecheck stability; the
  prebuild step always regenerates it.
- Add parser tests against the real PDF and a text-line fixture. Assert the
  two-page extraction, Professional Summary, three experience entries, three
  projects, skills groups, education, certifications, and interests.
- Update `npmDepsHash` after adding `pdfjs-dist` and `tsx`.

## Architecture

```text
src/
  lib/resume/
    extract.ts                 # PDF → positioned lines
    parse.ts                   # positioned lines → ResumeDocument
    parse.test.ts
  data/resume.generated.json
  experience/
    main.ts                    # bootstrap, lifecycle
    scene.ts                   # renderer, camera, resize, render loop
    camera-rig.ts              # damped X/Y movement, bounds, station offsets
    input.ts                   # pointer, wheel, keyboard, touch
    world.ts                   # path, backdrop, particles, station meshes
    stations.ts                # station meshes + projected DOM labels
    materials.ts               # procedural materials and textures
    overlay.ts                 # dialog, hash sync, focus management
  components/experience/
    ExperienceCanvas.astro
    StationDialog.astro
    Minimap.astro
  styles/experience.css
  pages/index.astro            # immersive experience
  pages/resume.astro           # static resume from generated data
```

Rendering:

- Perspective camera, fixed orientation, `lookAt(camera.x, camera.y, 0)`.
- Exponential damping for camera movement; no tween library.
- Path and stations at `z = 0`; spores behind at `z -20…-5`; foreground dust at
  `z +4`.
- Procedural visuals only. No downloaded textures.
- No postprocessing in v1; fake glow with additive sprites and emissive materials.
- DOM station labels projected from 3D positions each frame (six labels).

## Accessibility and fallback

- Canvas is `aria-hidden`; station labels are real buttons.
- Native `<dialog>` for station content; `Esc` closes; focus returns to the
  triggering station.
- “Read as text” link is always visible.
- `/resume` is a semantic HTML resume generated from the same data plus the PDF
  download.
- No WebGL / failed dynamic import / no JS → static resume is immediately
  available.
- `prefers-reduced-motion`: no particles, no camera damping, instant station focus.
- Keyboard movement: arrows/WASD; Shift accelerates; station buttons are tabbable.
- Color contrast verified for text and station labels.

## Performance

- DPR capped at 1.75.
- Low particle counts on mobile; pause rendering when the tab is hidden.
- No shadows; no postprocessing.
- Target 60fps on integrated graphics.
- Initial JS budget: Three.js plus scene only; parser stays build-time.
- Test desktop and mobile viewports with screenshots and frame timing.

## Verification

- `npm run test:resume`
- `npm run check`
- `npm run build`
- `nix build`
- Browser smoke: load scene, move, open station, close via Esc, deep-link to a
  station, keyboard-only traversal, mobile viewport, no-WebGL fallback.
- Deploy via the existing `.github/workflows/deploy.yml`.

## Locked decisions

- `/` becomes the experience. `/resume` remains the static, accessible fallback.
- The camera moves freely on X/Y at a fixed Z. No rail, orbit, or rotation.
- Dark mycelium art direction: ink green-black, off-white type, amber/rust accents.
- Vanilla Three.js. No React or R3F.
- The parser and PDF remain build-time inputs. No client-side PDF parsing.
- `public/resume.pdf` is the updated two-page general resume.
- The static resume includes the phone number because it comes from the PDF.
  The 3D contact station uses email, GitHub, LinkedIn, and the PDF download, and
  does not display the phone number.
- Site social links come from `src/config.ts`, not from parsed PDF URLs.
- Desktop uses a side dialog; mobile uses a bottom-sheet dialog.
- The intro requires a first movement input; there is no autoplay cinematic.
- No analytics.
- Zero-WebGL and no-JS users get the static resume immediately.

