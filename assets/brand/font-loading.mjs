/**
 * Load Sora with a stylesheet link instead of the WebFont loader.
 *
 *   node assets/brand/font-loading.mjs
 *
 * The main pages fetched a 20KB script from ajax.googleapis.com, waited for it to run, and
 * only then asked for the font: three round trips before a single letter can be drawn in
 * the right face, all of them blocking. A plain stylesheet link starts the font request
 * during the initial HTML parse instead. The legal pages already did it this way, so this
 * also makes the site consistent with itself.
 *
 * This is a page-speed change, which is a ranking factor and, on a Zimbabwean mobile
 * connection, the difference a patient actually feels.
 *
 * Nothing depended on the loader: it is checked across the CSS and JS for the wf-active
 * and wf-loading classes it sets, and there are none. display=swap keeps text visible in a
 * fallback face while Sora arrives, rather than leaving the page blank.
 *
 * The gstatic preconnect gains crossorigin, without which the browser opens a second
 * connection for the font files and the hint is wasted.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PAGES = [
  'index.html', 'about.html', 'service.html',
  'variant-blue/index.html', 'variant-blue/about.html', 'variant-blue/service.html',
];

const LOADER =
  /<script src="https:\/\/ajax\.googleapis\.com\/ajax\/libs\/webfont\/[^"]+"[^>]*><\/script>\s*<script type="text\/javascript">\s*WebFont\.load\(\{[\s\S]*?\}\);\s*<\/script>/;

const LINK =
  '<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&amp;display=swap" rel="stylesheet"/>';

let changed = 0;
const skipped = [];

for (const rel of PAGES) {
  const p = join(ROOT, rel);
  let h = readFileSync(p, 'utf8');
  const before = h;

  if (!LOADER.test(h)) {
    skipped.push(`${rel} (${h.includes('css2?family=Sora') ? 'already converted' : 'loader not found'})`);
    continue;
  }

  h = h.replace(LOADER, LINK);
  h = h.replace(
    '<link href="https://fonts.gstatic.com" rel="preconnect"/>',
    '<link href="https://fonts.gstatic.com" rel="preconnect" crossorigin/>'
  );

  if (h !== before) {
    writeFileSync(p, h);
    changed += 1;
    console.log(`  ${rel}`);
  }
}

console.log(`\n${changed} page(s) updated`);
for (const s of skipped) console.log(`  skipped: ${s}`);
