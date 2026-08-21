/**
 * Put the practice's own team photograph behind the closing call to action.
 *
 *   node assets/brand/cta-photo.mjs
 *
 * The band behind "Let's Talk Teeth" was still running the template's AI-generated
 * clinicians. It now uses the real team.
 *
 * The photograph is referenced from one CSS rule, so this changes the closing band on
 * every page that carries it, not just the home page. That is the intent: it is the same
 * band, and having it show a different set of people per page would be a bug.
 *
 * It does NOT overwrite gen_about-hero-image.jpg, which the rule used to point at: that
 * file is still the hero of about.html, and replacing it in place would silently change
 * a second page.
 *
 * BACKGROUND POSITION. The section's aspect ratio runs from 3.85:1 at 1920 down to
 * 1.03:1 at 390, so `cover` crops vertically on wide screens and horizontally on narrow
 * ones. The file is cut to 2:1 with the group high in the frame, and the vertical anchor
 * is pulled above centre so the wide-screen crop keeps the faces rather than landing on
 * shoulders.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const FILE = 'cta-team.jpg';
const OLD = "url('../img/gen_about-hero-image.jpg')";
const NEW = `url('../img/${FILE}')`;

const src = join(ROOT, 'assets/img', FILE);
if (!existsSync(src)) {
  console.error(`  assets/img/${FILE} is missing — nothing to point at`);
  process.exit(1);
}

// Mirror first: a stylesheet pointing at a file the blue tree does not have would 404,
// and the section would fall back to its flat colour with no visible failure.
const dst = join(ROOT, 'variant-blue/assets/img', FILE);
const bytes = readFileSync(src);
if (!existsSync(dst) || Buffer.compare(readFileSync(dst), bytes) !== 0) {
  writeFileSync(dst, bytes);
  console.log(`  ${FILE} mirrored into variant-blue/assets/img/`);
}

let changed = 0;
for (const rel of ['assets/css/lumora.css', 'variant-blue/assets/css/lumora.css']) {
  const p = join(ROOT, rel);
  const original = readFileSync(p, 'utf8');
  let s = original;

  if (s.includes(NEW)) {
    console.log(`  ${rel.padEnd(34)} already using ${FILE}`);
  } else {
    // Only the .section_cta rule, not every use of the old file.
    const at = s.indexOf('.section_cta{position:relative;background-image:');
    if (at === -1) {
      console.error(`  ${rel}: the CTA background rule was not found — skipped`);
      process.exitCode = 1;
      continue;
    }
    const end = s.indexOf('}', at);
    const rule = s.slice(at, end);
    if (!rule.includes(OLD)) {
      console.error(`  ${rel}: the CTA rule does not point at the expected file — skipped`);
      process.exitCode = 1;
      continue;
    }
    s = s.slice(0, at) + rule.replace(OLD, NEW) + s.slice(end);
    changed += 1;
  }

  // Anchor the crop above centre so wide screens keep the faces.
  s = s.replace(
    /(\.section_cta\{position:relative;background-image:[^}]*background-position:)center;/,
    '$1center 26%;'
  );

  if (s !== original) writeFileSync(p, s);
}

const check = readFileSync(join(ROOT, 'assets/css/lumora.css'), 'utf8');
const m = /\.section_cta\{position:relative;background-image:[^}]*\}/.exec(check);
console.log(`\n${changed} stylesheet(s) repointed`);
console.log('  ' + (m ? m[0] : 'RULE NOT FOUND'));
