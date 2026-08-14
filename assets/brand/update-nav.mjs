/**
 * Rebuild the main navigation.
 *
 *   node assets/brand/update-nav.mjs
 *
 * Three changes:
 *  1. The menu is trimmed to Home / About Us / Services. Blog and the template's
 *     "Pages" dropdown are removed.
 *  2. Services becomes a dropdown listing the clinic's 13 treatments, grouped under
 *     the four service headings the site already uses (Preventive dentistry, Cosmetic
 *     dentistry, Restorative treatments, Orthodontics) so the nav and the Services
 *     page agree with each other.
 *  3. A WhatsApp button and a click-to-call pill are added to the header.
 *
 * The dropdown reuses the template's own w-dropdown component (the markup the "Pages"
 * menu used), so Webflow's navigation script drives it — open/close, keyboard focus and
 * the mobile collapse all keep working without a line of new behaviour.
 *
 * Idempotent and guarded: tag counts are compared before and after and the file is
 * restored if anything drifts.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PHONE_HREF = '+263292263687';
const PHONE_DISPLAY = '+263 29 226 3687';
const WA_DIGITS = '263778398111';
const WA_TEXT = 'Hi Dental Care Centre, I would like to book an appointment.';

/* ── Services, grouped under the site's existing four headings ─────────────
   Extractions have no natural home among these four. They are operative treatment,
   so they sit with Restorative rather than being invented a fifth heading the
   Services page does not have. */
const GROUPS = [
  ['Preventive dentistry', ['Consultation / Examination', 'Scaling and Polishing']],
  [
    'Restorative treatments',
    [
      'Filling',
      'Root Canal',
      'Normal Extraction',
      'Surgical Extraction',
      'Crowns',
      'Dental Bridges',
      'Dentures',
      'Implants',
    ],
  ],
  ['Cosmetic dentistry', ['Veneers', 'Teeth Whitening']],
  ['Orthodontics', ['Braces / Orthodontics']],
];

const link = (label) =>
  `<a href="service.html" data-animation="text-flip" class="navbar-dropdown_link w-inline-block">` +
  `<div>${label}</div></a>`;

const chevron =
  '<div class="dropdown_chevron"><svg xmlns="http://www.w3.org/2000/svg" width="100%" ' +
  'viewBox="0 0 12 12" fill="none" preserveAspectRatio="none" aria-hidden="true">' +
  '<path d="M2.5 4.5 6 8l3.5-3.5" stroke="currentColor" stroke-width="1.5" ' +
  'stroke-linecap="round" stroke-linejoin="round"/></svg></div>';

const MENU =
  '<a href="index.html" class="navbar_link w-inline-block"><div>Home</div></a>' +
  '<a href="about.html" class="navbar_link w-inline-block"><div>About Us</div></a>' +
  '<div data-delay="200" data-hover="false" class="navbar_dropdown w-dropdown">' +
  `<div class="navbar-dropdown_toggle w-dropdown-toggle"><div>Services</div>${chevron}</div>` +
  '<nav class="navbar-dropdown_list w-dropdown-list">' +
  '<div class="navbar-dropdown_wrapper is-services">' +
  GROUPS.map(
    ([heading, items]) =>
      '<div class="navbar-dropdown_column">' +
      `<div class="svc-group_title">${heading}</div>` +
      items.map(link).join('') +
      '</div>'
  ).join('') +
  '</div></nav></div>';

/* ── Header contact buttons ─────────────────────────────────────────────── */
const CONTACT =
  '<div class="navbar-contact">' +
  `<a class="navbar-wa" href="https://wa.me/${WA_DIGITS}?text=${encodeURIComponent(WA_TEXT)}" ` +
  'target="_blank" rel="noopener noreferrer" aria-label="Message us on WhatsApp">' +
  '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
  '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.31-1.95 1.36-.5.05-.98.23-3.3-.69-2.77-1.09-4.53-3.92-4.67-4.1-.14-.18-1.12-1.49-1.12-2.85 0-1.35.71-2.02.96-2.29.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.24.57.8 1.97.87 2.11.07.14.12.31.02.49-.09.18-.14.29-.28.45-.14.16-.29.35-.42.47-.14.14-.28.29-.12.57.16.27.72 1.18 1.54 1.92 1.06.94 1.95 1.24 2.23 1.38.27.14.43.12.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.22.61-.13.25.09 1.6.75 1.87.89.27.14.46.2.53.32.07.11.07.66-.17 1.34Z"/></svg>' +
  '</a>' +
  `<a class="navbar-tel" href="tel:${PHONE_HREF}">` +
  '<span class="navbar-tel_icon"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" ' +
  'stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
  '<path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v4c0 .6-.4 1-1 1C10.7 21 3 13.3 3 5c0-.6.4-1 1-1Z"/>' +
  '</svg></span>' +
  `<span class="navbar-tel_num">${PHONE_DISPLAY}</span></a>` +
  '</div>';

