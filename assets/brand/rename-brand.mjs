/**
 * Rebrand: Lumora Dental -> Dental Care Centre.
 *
 *   node assets/brand/rename-brand.mjs
 *
 * Only user-visible brand copy is touched. Two lowercase identifiers must survive
 * untouched or the site breaks, and both are asserted after the rewrite:
 *
 *   - `lumora.css?v=...`  the stylesheet filename. Renaming the reference without
 *                         renaming the file would unstyle all 18 pages.
 *   - `lumoraLead(...)`   the hero lead-form handler. The definition and the inline
 *                         onsubmit must keep matching or the form stops submitting.
 *
 * Both are lowercase-l, and every rule here matches either capital `Lumora` or the
 * full email string, so neither can be hit. The assertions make that a guarantee
 * rather than an assumption.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const OLD_EMAIL = 'hello@lumoradental.com';
const NEW_EMAIL = 'hello@dentalcarecentre.com'; // ⚠ invented — confirm ownership before publishing

const RULES = [
  [/Lumora Dental/g, 'Dental Care Centre'],
  [/Lumora/g, 'Dental Care Centre'],
  [new RegExp(OLD_EMAIL.replace(/[.@]/g, '\\$&'), 'g'), NEW_EMAIL],
];

/** Must be byte-identical before and after. */
const PROTECTED = ['lumora.css?v=', 'lumoraLead'];

const PAGES = [];
for (const dir of ['.', 'variant-blue']) {
  for (const f of [
    'index.html', 'about.html', 'service.html', 'blog.html',
    'privacy.html', 'cookies.html', 'terms.html', 'licenses.html', '404.html',
  ]) {
    PAGES.push(join(ROOT, dir, f));
  }
}

let totalReplacements = 0;
const rows = [];

for (const file of PAGES) {
  const rel = relative(ROOT, file);
  const before = readFileSync(file, 'utf8');
  let s = before;

  const counts = { brand: 0, email: 0 };
  const protectedBefore = PROTECTED.map((p) => before.split(p).length - 1);

  s = s.replace(RULES[0][0], () => { counts.brand += 1; return RULES[0][1]; });
  s = s.replace(RULES[1][0], () => { counts.brand += 1; return RULES[1][1]; });
  s = s.replace(RULES[2][0], () => { counts.email += 1; return RULES[2][1]; });

  // Assert the protected identifiers survived, per file.
  const protectedAfter = PROTECTED.map((p) => s.split(p).length - 1);
  PROTECTED.forEach((p, i) => {
    if (protectedBefore[i] !== protectedAfter[i]) {
      throw new Error(
        `${rel}: protected string "${p}" changed (${protectedBefore[i]} -> ${protectedAfter[i]}). Aborting.`
      );
    }
  });

  if (s !== before) {
    writeFileSync(file, s);
    totalReplacements += counts.brand + counts.email;
    rows.push(
      `  ${rel.padEnd(28)} brand:${String(counts.brand).padStart(3)}  email:${String(counts.email).padStart(2)}` +
        `   [${PROTECTED.map((p, i) => `${p}×${protectedAfter[i]}`).join(' ')}]`
    );
  }
}

console.log(`\n${rows.length} file(s), ${totalReplacements} replacement(s)\n`);
console.log(rows.join('\n'));
console.log(`\nProtected identifiers verified unchanged in every file.`);
console.log(`Email set to ${NEW_EMAIL} — domain is invented and needs confirming.`);
