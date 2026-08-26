/**
 * Cut the about page back to the two sections the practice wants.
 *
 *   node assets/brand/trim-about.mjs
 *
 * What is left is the hero, which introduces the practice with the staff photograph, and
 * the dentist. Everything between them came from the template and was invented:
 *
 *   section_story     a twenty year history that is not this practice's
 *   section_success   50K+ patient visits, 12 specialists on board, a 4.98 rating
 *   section_job       three vacancies, all located in New York
 *   section_awards    five awards and accreditations the practice does not hold
 *   section_location  branches in New York, Los Angeles and London
 *
 * The awards and the branches were the urgent ones. Fabricated accreditations on a
 * healthcare site and addresses on three continents are not padding, they are claims a
 * patient could act on.
 *
 * The hero's "25+ Years of Dental Excellence" counter goes for the same reason. Its
 * sibling, "10k+ Smiles Transformed", is left because only the first was named, though
 * it is no more verifiable than the one being removed.
 *
 * The closing call to action and the footer stay: they are site furniture that every
 * page carries, not about-page content.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const SECTIONS = [
  'section_story',
  'section_success',
  'section_job',
  'section_awards',
  'section_location',
];

/** The hero counter to drop, identified by its label rather than its position. */
const COUNTER = 'Years of Dental Excellence';

const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  sectionClose: (s.match(/<\/section>/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
  scriptClose: (s.match(/<\/script>/g) || []).length,
});

function endOfElement(html, open, name) {
  const o = new RegExp(`<${name}\\b`, 'gi');
  const c = new RegExp(`</${name}\\s*>`, 'gi');
  let depth = 0;
  let i = open;
  while (i < html.length) {
    o.lastIndex = i; c.lastIndex = i;
    const a = o.exec(html); const b = c.exec(html);
    if (!b) return -1;
    if (a && a.index < b.index) { depth += 1; i = a.index + a[0].length; }
    else { depth -= 1; i = b.index + b[0].length; if (depth === 0) return i; }
  }
  return -1;
}

let changed = 0;
for (const rel of ['about.html', 'variant-blue/about.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);
  const done = [];

  for (const cls of SECTIONS) {
    // Matched by pattern: section_team carries an id ahead of its class, and any of these
    // could pick up another attribute later.
    const re = new RegExp(`<section\\b[^>]*\\b${cls}\\b[^>]*>`);
    const m = re.exec(s);
    if (!m) continue;
    const end = endOfElement(s, m.index, 'section');
    if (end === -1) {
      console.error(`  ${rel}: could not close ${cls} — skipped`);
      process.exitCode = 1;
      continue;
    }
    const span = s.slice(m.index, end);
    // Sanity: one section, and it must not have swallowed the footer or a script.
    if (
      (span.match(/<section\b/g) || []).length !== 1 ||
      /<\/(footer|main|body)>/i.test(span) ||
      span.includes('dcc-profile')
    ) {
      console.error(`  ${rel}: ${cls} failed its sanity check — skipped`);
      process.exitCode = 1;
      continue;
    }
    s = s.slice(0, m.index) + s.slice(end);
    done.push(`${cls} (-${span.length.toLocaleString()}b)`);
  }

  // The hero counter, found from its label back to the item that wraps it.
  const label = s.indexOf(`>${COUNTER}<`);
  if (label !== -1) {
    const openRe = /<div\b[^>]*\babout-hero_info-item\b[^>]*>/g;
    let open = -1;
    let m;
    while ((m = openRe.exec(s)) !== null) {
      if (m.index > label) break;
      open = m.index;
    }
    const end = open === -1 ? -1 : endOfElement(s, open, 'div');
    const span = end === -1 ? '' : s.slice(open, end);
    if (end !== -1 && end > label && span.includes(COUNTER) && span.length < 3000) {
      s = s.slice(0, open) + s.slice(end);
      done.push(`hero counter "${COUNTER}"`);
    } else {
      console.error(`  ${rel}: could not isolate the "${COUNTER}" counter — left in place`);
      process.exitCode = 1;
    }
  }

  if (!done.length) {
    console.log(`  ${rel.padEnd(28)} already trimmed`);
    continue;
  }

  const after = counts(s);
  const removedSections = done.filter((d) => d.startsWith('section_')).length;
  if (
    after.div !== after.divClose ||
    after.section !== after.sectionClose ||
    after.section !== before.section - removedSections ||
    after.script !== before.script ||
    after.script !== after.scriptClose
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  changed += 1;
  const saved = original.length - s.length;
  console.log(`  ${rel.padEnd(28)} -${saved.toLocaleString()} bytes`);
  for (const d of done) console.log(`      removed ${d}`);
}

console.log(`\n${changed} page(s) trimmed`);
