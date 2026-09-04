/**
 * Remove the blog.
 *
 *   node assets/brand/remove-blog.mjs
 *
 * Six invented articles illustrated with six AI-generated photographs, linked from the
 * navigation and the footer of every main page. It was the strongest remaining signal
 * that the site was generated rather than written, and unlike a layout quirk it is the
 * kind a patient can actually read and disbelieve.
 *
 * An absent blog costs a clinic nothing. A blog of invented articles costs it the first
 * reader who notices.
 *
 * WHAT GOES: blog.html in both trees, its six gen_blog-image-*.jpg files, and every
 * navigation and footer link pointing at it. WHAT STAYS: everything else, including the
 * footer's Navigation column, which simply loses one of its four entries.
 *
 * The script is idempotent: it checks for each thing before removing it.
 */

import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PAGE = 'blog.html';

function pages() {
  const out = [];
  for (const dir of ['', 'variant-blue']) {
    const base = dir ? join(ROOT, dir) : ROOT;
    if (!existsSync(base)) continue;
    for (const f of readdirSync(base)) {
      if (f.endsWith('.html')) out.push(dir ? `${dir}/${f}` : f);
    }
  }
  return out.sort();
}

const counts = (s) => ({
  a: (s.match(/<a\b/g) || []).length,
  aClose: (s.match(/<\/a>/g) || []).length,
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  li: (s.match(/<li\b/g) || []).length,
  liClose: (s.match(/<\/li>/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

/* ── 1. Links, on every page that carries one ────────────────────────────── */

let linksRemoved = 0;
let pagesTouched = 0;

for (const rel of pages()) {
  if (rel.endsWith(PAGE)) continue; // the page itself goes in step 2
  const file = join(ROOT, rel);
  const original = readFileSync(file, 'utf8');
  if (!original.includes(`"${PAGE}"`)) continue;
  let s = original;
  const before = counts(s);

  /* Each link is an <a> wrapping a label. Some sit inside a list item of their own, and
     leaving an empty <li> behind would show as a gap in the menu, so the list item goes
     with it where there is one. */
  let removed = 0;
  const re = new RegExp(
    '(?:<li\\b[^>]*>\\s*)?<a\\b[^>]*href="' + PAGE + '"[^>]*>[\\s\\S]*?</a>(?:\\s*</li>)?\\s*',
    'g'
  );
  s = s.replace(re, (m) => {
    // A match that swallowed more than one anchor means the lazy match ran past its
    // own closing tag into a later link; leave those alone rather than guess.
    if ((m.match(/<a\b/g) || []).length !== 1) return m;
    removed += 1;
    return '';
  });

  if (!removed) continue;

  const after = counts(s);
  if (
    after.a !== before.a - removed ||
    after.aClose !== before.aClose - removed ||
    after.div !== after.divClose ||
    after.li !== after.liClose ||
    after.script !== before.script
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  linksRemoved += removed;
  pagesTouched += 1;
  console.log(`  ${rel.padEnd(26)} ${removed} link(s) removed`);
}

/* ── 2. The pages themselves ─────────────────────────────────────────────── */

let deleted = 0;
for (const rel of [PAGE, `variant-blue/${PAGE}`]) {
  const p = join(ROOT, rel);
  if (!existsSync(p)) continue;
  unlinkSync(p);
  deleted += 1;
  console.log(`  ${rel} deleted`);
}

/* ── 3. Their illustrations ──────────────────────────────────────────────── */

let images = 0;
for (const dir of ['assets/img', 'variant-blue/assets/img']) {
  const base = join(ROOT, dir);
  if (!existsSync(base)) continue;
  for (const f of readdirSync(base)) {
    if (!/^gen_blog-image-\d+\.jpg$/.test(f)) continue;
    // Only if nothing still references it, so a reused photograph is never deleted.
    const used = pages().some((rel) => {
      const q = join(ROOT, rel);
      return existsSync(q) && readFileSync(q, 'utf8').includes(f);
    });
    if (used) {
      console.log(`  ${f} still referenced — kept`);
      continue;
    }
    unlinkSync(join(base, f));
    images += 1;
  }
}
if (images) console.log(`  ${images} blog illustration(s) deleted`);

console.log(
  `\n${linksRemoved} link(s) on ${pagesTouched} page(s), ` +
  `${deleted} page(s) deleted, ${images} image(s) deleted`
);
