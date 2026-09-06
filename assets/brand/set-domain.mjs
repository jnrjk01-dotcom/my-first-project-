/**
 * Tell the site what address it lives at.
 *
 *   node assets/brand/set-domain.mjs dentalcarecentre.co.zw
 *   node assets/brand/set-domain.mjs https://www.dentalcarecentre.co.zw
 *
 * Five things need the real domain and cannot be guessed, which is why seo.mjs leaves them
 * out rather than filling them with a placeholder:
 *
 *   canonical    Says "this page is the original". Point it at the wrong host and a search
 *                engine will credit that host instead, which is one of the few on-page
 *                mistakes that can remove a site from results entirely. Absent is safe;
 *                wrong is not.
 *   og:url       The address a shared link resolves to.
 *   og:image     Social previews need an absolute URL. A relative path shows no picture.
 *   sitemap.xml  The list of pages worth indexing.
 *   robots.txt   Points crawlers at the sitemap, and keeps them out of the colour variant,
 *                which is a byte-for-byte second copy of the site and would otherwise
 *                compete with it for the same searches.
 *
 * Re-runnable: run it again after moving the site and everything follows. Run it with a
 * different host and nothing is left pointing at the old one.
 *
 * The colour variant under variant-blue/ is treated as a copy, not as the live site. If
 * the blue variant is what gets published instead, publish it at the root of the domain
 * rather than in a subfolder, and this stays correct.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const arg = (process.argv[2] || '').trim();
if (!arg) {
  console.error('usage: node assets/brand/set-domain.mjs dentalcarecentre.co.zw');
  process.exit(1);
}

let origin;
try {
  origin = new URL(/^https?:\/\//i.test(arg) ? arg : `https://${arg}`).origin;
} catch {
  console.error(`"${arg}" is not a domain I can parse.`);
  process.exit(1);
}
if (!/\./.test(new URL(origin).hostname)) {
  console.error(`"${arg}" has no dot in it, so it is not a domain.`);
  process.exit(1);
}

/* The home page is served at the root of the domain, not at /index.html. Both work, but a
   canonical has to name one of them and the bare root is the one people link to. */
const PAGES = {
  'index.html': '/',
  'about.html': '/about.html',
  'service.html': '/service.html',
  'privacy.html': '/privacy.html',
  'terms.html': '/terms.html',
};

let changed = 0;
for (const [page, path] of Object.entries(PAGES)) {
  const p = join(ROOT, page);
  if (!existsSync(p)) continue;
  let h = readFileSync(p, 'utf8');
  const before = h;
  const url = origin + path;

  // Canonical: replace an existing one rather than stacking a second.
  h = h.replace(/\s*<link rel="canonical"[^>]*>/g, '');
  h = h.replace('</title>', `</title>\n        <link rel="canonical" href="${url}"/>`);

  // og:url, same treatment.
  h = h.replace(/\s*<meta content="[^"]*" property="og:url"\/?>/g, '');
  h = h.replace(
    /(<meta content="[^"]*" property="og:title"\/?>)/,
    `$1\n        <meta content="${url}" property="og:url"/>`
  );

  /* Social previews need a full URL. The relative path the pages carry shows nothing at
     all when the link is pasted into WhatsApp, which is where most of these links go. */
  h = h.replace(
    /<meta content="(assets\/[^"]+)" (property="og:image"|name="twitter:image")\/?>/g,
    (m, rel, attr) => `<meta content="${origin}/${rel}" ${attr}/>`
  );
  h = h.replace(
    /<meta content="https?:\/\/[^"]*\/(assets\/[^"]+)" (property="og:image"|name="twitter:image")\/?>/g,
    (m, rel, attr) => `<meta content="${origin}/${rel}" ${attr}/>`
  );

  /* The Dentist record should say where the practice's own page is. Clear any previous
     value before inserting: adding first and de-duplicating afterwards kept whichever line
     the pattern happened to reach first, which on a second run was the old domain. */
  h = h.replace(/\n\s*"url": "https?:\/\/[^"]*",(?=\n\s*")/g, '');
  h = h.replace(
    /("@type": "Dentist",\n\s*"name": "[^"]*",)/,
    `$1\n  "url": "${origin}/",`
  );

  if (h !== before) {
    writeFileSync(p, h);
    changed += 1;
    console.log(`  ${page} -> ${url}`);
  }
}

/* ── sitemap.xml ─────────────────────────────────────────────────────────── */
const today = new Date().toISOString().slice(0, 10);
const sitemap =
  '<?xml version="1.0" encoding="UTF-8"?>\n' +
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
  Object.values(PAGES)
    .map(
      (path) =>
        '  <url>\n' +
        `    <loc>${origin}${path}</loc>\n` +
        `    <lastmod>${today}</lastmod>\n` +
        '  </url>\n'
    )
    .join('') +
  '</urlset>\n';
writeFileSync(join(ROOT, 'sitemap.xml'), sitemap);

/* ── robots.txt ──────────────────────────────────────────────────────────── */
const robots =
  'User-agent: *\n' +
  'Allow: /\n' +
  '\n' +
  '# A byte-for-byte copy of the site in a different colour. Indexing it would put two\n' +
  '# identical pages in front of the same search.\n' +
  'Disallow: /variant-blue/\n' +
  '\n' +
  `Sitemap: ${origin}/sitemap.xml\n`;
writeFileSync(join(ROOT, 'robots.txt'), robots);

console.log(`\n${changed} page(s) updated`);
console.log(`wrote sitemap.xml (${Object.keys(PAGES).length} urls) and robots.txt`);
console.log(`\nAfter the site is live, submit ${origin}/sitemap.xml in Google Search Console.`);
