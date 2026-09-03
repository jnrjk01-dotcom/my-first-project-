/**
 * One hero photograph on phones, the rotation kept for wider screens.
 *
 *   node assets/brand/hero-mobile.mjs
 *
 * The hero cycled three photographs. They are all wide landscape frames (1344x752) and a
 * phone hero is a tall box, so object-fit: cover was showing about a quarter of each
 * one's width: three different narrow strips, swapping every five seconds. On a phone it
 * read as flicker rather than as photographs. Phones now show the treatment room and
 * nothing else; anything 768px and wider keeps all three and the crossfade.
 *
 * TWO THINGS MAKE THE ONE PHOTOGRAPH FIT BETTER.
 *
 * The band is capped. The image wrap ran the full height of the hero, but the Location
 * and Opening Hours strip is opaque and covers everything below about 436px of 912, so
 * over half the photograph was being cropped to fill space nobody can see. Limiting the
 * wrap to the part that is actually visible takes the box from 390x912 to roughly
 * 390x438, which is a far less extreme shape, and the visible slice goes from 24% of the
 * photograph's width to about 50%.
 *
 * The crop is re-aimed. object-position was 72%, which put the strip on the doorway and
 * the monitor at the right of the frame and cut the dental chair out. The chair sits
 * near 44% across, so that is where it now points.
 *
 * THE OTHER TWO ARE NOT IN THE MARKUP AT ALL. They are created by the script, on wide
 * screens only, so a phone never downloads them. Emptying their src instead would have
 * been worse than useless: an <img> with no src reports complete with naturalWidth 0,
 * which is exactly the condition the page's image guard treats as a broken image, and it
 * would have swapped both for gradient placeholders.
 *
 * With JavaScript off, every screen gets the treatment room and no rotation, which is a
 * fair outcome rather than a broken one.
 *
 * The script is idempotent: it checks for the extra images before removing them and
 * rewrites the cycler and the CSS block in place.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** The photographs that only wider screens get. Order is the rotation order. */
const EXTRA = [
  ['assets/img/clinic-dentist-child.jpg',
   'A dentist from the practice smiling to camera while treating a young patient.'],
  ['assets/img/clinic-treatment.jpg',
   'Close-up of a check-up in progress, gloved hands working with a dental mirror and probe.'],
];

/** The one every screen keeps. */
const KEEP = 'assets/img/clinic-operatory.jpg';

const CSS_MARKER = '/* --- hero: single photograph on phones --- */';
const CSS = `
${CSS_MARKER}
@media screen and (max-width: 767px) {
  /* The Location and Opening Hours strip is opaque and sits over everything below the
     button, so the lower half of the hero photograph was being cropped to fill space
     that is covered anyway. Capping the band at the part that is actually visible makes
     the box far less tall and thin, and roughly doubles how much of the photograph fits:
     a quarter of its width before, about half now. */
  .hero-image_wrap { height: 48% !important; }
  /* 72% pointed the visible strip at the doorway and the monitor on the right of the
     frame, with the dental chair cropped out. The chair sits near 44% across. */
  .home-hero_image { object-position: 44% 50% !important; }

  /* A scrim, because the crop puts a bright wall, counter and lit monitor behind the
     copy. With none at all, white text measures 1.21:1 against the brightest pixel behind
     it, which is invisible rather than merely low.

     How light it can go was measured rather than guessed, hiding the copy and sampling
     what is behind it against the mean brightness of the whole photo band:

       none            1.21:1   30.1% bright
       .55/.40/.06     2.84:1   20.8%
       .62/.48/.10     3.30:1   19.5%   <- here
       .72/.60/.20     4.25:1   17.7%
       .82/.72/.45     6.38:1   16.0%

     The first version of this sat at the bottom of that table and buried the room. This
     sits near the top of it. Moving the crop was tried first and does nothing: the room
     measures between 2.7 and 2.9 behind the copy at every horizontal position, because it
     is uniformly bright there rather than bright in one spot.

     3.30:1 is the AA threshold for large text, which is why the standfirst below is set
     to a size and weight that counts as large. The headline is 40px and already did. */
  .hero-image_wrap::after {
    content: "";
    position: absolute;
    inset: 0;
    background: linear-gradient(180deg,
      rgba(1, 31, 35, .62) 0%,
      rgba(1, 31, 35, .48) 45%,
      rgba(1, 31, 35, .10) 100%);
    pointer-events: none;
  }

  /* The standfirst was 16px regular, which is body text and would need 4.5:1 — only
     reachable by darkening the photo back down. At 19px bold it is large text by the same
     standard, so 3:1 applies and the measured 3.30:1 covers it. 700 rather than 600
     because the standard says bold, and 600 is arguable where 700 is not. */
  .home-hero_content p {
    font-size: 19px;
    font-weight: 700;
  }

  /* Carries contrast on the glyphs themselves rather than by darkening the whole picture.
     It is not counted by the contrast standard, which is why the sizes above do the
     compliance work; this is what makes it comfortable to read over a busy photograph. */
  .section_hero h1,
  .home-hero_content p {
    text-shadow: 0 1px 2px rgba(1, 31, 35, .95), 0 2px 14px rgba(1, 31, 35, .8);
  }
}
`;

