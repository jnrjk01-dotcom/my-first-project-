/**
 * Correct Dr. Mutemi's role and give him a word on the about page.
 *
 *   node assets/brand/mutemi-profile.mjs
 *
 * ROLE. He was labelled "Pediatric Dentist", inherited from the template's three
 * invented paediatric dentists. He is not one; he covers most of what the services page
 * lists. "Dentist" is what goes on the card, because it is the one thing that is
 * certainly true. If he holds a title (principal dentist, clinical director), it belongs
 * here instead.
 *
 * THE MESSAGE is written in his voice but he did not say it, so it is a draft for him to
 * approve or rewrite before this goes live. It is built from what the outreach banner
 * already states publicly: the two words of the programme's name, the aim printed across
 * it, and the range of treatments the site itself lists. Nothing is claimed that is not
 * already on the banner or the services page.
 *
 * On the about page it sits beside the card rather than under it, in the pattern the
 * practice pointed at on smithandvanlierop.co.za, so his one photograph is used once.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const OLD_ROLE = 'Pediatric Dentist';
const NEW_ROLE = 'Dentist';

const QUESTION = 'Why does the practice run an outreach programme?';
const PARAS = [
  '&ldquo;Nyemwerera. Ubobotheke. One word in Shona, one in Ndebele, and both of them ' +
    'mean smile. We put them on the banner together because a smile does not belong to ' +
    'one language, and because smiling itself is free, even when the dentistry behind ' +
    'it is not.',
  'Most of what I do here is not complicated. Examinations and cleanings, fillings, ' +
    'root canals, extractions, crowns and bridges, dentures, braces. What makes it ' +
    'complicated is time. The difference between a filling and losing the tooth is ' +
    'usually a few months, and months are exactly what people run out of when a dental ' +
    'visit feels like something they cannot afford.',
  'So we work in both directions. In the practice we treat whoever comes through the ' +
    'door. Through Nyemwerera Ubobotheke we go out to the communities and the schools, ' +
    'to the children nobody would have brought in. Improving the quality of life for ' +
    'vulnerable communities is written on our banner because it is how we spend our ' +
    'time.&rdquo;',
];
const CITE = `Dr. Mutemi, ${NEW_ROLE}`;

/* The about page's team heading and standfirst were written for the template's six
   invented clinicians. "Superheroes" plural no longer holds with one dentist, and the
   standfirst was truncated in the template itself: it ends "achieve healthier" with no
   noun. Both are rewritten for what the section now shows. */
const OLD_H2 = 'Superheroes Behind the <span class="text-highlighted">Dental Care</span>';
const NEW_H2 = 'The Hands Behind Your <span class="text-highlighted">Dental Care</span>';
const OLD_PARA =
  'Each member of our clinical staff is not only highly qualified but deeply passionate ' +
  'about helping patients achieve healthier.';
const NEW_PARA =
  'Every treatment here is carried out by a qualified clinician who will tell you what ' +
  'is happening and why before anything begins.';

const PROFILE =
  '<div class="dcc-profile">' +
  `<p class="dcc-profile_q">${QUESTION}</p>` +
  '<blockquote class="dcc-profile_quote">' +
  PARAS.map((p) => `<p>${p}</p>`).join('') +
  `<footer class="dcc-profile_cite">${CITE}</footer>` +
  '</blockquote></div>';

