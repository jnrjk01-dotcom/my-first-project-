/**
 * Dental Care Centre logo generator.
 *
 * Hand-traced from the photograph of the physical clinic sign. Run with:
 *   node assets/brand/build-logo.mjs
 *
 * Why a generator rather than four hand-edited SVGs: the navy and white lockups must
 * share identical geometry so they are swappable without layout shift, and the mark-only
 * file must be the exact same tooth-and-squares group. Deriving all of them from one
 * source of truth is the only way that stays true after an edit.
 *
 * Letterforms are drawn as explicit paths on a 100-unit cap-height grid and placed with
 * transforms, so the output contains no live <text> and needs no font installed.
 */

import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const IMG = join(dirname(fileURLToPath(import.meta.url)), '..', 'img');

/* ── Palette ──────────────────────────────────────────────────────────────
   Cleaned values, not raw pixel samples. The photograph reads much darker than
   the sign really is because it was shot in shade under warm light. */
const NAVY = '#10107A';
const ACCENT = '#3389CC';
const WHITE = '#FFFFFF';

/* ── Letterforms ──────────────────────────────────────────────────────────
   Bold condensed grotesque, all caps. Cap height 100, stem 21, drawn y-down with
   the baseline at y=100. `w` is the glyph width; tracking is applied at placement. */
const GLYPHS = {
  D: { w: 68, d: 'M0 0H32C52 0 68 14 68 33V67C68 86 52 100 32 100H0V0ZM22 19V81H31C42 81 46 74 46 64V36C46 26 42 19 31 19H22Z' },
  E: { w: 58, d: 'M0 0H58V20H22V40H52V58H22V80H58V100H0V0Z' },
  N: { w: 70, d: 'M0 100V0H20L48 58V0H70V100H50L22 42V100H0Z' },
  T: { w: 62, d: 'M0 0H62V20H42V100H20V20H0V0Z' },
  A: { w: 70, d: 'M0 100L26 0H44L70 100H48L44 79H26L22 100H0ZM29.5 60H40.5L35 33L29.5 60Z' },
  L: { w: 56, d: 'M0 0H22V80H56V100H0V0Z' },
  C: { w: 68, d: 'M68 34C68 13 55 0 34 0C14 0 0 14 0 34V66C0 86 14 100 34 100C55 100 68 87 68 66H46C46 74 41 80 34 80C28 80 22 75 22 66V34C22 25 28 20 34 20C41 20 46 26 46 34H68Z' },
  R: { w: 68, d: 'M0 0H36C54 0 66 11 66 28C66 40 60 48 51 52L68 100H45L31 57H22V100H0V0ZM22 19V39H32C38 39 43 35 43 29C43 23 38 19 32 19H22Z' },
};

/** Tracking, in cap-height units, matched to the letter spacing measured off the sign. */
const TRACK = 6.4;

/**
 * Lay out a word as outlined paths.
 * `tracking` is extra advance between glyphs, in cap-height units (negative = tighter).
 */
function word(text, { x, y, size, fill, tracking = TRACK }) {
  const s = size / 100;
  let cursor = 0;
  const parts = [];

  for (const ch of text) {
    if (ch === ' ') {
      cursor += 26 + tracking;
      continue;
    }
    const g = GLYPHS[ch];
    if (!g) throw new Error(`No glyph for "${ch}" — add it to GLYPHS.`);
    parts.push(
      `<path d="${g.d}" transform="translate(${(x + cursor * s).toFixed(2)} ${y}) scale(${s.toFixed(5)})" fill="${fill}" fill-rule="evenodd"/>`
    );
    cursor += g.w + tracking;
  }
  return { svg: parts.join('\n    '), width: (cursor - tracking) * s };
}

function wordWidth(text, size, tracking = TRACK) {
  let cursor = 0;
  for (const ch of text) {
    if (ch === ' ') { cursor += 26 + tracking; continue; }
    cursor += GLYPHS[ch].w + tracking;
  }
  return ((cursor - tracking) * size) / 100;
}

