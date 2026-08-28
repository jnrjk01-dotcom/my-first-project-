/**
 * Put the clinic's own signage in the Why Choose Us panel on the home page.
 *
 *   node assets/brand/value-photo.mjs
 *
 * The panel carried an AI-generated stock scene (gen_home-value-image.jpg). It now shows
 * the practice's actual door sign, which is the point of the section: the reason to
 * choose this clinic is that it is this clinic.
 *
 * THE IMAGE. Composed by fit-photo-extend.mjs rather than fit-photo.mjs. The sign runs
 * nearly edge to edge in the source, so a cover-crop to the panel's 1.17:1 cuts the tooth
 * mark off one side and the lettering off the other. fit-photo-extend fits the whole
 * frame to the panel width and extends the plain wall above and below, so the sign is
 * complete. On narrower screens the panel is 1.33:1 and object-fit: cover trims that
 * extended wall back off, which is exactly the part that can be spared.
 *
 * THE TRANSFORM. Webflow baked scale3d(1.5, 1.5, 1) onto this image as the opening state
 * of a zoom-out interaction, and the exported interaction never runs, so it sat
 * permanently at 1.5x with a third of the picture cropped away. The reveal engine does
 * not rescue it the way it rescues other elements, because it only adopts elements whose
 * inline style carries opacity:0 and this one carries only the transform. The CSS below
 * neutralises it, the same fix the about page hero needed.
 *
 * The script is idempotent: it compares what the slot already points at.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const FILE = 'value-signage.jpg';
const OLD = 'gen_home-value-image.jpg';
const ALT = 'The Dental Care Centre name and tooth mark etched on the clinic door';

const CSS_MARKER = '/* --- why choose us: clinic signage --- */';
const CSS = `
${CSS_MARKER}
/* Webflow baked scale3d(1.5,1.5,1) onto this image as the start of a zoom-out reveal.
   The exported interaction never applies it, and the reveal engine does not adopt the
   element because its inline style has no opacity:0 to match on, so it stayed at 1.5x
   with a third of the picture cropped off. The sign has to be readable whole. */
.home-value_image { transform: none !important; }
`;

/* ── 1. The photograph, in both trees ────────────────────────────────────── */

const src = join(ROOT, 'assets/img', FILE);
if (!existsSync(src)) {
  console.error(`  assets/img/${FILE} is missing — build it first with:`);
  console.error(`    node assets/brand/fit-photo-extend.mjs <signage.jpg> assets/img/${FILE} 1440x1231 0.84`);
  process.exit(1);
}
const bytes = readFileSync(src);
const dst = join(ROOT, 'variant-blue/assets/img', FILE);
if (!existsSync(dst) || Buffer.compare(readFileSync(dst), bytes) !== 0) {
  writeFileSync(dst, bytes);
  console.log(`  ${FILE} mirrored into variant-blue/assets/img/`);
}

/* ── 2. Repoint the slot ─────────────────────────────────────────────────── */

const counts = (s) => ({
  img: (s.match(/<img\b/g) || []).length,
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

let changed = 0;
for (const rel of ['index.html', 'variant-blue/index.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  const before = counts(original);

  if (!original.includes(OLD) && original.includes(FILE)) {
    console.log(`  ${rel.padEnd(26)} already showing the signage`);
    continue;
  }

  const m = /<img\b[^>]*\bhome-value_image\b[^>]*>/.exec(original);
  if (!m) {
    console.error(`  ${rel}: no .home-value_image found — skipped`);
    process.exitCode = 1;
    continue;
  }

  // Repoint src and every srcset entry, and replace the placeholder alt. The srcset
  // entries all name the same file, which is how the rest of the site's responsive
  // variants were collapsed; keeping that shape avoids a 404 against a width that
  // was never generated.
  let tag = m[0]
    .split(`assets/img/${OLD}`).join(`assets/img/${FILE}`)
    .replace(/\salt="[^"]*"/, ` alt="${ALT}"`);

  const s = original.slice(0, m.index) + tag + original.slice(m.index + m[0].length);

  const after = counts(s);
  if (
    after.img !== before.img ||
    after.div !== before.div ||
    after.divClose !== before.divClose ||
    after.script !== before.script
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  changed += 1;
  console.log(`  ${rel.padEnd(26)} Why Choose Us -> ${FILE}`);
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
  console.log(`  ${css.padEnd(34)} value styles ${at === -1 ? 'added' : 'refreshed'}`);
}

console.log(`\n${changed} page(s) updated`);
