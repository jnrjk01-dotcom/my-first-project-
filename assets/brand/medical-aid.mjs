/**
 * Add the "Medical Aid We Accept" band to the home page.
 *
 *   node assets/brand/medical-aid.mjs
 *
 * A row of the societies the practice bills, sitting between the outreach banner and the
 * Get In Touch section, in the pattern the practice pointed at on orthodontist.co.zw.
 * It is the last thing a visitor reads before the closing call to action, which is where
 * "can I actually use my cover here" belongs.
 *
 * LOGOS. The eleven files supplied are all opaque, white-backed, and carry wildly
 * different amounts of baked-in margin, so they were first cropped to their own ink and
 * scaled to a common height (see the trim step described in the commit). Because they
 * are white-backed rather than transparent, each sits on a white tile; on a transparent
 * set the tiles could go.
 *
 * The section tag is cloned from one already on the page rather than written out here:
 * the two trees use different eyebrow icons, and cloning keeps each correct without this
 * script knowing about either. The clone deliberately drops the wrapper's data-w-id, so
 * the band never depends on the reveal engine and cannot end up stuck at opacity 0.
 *
 * The script is idempotent: it looks for the band before adding one.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Alphabetical: no society is being ranked above another. */
const LOGOS = [
  ['aid-alliance-health.jpg', 'Alliance Health', 300, 67],
  ['aid-bonvie.jpg', 'Bonvie Medical Aid Scheme', 382, 158],
  ['aid-cellmed.jpg', 'Cellmed Health Medical Fund', 350, 200],
  ['aid-cimas.jpg', 'Cimas', 237, 200],
  ['aid-fbc-health.jpg', 'FBC Health', 174, 200],
  ['aid-fidelity-life.jpg', 'Fidelity Life Medical Aid Society', 276, 200],
  ['aid-first-mutual.jpg', 'First Mutual Health', 447, 161],
  ['aid-generation-health.jpg', 'Generation Health Medical Fund', 289, 124],
  ['aid-maisha.jpg', 'Maisha Health Fund', 411, 200],
  ['aid-masca.jpg', 'Masca Medical Aid Society Central Africa', 460, 161],
  ['aid-psmas.jpg', 'PSMAS Premier Service Medical Aid Society', 200, 121],
];

const TITLE = 'Medical Aid <span class="text-highlighted">We Accept</span>';
const PARA =
  'These are the societies we work with. Bring your medical aid card and a form of ID ' +
  'to your appointment, and give us a call first if you are not sure whether yours is ' +
  'covered.';

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/* ── Styles ──────────────────────────────────────────────────────────────── */

const CSS_MARKER = '/* --- medical aid band --- */';
const CSS = `
${CSS_MARKER}
/* Sits between the outreach section and the dark closing call to action. It carries the
   same light ground as the outreach section above it so the two read as one light band
   before the page goes dark, with the logo tiles picked out in white against it. */
.section_aid { background-color: #f4f7fa; }
.aid_header { max-width: 640px; margin: 0 auto 40px; text-align: center; }
.aid_header .section_tag { display: inline-flex; }
.aid_title { margin: 16px 0 14px; color: var(--primitive-color--primary-900); }
.aid_title .text-highlighted { color: var(--primitive-color--primary-600); }
.aid_para {
  margin: 0;
  color: #55636b;
  line-height: 1.6;
}
@supports (color: color-mix(in srgb, red 50%, white)) {
  .aid_para { color: color-mix(in srgb, var(--primitive-color--primary-900) 70%, #ffffff); }
}

/* Flex rather than grid: eleven logos do not divide evenly into any sensible column
   count, and this centres the short last row instead of leaving a hole in it. */
.aid_grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  /* flex-direction is stated because the sheet already sets ul { flex-direction: column }
     further up, which would otherwise stack all eleven logos one per row. */
  flex-direction: row;
  flex-wrap: wrap;
  align-items: stretch;
  justify-content: center;
  gap: 16px;
}
.aid_item {
  flex: 0 1 172px;
  height: 104px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px 20px;
  background: #fff;
  border: 1px solid rgba(1, 31, 35, .09);
  border-radius: 12px;
}
/* max-width/max-height rather than a fixed size: the logos have been cropped to their
   own ink but keep their own proportions, so each fills the tile on whichever axis
   binds first and none is stretched. */
.aid_logo {
  display: block;
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}

@media screen and (max-width: 767px) {
  .aid_header { margin-bottom: 30px; }
  .aid_grid { gap: 12px; }
  .aid_item { flex: 0 1 calc(50% - 6px); height: 88px; padding: 12px 16px; }
}
`;

/* ── Apply ───────────────────────────────────────────────────────────────── */

