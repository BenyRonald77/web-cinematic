/**
 * Draws `img` so it covers the whole canvas (like CSS `object-fit: cover`).
 *
 * `focusX` (0–1) picks the horizontal crop the same way CSS `object-position: X% 50%` does:
 * 0 keeps the left edge, 1 keeps the right edge. Using the same rule as the poster <img>
 * means the canvas lands on the same pixels when it takes over from the poster.
 *
 * `offsetX` shifts the image sideways by a share of its drawn width, to line up the flow that
 * crosses into the next scene. With the same focusX in every scene, a point at image fraction s
 * lands at (cw - dw) * focusX + (s + offsetX) * dw, so equal `s + offsetX` means aligned on any
 * screen. `offsetRange` (smallest and largest offsetX of all scenes) makes every scene grow by the
 * same amount when a shift would expose an edge, so their drawn widths stay identical.
 */
export function drawCover(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  focusX = 0.5,
  offsetX = 0,
  offsetRange: readonly [number, number] = [offsetX, offsetX],
) {
  const { width: cw, height: ch } = ctx.canvas;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!cw || !ch || !iw || !ih) return;

  const fx = Math.min(Math.max(focusX, 0), 1);
  let scale = Math.max(cw / iw, ch / ih);
  // Keep dx <= 0 and dx + dw >= cw for every offset in the range (dx = (cw - dw) * fx + o * dw).
  for (const o of offsetRange) {
    if (fx - o > 0) scale = Math.max(scale, (cw * fx) / ((fx - o) * iw));
    if (1 - fx + o > 0) scale = Math.max(scale, (cw * (1 - fx)) / ((1 - fx + o) * iw));
  }
  const dw = iw * scale;
  const dh = ih * scale;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (cw - dw) * fx + offsetX * dw, (ch - dh) / 2, dw, dh);
}
