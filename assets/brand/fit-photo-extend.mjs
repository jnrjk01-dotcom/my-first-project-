/**
 * Fit a whole photo into a taller box by extending its plain edges.
 *
 *   node assets/brand/fit-photo-extend.mjs <src> <out> [WxH] [quality]
 *
 * fit-photo.mjs cover-crops, which is right for most photographs: losing the edges of a
 * clinical close-up costs nothing. It is wrong for a photograph whose subject spans the
 * full frame. The clinic signage is the case in point — the sign runs nearly edge to
 * edge, so every crop to the 1.17:1 panel on the home page cuts the tooth mark off one
 * side and the lettering off the other.
 *
 * This script instead scales the source to fit the box's WIDTH, centres it, and fills
 * the bands above and below by stretching the source's own outermost row of pixels.
 * The signage sits on a plain wall, so clamping that edge extends the wall and invents
 * nothing; the sign itself is untouched and complete.
 *
 * IT REFUSES WHEN THAT IS NOT TRUE. Before writing anything it measures the colour
 * variation along the top and bottom rows. If either carries real detail, stretching it
 * would smear that detail into an obvious band, so the script reports the measurement
 * and exits rather than producing a quietly ugly image.
 *
 * Chromium does the work because this environment has no ImageMagick, librsvg or PIL.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { extname } from 'node:path';
import { chromium } from 'playwright';

const [, , SRC, OUT, SIZE = '1440x1231', Q = '0.82'] = process.argv;

if (!SRC || !OUT) {
  console.error('usage: node assets/brand/fit-photo-extend.mjs <src> <out> [WxH] [quality]');
  process.exit(1);
}
if (!existsSync(SRC)) {
  console.error(`source not found: ${SRC}`);
  process.exit(1);
}

const [TW, TH] = SIZE.split('x').map(Number);
const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };
const mime = MIME[extname(SRC).toLowerCase()];
if (!mime) {
  console.error(`unsupported source type: ${extname(SRC)}`);
  process.exit(1);
}

/** Above this, an edge row has too much detail to stretch without it showing. */
const FLATNESS_LIMIT = 12;

const dataUrl = `data:${mime};base64,${readFileSync(SRC).toString('base64')}`;

const browser = await chromium.launch({
  executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
});
const page = await browser.newPage();

const result = await page.evaluate(
  async ({ src, tw, th, q, limit }) => {
    const img = new Image();
    img.src = src;
    await img.decode();

    const sw = img.naturalWidth;
    const sh = img.naturalHeight;

    // Scale to the box width, so the full width of the subject survives.
    const drawH = Math.round((sh / sw) * tw);
    if (drawH >= th) {
      return { error: `source is not shorter than the box once fitted (${tw}x${drawH} vs ${tw}x${th}); use fit-photo.mjs` };
    }
    const top = Math.round((th - drawH) / 2);
    const bottom = th - drawH - top;

    // Measure how flat the outermost rows are: standard deviation of luminance.
    const probe = document.createElement('canvas');
    probe.width = sw;
    probe.height = sh;
    const pctx = probe.getContext('2d', { willReadFrequently: true });
    pctx.drawImage(img, 0, 0);
    const rowSpread = (y) => {
      const d = pctx.getImageData(0, y, sw, 1).data;
      const lum = [];
      for (let i = 0; i < d.length; i += 4) lum.push(0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]);
      const mean = lum.reduce((a, b) => a + b, 0) / lum.length;
      return Math.sqrt(lum.reduce((a, b) => a + (b - mean) ** 2, 0) / lum.length);
    };
    const spreadTop = rowSpread(0);
    const spreadBottom = rowSpread(sh - 1);
    if (spreadTop > limit || spreadBottom > limit) {
      return {
        error: `edge rows are not plain enough to stretch (top sd ${spreadTop.toFixed(1)}, ` +
               `bottom sd ${spreadBottom.toFixed(1)}, limit ${limit})`,
      };
    }

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');

    /* A single row stretched hundreds of pixels tall also stretches that row's sensor
       noise, which reads as fine vertical stripes across the band. Smoothing the row
       along its length first removes the noise while keeping the wall's real left-to-
       right shading, so the band still matches the photograph it continues. */
    const smoothRow = (y) => {
      const row = pctx.getImageData(0, y, sw, 1);
      const d = row.data;
      const out = new ImageData(sw, 1);
      const radius = Math.max(2, Math.round(sw * 0.05));
      for (let x = 0; x < sw; x += 1) {
        let r = 0, g = 0, b = 0, n = 0;
        for (let k = x - radius; k <= x + radius; k += 1) {
          if (k < 0 || k >= sw) continue;
          r += d[k * 4]; g += d[k * 4 + 1]; b += d[k * 4 + 2]; n += 1;
        }
        out.data[x * 4] = r / n;
        out.data[x * 4 + 1] = g / n;
        out.data[x * 4 + 2] = b / n;
        out.data[x * 4 + 3] = 255;
      }
      const strip = document.createElement('canvas');
      strip.width = sw;
      strip.height = 1;
      strip.getContext('2d').putImageData(out, 0, 0);
      return strip;
    };

    // Bands first: the source's outermost row, smoothed, then stretched to fill.
    if (top > 0) ctx.drawImage(smoothRow(0), 0, 0, sw, 1, 0, 0, tw, top);
    if (bottom > 0) ctx.drawImage(smoothRow(sh - 1), 0, 0, sw, 1, 0, th - bottom, tw, bottom);
    // Then the photograph itself, whole.
    ctx.drawImage(img, 0, 0, sw, sh, 0, top, tw, drawH);

    return {
      dataUrl: canvas.toDataURL('image/jpeg', q),
      sw, sh, drawH, top, bottom,
      spreadTop: +spreadTop.toFixed(1),
      spreadBottom: +spreadBottom.toFixed(1),
    };
  },
  { src: dataUrl, tw: TW, th: TH, q: Number(Q), limit: FLATNESS_LIMIT }
);

await browser.close();

if (result.error) {
  console.error(`refused: ${result.error}`);
  process.exit(1);
}

const bytes = Buffer.from(result.dataUrl.split(',')[1], 'base64');
writeFileSync(OUT, bytes);

console.log(
  `${SRC.split('/').pop()}  ${result.sw}x${result.sh}  ->  ${OUT.split('/').pop()}  ${TW}x${TH}\n` +
  `  photo drawn whole at ${TW}x${result.drawH}, wall extended ${result.top}px above and ` +
  `${result.bottom}px below\n` +
  `  edge flatness: top sd ${result.spreadTop}, bottom sd ${result.spreadBottom} (limit ${FLATNESS_LIMIT})\n` +
  `  ${Math.round(bytes.length / 1024)}KB`
);
