/**
 * Restraint pass: make the page feel composed rather than eager.
 *
 *   node assets/brand/restraint.mjs
 *
 * Nothing is removed and no layout is rebuilt. Three adjustments, all of them about
 * turning things down.
 *
 * THE SECTION EYEBROWS. Every section is introduced by a pill containing a four-pointed
 * sparkle and a label. The sparkle is the single most template-looking mark on the site;
 * it belongs to a certain kind of AI-product landing page and not to a dental surgery.
 * The pill stays, because it is doing real work separating the label from the heading
 * under it. The sparkle becomes a small solid dot, and the label is set in uppercase with
 * letterspacing, which is how a clinical or professional site sets a standfirst label.
 *
 * The icon is hidden in CSS rather than cut out of the markup, because the same tag is
 * cloned into the medical aid band at build time and each colour tree carries its own
 * glyph; styling it reaches every copy without either script knowing about the other.
 *
 * THE MOTION. The reveal engine moved every element 40px over 0.9 seconds. At that
 * distance and duration a page of a dozen sections spends its life in motion, and content
 * arriving from off screen reads as a sales page. 16px over 0.5s still gives the eye
 * something to follow without the page performing for the reader.
 *
 * THE HEADINGS. Large display type at its default tracking looks loose at big sizes. A
 * small negative letterspacing on the h1 and h2 is the difference between type that was
 * set and type that was typed.
 *
 * All of it is reversible: it is one CSS block, and removing it restores the template's
 * own values.
 */

import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const CSS_MARKER = '/* --- restraint: eyebrows, motion, display type --- */';
const CSS = `
${CSS_MARKER}
/* ── Section eyebrows ─────────────────────────────────────────────────────
   The pill stays; the sparkle inside it goes. It is the most template-looking mark on
   the site and it says nothing. A small dot holds the same space quietly. */
/* Two classes, because the closing call to action uses cta_tag while every other
   section uses section_tag. Treating only one of them leaves the last thing on the page
   as the only place the sparkle survives, which is worse than not doing it at all. */
.section_tag .icon_wrap.is-small > svg,
.cta_tag .icon_wrap.is-small > svg { display: none; }
.section_tag .icon_wrap.is-small,
.cta_tag .icon_wrap.is-small {
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: currentColor;
  opacity: .55;
}
/* The same sparkle marks each item of the Why Choose Us accordion. There it is not only
   decorative but misleading: those rows expand, and a sparkle gives no hint of that. A
   plus is the conventional mark for a row that opens, so the icon box is redrawn as one
   with two rules. It rotates into a minus when its row is the open one, which is the
   affordance the template never had. */
.tabs-accordion_header-icon > svg { display: none; }
.tabs-accordion_header-icon {
  position: relative;
  opacity: .75;
}
.tabs-accordion_header-icon::before,
.tabs-accordion_header-icon::after {
  content: "";
  position: absolute;
  top: 50%;
  left: 50%;
  width: 13px;
  height: 1.5px;
  background: currentColor;
  transform: translate(-50%, -50%);
  transition: transform .25s ease, opacity .25s ease;
}
.tabs-accordion_header-icon::after { transform: translate(-50%, -50%) rotate(90deg); }
/* Webflow marks the open tab with w--current. */
.tabs-accordion_item.w--current .tabs-accordion_header-icon::after {
  transform: translate(-50%, -50%) rotate(0deg);
  opacity: 0;
}

/* Uppercase and letterspaced, which is how a professional site sets a label above a
   heading. The size is nudged down because uppercase reads larger than lower case. */
.section_tag,
.cta_tag {
  text-transform: uppercase;
  letter-spacing: .1em;
  font-size: 12px;
  font-weight: 600;
}

/* Motion is not set here. The reveal engine's travel and duration are numbers inside the
   inline script on each page, so they are edited there by this script's second half:
   40px over 0.9s becomes 16px over 0.5s. Sections still arrive; they no longer make an
   entrance. Noted here so the next person looks in the right place. */

/* ── Display type ─────────────────────────────────────────────────────────
   Large type set at default tracking looks loose. This is small enough to be invisible
   as a decision and visible as a result. */
h1, .heading-style-h1 { letter-spacing: -0.02em; }
h2, .heading-style-h2 { letter-spacing: -0.015em; }

/* The closing call to action carried two 102px blurred colour blobs behind the copy,
   a decorative flourish from the template. Softened rather than removed: they still
   lift the corner, without the page looking like it is glowing at the reader. */
.cta_overlay { opacity: .45; }
`;

/* ── Apply ───────────────────────────────────────────────────────────────── */

for (const css of ['assets/css/lumora.css', 'variant-blue/assets/css/lumora.css']) {
  const p = join(ROOT, css);
  let s = readFileSync(p, 'utf8');
  const at = s.indexOf(CSS_MARKER);
  if (at !== -1) {
    const next = s.indexOf('\n/* --- ', at + CSS_MARKER.length);
    s = (s.slice(0, at) + (next === -1 ? '' : s.slice(next + 1))).replace(/\s+$/, '') + '\n';
  }
  writeFileSync(p, s + CSS);
  console.log(`  ${css.padEnd(34)} restraint styles ${at === -1 ? 'added' : 'refreshed'}`);
}

/* The engine's inline numbers, so the CSS variables above actually have something to
   override. Done as a text edit because the engine lives inline on every page. */
import { readdirSync, existsSync } from 'node:fs';

const PAGES = [];
for (const dir of ['', 'variant-blue']) {
  const base = dir ? join(ROOT, dir) : ROOT;
  if (!existsSync(base)) continue;
  for (const f of readdirSync(base)) if (f.endsWith('.html')) PAGES.push(dir ? `${dir}/${f}` : f);
}

let tuned = 0;
for (const rel of PAGES.sort()) {
  const file = join(ROOT, rel);
  const original = readFileSync(file, 'utf8');
  if (!original.includes('duration: 0.9')) continue;
  const s = original
    .split('duration: 0.9').join('duration: 0.5')
    .split('y: 40 }').join('y: 16 }');
  if (s === original) continue;
  writeFileSync(file, s);
  tuned += 1;
  console.log(`  ${rel.padEnd(26)} reveal 40px/0.9s -> 16px/0.5s`);
}

console.log(`\n${tuned} page(s) calmed`);
