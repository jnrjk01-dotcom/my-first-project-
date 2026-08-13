/**
 * Crop and resize a photo to a target box, anchored on a focal point.
 *
 *   node assets/brand/fit-photo.mjs <src> <out> [WxH] [focal] [quality]
 *
 *   src      source image path
 *   out      destination .jpg path
 *   WxH      target pixels, default 1344x752 (the hero carousel size)
 *   focal    where to anchor the crop: center | top | upper | lower | bottom
 *            default "upper", which keeps faces in frame when a portrait photo is
 *            cropped to a landscape box — a centre crop usually cuts heads off.
 *   quality  JPEG quality 0-1, default 0.82
 *
 * Chromium does the resampling because this environment has no ImageMagick, librsvg or
 * PIL. It draws the source into a canvas with a computed source rectangle (a real
 * cover-crop, never a squash) and exports JPEG.
 *
 * Cropping a portrait photo into a 16:9 box necessarily discards most of the frame; the
 * tool prints exactly how much so the loss is a visible decision, not a surprise.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { basename, extname } from 'node:path';
import { chromium } from 'playwright';

const [, , SRC, OUT, SIZE = '1344x752', FOCAL = 'upper', Q = '0.82'] = process.argv;

if (!SRC || !OUT) {
  console.error('usage: node assets/brand/fit-photo.mjs <src> <out> [WxH] [focal] [quality]');
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

const dataUri = `data:${mime};base64,${readFileSync(SRC).toString('base64')}`;

const browser = await chromium.launch({
  executablePath:
    process.env.CHROMIUM_PATH ||
    '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell',
});
const page = await browser.newPage();

const result = await page.evaluate(
  async ([uri, tw, th, focal, q]) => {
    const img = new Image();
    img.src = uri;
    await img.decode();

    const sw = img.naturalWidth;
    const sh = img.naturalHeight;

    // Cover-crop: scale so the target box is fully covered, then take a window.
    const scale = Math.max(tw / sw, th / sh);
    const cw = tw / scale; // source-space crop width
    const ch = th / scale; // source-space crop height

    const sx = (sw - cw) / 2; // always horizontally centred
    const bias = { top: 0, upper: 0.25, center: 0.5, lower: 0.75, bottom: 1 }[focal] ?? 0.25;
    const sy = (sh - ch) * bias;

    const canvas = document.createElement('canvas');
    canvas.width = tw;
    canvas.height = th;
    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(img, sx, sy, cw, ch, 0, 0, tw, th);

    return {
      dataUrl: canvas.toDataURL('image/jpeg', q),
      sw,
      sh,
      kept: Math.round(((cw * ch) / (sw * sh)) * 100),
    };
  },
  [dataUri, TW, TH, FOCAL, Number(Q)]
);

await browser.close();

const bytes = Buffer.from(result.dataUrl.split(',')[1], 'base64');
writeFileSync(OUT, bytes);

const srcRatio = (result.sw / result.sh).toFixed(2);
const outRatio = (TW / TH).toFixed(2);
console.log(
  `${basename(SRC)}  ${result.sw}x${result.sh} (${srcRatio}:1)  ->  ` +
    `${basename(OUT)}  ${TW}x${TH} (${outRatio}:1)  ` +
    `focal=${FOCAL}  kept ${result.kept}% of frame  ${Math.round(bytes.length / 1024)}KB`
);
