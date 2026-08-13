/**
 * Add the practice address to the footer contact block.
 *
 *   node assets/brand/add-address.mjs
 *
 * The site shipped with no address anywhere — the footer carried only a phone number
 * and an email — so this is an addition, not a replacement. The address is taken from
 * the clinic's own roll-up banner.
 *
 * The address is a live maps link, matching the phone and email beside it, so it is
 * tappable on a phone rather than something to copy out by hand.
 *
 * Idempotent: re-running finds the marker and makes no change.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const ADDRESS = {
  line1: 'Cnr Fife Street &amp; 14th Avenue',
  line2: 'Sunninghill Building, Suite Four',
  line3: 'Bulawayo, Zimbabwe',
};

const MAPS = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  'Sunninghill Building, Cnr Fife Street & 14th Avenue, Bulawayo, Zimbabwe'
)}`;

const MARKER = 'footer-address_link';

const BLOCK =
  `<a href="${MAPS}" target="_blank" rel="noopener noreferrer" ` +
  `class="footer-contact_link ${MARKER} w-inline-block">` +
  `<div>${ADDRESS.line1}<br/>${ADDRESS.line2}<br/>${ADDRESS.line3}</div>` +
  `</a>`;

const PAGES = [];
for (const dir of ['.', 'variant-blue']) {
  for (const f of ['index.html', 'about.html', 'service.html', 'blog.html']) {
    const p = join(ROOT, dir, f);
    if (existsSync(p)) PAGES.push(p);
  }
}

let changed = 0;
for (const file of PAGES) {
  let s = readFileSync(file, 'utf8');
  const rel = file.replace(ROOT + '/', '');

  if (s.includes(MARKER)) {
    console.log(`  ${rel.padEnd(26)} already has the address`);
    continue;
  }

  // Insert after the email link, inside .footer-contact_wrap.
  const wrap = s.indexOf('footer-contact_wrap');
  if (wrap === -1) {
    console.log(`  ${rel.padEnd(26)} no footer contact block — skipped`);
    continue;
  }
  const close = s.indexOf('</div>', s.lastIndexOf('</a>', s.indexOf('</div>', s.indexOf('mailto:', wrap))));
  const anchorEnd = s.indexOf('</a>', s.indexOf('mailto:', wrap));
  if (anchorEnd === -1) {
    console.log(`  ${rel.padEnd(26)} could not locate the email link — skipped`);
    continue;
  }

  const at = anchorEnd + 4;
  s = s.slice(0, at) + ' ' + BLOCK + s.slice(at);

  // The template's tel: href carries a space, which is invalid per RFC 3966 and is
  // rejected by some dialers. The digits are unchanged; only the space is removed.
  s = s.replace(/href="tel:\+91 9307512816"/g, 'href="tel:+919307512816"');

  writeFileSync(file, s);
  changed += 1;
  console.log(`  ${rel.padEnd(26)} address added`);
}

console.log(`\n${changed} file(s) changed`);
