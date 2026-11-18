#!/usr/bin/env node
/**
 * Turns the scene videos into scroll-sequence frames (CLAUDE.md "Asset pipeline").
 *
 *   assets/raw/scene-0X.mp4  →  public/sequences/scene-0X/{desktop,mobile}/0001.webp …
 *                            →  src/data/sequences.json
 *
 * - desktop: 24 fps, 1600 px wide, ≤ 120 frames · mobile: 12 fps, 900 px wide, ≤ 60 frames
 * - A longer clip is thinned evenly instead of cut short, and the first and last frames are
 *   always the clip's true first and last frames, so scene N still ends on the exact frame
 *   scene N+1 starts with.
 * - The manifest is merged: scenes without a video keep their current entry (e.g. dummy frames).
 * - Existing frames of a scene are only replaced once its new frames are extracted.
 * - scripts/frames.config.json can trim a clip: { "trim": { "scene-02": { "start": 0, "end": 7.708 } } }
 *   (seconds; end is exclusive). Use it when a generated clip glitches at its ends.
 *
 * Usage: npm run frames                  every assets/raw/scene-XX video
 *        npm run frames -- scene-01      only the given scene(s)
 *        options: --src <dir> --out <dir> --manifest <file>   (defaults above)
 * Env:   FFMPEG_PATH, FFPROBE_PATH
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync } from "node:fs";
import path from "node:path";
import {
  BUDGET_BYTES,
  DESKTOP_WARN_BYTES,
  FFMPEG,
  FFPROBE,
  MANIFEST_PATH,
  OUT_DIR,
  QUALITY,
  RAW_DIR,
  ROOT,
  VARIANTS,
  checkTool,
  fail,
  formatMB,
  frameFiles,
  readManifest,
  run,
  sizeOf,
  writeManifest,
} from "./lib/frames.mjs";

const VIDEO_RE = /^(scene-\d{2})\.(mp4|mov|webm|mkv)$/i;
const CONFIG_PATH = path.join(ROOT, "scripts", "frames.config.json");
const rel = (p) => path.relative(ROOT, p) || ".";
const pad = (n) => `${String(n).padStart(4, "0")}.webp`;
const sec = (s) => s.toFixed(3);

function readConfig() {
  if (!existsSync(CONFIG_PATH)) return {};
  try {
    return JSON.parse(readFileSync(CONFIG_PATH, "utf8"));
  } catch (error) {
    fail(`${rel(CONFIG_PATH)} is not valid JSON: ${error.message}`);
  }
}

/** Part of the clip to use, in seconds (end exclusive), from the optional trim config. */
function clipRange(scene, info, config) {
  const trim = config.trim?.[scene] ?? {};
  const start = Math.max(0, Number(trim.start ?? 0));
  const end = Math.min(info.duration, Number(trim.end ?? info.duration));
  if (!(end > start)) fail(`${scene}: trim end (${end}) must be after start (${start})`);
  return { start, end, trimmed: start > 0 || end < info.duration };
}

function parseArgs(argv) {
  const opts = { src: RAW_DIR, out: OUT_DIR, manifest: MANIFEST_PATH, scenes: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--src" || arg === "--out" || arg === "--manifest") {
      const value = argv[++i];
      if (!value) fail(`${arg} needs a value`);
      opts[arg.slice(2)] = path.resolve(value);
    } else if (/^scene-\d{2}$/.test(arg)) {
      opts.scenes.push(arg);
    } else {
      fail(`Unknown argument "${arg}".\n  Usage: npm run frames [-- scene-01 …] [--src dir] [--out dir] [--manifest file]`);
    }
  }
  return opts;
}

