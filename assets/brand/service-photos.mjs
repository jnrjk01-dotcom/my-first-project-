/**
 * Replace the service cards' stock showcase with an empty photo slot.
 *
 *   node assets/brand/service-photos.mjs
 *
 * Each card shipped with a stock background photo and four overlaid tag chips
 * ("Braces", "Clear Aligners", …) that duplicated the treatment list right above them.
 * Both are removed. In their place each card keeps a reserved, correctly proportioned
 * area for the clinic's own photograph.
 *
 * The slot deliberately references no image file. Pointing it at a filename that does
 * not exist yet would 404 on every card, and the site's inline image guard would swap
 * in a branded gradient — which looks intentional and would hide the fact that the
 * photo is still missing.
 *
 * TO ADD A PHOTO, per card, replace the slot's contents with:
 *
 *   <img class="service-item_photo-img" src="assets/img/service-<slug>.jpg"
 *        alt="<what the photo shows>" loading="lazy"/>
 *
 * Slugs, in card order: preventive-dentistry, cosmetic-dentistry,
 * restorative-treatments, orthodontics. The slot is a fixed 16:10 box, so dropping a
 * photo in causes no layout shift. Mirror the file into variant-blue/assets/img/ too.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Card order in the DOM. */
const SLUGS = [
  'preventive-dentistry',
  'cosmetic-dentistry',
  'restorative-treatments',
  'orthodontics',
];

const slot = (slug) =>
  '<div class="service-item_showcase">' +
  `<div class="service-item_photo" data-photo-slot="${slug}">` +
  '<span class="service-item_photo-label">Photo</span>' +
  '</div></div>';

const CSS_MARKER = '/* --- services: photo slot --- */';
const CSS = `
${CSS_MARKER}
/* Reserved area for each service card's photograph. Fixed 16:10 so dropping an image
   in causes no layout shift, and so the four cards stay visually consistent. */
.service-item_photo {
  position: relative;
  aspect-ratio: 16 / 10;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(1, 31, 35, 0.045);
  border: 1px dashed rgba(1, 31, 35, 0.18);
  display: flex;
  align-items: center;
  justify-content: center;
}
.service-item_photo-label {
  font-size: 12px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  opacity: 0.35;
}
/* Once a photo is added it fills the slot and the placeholder styling drops away. */
.service-item_photo:has(img) {
  background: none;
  border: 0;
}
.service-item_photo:has(img) .service-item_photo-label { display: none; }
.service-item_photo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
`;

/** End index of the element opened at `open`, counting nested divs. */
function endOfDiv(html, open) {
  const o = /<div\b/gi;
  const c = /<\/div\s*>/gi;
  let depth = 0;
  let i = open;
  while (i < html.length) {
    o.lastIndex = i;
    c.lastIndex = i;
    const a = o.exec(html);
    const b = c.exec(html);
    if (!b) return -1;
    if (a && a.index < b.index) {
      depth += 1;
      i = a.index + a[0].length;
    } else {
      depth -= 1;
      i = b.index + b[0].length;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

let changed = 0;
for (const rel of ['index.html', 'variant-blue/index.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);

  if (s.includes('service-item_photo')) {
    console.log(`  ${rel.padEnd(26)} already has photo slots`);
    continue;
  }

  // Replace from the last card backwards so earlier offsets stay valid.
  const opens = [];
  let idx = s.indexOf('<div class="service-item_showcase">');
  while (idx !== -1) {
    opens.push(idx);
    idx = s.indexOf('<div class="service-item_showcase">', idx + 1);
  }
  if (opens.length !== SLUGS.length) {
    console.error(`  ${rel}: expected ${SLUGS.length} showcases, found ${opens.length} — skipped`);
    continue;
  }

  for (let k = opens.length - 1; k >= 0; k -= 1) {
    const start = opens[k];
    const end = endOfDiv(s, start);
    if (end === -1) {
      console.error(`  ${rel}: could not close showcase ${k + 1} — skipped file`);
      s = original;
      break;
    }
    const span = s.slice(start, end);
    // Sanity: the block must be the showcase and nothing more.
    if (span.length > 9000 || !span.includes('service-item_image') || /<\/(section|body)>/i.test(span)) {
      console.error(`  ${rel}: showcase ${k + 1} failed its sanity check (${span.length} bytes) — skipped file`);
      s = original;
      break;
    }
    s = s.slice(0, start) + slot(SLUGS[k]) + s.slice(end);
  }

  if (s === original) {
    process.exitCode = 1;
    continue;
  }

  const after = counts(s);
  if (after.div !== after.divClose || after.section !== before.section || after.script !== before.script) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    writeFileSync(file, original);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  changed += 1;
  const saved = original.length - s.length;
  console.log(`  ${rel.padEnd(26)} 4 showcases -> photo slots (-${saved.toLocaleString()} bytes)`);
}

for (const css of ['assets/css/lumora.css', 'variant-blue/assets/css/lumora.css']) {
  const p = join(ROOT, css);
  const s = readFileSync(p, 'utf8');
  if (!s.includes(CSS_MARKER)) {
    writeFileSync(p, s + CSS);
    console.log(`  ${css.padEnd(34)} +photo slot styles`);
  }
}

console.log(`\n${changed} page(s) updated`);
console.log('  slots: ' + SLUGS.join(', '));