const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  sectionClose: (s.match(/<\/section>/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

/** The page's own eyebrow tag, relabelled. Keeps each tree's icon without hardcoding it. */
function sectionTag(html, label) {
  const open = html.indexOf('<div class="section_tag">');
  if (open === -1) return null;
  let depth = 0;
  let i = open;
  let close = -1;
  const o = /<div\b/g;
  const c = /<\/div>/g;
  while (i < html.length) {
    o.lastIndex = i;
    c.lastIndex = i;
    const a = o.exec(html);
    const b = c.exec(html);
    if (!b) break;
    if (a && a.index < b.index) { depth += 1; i = a.index + a[0].length; }
    else { depth -= 1; i = b.index + b[0].length; if (depth === 0) { close = i; break; } }
  }
  if (close === -1) return null;
  const tag = html.slice(open, close);
  // The label is the last bare <div>…</div> in the block; the one before it wraps the icon.
  const labels = [...tag.matchAll(/<div>[^<]*<\/div>/g)];
  if (!labels.length) return null;
  const last = labels[labels.length - 1];
  return tag.slice(0, last.index) + `<div>${label}</div>` + tag.slice(last.index + last[0].length);
}

function band(tag) {
  const items = LOGOS.map(
    ([file, name, w, h]) =>
      '<li class="aid_item">' +
      `<img class="aid_logo" src="assets/img/${file}" alt="${esc(name)}" ` +
      `width="${w}" height="${h}" loading="lazy" decoding="async"/></li>`
  ).join('');

  return (
    '<section class="section_aid">' +
    '<div class="section-padding padding-100x100">' +
    '<div class="container">' +
    '<div class="section_component">' +
    '<div class="aid_header">' +
    tag +
    `<h2 class="aid_title">${TITLE}</h2>` +
    `<p class="aid_para">${esc(PARA)}</p>` +
    '</div>' +
    `<ul class="aid_grid">${items}</ul>` +
    '</div></div></div></section>'
  );
}

/* Mirror the logos into the blue tree. */
let mirrored = 0;
for (const [f] of LOGOS) {
  const src = join(ROOT, 'assets/img', f);
  if (!existsSync(src)) continue;
  const dst = join(ROOT, 'variant-blue/assets/img', f);
  const bytes = readFileSync(src);
  if (!existsSync(dst) || Buffer.compare(readFileSync(dst), bytes) !== 0) {
    writeFileSync(dst, bytes);
    mirrored += 1;
  }
}
if (mirrored) console.log(`  ${mirrored} logo(s) mirrored into variant-blue/assets/img/`);


let added = 0;
for (const rel of ['index.html', 'variant-blue/index.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  const before = counts(original);

  if (original.includes('section_aid')) {
    console.log(`  ${rel.padEnd(26)} band already present`);
    continue;
  }

  // Every logo must exist in this tree before the markup references it: a missing file
  // 404s, and the site's inline image guard would swap in a branded gradient that looks
  // deliberate and hides the failure.
  const dir = rel.startsWith('variant-blue') ? 'variant-blue/assets/img' : 'assets/img';
  const missing = LOGOS.map(([f]) => f).filter((f) => !existsSync(join(ROOT, dir, f)));
  if (missing.length) {
    console.error(`  ${rel}: missing ${missing.length} logo(s) in ${dir} — skipped`);
    console.error(`    ${missing.join(', ')}`);
    process.exitCode = 1;
    continue;
  }

  const tag = sectionTag(original, 'Medical Aid');
  if (!tag) {
    console.error(`  ${rel}: could not clone a section tag — skipped`);
    process.exitCode = 1;
    continue;
  }

  const at = original.indexOf('<section class="section_cta"');
  if (at === -1) {
    console.error(`  ${rel}: closing CTA section not found — skipped`);
    process.exitCode = 1;
    continue;
  }

  const markup = band(tag);
  const s = original.slice(0, at) + markup + original.slice(at);

  const after = counts(s);
  const addedDivs = (markup.match(/<div\b/g) || []).length;
  if (
    after.div !== after.divClose ||
    after.div !== before.div + addedDivs ||
    after.section !== before.section + 1 ||
    after.sectionClose !== before.sectionClose + 1 ||
    after.script !== before.script
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  added += 1;
  console.log(`  ${rel.padEnd(26)} band added before the CTA (${LOGOS.length} logos)`);
}

for (const css of ['assets/css/lumora.css', 'variant-blue/assets/css/lumora.css']) {
  const p = join(ROOT, css);
  let s = readFileSync(p, 'utf8');
  const at = s.indexOf(CSS_MARKER);
  if (at !== -1) {
    const next = s.indexOf('\n/* --- ', at + CSS_MARKER.length);
    s = (s.slice(0, at) + (next === -1 ? '' : s.slice(next + 1))).replace(/\s+$/, '') + '\n';
  }
  writeFileSync(p, s + CSS);
  console.log(`  ${css.padEnd(34)} medical aid styles ${at === -1 ? 'added' : 'refreshed'}`);
}

console.log(`\n${added} page(s) updated`);
