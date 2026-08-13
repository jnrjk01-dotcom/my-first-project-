/**
 * Install the real clinic photography.
 *
 *   node assets/brand/install-photos.mjs <dir-of-sources>
 *
 * Expects the four originals in <dir>: p1 banner, p2 treatment close-up,
 * p3 operatory, p4 dentist with child.
 *
 * The originals are 10-16 MB each at up to 6000px. Only the web-sized derivatives are
 * written into the repo — committing 39 MB of camera originals would bloat every clone
 * for no benefit, and the site never serves anything larger than 1344px.
 *
 * Hero rotation is three photos, not four: the roll-up banner is dense with its own
 * text and would sit directly behind the hero headline, so it goes further down the
 * page where it can be read whole at its own aspect ratio.
 *
 * Crop anchors were chosen by rendering the candidates and comparing them:
 *   - operatory / treatment  1.50:1 sources, centre anchor, 84% of frame kept
 *   - dentist + child        0.67:1 portrait, TOP anchor. Only 37% of the frame
 *     survives the 16:9 hero box, and the centre anchor cuts the dentist's head off
 *     at the mask while the upper anchor leaves a band of dead space. Top keeps his
 *     full face and the smile to camera, which is what carries at hero scale.
 */

import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync, copyFileSync, mkdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const SRC = process.argv[2];

if (!SRC || !existsSync(SRC)) {
  console.error('usage: node assets/brand/install-photos.mjs <dir-of-sources>');
  process.exit(1);
}

const HERO = '1344x752'; // matches the carousel box exactly

const JOBS = [
  { src: 'p3.jpg', out: 'clinic-operatory.jpg', size: HERO, focal: 'center' },
  { src: 'p4.jpg', out: 'clinic-dentist-child.jpg', size: HERO, focal: 'top' },
  { src: 'p2.jpg', out: 'clinic-treatment.jpg', size: HERO, focal: 'center' },
  // Banner keeps its own portrait shape; it is never cropped.
  { src: 'p1.jpg', out: 'clinic-banner.jpg', size: '1000x1500', focal: 'center' },
];

const fit = join(ROOT, 'assets/brand/fit-photo.mjs');
for (const j of JOBS) {
  const src = join(SRC, j.src);
  if (!existsSync(src)) {
    console.error(`missing source: ${src}`);
    process.exit(1);
  }
  execFileSync(
    'node',
    [fit, src, join(ROOT, 'assets/img', j.out), j.size, j.focal, '0.82'],
    { stdio: 'inherit' }
  );
}

/* ── Hero carousel ──────────────────────────────────────────────────────── */
const SLIDES = [
  {
    file: 'clinic-operatory.jpg',
    alt: 'A treatment room at the practice: dental chair, overhead light and chairside monitor.',
  },
  {
    file: 'clinic-dentist-child.jpg',
    alt: 'A dentist from the practice smiling to camera while treating a young patient.',
  },
  {
    file: 'clinic-treatment.jpg',
    alt: 'Close-up of a check-up in progress, gloved hands working with a dental mirror and probe.',
  },
];

const carouselHtml = SLIDES.map(
  (s, i) =>
    `<img src="assets/img/${s.file}" loading="${i === 0 ? 'eager' : 'lazy'}" ` +
    `alt="${s.alt}" width="1344" height="752" ` +
    `class="home-hero_image hide-on-mobile hero-carousel-img${i === 0 ? ' is-active' : ''}"/>`
).join(' ');

/* ── Outreach banner section ────────────────────────────────────────────── */
const BANNER_MARKER = 'section_outreach';
const bannerHtml =
  `<section class="${BANNER_MARKER}">` +
  '<div class="section-padding padding-100x100"><div class="container-large">' +
  '<figure class="outreach_figure">' +
  '<img src="assets/img/clinic-banner.jpg" loading="lazy" width="1000" height="1500" ' +
  'class="outreach_image" ' +
  'alt="Nyemwerera Ubobotheke outreach banner. Our aim: improving the quality of life for ' +
  'vulnerable communities. Objectives: to provide oral health services to vulnerable ' +
  'communities, to raise awareness on oral health, to provide education support to orphans ' +
  'and other vulnerable children, and to offer technical support to other institutions ' +
  'providing oral health services."/>' +
  '</figure></div></div></section>';

