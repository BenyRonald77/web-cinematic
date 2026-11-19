"""Measure where the connecting flow crosses each scene border and suggest offsetX per scene.

For each border N -> N+1 it finds the horizontal position (as a share of the image width) of the
flow in the bottom strip of scene N's LAST frame and in the top strip of scene N+1's FIRST frame:
exactly the two frames the page shows while that border crosses the screen. Gaps between falling
beans move the reading a little with the strip height, so several heights are measured and the
median gap is used (--frames N averages the last/first N desktop frames instead). Then:
    offsetX[N+1] = offsetX[N] + (bottom position of N) - (top position of N+1)
with scene 01 as the reference (0). Desktop and mobile frames are measured separately as a check:
both must agree, because offsetX is a share of the drawn width (see drawCover).

With --keyframes DIR it measures the keyframes instead (s1-end bottom vs s2-start top, s2-end bottom
vs s3-start top), as an early estimate before the videos exist. Scene 04 starts on a gradient, not
a flow, so the 03 -> 04 border is not measured; in frames mode scene 04 gets scene 03's offset
(--gradient names the scenes whose top border is a gradient).

Usage:  npm run flow
        npm run flow -- --keyframes assets/keyframes/final
        python -P scripts/measure-flow.py [--root DIR] [--frames 1] [--strips 0.02 0.03 0.05 0.08] [--keyframes DIR] [--gradient scene-04]
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


def lightness(rgb):
    """CIE L* of an sRGB colour (0 = black, 100 = white)."""
    c = np.asarray(rgb) / 255
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    y = 0.2126 * lin[0] + 0.7152 * lin[1] + 0.0722 * lin[2]
    return 116 * np.cbrt(y) - 16 if y > 216 / 24389 else 24389 / 27 * y


def column_stats(a, top, strip=0.05):
    """Centre, the span holding 80 % of the flow, how densely that span is filled, and the
    lightness of the flow itself, in the edge strip. Robust to a few stray beans."""
    h, w, _ = a.shape
    rows = max(2, round(h * strip))
    band = a[:rows] if top else a[h - rows:]
    backdrop = np.median(band.reshape(-1, 3), axis=0)
    diff = np.abs(band - backdrop).max(axis=2)
    present = diff > 40
    present[:, : int(w * 0.35)] = False
    col = present.mean(axis=0)
    xs = (np.arange(w) + 0.5) / w
    cdf = np.cumsum(col) / col.sum()
    at = lambda q: float(xs[min(len(xs) - 1, np.searchsorted(cdf, q))])
    p10, p90, p5, p95 = at(0.10), at(0.90), at(0.05), at(0.95)
    centre = float((xs * col).sum() / col.sum())
    span = present[:, int(p5 * w):int(p95 * w) + 1]
    solid = diff > 60
    solid[:, : int(w * 0.35)] = False
    return {
        "centre": centre,
        "from": p10,
        "to": p90,
        "width": p90 - p10,
        "density": float(span.mean()),
        "lightness": float(lightness(np.median(band[solid], axis=0))) if solid.any() else float("nan"),
    }


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
        for label, img, top in ((f"{end} bottom", a, False), (f"{start} top", b, True)):
            s = column_stats(img, top)
            print(f"    {label:16s} centre {s['centre']:.3f}   80% within {s['from']:.3f}-{s['to']:.3f} "
                  f"(width {s['width']:.3f})   density {s['density']:.0%}   lightness L* {s['lightness']:.0f}")
        print(f"    -> {scene} offsetX {offset:+.4f} (keyframes only; re-measure with `npm run flow` on the video frames)")


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--root", type=Path, default=ROOT, help="project root (public/sequences, src/data/sequences.json)")
    ap.add_argument("--frames", type=int, default=1,
                    help="desktop frames averaged at each end (mobile: the same stretch of time); 1 = the cut frames only")
    ap.add_argument("--strips", type=float, nargs="+", default=[0.02, 0.03, 0.05, 0.08],
                    help="edge strip heights, share of the frame height (the median gap is used)")
    ap.add_argument("--keyframes", type=Path, default=None, help="measure keyframes s1-end … s3-start in this folder")
    ap.add_argument("--gradient", nargs="*", default=["scene-04"],
                    help="scenes whose top border is a plain gradient: not measured, they keep the offset of the scene above")
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
            if b in args.gradient:
                offsets[b] = offsets[a]
                rows.append((a, b, None, 0, 0, None, 0, 0, [], 0.0))
                continue
            n_a = manifest[a][variant]["count"]
            # Same stretch of time in both sets (mobile has fewer frames per second), so something
            # entering the frame a moment later doesn't skew only one of them.
            k_a = max(1, round(args.frames * n_a / manifest[a]["desktop"]["count"]))
            k_b = max(1, round(args.frames * manifest[b][variant]["count"] / manifest[b]["desktop"]["count"]))
            last = [load(seq / a / variant / f"{i:04d}.webp") for i in range(max(1, n_a - k_a + 1), n_a + 1)]
            first = [load(seq / b / variant / f"{i:04d}.webp") for i in range(1, k_b + 1)]
            readings = []
            for strip in args.strips:
                xa, wa, pa = flow_x(last, top=False, strip=strip)
                xb, wb, pb = flow_x(first, top=True, strip=strip)
                if xa is None or xb is None:
                    sys.exit(f"{variant} {a}->{b}: no flow found at the border (is something leaving/entering the frame edge?)")
                readings.append((xa, wa, pa, xb, wb, pb))
            gaps = [r[0] - r[3] for r in readings]
            gap = float(np.median(gaps))
            mid = min(readings, key=lambda r: abs(r[0] - r[3] - gap))  # the reading shown in the log
            offsets[b] = offsets[a] + gap
            rows.append((a, b, *mid, gaps, gap))
        results[variant] = offsets
        print(f"{variant}:")
        for a, b, xa, wa, pa, xb, wb, pb, gaps, gap in rows:
            if xa is None:
                print(f"  {a} -> {b}: gradient border, not measured ({b} keeps {a}'s offset)")
                continue
            print(f"  {a} bottom x {xa:.4f} (width {wa:.3f}, strength {pa:.0f})  ->  {b} top x {xb:.4f} "
                  f"(width {wb:.3f}, strength {pb:.0f})")
            spread = "  ".join(f"{st:.0%} {g:+.4f}" for st, g in zip(args.strips, gaps))
            print(f"      gap per strip height: {spread}   median {gap:+.4f}")
    print("\nSuggested offsetX (scene 01 = reference):")
    for s in scenes:
        d, m = results["desktop"][s], results["mobile"][s]
        flag = "" if abs(d - m) <= 0.003 else "   <- desktop and mobile disagree, check the frames"
        print(f"  {s}: offsetX {d:+.4f}   (mobile {m:+.4f}){flag}")


if __name__ == "__main__":
    main()