/* ── Geometry ─────────────────────────────────────────────────────────────
   Traced from the sign. The artwork spans 918 × 390; the viewBox is set tight to it.

   Squares are true squares, axis-aligned, unequal, deliberately offset. The wordmark
   rectangle's left edge tucks behind the tooth group, so the tooth is painted last. */
const W = 918;
const H = 390;

const SQ_A = { x: 0, y: 67, s: 160 };    // filled, upper left
const SQ_B = { x: 36, y: 229, s: 128 };  // outlined, lower left
const SQ_C = { x: 185, y: 222, s: 167 }; // filled, lower centre

const RECT = { x: 159, y: 0, w: 759, h: 207 };
const RECT_STROKE = +(RECT.h / 40).toFixed(1); // ≈ 5.2, per the sign's proportion

// Single molar: wide rounded crown, two roots splaying apart with a deep notch.
const TOOTH =
  // crown: wide, rounded, slightly flattened across the top
  'M121 0C60 0 6 30 6 92' +
  'C6 132 13 165 20 198' +
  // left root: outer edge down, rounded tip, inner edge back up to the notch
  'C26 232 30 268 34 288C38 306 66 308 74 290' +
  'C82 262 88 232 95 210' +
  // the notch — a wide inverted V, not a slit
  'C101 192 141 192 147 210' +
  // right root
  'C154 232 160 262 168 290C176 308 204 306 208 288' +
  'C212 268 216 232 222 198' +
  'C229 165 236 132 236 92' +
  'C236 30 182 0 121 0Z';
const TOOTH_POS = { x: 63, y: 83 };

/** Wordmark: DENTAL CARE over CENTRE, CENTRE smaller and indented right-of-centre. */
const L1_SIZE = 62;   // cap height, line 1
const L2_SIZE = 58;   // cap height, line 2 — slightly smaller
const L1_Y = 21;    // cap top of line 1
const L2_Y = 125;   // cap top of line 2
const L1_X = 357;
// CENTRE is inset from the right edge of the rectangle, matching the sign.
// CENTRE is indented and set right-of-centre, its right edge inset from the rectangle.
const L2_X = 720 - wordWidth('CENTRE', L2_SIZE);

/**
 * @param {object} o
 * @param {string} o.ink     tooth + line 1 + rectangle stroke + outlined square
 * @param {string} o.accent  CENTRE + the two filled squares
 */
