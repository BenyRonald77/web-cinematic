"""Measure where the connecting flow crosses each scene border and suggest offsetX per scene.

For each border N -> N+1 it finds the horizontal position (as a share of the image width) of the
flow in the bottom strip of scene N's LAST frames and in the top strip of scene N+1's FIRST frames
(a few frames are averaged, so gaps between falling beans don't matter). Then:
    offsetX[N+1] = offsetX[N] + (bottom position of N) - (top position of N+1)
with scene 01 as the reference (0). Desktop and mobile frames are measured separately as a check:
both must agree, because offsetX is a share of the drawn width (see drawCover).

With --keyframes DIR it measures the keyframes instead (s1-end bottom vs s2-start top, s2-end bottom
vs s3-start top), as an early estimate before the videos exist. Scene 04 starts on a gradient, not
a flow, so the 03 -> 04 border is not measured.

Usage:  npm run flow
        npm run flow -- --keyframes assets/keyframes/final
        python -P scripts/measure-flow.py [--root DIR] [--frames 6] [--strip 0.03] [--keyframes DIR]
Needs:  Python 3 with Pillow and numpy.
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent


def load(path):
    with Image.open(path) as im:
        return np.asarray(im.convert("RGB"), dtype=np.float64)


def flow_x(frames, top, strip):
    """Weighted horizontal centre of whatever differs from the backdrop in a thin edge strip."""
    profile = None
    for a in frames:
        h, w, _ = a.shape
        rows = max(2, round(h * strip))
        band = a[:rows] if top else a[h - rows:]
        backdrop = np.median(band.reshape(-1, 3), axis=0)
        diff = np.abs(band - backdrop).max(axis=2).mean(axis=0)  # per column
        profile = diff if profile is None else profile + diff
    profile /= len(frames)
    xs = (np.arange(len(profile)) + 0.5) / len(profile)
    weight = np.clip(profile - 12, 0, None)  # ignore noise and soft gradients
    weight[xs < 0.35] = 0  # left side is the empty text area
    if weight.sum() == 0:
        return None, 0.0, 0.0
    centre = float((xs * weight).sum() / weight.sum())
    on = xs[weight > weight.max() * 0.25]
    return centre, float(on.max() - on.min()), float(profile.max())


KEYFRAME_BORDERS = [("scene-02", "s1-end", "s2-start", "bean column"), ("scene-03", "s2-end", "s3-start", "ground coffee")]


def measure_keyframes(folder):
    """One image per side, so the strip height is varied to show how stable the reading is."""
    offset = 0.0
    print("Keyframe borders (x = share of the image width):")
    for scene, end, start, what in KEYFRAME_BORDERS:
        a, b = load(folder / f"{end}.jpg"), load(folder / f"{start}.jpg")
        readings = []
        for strip in (0.02, 0.03, 0.05):
            xa, wa, _ = flow_x([a], top=False, strip=strip)
            xb, wb, _ = flow_x([b], top=True, strip=strip)
            if xa is None or xb is None:
                sys.exit(f"{end} -> {start}: no flow found at the border")
            readings.append((strip, xa, wa, xb, wb))
        xa = float(np.median([r[1] for r in readings]))
        xb = float(np.median([r[3] for r in readings]))
        offset += xa - xb
        detail = "  ".join(f"strip {s:.0%}: {ra:.4f}/{rb:.4f}" for s, ra, _, rb, _ in readings)
        print(f"  {what}: {end} bottom x {xa:.4f} (width {readings[1][2]:.3f})  ->  {start} top x {xb:.4f} "
              f"(width {readings[1][4]:.3f})   gap {xa - xb:+.4f}   [{detail}]")
        print(f"    -> {scene} offsetX {offset:+.4f} (keyframes only; re-measure with `npm run flow` on the video frames)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", type=Path, default=ROOT, help="project root (public/sequences, src/data/sequences.json)")
    ap.add_argument("--frames", type=int, default=6, help="frames averaged at each end")
    ap.add_argument("--strip", type=float, default=0.03, help="edge strip height, share of the frame height")
    ap.add_argument("--keyframes", type=Path, default=None, help="measure keyframes s1-end … s3-start in this folder")
    args = ap.parse_args()

    if args.keyframes:
        measure_keyframes(args.keyframes)
        return

    manifest = json.loads((args.root / "src" / "data" / "sequences.json").read_text())
    scenes = sorted(manifest)
    seq = args.root / "public" / "sequences"

    results = {}
    for variant in ("desktop", "mobile"):
        offsets = {scenes[0]: 0.0}
        rows = []
        for a, b in zip(scenes, scenes[1:]):
            n_a = manifest[a][variant]["count"]
            last = [load(seq / a / variant / f"{i:04d}.webp") for i in range(max(1, n_a - args.frames + 1), n_a + 1)]
            first = [load(seq / b / variant / f"{i:04d}.webp") for i in range(1, args.frames + 1)]
            xa, wa, pa = flow_x(last, top=False, strip=args.strip)
            xb, wb, pb = flow_x(first, top=True, strip=args.strip)
            if xa is None or xb is None:
                sys.exit(f"{variant} {a}->{b}: no flow found at the border (is something leaving/entering the frame edge?)")
            offsets[b] = offsets[a] + (xa - xb)
            rows.append((a, b, xa, wa, pa, xb, wb, pb))
        results[variant] = offsets
        print(f"{variant}:")
        for a, b, xa, wa, pa, xb, wb, pb in rows:
            print(f"  {a} bottom x {xa:.4f} (width {wa:.3f}, strength {pa:.0f})  ->  {b} top x {xb:.4f} "
                  f"(width {wb:.3f}, strength {pb:.0f})   gap {xa - xb:+.4f}")
    print("\nSuggested offsetX (scene 01 = reference):")
    for s in scenes:
        d, m = results["desktop"][s], results["mobile"][s]
        flag = "" if abs(d - m) <= 0.003 else "   <- desktop and mobile disagree, check the frames"
        print(f"  {s}: offsetX {d:+.4f}   (mobile {m:+.4f}){flag}")


if __name__ == "__main__":
    main()
