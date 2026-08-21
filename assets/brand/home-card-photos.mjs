/**
 * Fill the home page service cards' photo slots from the services page.
 *
 *   node assets/brand/home-card-photos.mjs
 *
 * Each card already reserves a 16:10 slot (see service-photos.mjs). This points each one
 * at the photograph its own group already uses on service.html, so the two pages show
 * the same thing for the same treatment and there is nothing extra to keep in step.
 *
 * The files are reused as they are rather than re-cropped into card-sized copies: the
 * slot is `object-fit: cover`, so a 16:9 source loses a sliver top and bottom and
 * nothing is stretched. Duplicating them at a second size would double the number of
 * images to replace whenever a photograph changes.
 *
 * The script is idempotent by comparing sources rather than by checking emptiness: a
 * slot already holding the photograph named below is left alone, and one holding a
 * different photograph is updated, so changing the map above is enough to re-point it.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * Card slot -> the services page photograph for that group, with its alt text.
 * Where a group carries a pair on service.html, the card takes whichever of the two
 * reads better at card size, which is not always the first: preventive dentistry uses
 * the polishing photograph rather than the scaling one, both because it is the clearer
 * image and because it is 736px wide against the scaling photograph's 381px, so it is
 * not upscaled into the 440px box.
 */
const PHOTOS = {
  orthodontics: [
    'svc-orthodontic-treatments-1.jpg',
    "Fixed braces on a patient's upper teeth, with an interdental brush alongside",
  ],
  'cosmetic-dentistry': [
    'svc-cosmetic-dentistry-1.jpg',
    'A veneer being bonded to the front of an upper tooth',
  ],
  'restorative-treatments': [
    'svc-restorative-treatments-1.jpg',
    "Close view of a patient's teeth being examined with a mirror and probe",
  ],
  'preventive-dentistry': [
    'svc-preventive-dentistry-2.jpg',
    'A polishing cup being used on an upper front tooth',
  ],
};

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  img: (s.match(/<img\b/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

let changed = 0;
for (const rel of ['index.html', 'variant-blue/index.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);
  const dir = rel.startsWith('variant-blue') ? 'variant-blue/assets/img' : 'assets/img';
  const done = [];
  let newImages = 0;

  for (const [slot, [fileName, alt]] of Object.entries(PHOTOS)) {
    // A missing file would 404, and the site's inline image guard would swap in a
    // branded gradient that looks deliberate and hides the failure.
    if (!existsSync(join(ROOT, dir, fileName))) {
      console.error(`  ${rel}: ${dir}/${fileName} is missing — slot "${slot}" left empty`);
      process.exitCode = 1;
      continue;
    }
    const marker = `<div class="service-item_photo" data-photo-slot="${slot}">`;
    const open = s.indexOf(marker);
    if (open === -1) {
      console.error(`  ${rel}: no slot named "${slot}" — skipped`);
      process.exitCode = 1;
      continue;
    }
    const close = s.indexOf('</div>', open);
    if (close === -1) continue;
    const inner = s.slice(open + marker.length, close);
    // Already correct, so leave it: this is what makes re-running a no-op.
    if (inner.includes(`src="assets/img/${fileName}"`)) continue;
    // Anything else is either the untouched placeholder or a photograph that has since
    // been changed in the map above; both get replaced.
    if (!inner.includes('service-item_photo-label') && !inner.includes('<img')) {
      console.error(`  ${rel}: slot "${slot}" holds something unexpected — skipped`);
      process.exitCode = 1;
      continue;
    }
    const img =
      `<img class="service-item_photo-img" src="assets/img/${fileName}" ` +
      `alt="${esc(alt)}" loading="lazy" decoding="async"/>`;
    if (!inner.includes('<img')) newImages += 1;
    s = s.slice(0, open + marker.length) + img + s.slice(close);
    done.push(slot);
  }

  if (!done.length) {
    console.log(`  ${rel.padEnd(26)} slots already filled`);
    continue;
  }

  const after = counts(s);
  if (
    after.div !== after.divClose ||
    after.div !== before.div ||
    after.section !== before.section ||
    after.script !== before.script ||
    after.img !== before.img + newImages
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  changed += 1;
  console.log(`  ${rel.padEnd(26)} filled ${done.length} slot(s): ${done.join(', ')}`);
}

console.log(`\n${changed} page(s) updated`);
