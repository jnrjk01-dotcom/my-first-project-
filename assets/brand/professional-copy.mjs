/**
 * Copy pass: fix what is broken, and take the marketing register down a few notches.
 *
 *   node assets/brand/professional-copy.mjs
 *
 * The site reads like a template because of its words rather than its layout. Three
 * things were doing most of that work.
 *
 * BROKEN TEXT. "Compassionate &Care" and "Honesty &Trust" render with a stray ampersand
 * jammed against the next word, and the team paragraph ends mid-sentence: "helping
 * patients achieve healthier." A visitor does not think "template", they think nobody
 * proofread this, which is worse on a clinic site than on most.
 *
 * A CONTRADICTION. That same paragraph talks about "each member of our clinical staff"
 * on a page that lists one dentist. Copy that describes a bigger practice than the one
 * you have is the tell that the words came from somewhere else.
 *
 * REGISTER. "Let's Talk Teeth, We're Just a Smile Away" and "We Treat You Like Family,
 * Because Your Smile Matters Most" are the voice of a template, not of a dental surgery.
 * The replacements say the same thing plainly. Nothing is removed: every section keeps
 * its place, its structure and its call to action.
 *
 * The highlighted span is preserved in each headline, because the design colours the
 * second half of a heading and losing it would flatten the type.
 *
 * The script is idempotent: each replacement checks for its own result first.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/**
 * [find, replace, why]. Plain strings, not patterns, so a partial match cannot mangle
 * something adjacent.
 */
const EDITS = [
  // ── Broken text ────────────────────────────────────────────────────────────
  ['Compassionate &amp;Care', 'Compassionate Care',
   'stray ampersand rendered as "Compassionate &Care"'],
  // "Our Honesty &Trust" sat in a list whose other items are plain noun phrases
  // ("Compassionate Care", "Advanced Technology"), so the possessive goes with the
  // stray ampersand.
  ['Our Honesty &amp;Trust', 'Honesty &amp; Trust',
   'stray ampersand, and an odd possessive, in "Our Honesty &Trust"'],
  ['Honesty &amp;Trust', 'Honesty &amp; Trust',
   'stray ampersand rendered as "Honesty &Trust"'],

  // ── Contradiction + unfinished sentence ────────────────────────────────────
  ['Each member of our clinical staff is not only highly qualified but deeply passionate about helping patients achieve healthier.',
   'Every treatment at the practice is carried out by a qualified clinician, who will explain what is happening and why before anything begins.',
   'sentence ended mid-clause, and described a staff of many on a page listing one dentist'],

  // ── Register ───────────────────────────────────────────────────────────────
  ['Let’s Talk Teeth, We’re <span class="text-highlighted">Just a Smile Away</span>',
   'Speak to Us About <span class="text-highlighted">Your Treatment</span>',
   'closing call to action read as a slogan rather than an invitation'],
  ['Your health journey starts with one simple step, we’re here to guide you.',
   'Call the practice or send a WhatsApp message, and we will find you an appointment.',
   'closing paragraph said nothing a patient could act on'],
  ['We Treat You Like Family, Because Your <span class="text-highlighted">Smile Matters Most</span>',
   'Careful Dentistry, Explained <span class="text-highlighted">Before It Begins</span>',
   '"we treat you like family" is template copy, and claims a relationship rather than a standard'],

  // "Get Started" says nothing about what starts. It opens a WhatsApp message to the
  // practice, so it now says so; a button whose label matches its destination is most of
  // what makes an interface feel trustworthy.
  ['<div class="button_text">Get Started</div>', '<div class="button_text">Book an Appointment</div>',
   '"Get Started" did not say what it does'],

  // ── Invented figure ────────────────────────────────────────────────────────
  // Handled separately below, because it is markup rather than a phrase.
];

/**
 * [pattern, replace, why]. For headings the template split across lines, where the
 * highlighted span wraps only part of the phrase and the rest follows after a newline,
 * so a plain string cannot match it.
 */
const REGEX_EDITS = [
  [/Our\s*<span class="text-highlighted">Experts<\/span>\s*in Oral Health/g,
   'The Clinician <span class="text-highlighted">Treating You</span>',
   '"our experts in oral health" is plural on a page that lists one dentist'],
];

/** The About hero's counter. There is no source for this number. */
const STAT_LABEL = 'Smiles Transformed';

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
    if (a && a.index < b.index) { depth += 1; i = a.index + a[0].length; }
    else { depth -= 1; i = b.index + b[0].length; if (depth === 0) return i; }
  }
  return -1;
}

let changed = 0;
const applied = new Map();

for (const rel of pages()) {
  const file = join(ROOT, rel);
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);
  const done = [];

  for (const [re_, repl, why] of REGEX_EDITS) {
    if (!re_.test(s)) { re_.lastIndex = 0; continue; }
    re_.lastIndex = 0;
    s = s.replace(re_, repl);
    done.push(why);
    applied.set(why, (applied.get(why) || 0) + 1);
  }

  for (const [find, repl, why] of EDITS) {
    if (!s.includes(find)) continue;
    s = s.split(find).join(repl);
    done.push(why);
    applied.set(why, (applied.get(why) || 0) + 1);
  }

  /* The invented counter, removed with its wrapper so no empty cell is left behind. */
  const label = s.indexOf(STAT_LABEL);
  if (label !== -1) {
    const openRe = /<div\b[^>]*\babout-hero_info-item\b[^>]*>/g;
    let open = -1;
    let m;
    while ((m = openRe.exec(s)) !== null) {
      if (m.index > label) break;
      open = m.index;
    }
    const end = open === -1 ? -1 : endOfDiv(s, open);
    if (open !== -1 && end > label) {
      s = s.slice(0, open) + s.slice(end);
      done.push('removed the invented "10k+ Smiles Transformed" figure');
      applied.set('invented figure', (applied.get('invented figure') || 0) + 1);
    } else {
      console.error(`  ${rel}: found the figure but could not isolate its block — left alone`);
      process.exitCode = 1;
    }
  }

  if (!done.length) continue;

  const after = counts(s);
  if (
    after.div !== after.divClose ||
    after.section !== before.section ||
    after.script !== before.script
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  changed += 1;
  console.log(`  ${rel.padEnd(26)} ${done.length} change(s)`);
}

console.log(`\n${changed} page(s) updated`);
if (applied.size) {
  console.log('\nwhat changed and why:');
  for (const [why, n] of applied) console.log(`  x${n}  ${why}`);
} else {
  console.log('  nothing left to change');
}
