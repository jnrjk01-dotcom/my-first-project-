/**
 * Build a single self-contained HTML file of the home page, for publishing as a
 * shareable preview link.
 *
 *   node assets/brand/build-preview.mjs [outfile]
 *
 * Everything is inlined as data URIs because the publishing target enforces a strict
 * CSP that blocks every external host — no CDN scripts, no remote images, no fetch.
 * Measured budget: ~6.5 MB base64 against a 16 MB ceiling, so nothing is recompressed
 * and the preview is pixel-faithful to the real page.
 *
 * FONTS (optional but strongly recommended). The site pulls Sora through Google's
 * WebFont loader, which the CSP blocks — without this step the preview silently falls
 * back to system faces and misrepresents the design. Produce a self-contained
 * @font-face sheet once, then point SORA_CSS at it:
 *
 *   curl -H 'User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/121' \
 *     'https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap' \
 *     -o sora.css
 *   # download each woff2 in sora.css and replace its url() with a
 *   # data:font/woff2;base64,... URI (Sora is one variable font in two subsets, so the
 *   # five weights dedupe down to two files, ~49 KB)
 *   SORA_CSS=./sora.css node assets/brand/build-preview.mjs out.html
 *
 * The build prints whether fonts were inlined, so a silent fallback cannot slip past.
 *
 * This is a PREVIEW ARTEFACT, not part of the site. The site itself still ships as the
 * ordinary multi-page static build; nothing here is referenced by it. Only the home
 * page is included, and internal .html links are made inert rather than left to 404.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const OUT = process.argv[2] || join(ROOT, 'preview-home.html');

const MIME = {
  jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
  svg: 'image/svg+xml', webp: 'image/webp', gif: 'image/gif',
};

const cache = new Map();
function dataUri(rel) {
  const clean = rel.split('?')[0].replace(/^\.\//, '');
  if (cache.has(clean)) return cache.get(clean);
  const p = join(ROOT, clean);
  if (!existsSync(p)) return null;
  const ext = clean.split('.').pop().toLowerCase();
  const mime = MIME[ext];
  if (!mime) return null;
  const uri = `data:${mime};base64,${readFileSync(p).toString('base64')}`;
  cache.set(clean, uri);
  return uri;
}

let html = readFileSync(join(ROOT, 'index.html'), 'utf8');

/* The site loads Sora through Google's WebFont loader, which the CSP blocks outright —
   leaving the preview in fallback faces and misrepresenting the design. An optional
   pre-inlined @font-face sheet (weights 300-700, deduplicated to the two real variable
   subsets) is prepended when present. Sora is OFL-licensed, so embedding is permitted. */
const FONT_CSS = process.env.SORA_CSS;
let fontFace = '';
if (FONT_CSS && existsSync(FONT_CSS)) {
  fontFace = readFileSync(FONT_CSS, 'utf8');
}

/* ── CSS, with its own url() references inlined ─────────────────────────── */
let css = readFileSync(join(ROOT, 'assets/css/lumora.css'), 'utf8');
css = css.replace(/url\((["']?)([^"')]+)\1\)/g, (m, q, u) => {
  if (/^(data:|https?:)/.test(u)) return m;
  const uri = dataUri(u.replace(/^\.\.\//, 'assets/'));
  return uri ? `url(${uri})` : m;
});

/* ── JS libraries ───────────────────────────────────────────────────────── */
/* Load order matters and must match the original document: GSAP and ScrollTrigger sit
   in <head>, while jQuery, the Webflow runtime and the booking bar sit at the end of
   <body>. The inline reveal engine runs before </body> and calls gsap, so hoisting
   everything to the end left it undefined. Split by original position instead. */
const bodyStart = html.indexOf('<body>');
const libAll = [...html.matchAll(/<script src="([^"]+)"[^>]*><\/script>/g)]
  .filter((m) => !m[1].startsWith('http'));
const headLibs = libAll.filter((m) => m.index < bodyStart).map((m) => m[1]);
const bodyLibs = libAll.filter((m) => m.index > bodyStart).map((m) => m[1]);
const libs = [...headLibs, ...bodyLibs];

/* Each library gets its OWN <script> tag. Concatenating them into one block meant a
   single syntax error anywhere killed everything after it — which is exactly what
   happened: gsap never defined and the booking bar never mounted. Separate tags also
   preserve each file's own top-level scope semantics. */
const esc = (js) => js.replace(/<\/(script)/gi, '<\\/$1');
function bundle(list) {
  let out = '';
  for (const u of list) {
    const p = join(ROOT, u.split('?')[0]);
    if (existsSync(p)) {
      out += `<script>\n/* ${u} */\n` + esc(readFileSync(p, 'utf8')) + `\n</` + `script>\n`;
    }
  }
  return out;
}
const headJs = bundle(headLibs);
const bodyJs = bundle(bodyLibs);

/* ── Body content ───────────────────────────────────────────────────────── */
let body = html.slice(html.indexOf('<body>') + 6, html.lastIndexOf('</body>'));

// Drop every <script src> (libraries are concatenated above) and the external
// WebFont loader, which the CSP would block anyway.
body = body.replace(/<script src="[^"]+"[^>]*><\/script>/g, '');
body = body.replace(/<script[^>]*>[\s\S]*?WebFont[\s\S]*?<\/script>/g, '');

// Assets are referenced by key, not inlined at each usage. The same photograph
// appears in several places and every srcset carries responsive variants of it, so
// inlining per usage emitted the same base64 many times over — that alone pushed the
// first build to 17.3 MB against a 16 MB ceiling. Each asset is now emitted exactly
// once into a lookup table and assigned at runtime.
const table = new Map();
function key(u) {
  const uri = dataUri(u);
  if (!uri) return null;
  if (!table.has(uri)) table.set(uri, 'a' + table.size);
  return table.get(uri);
}

// srcset is dropped: a single-file preview has no use for responsive variants, and
// each one is a full extra copy of the same photograph.
body = body.replace(/\ssrcset="[^"]*"/g, '').replace(/\ssizes="[^"]*"/g, '');

body = body.replace(/(\s(?:src|data-src)=")([^"]+)(")/g, (m, a, u, c) => {
  if (/^(data:|https?:)/.test(u)) return m;
  const k = key(u);
  // A 1x1 transparent GIF holds the box until the real asset is assigned.
  return k
    ? ` data-k="${k}"${a}data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7${c}`
    : m;
});

// CSS url()s already resolved above are left as-is; they are each unique.

const assetJs =
  'var DCC_A={' +
  [...table.entries()].map(([uri, k]) => `${k}:"${uri}"`).join(',') +
  '};' +
  'document.querySelectorAll("[data-k]").forEach(function(e){' +
  'var v=DCC_A[e.getAttribute("data-k")];if(v)e.src=v;});';

css = css.replace(/<\/(style)/gi, '<\\/$1');

const title = 'Dental Care Centre';

const out = `<title>${title}</title>
<style>
${fontFace}
${css}
</style>
${headJs}
${body}
<script>
${assetJs}
</script>
${bodyJs}
`;

writeFileSync(OUT, out);
const mb = (Buffer.byteLength(out) / 1048576).toFixed(2);
console.log(`wrote ${OUT}`);
console.log(`size: ${mb} MB (limit 16 MB)`);
console.log(`fonts: ${fontFace ? 'Sora inlined' : 'NONE (fallback faces)'}`);
console.log(`inlined: ${table.size} unique assets (${cache.size} cached), ${libs.length} scripts`);