function lockup({ ink, accent }) {
  const line1 = word('DENTAL CARE', { x: L1_X, y: L1_Y, size: L1_SIZE, fill: ink });
  const line2 = word('CENTRE', { x: L2_X, y: L2_Y, size: L2_SIZE, fill: accent });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" fill="none" role="img" aria-label="Dental Care Centre">
  <title>Dental Care Centre</title>
  <g id="mark">
    <rect x="${SQ_A.x}" y="${SQ_A.y}" width="${SQ_A.s}" height="${SQ_A.s}" fill="${accent}"/>
    <rect x="${SQ_C.x}" y="${SQ_C.y}" width="${SQ_C.s}" height="${SQ_C.s}" fill="${accent}"/>
    <rect x="${SQ_B.x + 5}" y="${SQ_B.y + 5}" width="${SQ_B.s - 10}" height="${SQ_B.s - 10}" fill="none" stroke="${ink}" stroke-width="10"/>
  </g>
  <rect x="${RECT.x + RECT_STROKE / 2}" y="${RECT.y + RECT_STROKE / 2}" width="${RECT.w - RECT_STROKE}" height="${RECT.h - RECT_STROKE}" fill="none" stroke="${ink}" stroke-width="${RECT_STROKE}"/>
  <g id="wordmark">
    ${line1.svg}
    ${line2.svg}
  </g>
  <path d="${TOOTH}" transform="translate(${TOOTH_POS.x} ${TOOTH_POS.y})" fill="${ink}"/>
</svg>
`;
}

/**
 * Compact lockup for small screens.
 *
 * The full lockup cannot survive 36px: its wordmark would render at a 5.7px cap height
 * and the rectangle stroke at 0.48px, i.e. sub-pixel and effectively gone. Rather than
 * shrink it, this variant drops the rectangle and re-proportions the pieces so the
 * wordmark drives the height instead of the mark — the same lockup at 36px then gets a
 * 13.7px cap height, which is legible.
 */
function compact({ ink, accent }) {
  // Mark group bounds in artwork space.
  const gx0 = 0;
  const gy0 = SQ_A.y;
  const gx1 = Math.max(SQ_C.x + SQ_C.s, TOOTH_POS.x + 236);
  const gy1 = Math.max(SQ_C.y + SQ_C.s, TOOTH_POS.y + 302);
  const gw = gx1 - gx0;
  const gh = gy1 - gy0;

  const H2 = 100;
  const markScale = H2 / gh;
  const markW = gw * markScale;

  const GAP = 14;
  const C1 = 38; // DENTAL CARE cap height
  const C2 = 34; // CENTRE cap height
  const tx = markW + GAP;
  const w1 = wordWidth('DENTAL CARE', C1);
  const w2 = wordWidth('CENTRE', C2);
  const total = tx + w1;

  const l1 = word('DENTAL CARE', { x: tx, y: 12, size: C1, fill: ink });
  const l2 = word('CENTRE', { x: tx + (w1 - w2), y: 58, size: C2, fill: accent });

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total.toFixed(1)} ${H2}" width="${total.toFixed(0)}" height="${H2}" fill="none" role="img" aria-label="Dental Care Centre">
  <title>Dental Care Centre</title>
  <g transform="scale(${markScale.toFixed(5)}) translate(${-gx0} ${-gy0})">
    <rect x="${SQ_A.x}" y="${SQ_A.y}" width="${SQ_A.s}" height="${SQ_A.s}" fill="${accent}"/>
    <rect x="${SQ_C.x}" y="${SQ_C.y}" width="${SQ_C.s}" height="${SQ_C.s}" fill="${accent}"/>
    <rect x="${SQ_B.x + 5}" y="${SQ_B.y + 5}" width="${SQ_B.s - 10}" height="${SQ_B.s - 10}" fill="none" stroke="${ink}" stroke-width="10"/>
    <path d="${TOOTH}" transform="translate(${TOOTH_POS.x} ${TOOTH_POS.y})" fill="${ink}"/>
  </g>
  ${l1.svg}
  ${l2.svg}
</svg>
`;
}

