/**
 * Open the about page with the whole staff, watermarked.
 *
 *   node assets/brand/about-team-hero.mjs
 *
 * The hero's image was the template's AI clinic interior. It is now the practice's own
 * staff photograph, in the pattern the practice pointed at on smithandvanlierop.co.za,
 * with the Nyemwerera Ubobotheke wordmark laid over it.
 *
 * THE WATERMARK is lifted from the outreach banner in clinic-banner.jpg, because that is
 * the only place the mark exists in this repository: there is no vector of it. A
 * rectangular crop of a vinyl banner laid over a photograph reads as a sticker, so the
 * crop is reduced to a flat white silhouette on transparency by alpha-keying on
 * lightness. That works because the mark's parts separate cleanly from the banner blue
 * behind them, and it is why the crop starts to the right of the tooth device: the tooth
 * overlaps the wordmark's box and keyed into a white blob across the lettering.
 *
 * The ceiling here is the source. It is a 1000x1500 photograph of a printed banner, so
 * the mark carries the banner's weave and a little of its perspective. At 26% opacity and
 * 210px wide neither is visible, but this cannot be scaled up. A vector of the mark, or
 * the original artwork, would replace assets/img/watermark-nyemwerera.png directly.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PHOTO = 'about-team.jpg';
const MARK = 'watermark-nyemwerera.png';
const ALT =
  'The Dental Care Centre team, six clinicians and staff, at the practice in Bulawayo';

const CSS_MARKER = '/* --- about hero: staff photo watermark --- */';
const CSS = `
${CSS_MARKER}
/* The wrapper ships as static, so the mark has nothing to position against until it is
   made a containing block. */
.about-hero_image-wrap { position: relative; }
/* Webflow baked scale3d(1.5,1.5,1) onto this image as the start of a zoom-out reveal,
   and the exported interaction never runs, so it sits permanently at 1.5x and shows only
   the middle two thirds. That was survivable on a generic interior shot; on a group
   portrait it cuts the people at both ends in half. !important beats the inline style. */
.about-hero_image { transform: none !important; }
.about-hero_watermark {
  position: absolute;
  right: clamp(14px, 3%, 40px);
  bottom: clamp(12px, 4%, 34px);
  width: clamp(120px, 17%, 210px);
  height: auto;
  opacity: .26;
  /* A white mark can land on a light part of a photograph and vanish; the drop shadow
     keeps an edge under it wherever it falls. */
  filter: drop-shadow(0 1px 3px rgba(0, 0, 0, .55));
  pointer-events: none;
  user-select: none;
}
@media print { .about-hero_watermark { display: none; } }
`;

const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  img: (s.match(/<img\b/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

/* Mirror the assets first: markup pointing at a file the blue tree lacks would 404, and
   the site's image guard would swap in a branded gradient that hides the failure. */
for (const f of [PHOTO, MARK]) {
  const src = join(ROOT, 'assets/img', f);
  if (!existsSync(src)) {
    console.error(`  assets/img/${f} is missing`);
    process.exit(1);
  }
  const dst = join(ROOT, 'variant-blue/assets/img', f);
  const bytes = readFileSync(src);
  if (!existsSync(dst) || Buffer.compare(readFileSync(dst), bytes) !== 0) {
    writeFileSync(dst, bytes);
    console.log(`  ${f} mirrored into variant-blue/assets/img/`);
  }
}

let changed = 0;
for (const rel of ['about.html', 'variant-blue/about.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);

  // Matched by pattern, not by tag text: the wrapper carries a data-w-id and the reveal
  // engine's inline transform ahead of its class.
  const openTag = /<div\b[^>]*\babout-hero_image-wrap\b[^>]*>/.exec(s);
  if (!openTag) {
    console.error(`  ${rel}: hero image wrapper not found — skipped`);
    process.exitCode = 1;
    continue;
  }
  const open = openTag.index;
  const close = s.indexOf('</div>', open);
  if (close === -1) continue;
  let inner = s.slice(open + openTag[0].length, close);

  if (!/<img\b[^>]*about-hero_image/.test(inner)) {
    console.error(`  ${rel}: the wrapper does not hold the hero image — skipped`);
    process.exitCode = 1;
    continue;
  }

  const already = inner.includes(PHOTO) && inner.includes(MARK);
  if (already) {
    console.log(`  ${rel.padEnd(28)} already set`);
    continue;
  }

  // Point the hero image at the staff photograph. srcset and sizes go: they still list
  // the responsive variants of the image being replaced.
  inner = inner
    .replace(/(<img\b[^>]*\bsrc=")[^"]*(")/, `$1assets/img/${PHOTO}$2`)
    .replace(/\ssrcset="[^"]*"/g, '')
    .replace(/\ssizes="[^"]*"/g, '');
  inner = /<img\b[^>]*\salt="/.test(inner)
    ? inner.replace(/(<img\b[^>]*\salt=")[^"]*(")/, `$1${ALT}$2`)
    : inner.replace(/(<img\b)/, `$1 alt="${ALT}"`);

  if (!inner.includes(MARK)) {
    inner +=
      `<img class="about-hero_watermark" src="assets/img/${MARK}" alt="" ` +
      'aria-hidden="true" loading="lazy" decoding="async"/>';
  }

  s = s.slice(0, open + openTag[0].length) + inner + s.slice(close);

  const after = counts(s);
  if (
    after.div !== after.divClose ||
    after.div !== before.div ||
    after.section !== before.section ||
    after.script !== before.script ||
    after.img !== before.img + 1
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  changed += 1;
  console.log(`  ${rel.padEnd(28)} hero -> ${PHOTO} + watermark`);
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
  console.log(`  ${css.padEnd(34)} watermark styles ${at === -1 ? 'added' : 'refreshed'}`);
}

console.log(`\n${changed} page(s) updated`);
