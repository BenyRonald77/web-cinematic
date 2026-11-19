"""Match the backdrop colour of the keyframes before they go into Flow.

Reads assets/keyframes/s1-start … s4-end (.jpg/.jpeg/.png), samples the empty left side of each,
takes the mean as the target, and writes assets/keyframes/final/:
  - keyframes already within --threshold dE of the target are copied byte for byte,
  - the others get one global gain per RGB channel (nothing moves, nothing else changes) and are
    saved as JPEG quality 95, 4:4:4.
Originals are never touched. Decoding uses Pillow (libjpeg-turbo, like browsers), so the numbers
are the colours people see.

Usage:  npm run keyframes
        python -P scripts/match-keyframes.py [--src DIR] [--out DIR] [--threshold 0.5] [--ref s1-start,s2-start]
Needs:  Python 3 with Pillow and numpy.
"""
import argparse
import shutil
import sys
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
NAMES = [f"s{n}-{part}" for n in range(1, 5) for part in ("start", "end")]
EXTS = (".jpg", ".jpeg", ".png")
LEFT = (0.03, 0.05, 0.40, 0.95)  # empty side for text: x 3-40 %, y 5-95 %


def load(path):
    with Image.open(path) as im:
        return np.asarray(im.convert("RGB"), dtype=np.float64)


def region(a, box):
    h, w, _ = a.shape
    return a[round(h * box[1]):round(h * box[3]), round(w * box[0]):round(w * box[2])].reshape(-1, 3).mean(axis=0)


def lab(c):
    c = np.asarray(c) / 255
    lin = np.where(c <= 0.04045, c / 12.92, ((c + 0.055) / 1.055) ** 2.4)
    m = np.array([[0.4124, 0.3576, 0.1805], [0.2126, 0.7152, 0.0722], [0.0193, 0.1192, 0.9505]])
    x, y, z = m @ lin / np.array([0.95047, 1.0, 1.08883])
    f = lambda t: np.cbrt(t) if t > 216 / 24389 else (24389 / 27 * t + 16) / 116
    return np.array([116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))])


def delta_e(a, b):
    return float(np.linalg.norm(lab(a) - lab(b)))


def hexc(c):
    return "#" + "".join(f"{int(round(v)):02X}" for v in c)


def find(src, name):
    for ext in EXTS:
        p = src / f"{name}{ext}"
        if p.exists():
            return p
    return None


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--src", type=Path, default=ROOT / "assets" / "keyframes")
    ap.add_argument("--out", type=Path, default=None, help="default: <src>/final")
    ap.add_argument("--threshold", type=float, default=0.5, help="dE at or below which a keyframe is copied as is")
    ap.add_argument("--ref", default="", help="comma-separated names that define the target (default: all)")
    args = ap.parse_args()
    out = args.out or args.src / "final"

    files = {n: find(args.src, n) for n in NAMES}
    missing = [n for n, p in files.items() if p is None]
    files = {n: p for n, p in files.items() if p is not None}
    if not files:
        sys.exit(f"No keyframes found in {args.src} (expected {NAMES[0]}.jpg … {NAMES[-1]}.jpg).")
    if missing:
        print(f"Missing (skipped): {', '.join(missing)}\n")

    imgs = {n: load(p) for n, p in files.items()}
    left = {n: region(a, LEFT) for n, a in imgs.items()}
    refs = [r.strip() for r in args.ref.split(",") if r.strip()] or list(files)
    unknown = [r for r in refs if r not in left]
    if unknown:
        sys.exit(f"--ref names not found: {', '.join(unknown)}")
    target = np.mean([left[r] for r in refs], axis=0)
    print(f"Target backdrop (mean of {', '.join(refs)}): {hexc(target)} rgb({', '.join(f'{v:.1f}' for v in target)})\n")

    out.mkdir(parents=True, exist_ok=True)
    print(f"{'file':10s} {'before':8s} {'dE':>5s}   {'after':8s} {'dE':>5s}   action")
    for name, path in files.items():
        before = left[name]
        d_before = delta_e(before, target)
        h, w, _ = imgs[name].shape
        ratio = f"{w}x{h}" + ("" if abs(w / h - 16 / 9) <= 0.01 else f" (not 16:9: {w / h:.4f})")
        if d_before <= args.threshold:
            shutil.copy2(path, out / path.name)
            print(f"{name:10s} {hexc(before)} {d_before:5.2f}   {'-':8s} {'':>5s}   copied        {ratio}")
            continue
        gains = target / before
        corrected = np.clip(np.rint(imgs[name] * gains), 0, 255).astype(np.uint8)
        dst = out / f"{name}.jpg"
        Image.fromarray(corrected).save(dst, "JPEG", quality=95, subsampling=0, optimize=True)
        after = region(load(dst), LEFT)
        gain_txt = " ".join(f"{g:.3f}" for g in gains)
        print(f"{name:10s} {hexc(before)} {d_before:5.2f}   {hexc(after)} {delta_e(after, target):5.2f}   "
              f"corrected (gain RGB {gain_txt})  {ratio}")
    print(f"\nWrote {out}")


if __name__ == "__main__":
    main()
