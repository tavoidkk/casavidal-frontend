export function trimCanvas(canvas: HTMLCanvasElement): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  const imageData = ctx.getImageData(0, 0, w, h).data;

  let top = -1, bottom = -1, left = -1, right = -1;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const alpha = imageData[(y * w + x) * 4 + 3];
      if (alpha !== 0) {
        if (top === -1) top = y;
        bottom = y;
        if (left === -1 || x < left) left = x;
        if (right === -1 || x > right) right = x;
      }
    }
  }

  if (top === -1) {
    canvas.width = 0;
    canvas.height = 0;
    return canvas;
  }

  const newW = right - left + 1;
  const newH = bottom - top + 1;
  const cropped = ctx.getImageData(left, top, newW, newH);

  canvas.width = newW;
  canvas.height = newH;
  ctx.clearRect(0, 0, newW, newH);
  ctx.putImageData(cropped, 0, 0);

  return canvas;
}
