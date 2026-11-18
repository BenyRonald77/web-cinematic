/**
 * Shared bits of the frame pipeline (extract-frames.mjs, make-dummy-frames.mjs):
 * paths, frame-set specs, ffmpeg/ffprobe lookup, manifest read/write and size helpers.
 */
import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
export const RAW_DIR = path.join(ROOT, "assets", "raw");
export const OUT_DIR = path.join(ROOT, "public", "sequences");
export const MANIFEST_PATH = path.join(ROOT, "src", "data", "sequences.json");

export const QUALITY = 72;
export const DESKTOP_WARN_BYTES = 9 * 1024 * 1024;
/** PRD §10 budgets for all scenes together. */
export const BUDGET_BYTES = { desktop: 35 * 1024 * 1024, mobile: 12 * 1024 * 1024 };

/** Frame sets per CLAUDE.md "Asset pipeline". Height follows the 16:9 source (scale=W:-2). */
export const VARIANTS = {
  desktop: { width: 1600, height: 900, fps: 24, max: 120 },
  mobile: { width: 900, height: 506, fps: 12, max: 60 },
};

export const FFMPEG = process.env.FFMPEG_PATH || "ffmpeg";
// ffprobe ships next to ffmpeg; follow FFMPEG_PATH when only that is set.
export const FFPROBE =
  process.env.FFPROBE_PATH ||
  (process.env.FFMPEG_PATH
    ? path.join(path.dirname(process.env.FFMPEG_PATH), path.basename(process.env.FFMPEG_PATH).replace(/ffmpeg/i, "ffprobe"))
    : "ffprobe");

export function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

export function checkTool(bin, name) {
  const result = spawnSync(bin, ["-hide_banner", "-version"], { encoding: "utf8" });
  if (result.error || result.status !== 0) {
    fail(
      `${name} not found ("${bin}").\n` +
        "  Install ffmpeg (winget install Gyan.FFmpeg), then restart the terminal / VS Code,\n" +
        `  or point ${name === "ffprobe" ? "FFPROBE_PATH" : "FFMPEG_PATH"} to the executable.`,
    );
  }
}

/** Runs a command, exits with its stderr on failure, returns stdout. */
export function run(bin, args, what) {
  const result = spawnSync(bin, args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    fail(`${what} failed:\n${result.stderr || result.error}`);
  }
  return result.stdout;
}

export function frameFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir)
    .filter((f) => /^\d{4}\.webp$/.test(f))
    .sort();
}

export function sizeOf(dir, files = frameFiles(dir)) {
  return files.reduce((sum, f) => sum + statSync(path.join(dir, f)).size, 0);
}

export function formatMB(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

export function readManifest(file) {
  if (!existsSync(file)) return {};
  try {
    return JSON.parse(readFileSync(file, "utf8"));
  } catch {
    console.warn(`  ⚠ ${path.relative(ROOT, file)} is not valid JSON; starting a new manifest`);
    return {};
  }
}

/** Writes the manifest with scenes sorted, so diffs stay small. */
export function writeManifest(file, manifest) {
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((key) => [key, manifest[key]]));
  mkdirSync(path.dirname(file), { recursive: true });
  writeFileSync(file, `${JSON.stringify(sorted, null, 2)}\n`);
}
