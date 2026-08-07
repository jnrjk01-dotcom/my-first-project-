/**
 * Rasterize the generated SVGs to PNG using headless Chromium.
 *
 *   node assets/brand/rasterize.mjs
 *
 * Chromium is the rasterizer because this environment has no Inkscape, ImageMagick or
 * librsvg. It renders the same SVG the browser will, which is the point: the PNG
 * fallback cannot disagree with the vector it falls back from.
 *
 * Requires playwright to be resolvable. It is a build-time-only dependency and is
 * deliberately not added to the site, which ships no package.json.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { chromium } from 'playwright';

const IMG = join(dirname(fileURLToPath(import.meta.url)), '..', 'img');
const CHROME =
  process.env.CHROMIUM_PATH ||
  '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell';

/** Lockup aspect, from the generator's viewBox. Keep in sync if the artwork changes. */
const RATIO = 918 / 390;

const JOBS = [
  // 2x raster fallbacks for the lockups: 96px display height => 192px actual.
  { src: 'logo-dcc-navy.svg', out: 'logo-dcc-navy.png', h: 192, w: Math.round(192 * RATIO) },
  { src: 'logo-dcc-white.svg', out: 'logo-dcc-white.png', h: 192, w: Math.round(192 * RATIO) },
  // Favicons and touch icon from the mark.
  { src: 'favicon-dcc.svg', out: 'favicon-32.png', h: 32, w: 32 },
  { src: 'favicon-dcc.svg', out: 'favicon-16.png', h: 16, w: 16 },
  { src: 'apple-touch-icon.svg', out: 'apple-touch-icon.png', h: 180, w: 180 },
  { src: 'logo-dcc-mark.svg', out: 'logo-dcc-mark.png', h: 512, w: 512 },
  // Compact lockup (used under 768px), 2x for a 36px display height.
  { src: 'logo-dcc-compact-navy.svg', out: 'logo-dcc-compact-navy.png', h: 72, w: 291 },
  { src: 'logo-dcc-compact-white.svg', out: 'logo-dcc-compact-white.png', h: 72, w: 291 },
  // Maskable / social avatar: mark on the navy tile at 512.
  { src: 'apple-touch-icon.svg', out: 'icon-512.png', h: 512, w: 512 },
  { src: 'apple-touch-icon.svg', out: 'icon-192.png', h: 192, w: 192 },
];

const browser = await chromium.launch({ executablePath: CHROME });

for (const job of JOBS) {
  const svg = readFileSync(join(IMG, job.src), 'utf8');
  const ctx = await browser.newContext({
    viewport: { width: job.w, height: job.h },
    deviceScaleFactor: 1,
  });
  const page = await ctx.newPage();
  // Transparent page so the alpha channel survives; the tile SVGs paint their own bg.
  await page.setContent(
    `<html><body style="margin:0;background:transparent">
       <div style="width:${job.w}px;height:${job.h}px">
         ${svg.replace(/width="[^"]*"\s+height="[^"]*"/, `width="${job.w}" height="${job.h}"`)}
       </div>
     </body></html>`
  );
  await page.waitForTimeout(120);
  const buf = await page.screenshot({ omitBackground: true });
  writeFileSync(join(IMG, job.out), buf);
  console.log(`wrote assets/img/${job.out}  ${job.w}x${job.h}  (${buf.length} bytes)`);
  await ctx.close();
}

await browser.close();