/** One video per scene; .mp4 wins if a scene has several. */
function findVideos(src, only) {
  if (!existsSync(src)) fail(`Source folder not found: ${src}`);
  const byScene = new Map();
  for (const file of readdirSync(src)) {
    const match = file.match(VIDEO_RE);
    if (!match) continue;
    const scene = match[1].toLowerCase();
    const current = byScene.get(scene);
    if (!current || (/\.mp4$/i.test(file) && !/\.mp4$/i.test(current))) byScene.set(scene, file);
  }
  for (const scene of only) {
    if (!byScene.has(scene)) fail(`No video for ${scene} in ${rel(src)}`);
  }
  return [...byScene.entries()]
    .filter(([scene]) => only.length === 0 || only.includes(scene))
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([scene, file]) => ({ scene, file: path.join(src, file) }));
}

function probeVideo(file) {
  const json = JSON.parse(
    run(
      FFPROBE,
      ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height,r_frame_rate:format=duration", "-of", "json", file],
      `ffprobe ${path.basename(file)}`,
    ),
  );
  const stream = json.streams?.[0];
  if (!stream) fail(`${path.basename(file)}: no video stream`);
  const [num, den] = String(stream.r_frame_rate).split("/").map(Number);
  return {
    width: stream.width,
    height: stream.height,
    fps: den ? num / den : num,
    duration: Number(json.format?.duration ?? 0),
  };
}

function probeImage(file) {
  const json = JSON.parse(
    run(FFPROBE, ["-v", "error", "-show_entries", "stream=width,height", "-of", "json", file], `ffprobe ${path.basename(file)}`),
  );
  return { width: json.streams[0].width, height: json.streams[0].height };
}

/** `keep` evenly spaced indices out of `total`, always including the first and the last. */
function evenly(total, keep) {
  return Array.from({ length: keep }, (_, i) => Math.round((i * (total - 1)) / (keep - 1)));
}

