/**
 * Take the email address off the site.
 *
 *   node assets/brand/remove-email.mjs
 *
 * hello@dentalcarecentre.com was never a real address. It came from the template and the
 * domain does not exist, so anything sent to it went nowhere.
 *
 * It appears in two quite different places and they are not handled the same way.
 *
 * THE FOOTER CONTACT STRIP on the four main pages lists a phone number, the email, and a
 * link to the map. The email line simply goes; the phone and the map remain.
 *
 * THE LEGAL PAGES are the reason this is not a plain delete. On all four of them the
 * email is the only route offered for acting on the policy: requesting your data,
 * asking about cookies, licensing enquiries. Deleting it would leave a privacy policy
 * that promises you can request deletion of your information and then gives you no way
 * to ask. Each of those sentences is repointed at the clinic's phone line, which is real
 * and already published, and the wording around it is corrected so it does not still say
 * "emailing" next to a telephone number.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const EMAIL = 'hello@dentalcarecentre.com';
const TEL = '+263292263687';
const TEL_DISPLAY = '+263 29 226 3687';

/**
 * Wording fixes for the legal pages, applied after the address itself is swapped for the
 * phone number. Without these the sentences would read "by emailing +263 29 226 3687".
 */
const WORDING = [
  ['at any time by emailing ', 'at any time by calling us on '],
  ['Reach us at ', 'Reach us on '],
  ['? Email ', '? Call us on '],
  // "contact" on its own reads as an instruction to contact a phone number rather than a
  // person, so these two say what the reader is actually being asked to do.
  ['these terms, contact ', 'these terms, call us on '],
  ['licensing enquiries, contact ', 'licensing enquiries, call us on '],
];

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
  a: (s.match(/<a\b/g) || []).length,
  aClose: (s.match(/<\/a>/g) || []).length,
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

let changed = 0;
for (const rel of pages()) {
  const file = join(ROOT, rel);
  const original = readFileSync(file, 'utf8');
  if (!original.includes(EMAIL)) continue;
  let s = original;
  const before = counts(s);
  const done = [];

  /* 1. The footer contact strip: drop the whole anchor, leaving the phone and the map. */
  const strip = new RegExp(
    '<a\\b[^>]*href="mailto:' + EMAIL + '[^"]*"[^>]*class="footer-contact_link[^"]*"[^>]*>[\\s\\S]*?</a>\\s*',
    'g'
  );
  const stripHits = (s.match(strip) || []).length;
  if (stripHits) {
    s = s.replace(strip, '');
    done.push(`contact strip (${stripHits})`);
  }

  /* 2. The legal pages: repoint at the phone rather than leaving the policy contactless. */
  const inline = new RegExp(
    '<a\\b([^>]*)href="mailto:' + EMAIL + '[^"]*"([^>]*)>' + EMAIL + '</a>',
    'g'
  );
  const inlineHits = (s.match(inline) || []).length;
  if (inlineHits) {
    s = s.replace(inline, (_m, a, b) => `<a${a}href="tel:${TEL}"${b}>${TEL_DISPLAY}</a>`);
    for (const [from, to] of WORDING) {
      if (from !== to) s = s.split(from).join(to);
    }
    done.push(`legal contact repointed to the phone (${inlineHits})`);
  }

  if (!done.length) continue;

  if (s.includes(EMAIL)) {
    console.error(`  ${rel}: ABORTED — ${EMAIL} still present after the pass`);
    process.exitCode = 1;
    continue;
  }

  const after = counts(s);
  if (
    after.aClose !== after.a ||
    after.a !== before.a - stripHits ||
    after.div !== before.div - stripHits ||
    after.divClose !== before.divClose - stripHits ||
    after.script !== before.script
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

if (!changed) console.log('  no email addresses left to remove');
console.log(`\n${changed} page(s) updated`);
