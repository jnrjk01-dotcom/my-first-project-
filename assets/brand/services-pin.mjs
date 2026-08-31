/**
 * Install the phone-only scroll-driven services carousel.
 *
 *   node assets/brand/services-pin.mjs
 *
 * Adds assets/js/services-pin.js to the home page in both trees, plus the CSS that
 * switches the rail from a scrolling container to a transformed one while that script is
 * driving. Everything is scoped to the .dcc-svc-pinned class the script sets on <html>,
 * so the swipe rail is what you get whenever the script does not run: no JavaScript,
 * reduced motion, a tablet or desktop width, or a phone too short to fit the cards.
 *
 * Desktop and tablet are untouched by design; the request was to bring the effect back
 * on phones only.
 *
 * The script is idempotent: it looks for the tag and rewrites the CSS block in place.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const TAG = '<script src="assets/js/services-pin.js" defer></' + 'script>';
const ANCHOR = '<script src="assets/js/services-rail.js" defer></' + 'script>';

const CSS_MARKER = '/* --- services: phone scroll carousel --- */';
const CSS = `
${CSS_MARKER}
/* Only while services-pin.js is driving. Without the class the rail stays the native
   scroll-snap carousel, which is what phones get when the script does not run: no
   JavaScript, reduced motion, or a screen too short to pin the cards into. */
@media screen and (max-width: 767px) {
  /* The container scrolls by transform now, so its own scrolling has to stop or the
     two fight each other: a swipe would move the rail while the pin moves it back. */
  .dcc-svc-pinned .service_list {
    overflow: visible !important;
    scroll-snap-type: none !important;
    /* 20px of scrollbar gutter is no longer needed and the height has to be won back:
       the pinned block only fits a phone screen with the booking bar allowed for. */
    padding-bottom: 4px !important;
    /* Vertical swipes still scroll the page, which is what now drives the carousel. */
    touch-action: pan-y;
  }
  .dcc-svc-pinned .service_wrap { overflow: hidden !important; }

  /* Webflow left translate(0, 40px) on the camera as the opening state of an interaction
     the export never runs, the same kind of stranded start-state as the about page hero.
     It offsets the section for no reason, and a transformed ancestor is also what stops
     a pinned child from holding still, so it goes. */
  .dcc-svc-pinned .scroll-mobile_camera,
  .dcc-svc-pinned .scroll-mobile_trigger,
  .dcc-svc-pinned .service_sticky-camera { transform: none !important; }
  /* The arrows page a scrolling container that no longer scrolls, and the hint tells
     people to drag when dragging is not what moves it. */
  .dcc-svc-pinned .service-rail_controls { display: none !important; }

  /* Only in the pinned variant. A pinned card has to fit the screen whole, or its button
     ends up unreachable behind the booking bar, which is the fault that got the original
     interaction removed. The tallest card is Restorative at eight treatments, so the card
     is tightened here: a shallower photograph and less air between the blocks. Nothing is
     hidden. These are applied before the fit is measured and dropped again if it fails,
     so a phone that ends up on the swipe rail keeps the roomier card.

     Sizes here were set against the real Sora webfont. Measuring with a fallback face
     makes every text block shorter and the rail looks 20-40px smaller than it is, which
     is how this first shipped passing a fit check that a real phone then failed. */
  .dcc-svc-pinned-pin .service-item_photo {
    aspect-ratio: auto !important;
    height: 68px !important;
  }
  .dcc-svc-pinned-pin .service_item { gap: 10px !important; }
  .dcc-svc-pinned-pin .service-item_list { margin-top: 8px !important; gap: 6px 18px !important; }
  .dcc-svc-pinned-pin .service_item-wrap { padding-bottom: 14px !important; }
}
`;

/* ── 1. The script tag ───────────────────────────────────────────────────── */

if (!existsSync(join(ROOT, 'assets/js/services-pin.js'))) {
  console.error('  assets/js/services-pin.js is missing');
  process.exit(1);
}

let added = 0;
for (const rel of ['index.html', 'variant-blue/index.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');

  if (original.includes('assets/js/services-pin.js')) {
    console.log(`  ${rel.padEnd(26)} script already present`);
    continue;
  }
  // After services-rail.js: the arrows it injects change the rail's height, and the
  // pin script measures that height before deciding whether it fits.
  const at = original.indexOf(ANCHOR);
  if (at === -1) {
    console.error(`  ${rel}: services-rail.js tag not found — skipped`);
    process.exitCode = 1;
    continue;
  }
  const s = original.slice(0, at + ANCHOR.length) + TAG + original.slice(at + ANCHOR.length);

  const before = (original.match(/<script\b/g) || []).length;
  const after = (s.match(/<script\b/g) || []).length;
  if (after !== before + 1 || (s.match(/<\/script>/g) || []).length !== after) {
    console.error(`  ${rel}: ABORTED — script tags did not balance`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  added += 1;
  console.log(`  ${rel.padEnd(26)} services-pin.js added`);
}

/* ── 2. The script, mirrored into the blue tree ──────────────────────────── */

const src = join(ROOT, 'assets/js/services-pin.js');
const dst = join(ROOT, 'variant-blue/assets/js/services-pin.js');
const bytes = readFileSync(src);
if (!existsSync(dst) || Buffer.compare(readFileSync(dst), bytes) !== 0) {
  writeFileSync(dst, bytes);
  console.log('  services-pin.js mirrored into variant-blue/assets/js/');
}

/* ── 3. Styles, mirrored into both trees ─────────────────────────────────── */

for (const css of ['assets/css/lumora.css', 'variant-blue/assets/css/lumora.css']) {
  const p = join(ROOT, css);
  let s = readFileSync(p, 'utf8');
  const at = s.indexOf(CSS_MARKER);
  if (at !== -1) {
    const next = s.indexOf('\n/* --- ', at + CSS_MARKER.length);
    s = (s.slice(0, at) + (next === -1 ? '' : s.slice(next + 1))).replace(/\s+$/, '') + '\n';
  }
  writeFileSync(p, s + CSS);
  console.log(`  ${css.padEnd(34)} carousel styles ${at === -1 ? 'added' : 'refreshed'}`);
}

console.log(`\n${added} page(s) updated`);
