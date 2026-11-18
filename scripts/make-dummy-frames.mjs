#!/usr/bin/env node
/**
 * Generates numbered placeholder frames for every scene so the scroll sequence
 * can be built and tested before the real assets exist.
 *
 * Output has the same layout and sizes as `npm run frames` (scripts/extract-frames.mjs):
 *   public/sequences/scene-0X/{desktop,mobile}/0001.webp …
 *   src/data/sequences.json
 *
 * Running it again replaces all four scenes and the manifest, including real frames.
 *
 * Usage: npm run frames:dummy
 * Env:   FFMPEG_PATH  ffmpeg executable (default: "ffmpeg" on PATH)
 *        DUMMY_FONT   .ttf font file for the frame labels (default: Arial / DejaVu Sans)
 */
import { existsSync, mkdirSync, rmSync } from "node:fs";
import path from "node:path";
import {
  DESKTOP_WARN_BYTES,
  FFMPEG,
  MANIFEST_PATH,
  OUT_DIR,
  QUALITY,
  ROOT,
  VARIANTS,
  checkTool,
  fail,
  formatMB,
  frameFiles,
  run,
  sizeOf,
  writeManifest,
} from "./lib/frames.mjs";

// One tint per scene so it's obvious which scene is on screen.
const SCENES = [
  { id: "scene-01", tint: "0x8a5a3c" },
  { id: "scene-02", tint: "0x3d6a82" },
  { id: "scene-03", tint: "0x5f6e34" },
  { id: "scene-04", tint: "0x7b3f5c" },
];

const FONT_CANDIDATES = [
  process.env.DUMMY_FONT,
  "C:/Windows/Fonts/arialbd.ttf",
  "C:/Windows/Fonts/arial.ttf",
  "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
  "/Library/Fonts/Arial.ttf",
  "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
  "/usr/share/fonts/TTF/DejaVuSans-Bold.ttf",
];

function findFont() {
  const font = FONT_CANDIDATES.find((p) => p && existsSync(p));
  if (!font) fail("No font found for frame labels. Set DUMMY_FONT to a .ttf file.");
  return font;
}

/** Escape a value for use inside a single-quoted ffmpeg filter option. */
function filterValue(value) {
  return `'${value.replace(/\\/g, "/").replace(/:/g, "\\:").replace(/'/g, "")}'`;
}

function buildFilter({ sceneId, tint, variant, spec, font }) {
  const { width: w, height: h, fps, max: count } = spec;
  const fontfile = filterValue(font);
  const label = `${sceneId.toUpperCase().replace("-", " ")}  /  ${variant.toUpperCase()}  /  ${fps} FPS`;
  const barH = Math.max(4, Math.round(h * 0.012));

  const base = [
    // Moving test pattern underneath, so scrub direction is visible.
    `testsrc2=size=${w}x${h}:rate=${fps}`,
    `drawbox=x=0:y=0:w=iw:h=ih:color=${tint}@0.82:t=fill`,
    // Big zero-padded frame number (matches the file name).
    `drawtext=fontfile=${fontfile}:text='%{eif\\:n+1\\:d\\:4}':fontsize=${Math.round(h * 0.3)}` +
      `:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2`,
    `drawtext=fontfile=${fontfile}:text=${filterValue(label)}:fontsize=${Math.round(h * 0.045)}` +
      `:fontcolor=white@0.9:x=w*0.04:y=h*0.06`,
    `drawtext=fontfile=${fontfile}:text='frame %{eif\\:n+1\\:d} of ${count}':fontsize=${Math.round(h * 0.04)}` +
      `:fontcolor=white@0.8:x=w*0.04:y=h-text_h-h*0.07`,
  ].join(",");

  // Progress bar along the bottom edge: a white strip that slides in frame by frame.
  // (overlay evaluates x per frame; drawbox only evaluates once.)
  return (
    `${base}[base];` +
    `color=c=white:size=${w}x${barH}:rate=${fps}[bar];` +
    `[base][bar]overlay=x=-W+W*(n+1)/${count}:y=H-h[out0]`
  );
}

function generate({ sceneId, tint, variant, spec, font }) {
  const dir = path.join(OUT_DIR, sceneId, variant);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });

  run(
    FFMPEG,
    [
      "-hide_banner",
      "-loglevel", "error",
      "-y",
      "-f", "lavfi",
      "-i", buildFilter({ sceneId, tint, variant, spec, font }),
      "-frames:v", String(spec.max),
      "-c:v", "libwebp",
      "-quality", String(QUALITY),
      "-f", "image2",
      path.join(dir, "%04d.webp"),
    ],
    `ffmpeg ${sceneId}/${variant}`,
  );

  const files = frameFiles(dir);
  if (files.length !== spec.max) {
    fail(`${sceneId}/${variant}: expected ${spec.max} frames, got ${files.length}`);
  }
  return { count: files.length, bytes: sizeOf(dir, files) };
}

function main() {
  checkTool(FFMPEG, "ffmpeg");
  const font = findFont();
  console.log(`Generating dummy frames (font: ${font})\n`);

  const manifest = {};
  const totals = { desktop: 0, mobile: 0 };

  for (const { id, tint } of SCENES) {
    manifest[id] = {};
    const sizes = {};

    for (const [variant, spec] of Object.entries(VARIANTS)) {
      const { count, bytes } = generate({ sceneId: id, tint, variant, spec, font });
      manifest[id][variant] = { count, width: spec.width, height: spec.height };
      sizes[variant] = `${count} frames, ${formatMB(bytes)}`;
      totals[variant] += bytes;
      if (variant === "desktop" && bytes > DESKTOP_WARN_BYTES) {
        console.warn(`  ⚠ ${id} desktop is ${formatMB(bytes)} (> ${formatMB(DESKTOP_WARN_BYTES)})`);
      }
    }

    console.log(`  ${id}  desktop: ${sizes.desktop}  ·  mobile: ${sizes.mobile}`);
  }

  writeManifest(MANIFEST_PATH, manifest);

  console.log(`\nTotal  desktop: ${formatMB(totals.desktop)}  ·  mobile: ${formatMB(totals.mobile)}`);
  console.log(`Wrote ${path.relative(ROOT, MANIFEST_PATH)}`);
}

main();
