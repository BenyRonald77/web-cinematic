# CLAUDE.md

Project: cinematic, scroll-driven landing page for a specialty coffee brand ("Pelan Coffee", placeholder name).
The full spec is in `docs/PRD.md`. Read it before starting any milestone. Asset prompts live in `docs/ASSET-PROMPTS.md`.

The user communicates in Indonesian. Reply in Indonesian; write code, comments, and site copy in English.
The user works on Windows (PowerShell, VS Code).

## Stack

- Next.js (latest, App Router) + TypeScript, `src/` directory, import alias `@/*`
- Tailwind CSS
- GSAP (`gsap`, `@gsap/react`) with ScrollTrigger and SplitText. All GSAP plugins are free; import them from the `gsap` package.
- Lenis for smooth scroll, synced with ScrollTrigger
- ffmpeg for asset processing (must be on PATH)

Do not add Three.js, Framer Motion, or other animation libraries. Ask before adding any new dependency.

## Commands

```
npm run dev        # dev server at http://localhost:3000
npm run build      # production build, must pass before a milestone is done
npm run lint
npm run frames     # node scripts/extract-frames.mjs → frames + src/data/sequences.json
```

## Folder structure

```
src/
  app/                    layout.tsx, page.tsx, globals.css
  components/
    sequence/             ScrollSequence.tsx, useFramePreloader.ts, drawCover.ts
    sections/             Hero/Scene overlays, MenuHighlight, OurStory, Visit, Footer
    layout/               Navbar, SmoothScroll (Lenis provider)
  lib/gsap.ts             registers GSAP plugins once, re-exports gsap
  data/                   scenes.ts (copy + focusX per scene), menu.ts, sequences.json (generated)
scripts/                  extract-frames.mjs, make-dummy-frames.mjs
assets/raw/               source videos scene-01.mp4 … (gitignored)
assets/keyframes/         Nano Banana images (gitignored)
public/sequences/scene-0X/{desktop,mobile}/0001.webp
docs/                     PRD.md, ASSET-PROMPTS.md
```

## How the cinematic scenes work

- Each scene is a pinned section (~250–300vh) containing a full-viewport `<canvas>` and a text overlay.
- ScrollTrigger `scrub` maps scroll progress → frame index. Draw only when the index changes (requestAnimationFrame).
- `drawCover(ctx, img, focusX)`: cover-fit the image on the canvas; `focusX` (0–1) picks the horizontal crop point so the subject stays visible on portrait screens.
- Canvas size = CSS size × `Math.min(devicePixelRatio, 2)`. Re-size and `ScrollTrigger.refresh()` on resize/orientation change.
- Pick `desktop` or `mobile` frame set once on load based on viewport width (< 768px → mobile).
- Preload: scene 01 first (first 20 frames with priority), other scenes when within ~1 viewport of entering. Show frame 1 as poster until loaded. Never draw an image that is not `complete`; fall back to the nearest loaded frame.
- Text: SplitText by lines/words, animate `yPercent` + `opacity` in a timeline tied to the same ScrollTrigger.
- `prefers-reduced-motion: reduce` → no pinning or scrub; show the last frame of each scene as a static image with plain text.
- Frame counts and paths come from `src/data/sequences.json`. Never hardcode them.

## Rules

- Client components only where needed (`"use client"` on animated components; sections stay server components when possible).
- All GSAP code inside `useGSAP` with a scope ref so it cleans up automatically. No ScrollTrigger created outside it.
- Animate only `transform` and `opacity`.
- Use `next/font` for fonts and `next/image` for normal images. Canvas frames are loaded with `new Image()`.
- Keep components small. One component per file.
- Do not copy brand names, logos, colors, or copy from reference sites.
- Do not commit anything in `assets/raw/` or `assets/keyframes/`.

## Asset pipeline (`npm run frames`)

For each `assets/raw/scene-0X.mp4`:
- desktop: `ffmpeg -i in.mp4 -vf "fps=24,scale=1600:-2" -c:v libwebp -quality 72 desktop/%04d.webp`
- mobile: same but `fps=12,scale=900:-2`
- trim the frame count to ≤ 120 desktop / ≤ 60 mobile if longer
- write `src/data/sequences.json`: `{ "scene-01": { "desktop": { "count", "width", "height" }, "mobile": {...} }, ... }`
- print total size per scene and warn if desktop > 9 MB per scene

`scripts/make-dummy-frames.mjs` generates numbered placeholder frames (ffmpeg testsrc + drawtext) so the scroll can be built before real assets exist.

## Verification

- After UI changes, use the Playwright MCP (if available) to open http://localhost:3000, scroll through each scene at 1440×900 and 390×844, take screenshots, and check the console for errors.
- `npm run build` must pass with no type errors.
- Before finishing a milestone, list what was done and what is left against the milestone in `docs/PRD.md` section 13.
