/**
 * Localised eye-white retouch.
 *
 *   node assets/brand/retouch-eyes.mjs <src> <out> <strength>
 *
 * Standard portrait retouching: takes the yellow cast out of the sclera and lifts it
 * slightly, without touching the iris, lashes or skin.
 *
 * How it stays honest-looking:
 *  - The adjustment is confined to two hand-placed ellipses over the eye openings, with
 *    a smooth radial falloff, so there is never a visible edge.
 *  - Inside each ellipse a per-pixel test decides how sclera-like the pixel is: it must
 *    be bright enough not to be iris, pupil or lash, and warm/low-saturation enough to
 *    be a yellowed white. Everything else is left exactly as it was.
 *  - Saturation is reduced rather than zeroed and lightness is lifted a little, so the
 *    eye keeps its own shading, veins and catchlights. Pushing to pure white is what
 *    makes retouching look pasted on.
 *
 * Coordinates are given in the 1344x752 hero-crop space and scaled to the source, so
 * they can be read straight off a magnified view of the shipped image.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { chromium } from 'playwright';

const [, , SRC, OUT, STRENGTH = '1'] = process.argv;
if (!SRC || !OUT || !existsSync(SRC)) {
  console.error('usage: node assets/brand/retouch-eyes.mjs <src> <out> [strength]');
  process.exit(1);
}

/** Eye ellipses, measured off the 1344x752 hero crop. */
const HERO_W = 1344;
const EYES = [
  { cx: 478, cy: 432, rx: 30, ry: 21 }, // his right eye (viewer left)
  { cx: 643, cy: 452, rx: 34, ry: 22 }, // his left eye (viewer right)
];

const dataUri = `data:image/jpeg;base64,${readFileSync(SRC).toString('base64')}`;

const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
});
const page = await browser.newPage();

const out = await page.evaluate(
  async ([uri, eyes, heroW, strength]) => {
    const img = new Image();
    img.src = uri;
    await img.decode();

    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const scale = W / heroW; // hero-crop space -> source space

    const canvas = document.createElement('canvas');
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);

    let touched = 0;

    for (const e of eyes) {
      const cx = e.cx * scale;
      const cy = e.cy * scale;
      const rx = e.rx * scale;
      const ry = e.ry * scale;

      const x0 = Math.max(0, Math.floor(cx - rx));
      const y0 = Math.max(0, Math.floor(cy - ry));
      const w = Math.min(W - x0, Math.ceil(rx * 2));
      const h = Math.min(H - y0, Math.ceil(ry * 2));
      if (w <= 0 || h <= 0) continue;

      const imgData = ctx.getImageData(x0, y0, w, h);
      const d = imgData.data;

      /* Pass 1 — find how bright the sclera actually is in THIS eye.
         A fixed brightness cut-off cannot separate sclera from the surrounding skin:
         lit brown skin and a yellowed white overlap heavily, so any threshold loose
         enough to catch the sclera also bleaches the eyelid. Taking a high percentile
         of the brightness inside the ellipse adapts to the exposure of each eye and
         leaves the skin below the line. */
      const vs = [];
      for (let py = 0; py < h; py += 1) {
        for (let px = 0; px < w; px += 1) {
          const nx = (x0 + px - cx) / rx;
          const ny = (y0 + py - cy) / ry;
          if (nx * nx + ny * ny > 1) continue;
          const i = (py * w + px) * 4;
          vs.push(Math.max(d[i], d[i + 1], d[i + 2]) / 255);
        }
      }
      if (!vs.length) continue;
      vs.sort((a, b2) => a - b2);
      const cut = vs[Math.floor(vs.length * 0.70)];

      // Pass 2 — apply.
      for (let py = 0; py < h; py += 1) {
        for (let px = 0; px < w; px += 1) {
          const i = (py * w + px) * 4;

          const nx = (x0 + px - cx) / rx;
          const ny = (y0 + py - cy) / ry;
          const dist = Math.sqrt(nx * nx + ny * ny);
          if (dist > 1) continue;

          const feather = Math.min(1, (1 - dist) / 0.40);

          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];

          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const v = max / 255;
          const sat = max === 0 ? 0 : (max - min) / max;

          // Above the adaptive cut and warm-cast: that is the yellowed white.
          const bright = Math.min(1, Math.max(0, (v - cut) / 0.10));
          const desat = Math.min(1, Math.max(0, (0.72 - sat) / 0.30));
          const warm = r >= b ? 1 : 0.2; // leave blue catchlights alone

          const k = feather * bright * desat * warm * strength;
          if (k <= 0.002) continue;

          // Target a genuinely brighter neutral, not just this pixel's own luminance —
          // matching the pixel's own (low) luminance is why a gentle version still
          // reads yellow.
          const lum = 0.299 * r + 0.587 * g + 0.114 * b;
          const lifted = Math.min(238, lum * 1.16 + 26);

          d[i] = r + (lifted - r) * k * 0.92;
          d[i + 1] = g + (lifted - g) * k * 0.92;
          d[i + 2] = b + (lifted - b) * k * 0.92;
          touched += 1;
        }
      }
      ctx.putImageData(imgData, x0, y0);
    }

    return { dataUrl: canvas.toDataURL('image/jpeg', 0.94), W, H, touched };
  },
  [dataUri, EYES, HERO_W, Number(STRENGTH)]
);

await browser.close();

writeFileSync(OUT, Buffer.from(out.dataUrl.split(',')[1], 'base64'));
console.log(
  `retouched ${out.W}x${out.H}, ${out.touched.toLocaleString()} px adjusted, ` +
    `strength ${STRENGTH} -> ${OUT} (${Math.round(readFileSync(OUT).length / 1024)}KB)`
);
