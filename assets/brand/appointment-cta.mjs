/**
 * Point the appointment buttons at the clinic's WhatsApp instead of Calendly.
 *
 *   node assets/brand/appointment-cta.mjs
 *
 * The template shipped every call to action at a Calendly account belonging to someone
 * unconnected to the practice. Booking here happens over WhatsApp, and the number is
 * already wired into the navbar and the mobile booking bar, so the buttons now open the
 * same chat with the same prefilled message. Reusing the exact URL already in the markup
 * keeps one booking destination rather than two that can drift apart.
 *
 * WHICH BUTTONS. Only the ones whose label actually asks for an appointment, listed in
 * LABELS below. The match is on the button's visible text rather than on its position or
 * its Webflow variant class, because the same variant is used for buttons that mean
 * different things: "Make A Call" belongs on a tel: link and "Get Started" is not
 * necessarily a booking action, so both are deliberately left alone and reported at the
 * end for a decision.
 *
 * The script is idempotent: a button already pointing at the WhatsApp URL is skipped, so
 * re-running changes nothing.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Visible button text, lowercased, that should open the booking chat. */
const LABELS = new Set(['get appointment', 'book appointment', 'book an appointment']);

/** The booking chat, taken verbatim from the navbar link already in the pages. */
const WA =
  'https://wa.me/263778398111?text=Hi%20Dental%20Care%20Centre%2C' +
  '%20I%20would%20like%20to%20book%20an%20appointment.';

const OLD = /^https:\/\/calendly\.com\//;

/** Every HTML page in both trees. */
function pages() {
  const out = [];
  for (const dir of ['', 'variant-blue']) {
    const base = dir ? join(ROOT, dir) : ROOT;
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
  script: (s.match(/<script\b/g) || []).length,
});

const text = (html) => html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();

let changed = 0;
let retargeted = 0;
const skipped = [];

for (const rel of pages()) {
  const file = join(ROOT, rel);
  const original = readFileSync(file, 'utf8');
  if (!original.includes('calendly.com')) continue;
  const before = counts(original);

  let s = '';
  let i = 0;
  let hits = 0;
  // Walk the anchors rather than regex-replacing every calendly href at once: the
  // decision depends on the anchor's inner text, which a single-pass href replace
  // cannot see.
  const re = /<a\b[^>]*\bhref="([^"]+)"[^>]*>/g;
  let m;
  while ((m = re.exec(original)) !== null) {
    const end = original.indexOf('</a>', m.index + m[0].length);
    if (end === -1) continue;
    const label = text(original.slice(m.index + m[0].length, end)).toLowerCase();
    if (!OLD.test(m[1])) continue;
    if (!LABELS.has(label)) {
      skipped.push(`${rel}: "${label}"`);
      continue;
    }
    s += original.slice(i, m.index) + m[0].replace(`href="${m[1]}"`, `href="${WA}"`);
    i = m.index + m[0].length;
    hits += 1;
  }
  s += original.slice(i);

  if (!hits) continue;

  const after = counts(s);
  if (
    after.a !== before.a ||
    after.aClose !== before.aClose ||
    after.div !== before.div ||
    after.divClose !== before.divClose ||
    after.script !== before.script
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  changed += 1;
  retargeted += hits;
  console.log(`  ${rel.padEnd(26)} ${hits} button(s) -> WhatsApp`);
}

if (!changed) console.log('  every appointment button already points at WhatsApp');
console.log(`\n${retargeted} button(s) on ${changed} page(s)`);

if (skipped.length) {
  console.log('\nStill on Calendly, left alone because the label is not a booking action:');
  for (const s of [...new Set(skipped)]) console.log(`  ${s}`);
}
