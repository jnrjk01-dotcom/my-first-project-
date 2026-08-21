/**
 * Reorder the home page service cards so the highest-value work leads.
 *
 *   node assets/brand/reorder-home-services.mjs
 *
 * The template shipped them in clinical order, opening on preventive dentistry. The
 * practice wants orthodontics first and preventive last, which also matches the group
 * order already used on the services page.
 *
 * ORDER IS DECLARED, NOT RELATIVE, so the script is idempotent: it reads the four cards,
 * arranges them by title into ORDER, and writes them back. Running it twice changes
 * nothing the second time.
 *
 * Two things stay with the position rather than travelling with the card: the [01]-[04]
 * numeral, which has to read in sequence left to right, and the card's tint, which is a
 * four-step wash across the row and would otherwise come out shuffled. Everything else
 * (title, copy, treatment list, photo slot, "View Details" target) moves with its card.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Card titles, in the order they should appear. */
const ORDER = [
  'Orthodontics',
  'Cosmetic dentistry',
  'Restorative treatments',
  'Preventive dentistry',
];

/** Tint per position, left to right. Unchanged from the template. */
const TINTS = ['#f3f6ff', '#fef5ec', '#effff7', '#f7efff'];

const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

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

let changed = 0;
for (const rel of ['index.html', 'variant-blue/index.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  const before = counts(original);

  const secStart = original.indexOf('<section class="section_service"');
  if (secStart === -1) {
    console.error(`  ${rel}: services section not found — skipped`);
    process.exitCode = 1;
    continue;
  }
  const secEnd = original.indexOf('</section>', secStart);

  // Collect the four cards. Bounded to the services section so the listitem pattern
  // cannot pick up a collection item from somewhere else on the page.
  const cards = [];
  const re = /<div role="listitem"[^>]*\bservice_item-wrap\b[^>]*>/g;
  re.lastIndex = secStart;
  let m;
  while ((m = re.exec(original)) !== null) {
    if (m.index > secEnd) break;
    const end = endOfDiv(original, m.index);
    if (end === -1 || end > secEnd) {
      console.error(`  ${rel}: could not close a service card — skipped`);
      process.exitCode = 1;
      cards.length = 0;
      break;
    }
    cards.push({ start: m.index, end, html: original.slice(m.index, end) });
    re.lastIndex = end;
  }
  if (cards.length !== ORDER.length) {
    if (cards.length) {
      console.error(`  ${rel}: expected ${ORDER.length} cards, found ${cards.length} — skipped`);
      process.exitCode = 1;
    }
    continue;
  }

  // Index each card by its title, so the order is read from the markup rather than
  // assumed from the current positions.
  const byTitle = new Map();
  for (const c of cards) {
    const t = /service-item_info-title">([^<]*)</.exec(c.html);
    if (!t) {
      console.error(`  ${rel}: a service card has no title — skipped`);
      process.exitCode = 1;
      byTitle.clear();
      break;
    }
    byTitle.set(t[1].trim(), c);
  }
  if (byTitle.size !== ORDER.length) continue;

  const missing = ORDER.filter((t) => !byTitle.has(t));
  if (missing.length) {
    console.error(`  ${rel}: no card titled ${missing.join(', ')} — skipped`);
    process.exitCode = 1;
    continue;
  }

  const arranged = ORDER.map((title, i) => {
    let html = byTitle.get(title).html;
    // The numeral and the tint belong to the position, not to the card.
    const n = String(i + 1).padStart(2, '0');
    html = html.replace(
      /(<div class="service-item_number_text">)\d{2}(<\/div>)/,
      `$1${n}$2`
    );
    html = html.replace(/style="background-color:#[0-9a-fA-F]+"/, `style="background-color:${TINTS[i]}"`);
    return html;
  });

  // Keep each gap between cards exactly as it was rather than reusing the first one:
  // the indentation between them is not guaranteed to be identical, and preserving it
  // is what makes the byte-length check below a real invariant.
  let s = original.slice(0, cards[0].start);
  for (let i = 0; i < arranged.length; i += 1) {
    s += arranged[i];
    if (i < arranged.length - 1) s += original.slice(cards[i].end, cards[i + 1].start);
  }
  s += original.slice(cards[cards.length - 1].end);

  if (s === original) {
    console.log(`  ${rel.padEnd(26)} already in order`);
    continue;
  }

  const after = counts(s);
  if (
    s.length !== original.length ||
    after.div !== after.divClose ||
    after.div !== before.div ||
    after.section !== before.section ||
    after.script !== before.script
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    console.error(`    length ${original.length} -> ${s.length}`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  changed += 1;
  console.log(`  ${rel.padEnd(26)} ${ORDER.map((t, i) => `[0${i + 1}] ${t}`).join('  ')}`);
}

console.log(`\n${changed} page(s) reordered`);
