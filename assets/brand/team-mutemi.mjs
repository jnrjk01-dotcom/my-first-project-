/**
 * Reduce the team to the one dentist the practice actually has.
 *
 *   node assets/brand/team-mutemi.mjs
 *
 * The home page carried three invented paediatric dentists and the about page six, all
 * with AI portraits and all but two labelled "Pediatric Dentist". The practice has one:
 * Dr. Mutemi. Both lists collapse to a single card with his own photograph.
 *
 * The card loses its Instagram and X links along with the rest: the practice has no
 * social accounts, which is the same reason the footer's "Follow us" column came off.
 *
 * The home page's "View All Doctors" button goes too. With one dentist there is no list
 * to view, and its href was broken anyway ("https://about#team-members", an artefact of
 * an earlier rename that dropped the .html).
 *
 * The section background changes from the AI clinic interior to the practice's own
 * waiting area. It is one CSS rule, so it applies to both pages that carry the section.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const NAME = 'Dr. Mutemi';
const ROLE = 'Pediatric Dentist';
const PORTRAIT = 'team-mutemi.jpg';
const BG = 'team-bg-clinic.jpg';
const OLD_BG = 'gen_team-bg.jpg';

/* ── Styles ──────────────────────────────────────────────────────────────── */

const CSS_MARKER = '/* --- team: single member + photo overlay --- */';
const CSS_TEAL = `
${CSS_MARKER}
/* The sheet above claims a cyan overlay on this section but only ever set a background
   image; the AI interior it used was dark enough that white text held anyway. The
   practice's own waiting-area photograph is bright, and without a real overlay the
   heading measured under 2:1 against it. The gradient is stated here, over the image,
   and needs !important to beat the earlier rule's own !important. */
.section_team {
  background-image: linear-gradient(115deg, rgba(2,47,52,.90), rgba(2,47,52,.72)),
                    url('../img/team-bg-clinic.jpg') !important;
}
/* One dentist, so the three-column grid would leave two empty tracks beside the card.
   Scoped with :has to exactly one item, so adding a colleague restores the old layout. */
.team_list:not(:has(.w-dyn-item ~ .w-dyn-item)) {
  grid-template-columns: minmax(0, 400px);
  justify-content: center;
}
`;
const CSS_BLUE = CSS_TEAL.replace(/rgba\(2,47,52,/g, 'rgba(6,24,46,');

const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  sectionClose: (s.match(/<\/section>/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

/** End index of the element opened at `open`, counting nested tags of the same name. */
function endOfElement(html, open, name) {
  const o = new RegExp(`<${name}\\b`, 'gi');
  const c = new RegExp(`</${name}\\s*>`, 'gi');
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

/* The card is written from the page's own first card so the Webflow wrappers the image
   animation depends on are carried over verbatim rather than guessed at. */
function card(sample) {
  let c = sample;
  c = c.replace(/(<img[^>]*\ssrc=")[^"]*(")/, `$1assets/img/${PORTRAIT}$2`);
  c = c.replace(/(<img[^>]*\salt=")[^"]*(")/, `$1${NAME}$2`);
  c = c.replace(/(\sclass="team-menmber_name">)[^<]*(<)/, `$1${NAME}$2`);
  c = c.replace(/(\sclass="team-menuber_designation">)[^<]*(<)/, `$1${ROLE}$2`);
  // srcset would still point at the responsive variants of the old photograph.
  c = c.replace(/\ssrcset="[^"]*"/g, '').replace(/\ssizes="[^"]*"/g, '');
  // No social accounts, so no social row.
  const soc = c.indexOf('<div class="team-menuber_social">');
  if (soc !== -1) {
    const end = endOfElement(c, soc, 'div');
    if (end !== -1) c = c.slice(0, soc) + c.slice(end);
  }
  return c;
}

let changed = 0;
for (const rel of ['index.html', 'about.html', 'variant-blue/index.html', 'variant-blue/about.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);

  if (s.includes(`>${NAME}<`)) {
    console.log(`  ${rel.padEnd(28)} already shows ${NAME} only`);
    continue;
  }

  const listOpen = s.indexOf('<div role="list" class="team_list');
  if (listOpen === -1) {
    console.error(`  ${rel}: no team list found — skipped`);
    process.exitCode = 1;
    continue;
  }
  const listEnd = endOfElement(s, listOpen, 'div');
  if (listEnd === -1) {
    console.error(`  ${rel}: could not close the team list — skipped`);
    process.exitCode = 1;
    continue;
  }
  const list = s.slice(listOpen, listEnd);
  const openTag = /<div role="list" class="team_list[^"]*"[^>]*>/.exec(list);
  const first = list.indexOf('<div role="listitem"');
  if (!openTag || first === -1) {
    console.error(`  ${rel}: the team list is not shaped as expected — skipped`);
    process.exitCode = 1;
    continue;
  }
  const firstEnd = endOfElement(list, first, 'div');
  const sample = list.slice(first, firstEnd);
  const cards = (list.match(/<div role="listitem"/g) || []).length;
  if (firstEnd === -1 || !sample.includes('team-menmber_name')) {
    console.error(`  ${rel}: the first team card failed its sanity check — skipped`);
    process.exitCode = 1;
    continue;
  }

  s = s.slice(0, listOpen) + openTag[0] + card(sample) + '</div>' + s.slice(listEnd);

  // "View All Doctors" only makes sense with a list to view. Found by walking back from
  // the label to its wrapper rather than matching the wrapper's tag: it carries a
  // data-w-id and an inline style ahead of the class, so an exact-string match misses it.
  const label = s.indexOf('>View All Doctors<');
  if (label !== -1) {
    const openRe = /<div\b[^>]*\bbutton-container\b[^>]*>/g;
    let btn = -1;
    let m;
    while ((m = openRe.exec(s)) !== null) {
      if (m.index > label) break;
      btn = m.index;
    }
    const btnEnd = btn === -1 ? -1 : endOfElement(s, btn, 'div');
    const span = btnEnd === -1 ? '' : s.slice(btn, btnEnd);
    if (btnEnd !== -1 && btnEnd > label && span.includes('View All Doctors') && span.length < 4000) {
      s = s.slice(0, btn) + s.slice(btnEnd);
    } else {
      console.error(`  ${rel}: could not isolate the "View All Doctors" button — left in place`);
      process.exitCode = 1;
    }
  }

  const after = counts(s);
  if (
    after.div !== after.divClose ||
    after.section !== before.section ||
    after.sectionClose !== before.sectionClose ||
    after.script !== before.script
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  changed += 1;
  console.log(`  ${rel.padEnd(28)} ${cards} card(s) -> 1 (${NAME})`);
}

/* Assets, mirrored: the trees have separate image directories. */
for (const f of [PORTRAIT, BG]) {
  const src = join(ROOT, 'assets/img', f);
  if (!existsSync(src)) {
    console.error(`  assets/img/${f} is missing`);
    process.exitCode = 1;
    continue;
  }
  const dst = join(ROOT, 'variant-blue/assets/img', f);
  const bytes = readFileSync(src);
  if (!existsSync(dst) || Buffer.compare(readFileSync(dst), bytes) !== 0) {
    writeFileSync(dst, bytes);
    console.log(`  ${f} mirrored into variant-blue/assets/img/`);
  }
}

for (const [css, block] of [
  ['assets/css/lumora.css', CSS_TEAL],
  ['variant-blue/assets/css/lumora.css', CSS_BLUE],
]) {
  const p = join(ROOT, css);
  let sheet = readFileSync(p, 'utf8');
  const repointed = sheet.includes(`../img/${OLD_BG}`);
  if (repointed) sheet = sheet.replace(`../img/${OLD_BG}`, `../img/${BG}`);

  const at = sheet.indexOf(CSS_MARKER);
  if (at !== -1) {
    const next = sheet.indexOf('\n/* --- ', at + CSS_MARKER.length);
    sheet = (sheet.slice(0, at) + (next === -1 ? '' : sheet.slice(next + 1))).replace(/\s+$/, '') + '\n';
  }
  writeFileSync(p, sheet + block);
  console.log(
    `  ${css.padEnd(34)} ${repointed ? `background -> ${BG}, ` : ''}` +
      `overlay + single-card grid ${at === -1 ? 'added' : 'refreshed'}`
  );
}

console.log(`\n${changed} page(s) updated`);
