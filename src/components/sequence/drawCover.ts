/**
 * Draws `img` so it covers the whole canvas (like CSS `object-fit: cover`).
 *
 * `focusX` (0–1) picks the horizontal crop the same way CSS `object-position: X% 50%` does:
 * 0 keeps the left edge, 1 keeps the right edge. Using the same rule as the poster <img>
 * means the canvas lands on exactly the same pixels when it takes over from the poster.
 */
export function drawCover(ctx: CanvasRenderingContext2D, img: HTMLImageElement, focusX = 0.5) {
  const { width: cw, height: ch } = ctx.canvas;
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!cw || !ch || !iw || !ih) return;

  const scale = Math.max(cw / iw, ch / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const fx = Math.min(Math.max(focusX, 0), 1);

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(img, (cw - dw) * fx, (ch - dh) / 2, dw, dh);
}