/* ── Styles ─────────────────────────────────────────────────────────────── */
const CSS_MARKER = '/* --- nav: services dropdown + contact buttons --- */';
const CSS = `
${CSS_MARKER}
/* Services mega-menu. The template's dropdown was a single narrow column; four
   grouped columns need an explicit grid and a wider panel. */
.navbar-dropdown_wrapper.is-services {
  display: grid;
  grid-template-columns: repeat(4, minmax(168px, 1fr));
  gap: 4px 30px;
  padding: 24px 28px;
  min-width: 780px;
  align-items: start;
}
.svc-group_title {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.14em;
  opacity: 0.62;
  margin-bottom: 10px;
  white-space: nowrap;
}
.navbar-dropdown_wrapper.is-services .navbar-dropdown_link { padding-block: 6px; }

/* Header contact pair. */
.navbar-contact { display: flex; align-items: center; gap: 10px; margin-right: 12px; }
.navbar-wa {
  width: 44px; height: 44px; border-radius: 50%;
  display: inline-flex; align-items: center; justify-content: center;
  background: #e7f6ec; color: #1faf54;
  transition: background-color .2s, transform .2s;
}
.navbar-wa:hover { background: #d3efdd; transform: translateY(-1px); }
.navbar-tel {
  display: inline-flex; align-items: center; gap: 10px;
  padding: 6px 18px 6px 6px; border-radius: 999px;
  background: #0d2526; color: #fff; text-decoration: none;
  font-weight: 600; font-size: 15px; white-space: nowrap;
  transition: background-color .2s;
}
.navbar-tel:hover { background: #133537; }
.navbar-tel_icon {
  width: 32px; height: 32px; border-radius: 50%;
  background: #fff; color: #0d2526;
  display: inline-flex; align-items: center; justify-content: center; flex: none;
}
.navbar-wa:focus-visible, .navbar-tel:focus-visible { outline: 3px solid #3389CC; outline-offset: 2px; }

/* The Webflow nav collapses at 991px; the mega-menu becomes a single stacked list. */
@media screen and (max-width: 991px) {
  .navbar-dropdown_wrapper.is-services {
    grid-template-columns: 1fr; min-width: 0; padding: 14px 16px; gap: 2px;
  }
  .svc-group_title { margin-top: 12px; }
}

/* Below 600px the number itself is dropped: the icon still calls, and the booking
   bar at the foot of the page carries the number in full. */
@media screen and (max-width: 600px) {
  .navbar-tel_num { display: none; }
  .navbar-tel { padding: 6px; }
  .navbar-contact { gap: 8px; margin-right: 8px; }
  .navbar-wa { width: 40px; height: 40px; }
}
`;

const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  nav: (s.match(/<nav\b/g) || []).length,
  navClose: (s.match(/<\/nav>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

/** End index of the element opened at `open`, counting nesting of `tag`. */
function endOf(html, open, tag) {
  const o = new RegExp(`<${tag}\\b`, 'gi');
  const c = new RegExp(`</${tag}\\s*>`, 'gi');
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

const PAGES = [];
for (const dir of ['.', 'variant-blue']) {
  for (const f of ['index.html', 'about.html', 'service.html', 'blog.html']) {
    const p = join(ROOT, dir, f);
    if (existsSync(p)) PAGES.push(p);
  }
}

let changed = 0;
for (const file of PAGES) {
  const rel = file.replace(ROOT + '/', '');
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);

  // ── 1. Replace the menu's contents ────────────────────────────────────
  if (!s.includes('is-services')) {
    /* The opening tag carries other attributes (role="navigation"), so match it by
       pattern; an exact-string search silently finds nothing. */
    const menuMatch = /<nav\b[^>]*\bnavbar_menu\b[^>]*>/.exec(s);
    const menuOpen = menuMatch ? menuMatch.index : -1;
    if (menuOpen === -1) {
      console.error(`  ${rel}: navbar_menu not found — skipped`);
      continue;
    }
    const menuEnd = endOf(s, menuOpen, 'nav');
    if (menuEnd === -1) {
      console.error(`  ${rel}: could not close navbar_menu — skipped`);
      continue;
    }
    const inner = s.slice(menuOpen, menuEnd);
    if (inner.length > 20000 || /<\/(body|header)>/i.test(inner)) {
      console.error(`  ${rel}: menu span failed its sanity check — skipped`);
      continue;
    }
    // Reuse the original opening tag verbatim so role/data attributes survive.
    s = s.slice(0, menuOpen) + menuMatch[0] + MENU + '</nav>' + s.slice(menuEnd);
  }

  // ── 2. Header contact buttons ─────────────────────────────────────────
  if (!s.includes('navbar-contact')) {
    const anchor = '<div class="navbar-button_wrapper">';
    const at = s.indexOf(anchor);
    if (at !== -1) s = s.slice(0, at + anchor.length) + CONTACT + s.slice(at + anchor.length);
  }

  const after = counts(s);
  if (after.div !== after.divClose || after.nav !== after.navClose ||
      after.section !== before.section || after.script !== before.script) {
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
    console.log(`  ${rel.padEnd(26)} nav rebuilt`);
  } else {
    console.log(`  ${rel.padEnd(26)} already up to date`);
  }
}

for (const css of ['assets/css/lumora.css', 'variant-blue/assets/css/lumora.css']) {
  const p = join(ROOT, css);
  const s = readFileSync(p, 'utf8');
  if (!s.includes(CSS_MARKER)) {
    writeFileSync(p, s + CSS);
    console.log(`  ${css.padEnd(34)} +nav styles`);
  }
}

console.log(`\n${changed} page(s) updated`);
console.log(`  menu: Home / About Us / Services (${GROUPS.reduce((n, g) => n + g[1].length, 0)} treatments in ${GROUPS.length} groups)`);