/* ── The cycler ──────────────────────────────────────────────────────────── */

const CYCLER =
  '(function(){' +
  'var EXTRA=' + JSON.stringify(EXTRA) + ';' +
  'function go(){' +
  'var first=document.querySelector(".hero-carousel-img");' +
  'if(!first||!first.parentElement)return;' +
  /* Phones keep the single photograph: these are wide frames and a phone hero crops them
     to a narrow strip, so rotating them swaps between slices rather than pictures. */
  'if(!window.matchMedia("(min-width: 768px)").matches)return;' +
  'if(window.matchMedia("(prefers-reduced-motion: reduce)").matches)return;' +
  'var wrap=first.parentElement,imgs=[first];' +
  'EXTRA.forEach(function(d){' +
  'var im=first.cloneNode(false);' +
  'im.classList.remove("is-active");' +
  /* The clone would otherwise carry the first image's interaction id, and two elements
     answering to the same id is a thing the reveal engine should not have to think about. */
  'im.removeAttribute("data-w-id");' +
  'im.setAttribute("loading","lazy");' +
  'im.src=d[0];im.alt=d[1];' +
  'wrap.appendChild(im);imgs.push(im);' +
  '});' +
  'var i=0;' +
  'setInterval(function(){' +
  'imgs[i].classList.remove("is-active");' +
  'i=(i+1)%imgs.length;' +
  'imgs[i].classList.add("is-active");' +
  '},5000);' +
  '}' +
  'document.readyState!=="loading"?go():document.addEventListener("DOMContentLoaded",go);' +
  '})();';

/* ── Apply ───────────────────────────────────────────────────────────────── */

const counts = (s) => ({
  img: (s.match(/<img\b/g) || []).length,
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
  scriptClose: (s.match(/<\/script>/g) || []).length,
});

let changed = 0;
for (const rel of ['index.html', 'variant-blue/index.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);
  const done = [];

  // 1. Drop the two extra <img> tags, identified by their file rather than by position.
  let removed = 0;
  for (const [src] of EXTRA) {
    const re = new RegExp('<img\\b[^>]*\\bsrc="' + src.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '"[^>]*>', 'g');
    const hits = s.match(re);
    if (!hits) continue;
    s = s.replace(re, '');
    removed += hits.length;
  }
  if (removed) done.push(`${removed} image(s) removed from the markup`);

  // 2. Swap the cycler for one that adds them back on wide screens only.
  const open = s.indexOf('function startHeroCarousel');
  if (open !== -1) {
    let a = s.lastIndexOf('<script', open);
    let b = s.indexOf('</script>', open);
    if (a === -1 || b === -1) {
      console.error(`  ${rel}: could not isolate the cycler — skipped`);
      process.exitCode = 1;
      continue;
    }
    const tagEnd = s.indexOf('>', a) + 1;
    s = s.slice(0, tagEnd) + CYCLER + s.slice(b);
    done.push('cycler replaced');
  } else if (!s.includes('window.matchMedia("(min-width: 768px)")')) {
    console.error(`  ${rel}: no hero cycler found — skipped`);
    process.exitCode = 1;
    continue;
  }

  if (!done.length) {
    console.log(`  ${rel.padEnd(26)} already single-photo on phones`);
    continue;
  }

  if (!s.includes(KEEP)) {
    console.error(`  ${rel}: ABORTED — the kept photograph is no longer referenced`);
    process.exitCode = 1;
    continue;
  }

  const after = counts(s);
  if (
    after.img !== before.img - removed ||
    after.div !== before.div ||
    after.divClose !== before.divClose ||
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
  console.log(`  ${css.padEnd(34)} hero styles ${at === -1 ? 'added' : 'refreshed'}`);
}

console.log(`\n${changed} page(s) updated`);
