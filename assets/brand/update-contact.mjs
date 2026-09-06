/**
 * Rebuild the hero info strip and set the real contact numbers site-wide.
 *
 *   node assets/brand/update-contact.mjs
 *
 * The strip shipped with three cards headed "Get An Appointment", "Emergency Contact"
 * and "Get An Appointment" again — the duplicate heading is a fault in the template.
 * They become Our Location / Operating Hours / Contact Us, keeping the existing
 * .our-info_* structure so the layout, spacing and responsive behaviour are untouched.
 *
 * Phone format: the number was supplied as +2630292263687, which keeps Zimbabwe's
 * national trunk "0" after the country code. That is not dialable from abroad, so the
 * tel: href uses +263292263687 (area code 29 for Bulawayo). Same digits, minus the 0
 * that only applies when dialling domestically.
 *
 * Idempotent, and guarded: div/section/script counts are compared before and after, and
 * the file is restored untouched if anything drifts.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/* ── Real contact details ───────────────────────────────────────────────── */
const PHONE_HREF = '+263292263687';
const PHONE_DISPLAY = '+263 29 226 3687';
const WA_DIGITS = '263777804093';
const WA_DISPLAY = '+263 77 780 4093';

const ADDRESS_LINES = ['Cnr Fife Street &amp; 14th Avenue', 'Sunninghill Building, Suite Four', 'Bulawayo, Zimbabwe'];
const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  'Sunninghill Building, Cnr Fife Street & 14th Avenue, Bulawayo, Zimbabwe'
)}`;

const HOURS = [
  ['Mon - Fri', '08:00 - 17:00'],
  ['Saturday', '08:00 - 13:00'],
  ['Sunday', 'Closed'],
  ['Holidays', 'Closed'],
];

/* ── Icons ──────────────────────────────────────────────────────────────────
   Three matched line icons replace the old stethoscope / ambulance / clock set,
   which no longer described the cards. Same 40x40 box and currentColor as before, so
   they inherit the existing sizing and colour rules. */
const icon = (paths) =>
  '<svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 40 40" fill="none" ' +
  'vector-effect="non-scaling-stroke" preserveAspectRatio="none" aria-hidden="true">' +
  paths +
  '</svg>';

const S = 'stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"';

const PIN = icon(
  `<path d="M20 5c-5.5 0-10 4.4-10 9.9 0 7.4 10 20.1 10 20.1s10-12.7 10-20.1C30 9.4 25.5 5 20 5Z" ${S}/>` +
  `<circle cx="20" cy="15" r="3.6" ${S}/>`
);
const CLOCK = icon(`<circle cx="20" cy="20" r="14.5" ${S}/><path d="M20 11v9.4l6.2 3.6" ${S}/>`);
const PHONE = icon(
  `<path d="M8 7h6l3 7.5-3.7 2.2a17 17 0 0 0 9 9l2.2-3.7L32 25v6a2 2 0 0 1-2 2C17.3 33 7 22.7 7 10a2 2 0 0 1 2-2Z" ${S}/>`
);

/* ── Cards ──────────────────────────────────────────────────────────────── */
/* The third card carries an extra `is-last` class in the template, which the
   stylesheet uses for its border treatment. It must survive the rebuild. */
const card = (iconSvg, title, body, extra = '') =>
  `<div class="our-info_item${extra}">` +
  `<div class="our-info_item-header"><div class="our-info_icon">${iconSvg}</div>` +
  `<h2 class="our-info_title">${title}</h2></div>` +
  `<div class="our-info_item-body">${body}</div>` +
  '</div>';

const locationCard = card(
  PIN,
  'Our Location',
  `<a href="${MAPS}" target="_blank" rel="noopener noreferrer" class="our-info_item-link w-inline-block">` +
    ADDRESS_LINES.map((l) => `<div class="our-info_item-para">${l}</div>`).join('') +
    '</a>'
);

const hoursCard = card(
  CLOCK,
  'Operating Hours',
  HOURS.map(
    ([d, t]) =>
      `<div class="our-info_block"><div class="our-info_item-para">${d}</div>` +
      `<div class="our-info_item-para">${t}</div></div>`
  ).join('')
);

const contactCard = card(
  PHONE,
  'Contact Us',
  `<a href="tel:${PHONE_HREF}" class="our-info_item-link w-inline-block">` +
    `<div class="our-info_item-para">Call: ${PHONE_DISPLAY}</div></a>` +
    `<a href="https://wa.me/${WA_DIGITS}" target="_blank" rel="noopener noreferrer" class="our-info_item-link w-inline-block">` +
    `<div class="our-info_item-para">WhatsApp: ${WA_DISPLAY}</div></a>`,
  ' is-last'
);

const STRIP = locationCard + hoursCard + contactCard;

/** Depth-counted end of the element starting at `open`. */
function endOfDiv(html, open) {
  const openRe = /<div\b/gi;
  const closeRe = /<\/div\s*>/gi;
  let depth = 0;
  let i = open;
  while (i < html.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const o = openRe.exec(html);
    const c = closeRe.exec(html);
    if (!c) return -1;
    if (o && o.index < c.index) {
      depth += 1;
      i = o.index + o[0].length;
    } else {
      depth -= 1;
      i = c.index + c[0].length;
      if (depth === 0) return i;
    }
  }
  return -1;
}

const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

let changed = 0;

/* ── 1. The hero info strip (index pages only) ──────────────────────────── */
for (const rel of ['index.html', 'variant-blue/index.html']) {
  const file = join(ROOT, rel);
  const original = readFileSync(file, 'utf8');
  let s = original;

  if (s.includes('>Our Location<')) {
    console.log(`  ${rel.padEnd(26)} strip already updated`);
  } else {
    // The class list varies between the cards (the third carries `is-last`), so match
    // the opening tag by pattern rather than by an exact string.
    const itemRe = /<div class="our-info_item(?:\s[^"]*)?">/g;
    const starts = [...s.matchAll(itemRe)].map((m) => m.index);
    if (starts.length !== 3) {
      console.error(`  ${rel}: expected 3 info items, found ${starts.length} — skipped`);
      continue;
    }
    const end = endOfDiv(s, starts[2]);
    if (end === -1) {
      console.error(`  ${rel}: could not close the third item — skipped`);
      continue;
    }
    const span = s.slice(starts[0], end);
    if (/<\/(section|body)>/i.test(span)) {
      console.error(`  ${rel}: span overran the section — skipped`);
      continue;
    }
    s = s.slice(0, starts[0]) + STRIP + s.slice(end);
  }

  // The three cards replace three cards, so structure must be unchanged apart from
  // the divs inside them.
  const before = counts(original);
  const after = counts(s);
  if (after.section !== before.section || after.script !== before.script || after.div !== after.divClose) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}`);
    console.error(`    after  ${JSON.stringify(after)}`);
    writeFileSync(file, original);
    process.exitCode = 1;
    continue;
  }

  if (s !== original) {
    writeFileSync(file, s);
    changed += 1;
    console.log(`  ${rel.padEnd(26)} strip -> Our Location / Operating Hours / Contact Us`);
  }
}