const CSS_MARKER = '/* --- outreach banner --- */';
const CSS = `
${CSS_MARKER}
/* The banner carries its own dense typography, so it is shown whole and uncropped.
   Capped against the viewport so it never dominates the page on a tall screen. */
.section_outreach { background: #f4f7fa; }
.outreach_figure { margin: 0; display: flex; justify-content: center; }
.outreach_image {
  width: auto;
  height: auto;
  max-width: 100%;
  max-height: 78vh;
  border-radius: 14px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.10);
}
`;

let pages = 0;
for (const rel of ['index.html', 'variant-blue/index.html']) {
  const file = join(ROOT, rel);
  let s = readFileSync(file, 'utf8');

  // Structural fingerprint taken before any edit. Any change to these counts means
  // the edit removed or unbalanced markup, and the file is left untouched.
  const before = {
    div: (s.match(/<div\b/g) || []).length,
    divClose: (s.match(/<\/div>/g) || []).length,
    section: (s.match(/<section\b/g) || []).length,
    script: (s.match(/<script\b/g) || []).length,
  };
  const original = s;

  /* Match the <img> TAGS themselves, not the class name as a bare string. The string
     "hero-carousel-img" also appears in the cycler script near </body> as a query
     selector, so a lastIndexOf on it spans from the hero to the end of the document
     and deletes the entire page body. */
  const imgRe = /<img\b[^>]*hero-carousel-img[^>]*>/g;
  const slides = [...s.matchAll(imgRe)];
  if (slides.length === 0) {
    console.log(`  ${rel}: carousel already replaced or not found — skipped`);
    continue;
  }

  const first = slides[0].index;
  const last = slides[slides.length - 1];
  const end = last.index + last[0].length;
  const span = s.slice(first, end);

  // The run of <img> tags must be a small, self-contained block.
  if (span.length > 4000 || /<\/(section|body|script)>/i.test(span)) {
    console.error(`  ${rel}: carousel span failed its sanity check (${span.length} bytes) — skipped`);
    continue;
  }

  s = s.slice(0, first) + carouselHtml + s.slice(end);

  // Insert the banner section immediately before the closing CTA.
  if (!s.includes(BANNER_MARKER)) {
    const cta = s.indexOf('<section class="section_cta">');
    if (cta !== -1) s = s.slice(0, cta) + bannerHtml + s.slice(cta);
  }

  const after = {
    div: (s.match(/<div\b/g) || []).length,
    divClose: (s.match(/<\/div>/g) || []).length,
    section: (s.match(/<section\b/g) || []).length,
    script: (s.match(/<script\b/g) || []).length,
  };
  // The banner adds exactly one <section> and two <div>s (section-padding and
  // container-large); nothing else may move. Counted from bannerHtml itself so the
  // expectation cannot drift from the markup.
  const addedDivs = (bannerHtml.match(/<div\b/g) || []).length;
  const addedSections = (bannerHtml.match(/<section\b/g) || []).length;
  const expected = { div: before.div + addedDivs, divClose: before.divClose + addedDivs,
                     section: before.section + addedSections, script: before.script };
  const drift = Object.keys(expected).filter((k) => after[k] !== expected[k]);
  if (drift.length) {
    console.error(`  ${rel}: ABORTED — structure drifted on ${drift.join(', ')}`);
    console.error(`    before ${JSON.stringify(before)}`);
    console.error(`    after  ${JSON.stringify(after)}`);
    writeFileSync(file, original);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  pages += 1;
  console.log(`  ${rel}: carousel -> 3 slides, outreach banner inserted`);
}

for (const css of ['assets/css/lumora.css', 'variant-blue/assets/css/lumora.css']) {
  const p = join(ROOT, css);
  let s = readFileSync(p, 'utf8');
  if (!s.includes(CSS_MARKER)) {
    writeFileSync(p, s + CSS);
    console.log(`  ${css}: +outreach styles`);
  }
}

// Mirror the new images into the variant-blue asset tree.
const mirror = join(ROOT, 'variant-blue/assets/img');
mkdirSync(mirror, { recursive: true });
for (const j of JOBS) {
  copyFileSync(join(ROOT, 'assets/img', j.out), join(mirror, j.out));
}
console.log(`  mirrored ${JOBS.length} image(s) into variant-blue/assets/img/`);

console.log(`\n${pages} page(s) updated`);
for (const j of JOBS) {
  const kb = Math.round(statSync(join(ROOT, 'assets/img', j.out)).size / 1024);
  console.log(`  assets/img/${j.out.padEnd(26)} ${kb}KB`);
}
