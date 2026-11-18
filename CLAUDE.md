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
npm run dev           # dev server at http://localhost:3000
npm run dev:lan       # dev server on 0.0.0.0, to test on a phone: http://<laptop LAN IP>:3000
npm run build         # production build, must pass before a milestone is done
npm run lint
npm run frames        # node scripts/extract-frames.mjs → frames + src/data/sequences.json
npm run frames:dummy  # numbered placeholder frames for all 4 scenes (overwrites real frames)
```

`dev:lan`: `allowedDevOrigins` in `next.config.ts` lists this machine's LAN IPv4 addresses when the server starts, so restart it if the IP changes. Give the phone the IP of the adapter that is actually connected (check `Get-NetAdapter`; a disconnected Wi-Fi adapter can still show an old address). The phone must be on the same network, not a guest network with client isolation.

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
  lib/frames.mjs          shared paths, frame-set specs, ffmpeg/ffprobe + manifest helpers
assets/raw/               source videos scene-01.mp4 … (gitignored)
assets/keyframes/         Nano Banana images (gitignored)
public/sequences/scene-0X/{desktop,mobile}/0001.webp
docs/                     PRD.md, ASSET-PROMPTS.md
```

## How the cinematic scenes work

- Each scene is a full-screen section (`h-lvh`, **not pinned**) with a `<canvas>` and a text overlay. The page keeps scrolling while the film plays: frame progress runs from the section entering at the bottom (`clamp(top bottom)`) to leaving at the top (`bottom top`), so two scenes can be on screen at once during a transition.
- Scenes 02–04 overlap the previous scene by 14lvh and fade their top edge in over it (`blendTop`), so stacked scenes meet in a soft gradient, not a seam; the last scene fades its bottom into the page (`fadeBottom`). The page background (`--color-cream`) equals the video backdrop.
- Scroll progress → frame index. Draw only when the index changes (requestAnimationFrame).
- `drawCover(ctx, img, focusX)`: cover-fit the image on the canvas; `focusX` (0–1) picks the horizontal crop point so the subject stays visible on portrait screens.
- Canvas size = CSS size × `Math.min(devicePixelRatio, 2)`. Re-size and `ScrollTrigger.refresh()` on resize/orientation change.
- Pick `desktop` or `mobile` frame set once on load based on viewport width (< 768px → mobile).
- Preload: scene 01 first (first 20 frames with priority), other scenes when within ~1 viewport of entering. Show frame 1 as poster until loaded. Never draw an image that is not `complete`; fall back to the nearest loaded frame.
- Text scrolls with its section. Scene 01's text is visible at first paint (server-split words, CSS keyframes intro, see `IntroWords`). Scenes 02–04: SplitText by lines/words, `yPercent` + `opacity` reveal while the section enters, driven by the same ScrollTrigger progress; no exit animation.
- Phones: the centred subject fills the screen height, so text sits at the bottom over a backdrop-coloured scrim (`[data-scrim]`, fades in with the text) plus a soft text halo.
- `prefers-reduced-motion: reduce` → no scrub; show the last frame of each scene as a static image with plain text.
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

For each `assets/raw/scene-0X` video (`.mp4` preferred; `.mov`, `.webm`, `.mkv` also read):
- desktop: `-vf "fps=24,scale=1600:-2:flags=lanczos" -c:v libwebp -quality 72` → `public/sequences/scene-0X/desktop/0001.webp …`
- mobile: same with `fps=12,scale=900:-2`
- More than 120 desktop / 60 mobile frames: thin evenly across the whole clip. Never cut the end off.
- Frame `0001` and the last frame are always the clip's true first and last frames (extracted separately): they are the cut points shared with the previous and next scene (PRD §6).
- A scene's old frames are only replaced once its new frames are extracted.
- `src/data/sequences.json` is merged, not rewritten: `{ "scene-01": { "desktop": { "count", "width", "height" }, "mobile": {...} }, ... }`. Width and height are read from the output frames. Scenes without a video keep their entry (e.g. dummy frames); it warns if their frames are missing on disk.
- Prints size per scene and totals against the PRD §10 budget (desktop ≤ 35 MB, mobile ≤ 12 MB). Warns if desktop > 9 MB per scene, if the source is not 16:9, or if it is narrower than 1600 px (upscaled; prefer 1080p).
- `scripts/frames.config.json` can trim a clip (`{ "trim": { "scene-02": { "start": 0, "end": 7.708 } } }`, seconds, end exclusive), e.g. when a generated clip glitches at its ends.
- `npm run frames -- scene-01` processes only the given scene(s). `--src`, `--out`, `--manifest` override the folders (useful for tests outside the repo).
- ffmpeg and ffprobe come from PATH, or from `FFMPEG_PATH` / `FFPROBE_PATH`.

`scripts/make-dummy-frames.mjs` (`npm run frames:dummy`) generates numbered placeholder frames for all four scenes (ffmpeg testsrc2 + drawtext, same sizes as the real pipeline) and rewrites the manifest, so the scroll can be built before real assets exist. It overwrites real frames.

While only dummy frames exist, `public/sequences/` is gitignored. Remove that line from `.gitignore` once the real videos are in and their frames get committed (milestone 4).

## Verification

- After UI changes, use the Playwright MCP (if available) to open http://localhost:3000, scroll through each scene at 1440×900 and 390×844, take screenshots, and check the console for errors.
- `npm run build` must pass with no type errors.
- Before finishing a milestone, list what was done and what is left against the milestone in `docs/PRD.md` section 13.
