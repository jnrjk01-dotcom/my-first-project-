/**
 * A map in the footer, and the developer credit at the foot of the page.
 *
 *   node assets/brand/footer-map.mjs
 *
 * THE MAP fills the gap on the right of the footer. That column has been half empty since
 * the Legal and Follow-us link columns came out, and a map is what the practice pointed
 * at as the pattern it wanted.
 *
 * It is an embed keyed on the address string rather than on coordinates. Typing latitude
 * and longitude I had guessed would put the pin somewhere plausible and wrong; letting
 * the map service resolve the address the practice actually published means the pin is
 * either right or visibly not, rather than quietly off by a street. THE PIN IS WORTH
 * CHECKING once, on a real device, because nothing here can verify it.
 *
 * The iframe is lazy so it costs nothing until someone scrolls to the footer, and it
 * carries a visible "Get directions" link beside it. That link is not decoration: an
 * embedded map is third-party and can be blocked by a content blocker, a strict privacy
 * setting, or a slow connection, and the address plus a working directions link has to
 * survive all of those. The address is also written out as text above the map for the
 * same reason.
 *
 * THE CREDIT replaces "Crafted by RapidXAI", which was the previous builder's line, with
 * "Website Developed by GrowthWorkz". GrowthWorkz is deliberately an anchor with NO href
 * yet: it is styled to underline and lift on hover so it reads as pressable, and the
 * moment a real URL is added it becomes a working link with that styling already on it.
 * Until then it is correctly not reachable by keyboard, because there is nowhere to go.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Exactly as published on the site. */
const ADDRESS = 'Sunninghill Building, Suite Four, Cnr Fife Street & 14th Avenue, Bulawayo, Zimbabwe';
const Q = encodeURIComponent(ADDRESS);
const EMBED = `https://maps.google.com/maps?q=${Q}&output=embed`;
const DIRECTIONS = `https://www.google.com/maps/search/?api=1&query=${Q}`;

const OLD_CREDIT = 'Crafted by RapidXAI';
const CREDIT =
  'Website Developed by <a class="footer-credit_link">GrowthWorkz</a>';

const MAP =
  '<div class="footer_map">' +
  '<div class="footer-map_label">Find us</div>' +
  '<address class="footer-map_address">Sunninghill Building, Suite Four<br/>' +
  'Cnr Fife Street &amp; 14th Avenue<br/>Bulawayo, Zimbabwe</address>' +
  '<div class="footer-map_frame">' +
  `<iframe class="footer-map_iframe" src="${EMBED}" loading="lazy" ` +
  'title="Map showing the Dental Care Centre in Bulawayo" ' +
  'referrerpolicy="no-referrer-when-downgrade"></iframe>' +
  '</div>' +
  `<a class="footer-map_link" href="${DIRECTIONS}" target="_blank" rel="noopener noreferrer">` +
  'Get directions</a>' +
  '</div>';