/* ── 2. Numbers, site-wide ──────────────────────────────────────────────── */
const FILES = [];
for (const dir of ['.', 'variant-blue']) {
  for (const f of [
    'index.html', 'about.html', 'service.html', 'blog.html',
    'privacy.html', 'cookies.html', 'terms.html', 'licenses.html', '404.html',
    'assets/js/booking-bar.js',
  ]) {
    const p = join(ROOT, dir, f);
    if (existsSync(p)) FILES.push(p);
  }
}

const SUBS = [
  [/tel:\+?919307512816/g, `tel:${PHONE_HREF}`],
  [/\+91 9307512816/g, PHONE_DISPLAY],
  [/wa\.me\/919307512816/g, `wa.me/${WA_DIGITS}`],
  [/'919307512816'/g, `'${WA_DIGITS}'`],
  [/'\+919307512816'/g, `'${PHONE_HREF}'`],
];

let numFiles = 0;
for (const file of FILES) {
  const original = readFileSync(file, 'utf8');
  let s = original;
  for (const [re, to] of SUBS) s = s.replace(re, to);
  if (s !== original) {
    writeFileSync(file, s);
    numFiles += 1;
    console.log(`  ${file.replace(ROOT + '/', '').padEnd(34)} numbers updated`);
  }
}

console.log(`\n${changed} strip(s) rebuilt, ${numFiles} file(s) renumbered`);
console.log(`  call     ${PHONE_DISPLAY}  (tel:${PHONE_HREF})`);
console.log(`  whatsapp ${WA_DISPLAY}  (wa.me/${WA_DIGITS})`);
