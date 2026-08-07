/**
 * Install the Dental Care Centre logo across both site trees.
 *
 *   node assets/brand/install-logo.mjs
 *
 * Idempotent: safe to re-run. It matches on the old filenames and on marker comments,
 * so a second run is a no-op rather than a double-insert.
 *
 * Variant choice is driven by the MEASURED background behind each placement, not by
 * assumption:
 *   - main-page header  → navbar is position:absolute and transparent over the dark
 *                         hero photograph (sampled rgb(13,37,38)) → WHITE lockup
 *   - main-page footer  → #011f23 teal / #06182e blue                → WHITE lockup
 *   - legal-page nav    → #fafafa                                     → NAVY lockup
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { globSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join, relative } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Lockup aspect from the generator viewBox: 918 x 390. */
const RATIO = 918 / 390;
const dim = (h) => ({ h, w: Math.round(h * RATIO) });

const HEADER = dim(44); // desktop header
const FOOTER = dim(52);
const LEGAL = dim(36);

const CSS_MARKER = '/* --- Dental Care Centre logo --- */';
const CSS_BLOCK = `
${CSS_MARKER}
/* The lockup is 918x390 (2.354:1). The previous mark was 4.6:1, so the anchor's
   140px max-width alone would render this one ~60px tall. Heights are therefore
   explicit, and the anchor cap is lifted. */
.navbar_logo { max-width: none; }
.logo_image { height: ${HEADER.h}px; width: auto; object-fit: contain; }
.footer_brand .brand_logo { height: ${FOOTER.h}px; width: auto; object-fit: contain; }

@media screen and (max-width: 767px) {
  .logo_image { height: 36px; }
  .footer_brand .brand_logo { height: 44px; }
}

@media print {
  /* The white lockup is invisible on paper. Swap the image content itself — a
     background-image would not do, because browsers omit background graphics from
     print by default. */
  .logo_image,
  .footer_brand .brand_logo { content: url("../img/logo-dcc-navy.png"); }
}
`;

const HEAD_MARKER = '<!-- Dental Care Centre icons -->';
const headBlock = (p) => `    ${HEAD_MARKER}
    <link rel="icon" href="${p}assets/img/favicon-dcc.svg" type="image/svg+xml"/>
    <link rel="icon" href="${p}assets/img/favicon-32.png" sizes="32x32" type="image/png"/>
    <link rel="icon" href="${p}assets/img/favicon-16.png" sizes="16x16" type="image/png"/>
    <link rel="apple-touch-icon" href="${p}assets/img/apple-touch-icon.png"/>
    <link rel="manifest" href="${p}site.webmanifest"/>
    <meta name="theme-color" content="#10107A"/>
`;

const files = [];
for (const dir of ['.', 'variant-blue']) {
  for (const f of [
    'index.html', 'about.html', 'service.html', 'blog.html',
    'privacy.html', 'cookies.html', 'terms.html', 'licenses.html', '404.html',
  ]) {
    const p = join(ROOT, dir, f);
    if (existsSync(p)) files.push(p);
  }
}

let changed = 0;
const report = [];

for (const file of files) {
  const rel = relative(ROOT, file);
  let s = readFileSync(file, 'utf8');
  const before = s;
  const notes = [];

  // ── Header (main pages): white lockup ─────────────────────────────────
  const headerRe = /(<img[^>]*class="logo_image"[^>]*>)/g;
  s = s.replace(headerRe, () => {
    notes.push('header→white');
    return `<img loading="eager" src="assets/img/logo-dcc-white.svg" alt="Dental Care Centre" width="${HEADER.w}" height="${HEADER.h}" class="logo_image"/>`;
  });
  // The header img in this export puts class last; also catch src-first form.
  s = s.replace(
    /<img loading="eager" src="assets\/img\/lumora-logo-dark\.svg" alt="[^"]*" class="logo_image"\/>/g,
    () => {
      notes.push('header→white');
      return `<img loading="eager" src="assets/img/logo-dcc-white.svg" alt="Dental Care Centre" width="${HEADER.w}" height="${HEADER.h}" class="logo_image"/>`;
    }
  );

  // ── Footer (main pages): white lockup ─────────────────────────────────
  s = s.replace(
    /<img src="assets\/img\/lumora-logo-dark\.svg" loading="lazy" alt="[^"]*" class="brand_logo"\/>/g,
    () => {
      notes.push('footer→white');
      return `<img src="assets/img/logo-dcc-white.svg" loading="lazy" alt="Dental Care Centre" width="${FOOTER.w}" height="${FOOTER.h}" class="brand_logo"/>`;
    }
  );

  // ── Legal pages: navy lockup on #fafafa ───────────────────────────────
  s = s.replace(
    /<img src="assets\/img\/lumora-logo\.svg" alt="[^"]*" height="\d+"\/>/g,
    () => {
      notes.push('legal→navy');
      return `<img src="assets/img/logo-dcc-navy.svg" alt="Dental Care Centre" width="${LEGAL.w}" height="${LEGAL.h}"/>`;
    }
  );

  // ── Head: icons, manifest, theme-color ────────────────────────────────
  if (!s.includes(HEAD_MARKER)) {
    const prefix = rel.startsWith('variant-blue') ? '' : '';
    const block = headBlock(prefix);
    if (s.includes('</head>')) {
      s = s.replace('</head>', `${block}  </head>`);
      notes.push('head+icons');
    }
  }

  // Retire the old favicon lines so two icon sets do not compete.
  s = s.replace(
    /\s*<link href="assets\/img\/favicon\.svg" rel="shortcut icon" type="image\/x-icon"\/>/g,
    ''
  );
  s = s.replace(/\s*<link href="assets\/img\/webclip\.png" rel="apple-touch-icon"\/>/g, '');

  if (s !== before) {
    writeFileSync(file, s);
    changed += 1;
    report.push(`  ${rel.padEnd(28)} ${[...new Set(notes)].join(', ')}`);
  }
}

// ── Stylesheets (one per tree) ──────────────────────────────────────────
for (const css of ['assets/css/lumora.css', 'variant-blue/assets/css/lumora.css']) {
  const p = join(ROOT, css);
  if (!existsSync(p)) continue;
  let s = readFileSync(p, 'utf8');
  if (!s.includes(CSS_MARKER)) {
    writeFileSync(p, s + CSS_BLOCK);
    report.push(`  ${css.padEnd(28)} +logo sizing, +print rule`);
  }
}

// ── Web manifest (one per tree) ─────────────────────────────────────────
const manifest = {
  name: 'Dental Care Centre',
  short_name: 'Dental Care Centre',
  theme_color: '#10107A',
  background_color: '#10107A',
  display: 'standalone',
  start_url: './',
  icons: [
    { src: 'assets/img/icon-192.png', sizes: '192x192', type: 'image/png' },
    { src: 'assets/img/icon-512.png', sizes: '512x512', type: 'image/png' },
    { src: 'assets/img/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
for (const m of ['site.webmanifest', 'variant-blue/site.webmanifest']) {
  writeFileSync(join(ROOT, m), JSON.stringify(manifest, null, 2) + '\n');
  report.push(`  ${m.padEnd(28)} written`);
}

console.log(`\n${changed} HTML file(s) changed\n`);
console.log(report.join('\n'));
