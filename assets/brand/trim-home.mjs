/**
 * Remove the home page sections and footer columns the practice does not have content for.
 *
 *   node assets/brand/trim-home.mjs
 *
 * HOME PAGE: the story, testimonial and blog sections all came from the template and are
 * still carrying its copy. Rather than leave invented history, invented patient quotes
 * and articles that do not exist on a live clinic site, they come out.
 *
 * FOOTER: the Legal and "Follow us" columns come out too. The practice has no social
 * accounts, so those four links pointed at "#", and it does not want the legal column.
 *
 * The footer is shared markup, so both columns are removed from every page that carries
 * it, not just the home page: a footer that differs between pages reads as a bug. That
 * leaves terms.html, cookies.html and licenses.html with nothing linking to them; the
 * pages themselves are untouched, and privacy.html is still reached from the bar at the
 * very bottom of the footer.
 *
 * The script is idempotent: re-running it finds nothing left to remove and says so.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Home page sections to drop, by their opening tag's class attribute. */
const SECTIONS = ['section_story', 'section_testimonial is-home', 'section_blog'];

/** Footer columns to drop, by the text of their heading. */
const COLUMNS = ['Legal', 'Follow us'];

const CSS_MARKER = '/* --- footer: single link column --- */';
const CSS = `
${CSS_MARKER}
/* The footer menu was a three-column grid holding Navigation, Legal and Follow us. With
   only Navigation left the other two tracks would stay behind as empty space beside it,
   so the grid follows the number of columns actually present. The selector matches only
   when there is exactly one column, so restoring a second brings the old layout back. */
.footer_menu:not(:has(.footer-links-column ~ .footer-links-column)) {
  grid-template-columns: max-content;
  max-width: none;
}
`;

/* ── Helpers ─────────────────────────────────────────────────────────────── */

const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  sectionClose: (s.match(/<\/section>/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
  scriptClose: (s.match(/<\/script>/g) || []).length,
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

/** Every HTML page in both trees. */
function pages() {
  const out = [];
  for (const dir of ['', 'variant-blue']) {
    const base = dir ? join(ROOT, dir) : ROOT;
    for (const f of readdirSync(base)) {
      if (f.endsWith('.html')) out.push(dir ? `${dir}/${f}` : f);
    }
  }
  return out;
}

/* ── 1. Home page sections ───────────────────────────────────────────────── */

let sectionsRemoved = 0;
for (const rel of ['index.html', 'variant-blue/index.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);
  const done = [];

  for (const cls of SECTIONS) {
    const open = s.indexOf(`<section class="${cls}"`);
    if (open === -1) continue;
    const end = endOfElement(s, open, 'section');
    if (end === -1) {
      console.error(`  ${rel}: could not close <section class="${cls}"> — skipped`);
      process.exitCode = 1;
      continue;
    }
    const span = s.slice(open, end);
    // Sanity: the span must be one section and must not swallow the footer or a script.
    if (
      span.length > 60000 ||
      /<\/(footer|main|body)>/i.test(span) ||
      (span.match(/<section\b/g) || []).length !== 1
    ) {
      console.error(`  ${rel}: <section class="${cls}"> failed its sanity check — skipped`);
      process.exitCode = 1;
      continue;
    }
    s = s.slice(0, open) + s.slice(end);
    done.push(`${cls} (-${span.length.toLocaleString()}b)`);
  }

  if (!done.length) {
    console.log(`  ${rel.padEnd(26)} sections already removed`);
    continue;
  }

  const after = counts(s);
  if (
    after.div !== after.divClose ||
    after.section !== after.sectionClose ||
    after.section !== before.section - done.length ||
    after.script !== before.script ||
    after.script !== after.scriptClose
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    writeFileSync(file, original);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  sectionsRemoved += 1;
  console.log(`  ${rel.padEnd(26)} removed ${done.join(', ')}`);
}

/* ── 2. Footer columns, on every page that carries the footer ────────────── */

let footersChanged = 0;
for (const rel of pages()) {
  const file = join(ROOT, rel);
  const original = readFileSync(file, 'utf8');
  if (!original.includes('footer-links-column')) continue;
  let s = original;
  const before = counts(s);
  const done = [];

  for (const heading of COLUMNS) {
    // Find the column by its heading, then the element that wraps it. Matching the
    // wrapper directly is not enough: the three columns' opening tags differ only in a
    // Webflow node id, and the first one is the column that stays.
    const title = s.indexOf(`class="footer-menu_title">${heading}<`);
    if (title === -1) continue;
    const openRe = /<div\b[^>]*\bfooter-links-column\b[^>]*>/g;
    let open = -1;
    let m;
    while ((m = openRe.exec(s)) !== null) {
      if (m.index > title) break;
      open = m.index;
    }
    if (open === -1) {
      console.error(`  ${rel}: no column wrapper found for "${heading}" — skipped`);
      process.exitCode = 1;
      continue;
    }
    const end = endOfElement(s, open, 'div');
    const span = end === -1 ? '' : s.slice(open, end);
    if (end === -1 || end < title || span.length > 12000 || !span.includes(`>${heading}<`)) {
      console.error(`  ${rel}: column "${heading}" failed its sanity check — skipped`);
      process.exitCode = 1;
      continue;
    }
    s = s.slice(0, open) + s.slice(end);
    done.push(heading);
  }

  if (!done.length) continue;

  const after = counts(s);
  if (
    after.div !== after.divClose ||
    after.section !== before.section ||
    after.script !== before.script
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted while trimming the footer`);
    writeFileSync(file, original);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  footersChanged += 1;
}
if (footersChanged) {
  console.log(`  footer columns ${COLUMNS.join(' + ')} removed from ${footersChanged} page(s)`);
} else {
  console.log('  footer columns already removed');
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
  console.log(`  ${css.padEnd(34)} footer styles ${at === -1 ? 'added' : 'refreshed'}`);
}

console.log(`\n${sectionsRemoved} home page(s) trimmed, ${footersChanged} footer(s) trimmed`);