/** Mark only: tooth + squares, square viewBox with even optical padding. */
function markOnly({ ink, accent }) {
  // Tight bounds of the tooth-and-squares group.
  const minX = 0;
  const maxX = Math.max(SQ_C.x + SQ_C.s, TOOTH_POS.x + 242);
  const minY = SQ_A.y;
  const maxY = Math.max(SQ_C.y + SQ_C.s, TOOTH_POS.y + 302);
  const gw = maxX - minX;
  const gh = maxY - minY;
  const side = Math.max(gw, gh);
  const pad = side * 0.12;
  const box = side + pad * 2;
  const ox = minX - pad - (side - gw) / 2;
  const oy = minY - pad - (side - gh) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${ox.toFixed(1)} ${oy.toFixed(1)} ${box.toFixed(1)} ${box.toFixed(1)}" width="512" height="512" fill="none" role="img" aria-label="Dental Care Centre">
  <title>Dental Care Centre</title>
  <rect x="${SQ_A.x}" y="${SQ_A.y}" width="${SQ_A.s}" height="${SQ_A.s}" fill="${accent}"/>
  <rect x="${SQ_C.x}" y="${SQ_C.y}" width="${SQ_C.s}" height="${SQ_C.s}" fill="${accent}"/>
  <rect x="${SQ_B.x + 5}" y="${SQ_B.y + 5}" width="${SQ_B.s - 10}" height="${SQ_B.s - 10}" fill="none" stroke="${ink}" stroke-width="10"/>
  <path d="${TOOTH}" transform="translate(${TOOTH_POS.x} ${TOOTH_POS.y})" fill="${ink}"/>
</svg>
`;
}

/** Favicon / apple-touch: mark on a solid navy tile so it survives any browser chrome. */
function tile({ ink, accent, bg, size = 180, radiusPct = 0 }) {
  const inner = markOnly({ ink, accent });
  const vb = inner.match(/viewBox="([^"]+)"/)[1];
  const body = inner
    .replace(/^[\s\S]*?<title>[^<]*<\/title>/, '')
    .replace(/<\/svg>\s*$/, '');
  const [ox, oy, bw, bh] = vb.split(' ').map(Number);
  // 14% safe padding inside the tile.
  const scale = 0.72;
  const off = (1 - scale) / 2;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" role="img" aria-label="Dental Care Centre">
  <title>Dental Care Centre</title>
  <rect width="${size}" height="${size}" ${radiusPct ? `rx="${(size * radiusPct).toFixed(1)}"` : ''} fill="${bg}"/>
  <g transform="translate(${(size * off).toFixed(2)} ${(size * off).toFixed(2)}) scale(${((size * scale) / bw).toFixed(5)}) translate(${-ox} ${-oy})">${body}</g>
</svg>
`;
}

/* ── Emit ─────────────────────────────────────────────────────────────────── */
const files = {
  'logo-dcc-navy.svg': lockup({ ink: NAVY, accent: ACCENT }),
  'logo-dcc-white.svg': lockup({ ink: WHITE, accent: ACCENT }),
  'logo-dcc-compact-navy.svg': compact({ ink: NAVY, accent: ACCENT }),
  'logo-dcc-compact-white.svg': compact({ ink: WHITE, accent: ACCENT }),
  'logo-dcc-mark.svg': markOnly({ ink: NAVY, accent: ACCENT }),
  'logo-dcc-mark-white.svg': markOnly({ ink: WHITE, accent: ACCENT }),
  'favicon-dcc.svg': tile({ ink: WHITE, accent: ACCENT, bg: NAVY, size: 64 }),
  'apple-touch-icon.svg': tile({ ink: WHITE, accent: ACCENT, bg: NAVY, size: 180 }),
};

for (const [name, svg] of Object.entries(files)) {
  writeFileSync(join(IMG, name), svg);
  console.log(`wrote assets/img/${name}  (${svg.length} bytes)`);
}

const MIRRORED = Object.keys(files);
/* Both site trees have their own assets/img. Mirror every generated file into
   variant-blue, or its pages 404 and the inline image guard silently swaps in a
   gradient placeholder — which looks intentional and hides the mistake. */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
const MIRROR = join(IMG, '..', '..', 'variant-blue', 'assets', 'img');
if (existsSync(join(IMG, '..', '..', 'variant-blue'))) {
  mkdirSync(MIRROR, { recursive: true });
  for (const name of MIRRORED) {
    copyFileSync(join(IMG, name), join(MIRROR, name));
  }
  console.log(`\nmirrored ${MIRRORED.length} file(s) into variant-blue/assets/img/`);
}


console.log(`\nlockup viewBox: 0 0 ${W} ${H}  (ratio ${(W / H).toFixed(4)})`);
console.log(`rect stroke: ${RECT_STROKE} (${(RECT.h / RECT_STROKE).toFixed(0)}:1 vs height)`);
console.log(`DENTAL CARE width: ${wordWidth('DENTAL CARE', L1_SIZE).toFixed(1)}`);
console.log(`CENTRE width: ${wordWidth('CENTRE', L2_SIZE).toFixed(1)}  x=${L2_X.toFixed(1)}`);
