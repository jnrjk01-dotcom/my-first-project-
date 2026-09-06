/**
 * Make the phone menu usable.
 *
 *   node assets/brand/mobile-nav.mjs
 *
 * WHAT WAS WRONG. Measured on an iPhone 12 (390x664 of usable page), opening the menu and
 * tapping Services produced 850px of content in a 664px screen: four category headings and
 * thirteen treatment links, so Home and About Us scrolled off the top and the last
 * treatments sat under the fixed booking bar. The links were 36px tall, under the 44px
 * everyone treats as the minimum for a thumb. And "Services" was not a link to anything —
 * tapping it only expanded the list, so the Services page itself could not be reached from
 * the menu at all.
 *
 * WHAT THIS DOES.
 *   1. Splits the Services row into a real link plus a separate chevron. Tapping the word
 *      goes to the Services page; tapping the chevron opens the categories. On desktop the
 *      panel also opens on hover, so losing the click-to-open on the word costs nothing
 *      there.
 *   2. Turns the four category headings into links to their section of the Services page,
 *      and hides the thirteen individual treatments on phones. Four rows instead of
 *      seventeen. The treatments are untouched on desktop, where the mega-menu has room.
 *   3. Adds the two things a patient actually came for and the menu did not offer: a
 *      Contact row (address and opening hours) and a Book on WhatsApp button.
 *   4. Sizes every row to at least 48px and lets the panel scroll on its own instead of
 *      overflowing the screen.
 *
 * Idempotent and fingerprinted: it looks for the exact original markup and skips any page
 * already converted, so a second run is a no-op rather than a double insertion. If a page's
 * nav has drifted from what this expects, it says so and changes nothing rather than
 * guessing.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PAGES = [
  'index.html', 'about.html', 'service.html',
  'variant-blue/index.html', 'variant-blue/about.html', 'variant-blue/service.html',
];

const WA = 'https://wa.me/263777804093?text=' +
  encodeURIComponent('Hi Dental Care Centre, I would like to book an appointment.');

/* Each nav category maps to the heading it should land on. The Services page groups
   treatments more finely than the menu does (oral surgery, crowns and implants each have
   their own section), so "Restorative treatments" lands at the top of that run and the
   rest follows underneath, in order. */
const GROUP_ANCHORS = {
  'Preventive dentistry': 'preventive-dentistry',
  'Restorative treatments': 'restorative-treatments',
  'Cosmetic dentistry': 'cosmetic-dentistry',
  'Orthodontics': 'orthodontic-treatments',
};

/* The old row: label and chevron both inside the toggle, so the whole thing was a
   disclosure control and nothing in it was a link. */
const TOGGLE_RE =
  /<div class="navbar-dropdown_toggle w-dropdown-toggle"><div>Services<\/div>(<div class="dropdown_chevron">[\s\S]*?<\/div>)<\/div>/;

let changed = 0;
const skipped = [];

for (const rel of PAGES) {
  const p = join(ROOT, rel);
  let h = readFileSync(p, 'utf8');
  const before = h;

  if (h.includes('navbar-services_link')) {
    skipped.push(`${rel} (already converted)`);
    continue;
  }
  if (!TOGGLE_RE.test(h)) {
    skipped.push(`${rel} (nav markup not recognised — left alone)`);
    continue;
  }

  /* 1. Services becomes a link, with the chevron as its own control beside it.
        The chevron keeps the w-dropdown-toggle class so Webflow's own dropdown code
        still drives it; it just no longer swallows the label. */
  h = h.replace(TOGGLE_RE, (m, chevron) =>
    '<a href="service.html" class="navbar_link navbar-services_link w-inline-block">' +
    '<div>Services</div></a>' +
    '<div class="navbar-dropdown_toggle w-dropdown-toggle" ' +
    'aria-label="Show service categories">' + chevron + '</div>'
  );

  /* Hovering the row opens the panel on desktop. This replaces the click that the label
     used to carry, and does nothing on a phone, where there is no hover. */
  h = h.replace(
    /<div data-delay="200" data-hover="false" class="navbar_dropdown w-dropdown">/,
    '<div data-delay="200" data-hover="true" class="navbar_dropdown w-dropdown">'
  );

  /* 2. Category headings become links. On a phone these are the only rows in the panel;
        on desktop they sit above their column exactly as before, now clickable. */
  for (const [label, anchor] of Object.entries(GROUP_ANCHORS)) {
    h = h.replace(
      `<div class="svc-group_title">${label}</div>`,
      `<a class="svc-group_title" href="service.html#${anchor}">${label}</a>`
    );
  }

  /* 3. Contact and the booking button, at the end of the menu. Both are phone-only:
        the desktop header already carries a call pill and a Get Appointment button. */
  const extras =
    '<a href="index.html#contact" class="navbar_link navbar-menu_contact">' +
    '<div>Contact</div></a>' +
    '<div class="navbar-menu_cta">' +
    `<a class="navbar-menu_book" href="${WA}" target="_blank" rel="noopener noreferrer">` +
    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 ' +
    '9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 ' +
    '14.16c-.24.68-1.42 1.31-1.95 1.36-.5.05-.98.23-3.3-.69-2.77-1.09-4.53-3.92-4.67-4.1-.14-.18-1.12-1.49-1.12-2.85 ' +
    '0-1.35.71-2.02.96-2.29.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.24.57.8 ' +
    '1.97.87 2.11.07.14.12.31.02.49-.09.18-.14.29-.28.45-.14.16-.29.35-.42.47-.14.14-.28.29-.12.57.16.27.72 ' +
    '1.18 1.54 1.92 1.06.94 1.95 1.24 2.23 1.38.27.14.43.12.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.22.61-.13.25.09 ' +
    '1.6.75 1.87.89.27.14.46.2.53.32.07.11.07.66-.17 1.34Z"/></svg>' +
    '<span>Book on WhatsApp</span></a></div>';

  /* The menu is the only <nav> that closes right before the button wrapper. Anchoring on
     that pair rather than on "the next </nav>" keeps this off the dropdown's own <nav>. */
  const anchor = '</nav>\n                        <div class="navbar-button_wrapper">';
  if (!h.includes(anchor)) {
    skipped.push(`${rel} (menu end not found — left alone)`);
    continue;
  }
  h = h.replace(anchor, extras + anchor);

  /* 4. Somewhere for the Contact row to land. The address, opening hours and numbers all
        live in one block on the home page. */
  h = h.replace(
    /(<div data-w-id="4a010508-9584-456a-0d04-e7cbb6c6bb4f")(?![^>]*\sid=)/,
    '$1 id="contact"'
  );

  if (h !== before) {
    writeFileSync(p, h);
    changed += 1;
    console.log(`  ${rel}`);
  }
}

console.log(`\n${changed} page(s) updated`);
for (const s of skipped) console.log(`  skipped: ${s}`);