const CSS_MARKER = '/* --- footer: map and developer credit --- */';
const CSS = `
${CSS_MARKER}
/* The footer grid was two columns, the info block and the link columns, and the right of
   it has been half empty since Legal and Follow us were removed. The map takes that space
   back. On a phone the three stack. */
.footer_element:has(.footer_map) {
  grid-template-columns: 1fr 0.8fr 1.1fr;
  align-items: start;
}
.footer_map { min-width: 0; }
.footer-map_label {
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 12px;
}
.footer-map_address {
  font-style: normal;
  line-height: 1.55;
  margin: 0 0 14px;
}
/* A fixed shape so the footer does not jump when the map finishes loading, and so the
   space is reserved even if the embed never loads at all. */
.footer-map_frame {
  position: relative;
  aspect-ratio: 4 / 3;
  border-radius: 12px;
  overflow: hidden;
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .14);
}
.footer-map_iframe {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  border: 0;
  display: block;
}
.footer-map_link {
  display: inline-block;
  margin-top: 12px;
  text-decoration: underline;
  text-underline-offset: 3px;
}

/* The developer credit. No href yet, so the cursor and the hover are what say it is
   pressable; add an href and it becomes a real link with this styling already on it.
   The colours are forced AND scoped under .section_footer, because the footer paints
   every link #cdd8da with !important and turns them white on hover. !important alone
   loses that fight: ".section_footer a" is one class plus one type, which out-specifies a
   bare ".footer-credit_link", so both being important the footer's rule still won and the
   hover was a barely visible pale-grey-to-white shift instead of reading as a control. */
.section_footer .footer-credit_link {
  color: #ffffff !important;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 3px;
  text-decoration-color: rgba(255, 255, 255, .45);
  cursor: pointer;
  transition: color .18s ease, text-decoration-color .18s ease;
}
.section_footer .footer-credit_link:hover,
.section_footer .footer-credit_link:focus-visible {
  color: var(--primitive-color--primary-500, #24a3b1) !important;
  text-decoration-color: currentColor;
}
.section_footer .footer-credit_link:focus-visible {
  outline: 2px solid var(--primitive-color--primary-500, #24a3b1);
  outline-offset: 3px;
  border-radius: 2px;
}

@media screen and (max-width: 991px) {
  .footer_element:has(.footer_map) { grid-template-columns: 1fr; }
  .footer-map_frame { aspect-ratio: 16 / 10; }
}
`;

/* ── Apply ───────────────────────────────────────────────────────────────── */

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
  script: (s.match(/<script\b/g) || []).length,
  iframe: (s.match(/<iframe\b/g) || []).length,
});

let mapped = 0;
let credited = 0;

for (const rel of pages()) {
  const file = join(ROOT, rel);
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);
  const done = [];

  /* 1. The map, as the last child INSIDE footer_element so it takes a grid column.
     Any existing copy is stripped first, so a badly placed one from an earlier run is
     moved rather than left where it was: inserted a single </div> too late it lands as a
     sibling of footer_element instead of a child, the grid rule never matches it, and it
     stretches to the full width of the footer. */
  let hadMap = false;
  if (s.includes('footer_element')) {
    if (s.includes(MAP)) {
      s = s.split(MAP).join('');
      hadMap = true;
    }
    const bottom = s.indexOf('class="footer_bottom"');
    const menu = s.indexOf('class="footer_menu"');
    if (bottom !== -1 && menu !== -1 && menu < bottom) {
      const bottomTag = s.lastIndexOf('<div', bottom);
      // The </div> that closes footer_element. Inserting BEFORE it puts the map inside.
      const closeEl = s.lastIndexOf('</div>', bottomTag);
      if (closeEl !== -1) {
        s = s.slice(0, closeEl) + MAP + s.slice(closeEl);
        done.push(hadMap ? 'map repositioned' : 'map added');
      }
    }
    if (!done.length) {
      console.error(`  ${rel}: could not place the map — skipped`);
      process.exitCode = 1;
    }
  }

  /* 2. The credit, on every page that carries the old one. The template put a stray full
     stop on its own line after the old credit, which renders as a floating "." a space
     away from the name, so it is pulled back onto the word. */
  if (s.includes(OLD_CREDIT)) {
    s = s.split(OLD_CREDIT).join(CREDIT);
    s = s.replace(/(GrowthWorkz<\/a>)\s+\./g, '$1.');
    done.push('credit replaced');
  }

  if (!done.length) continue;

  // A reposition removes and re-adds the same block, so the net change is zero.
  const net = done.includes('map added') ? 1 : 0;
  const addedDivs = net * (MAP.match(/<div\b/g) || []).length;
  const addedFrames = net;
  const after = counts(s);
  if (
    after.div !== before.div + addedDivs ||
    after.divClose !== before.divClose + addedDivs ||
    after.script !== before.script ||
    after.iframe !== before.iframe + addedFrames
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  if (done.includes('map added')) mapped += 1;
  if (done.includes('credit replaced')) credited += 1;
  console.log(`  ${rel.padEnd(26)} ${done.join(', ')}`);
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
  console.log(`  ${css.padEnd(34)} footer styles ${at === -1 ? 'added' : 'refreshed'}`);
}

console.log(`\nmap on ${mapped} page(s), credit on ${credited} page(s)`);
