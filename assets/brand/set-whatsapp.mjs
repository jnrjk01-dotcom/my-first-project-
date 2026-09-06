/**
 * Point every WhatsApp link at a new number.
 *
 *   node assets/brand/set-whatsapp.mjs 0777804093
 *
 * The WhatsApp number appears in three shapes across two page trees and a handful of
 * generator scripts: the wa.me digits, the "+263 77 780 4093" display string, and the
 * booking bar's config constant. Changing it by hand has already meant editing 57 places,
 * which is how a number ends up half-changed and a patient messages a line nobody reads.
 * This does all three shapes in one pass and prints what it touched.
 *
 * Local Zimbabwean form (0777804093) and international form (+263777804093) are both
 * accepted; the leading 0 is a national trunk prefix and is dropped for the country code,
 * which is the mistake that makes a wa.me link silently open an empty chat.
 *
 * Idempotent: run it twice and the second run reports nothing to do. It rewrites only the
 * exact previous number, so it cannot damage the landline, which is a different number and
 * is left alone.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/* The number being replaced. Kept explicit rather than discovered so a stray number
   somewhere in the tree cannot be swept up by accident. */
const OLD_DIGITS = '263778398111';
const OLD_DISPLAY = '+263 77 839 8111';

const raw = (process.argv[2] || '').replace(/[^\d+]/g, '');
if (!raw) {
  console.error('usage: node assets/brand/set-whatsapp.mjs 0777804093');
  process.exit(1);
}

/* wa.me wants country code plus subscriber number, no plus and no trunk zero. */
let digits;
if (raw.startsWith('+')) digits = raw.slice(1);
else if (raw.startsWith('263')) digits = raw;
else if (raw.startsWith('0')) digits = '263' + raw.slice(1);
else digits = '263' + raw;

if (!/^263\d{9}$/.test(digits)) {
  console.error(`"${process.argv[2]}" is not a Zimbabwean number: expected 263 + 9 digits, got ${digits}`);
  process.exit(1);
}

/* +263 77 780 4093 — the grouping Zimbabwean numbers are normally written in. */
const sub = digits.slice(3);
const display = `+263 ${sub.slice(0, 2)} ${sub.slice(2, 5)} ${sub.slice(5)}`;

const FILES = [
  'index.html', 'about.html', 'service.html', 'privacy.html',
  'variant-blue/index.html', 'variant-blue/about.html',
  'variant-blue/service.html', 'variant-blue/privacy.html',
  'assets/js/booking-bar.js', 'variant-blue/assets/js/booking-bar.js',
  // The generator scripts carry the number as a constant, so a page rebuilt from one of
  // them would otherwise reintroduce the old number.
  'assets/brand/update-nav.mjs', 'assets/brand/update-contact.mjs',
  'assets/brand/service-detail.mjs', 'assets/brand/appointment-cta.mjs',
];

let touched = 0;
let hits = 0;
for (const rel of FILES) {
  const p = join(ROOT, rel);
  const before = readFileSync(p, 'utf8');
  const after = before
    .split(OLD_DIGITS).join(digits)
    .split(OLD_DISPLAY).join(display);
  if (after === before) continue;
  const n = before.split(OLD_DIGITS).length - 1 + (before.split(OLD_DISPLAY).length - 1);
  hits += n;
  touched += 1;
  writeFileSync(p, after);
  console.log(`  ${rel}  (${n})`);
}

console.log(touched ? `\nwhatsapp -> ${display}  (wa.me/${digits})` : 'nothing to do');
console.log(`${hits} replacement(s) across ${touched} file(s)`);