function extractVariant(file, sceneDir, variant, spec, { start, end }) {
  const dir = path.join(sceneDir, variant);
  const tmp = path.join(sceneDir, `.tmp-${variant}`);
  const scale = `scale=${spec.width}:-2:flags=lanczos`;
  const webp = ["-c:v", "libwebp", "-quality", String(QUALITY)];
  const quiet = ["-hide_banner", "-loglevel", "error", "-y"];
  // Input seeking (-ss before -i) is frame-accurate when decoding; -t limits the output duration.
  const tailStart = Math.max(start, end - 0.5);
  rmSync(tmp, { recursive: true, force: true });
  mkdirSync(tmp, { recursive: true });

  try {
    run(
      FFMPEG,
      [...quiet, "-ss", sec(start), "-i", file, "-t", sec(end - start), "-an", "-vf", `fps=${spec.fps},${scale}`, ...webp, "-f", "image2", path.join(tmp, "%04d.webp")],
      `ffmpeg ${path.basename(file)} → ${variant}`,
    );
    // The clip's true first and last frames: these are the cut points shared with the previous
    // and next scene, and fps sampling can land a source frame or two away from them.
    const first = path.join(tmp, "first.webp");
    const last = path.join(tmp, "last.webp");
    run(
      FFMPEG,
      [...quiet, "-ss", sec(start), "-i", file, "-an", "-vf", scale, "-frames:v", "1", ...webp, "-f", "image2", first],
      `ffmpeg ${path.basename(file)} → first frame`,
    );
    run(
      FFMPEG,
      [...quiet, "-ss", sec(tailStart), "-i", file, "-t", sec(end - tailStart), "-an", "-vf", scale, ...webp, "-update", "1", "-f", "image2", last],
      `ffmpeg ${path.basename(file)} → last frame`,
    );

    const files = frameFiles(tmp);
    if (files.length < 2) fail(`${path.basename(file)}: only ${files.length} frame(s) extracted for ${variant}`);
    const keep = files.length > spec.max ? evenly(files.length, spec.max) : files.map((_, i) => i);

    // Swap in the new frames only now, so a failed run never leaves a scene half-written.
    rmSync(dir, { recursive: true, force: true });
    mkdirSync(dir, { recursive: true });
    keep.forEach((from, i) => renameSync(path.join(tmp, files[from]), path.join(dir, pad(i + 1))));
    if (existsSync(first)) renameSync(first, path.join(dir, pad(1)));
    if (existsSync(last)) renameSync(last, path.join(dir, pad(keep.length)));

    const { width, height } = probeImage(path.join(dir, pad(1)));
    return { count: keep.length, width, height, extracted: files.length, bytes: sizeOf(dir) };
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  checkTool(FFMPEG, "ffmpeg");
  checkTool(FFPROBE, "ffprobe");

  const videos = findVideos(opts.src, opts.scenes);
  if (videos.length === 0) {
    fail(`No scene videos in ${rel(opts.src)} (expected scene-01.mp4, scene-02.mp4, …).`);
  }

  const config = readConfig();
  const manifest = readManifest(opts.manifest);
  const processed = new Set();
  console.log(`Extracting ${videos.length} scene(s) from ${rel(opts.src)} → ${rel(opts.out)}\n`);

  for (const { scene, file } of videos) {
    const info = probeVideo(file);
    console.log(
      `${scene}  ${path.basename(file)}  ${info.width}×${info.height}  ${info.fps.toFixed(2)} fps  ${info.duration.toFixed(2)} s`,
    );
    if (Math.abs(info.width / info.height - 16 / 9) > 0.01) {
      console.warn(`  ⚠ not 16:9; frames keep the source ratio (the manifest records the real size)`);
    }
    if (info.width < VARIANTS.desktop.width) {
      console.warn(`  ⚠ ${info.width} px wide: desktop frames are upscaled to ${VARIANTS.desktop.width} px (a 1080p source looks sharper)`);
    }

    const range = clipRange(scene, info, config);
    if (range.trimmed) {
      const frame = (t) => Math.round(t * info.fps);
      console.log(
        `  trimmed to ${range.start.toFixed(2)}–${range.end.toFixed(2)} s (source frames #${frame(range.start)}–#${frame(range.end) - 1}, ${rel(CONFIG_PATH)})`,
      );
    }

    const entry = {};
    for (const [variant, spec] of Object.entries(VARIANTS)) {
      const result = extractVariant(file, path.join(opts.out, scene), variant, spec, range);
      entry[variant] = { count: result.count, width: result.width, height: result.height };
      const thinned = result.extracted > result.count ? `  (thinned from ${result.extracted})` : "";
      console.log(
        `  ${variant.padEnd(7)} ${String(result.count).padStart(3)} frames  ${result.width}×${result.height}  ${formatMB(result.bytes)}${thinned}`,
      );
      if (variant === "desktop" && result.bytes > DESKTOP_WARN_BYTES) {
        console.warn(`  ⚠ desktop is ${formatMB(result.bytes)} (> ${formatMB(DESKTOP_WARN_BYTES)} per scene)`);
      }
    }
    manifest[scene] = entry;
    processed.add(scene);
  }

  // Scenes without a video keep their entry; make sure their frames are still on disk.
  const totals = { desktop: 0, mobile: 0 };
  const kept = [];
  for (const [scene, entry] of Object.entries(manifest)) {
    for (const variant of Object.keys(VARIANTS)) {
      const dir = path.join(opts.out, scene, variant);
      const files = frameFiles(dir);
      totals[variant] += sizeOf(dir, files);
      if (!processed.has(scene) && files.length !== entry[variant]?.count) {
        console.warn(`  ⚠ ${scene}/${variant}: manifest says ${entry[variant]?.count ?? 0} frames, ${files.length} on disk`);
      }
    }
    if (!processed.has(scene)) kept.push(scene);
  }

  writeManifest(opts.manifest, manifest);

  console.log(`\nWrote ${rel(opts.manifest)}${kept.length ? ` (kept as is: ${kept.join(", ")})` : ""}`);
  for (const variant of Object.keys(VARIANTS)) {
    const over = totals[variant] > BUDGET_BYTES[variant] ? "  ⚠ over budget" : "";
    console.log(`Total ${variant.padEnd(7)} ${formatMB(totals[variant])} of ${formatMB(BUDGET_BYTES[variant])} budget${over}`);
  }
}

main();