const CSS_MARKER = '/* --- about: dentist profile --- */';
const CSS = `
${CSS_MARKER}
/* Card on one side, his words on the other, so the single portrait is used once on the
   page. Below 992 the card sits above the text rather than beside it. */
.dcc-team-profile {
  display: grid;
  grid-template-columns: minmax(0, 400px) minmax(0, 1fr);
  gap: clamp(28px, 5vw, 64px);
  align-items: start;
}
/* The list is already constrained to one 400px column by the team rules; inside this
   grid it should fill the track it has been given. */
.dcc-team-profile .team_list { grid-template-columns: minmax(0, 1fr); justify-content: stretch; }

.dcc-profile { color: rgba(255, 255, 255, .92); padding-top: 6px; }
.dcc-profile_q {
  margin: 0 0 18px;
  font-size: 19px;
  font-weight: 600;
  color: #fff;
}
.dcc-profile_quote {
  margin: 0;
  padding: 0;
  border: 0;
  max-width: 62ch;
}
.dcc-profile_quote p {
  margin: 0 0 16px;
  font-size: 17px;
  line-height: 1.65;
  color: rgba(255, 255, 255, .92);
}
.dcc-profile_cite {
  /* The sheet carries a bare footer border-top rule in the accent colour for the
     page footer, which this element inherits simply by being a <footer>. Zeroed here so
     the short accent rule below is the only line drawn. */
  border-top: 0;
  margin-top: 22px;
  font-size: 15px;
  font-weight: 600;
  color: #fff;
  font-style: normal;
}
.dcc-profile_cite::before {
  content: "";
  display: block;
  width: 46px;
  height: 2px;
  margin-bottom: 12px;
  background: var(--primitive-color--primary-500);
}

/* The white-text overrides written for this section target the home page's header
   classes. The about page uses its own, so its heading and standfirst were left dark on
   the photograph and measured close to unreadable. */
.section_team .about-team_header-content h2,
.section_team .about-team_para {
  color: #fff !important;
  text-shadow: 0 2px 14px rgba(0, 0, 0, .45);
}
.section_team .about-team_para { color: rgba(255, 255, 255, .9) !important; }

@media screen and (max-width: 991px) {
  .dcc-team-profile { grid-template-columns: minmax(0, 1fr); }
  .dcc-team-profile .team_list { max-width: 400px; }
}
`;

const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
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

/* 1. The role, everywhere it appears. */
let roles = 0;
for (const rel of ['index.html', 'about.html', 'variant-blue/index.html', 'variant-blue/about.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  const re = new RegExp(`(class="team-menuber_designation">)${OLD_ROLE}(<)`, 'g');
  const s = original.replace(re, `$1${NEW_ROLE}$2`);
  if (s !== original) {
    writeFileSync(file, s);
    roles += 1;
    console.log(`  ${rel.padEnd(28)} role -> ${NEW_ROLE}`);
  }
}
if (!roles) console.log(`  role already ${NEW_ROLE} on every page`);

/* 2. The message, beside the card, on the about page only. */
let added = 0;
for (const rel of ['about.html', 'variant-blue/about.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  const before = counts(original);

  if (original.includes('dcc-profile')) {
    console.log(`  ${rel.padEnd(28)} message already present`);
    continue;
  }

  const teamAt = original.indexOf('section_team');
  const open = original.indexOf('<div class="w-dyn-list">', teamAt);
  const end = open === -1 ? -1 : endOfElement(original, open, 'div');
  if (open === -1 || end === -1) {
    console.error(`  ${rel}: the team collection was not found — skipped`);
    process.exitCode = 1;
    continue;
  }
  const span = original.slice(open, end);
  if (!span.includes('team_list') || !span.includes('Dr. Mutemi')) {
    console.error(`  ${rel}: the team collection failed its sanity check — skipped`);
    process.exitCode = 1;
    continue;
  }

  let s =
    original.slice(0, open) +
    '<div class="dcc-team-profile">' + span + PROFILE + '</div>' +
    original.slice(end);
  s = s.replace(OLD_H2, NEW_H2).replace(OLD_PARA, NEW_PARA);

  const after = counts(s);
  const addedDivs = (('<div class="dcc-team-profile">' + PROFILE + '</div>').match(/<div\b/g) || []).length;
  if (
    after.div !== after.divClose ||
    after.div !== before.div + addedDivs ||
    after.section !== before.section ||
    after.script !== before.script
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  added += 1;
  console.log(`  ${rel.padEnd(28)} message added beside the card`);
}

for (const css of ['assets/css/lumora.css', 'variant-blue/assets/css/lumora.css']) {
  const p = join(ROOT, css);
  let sheet = readFileSync(p, 'utf8');
  const at = sheet.indexOf(CSS_MARKER);
  if (at !== -1) {
    const next = sheet.indexOf('\n/* --- ', at + CSS_MARKER.length);
    sheet = (sheet.slice(0, at) + (next === -1 ? '' : sheet.slice(next + 1))).replace(/\s+$/, '') + '\n';
  }
  writeFileSync(p, sheet + CSS);
  console.log(`  ${css.padEnd(34)} profile styles ${at === -1 ? 'added' : 'refreshed'}`);
}

console.log(`\n${roles} role(s) corrected, ${added} message(s) added`);
