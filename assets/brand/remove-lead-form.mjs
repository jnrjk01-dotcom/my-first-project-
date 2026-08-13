/**
 * Remove the hero lead-capture card ("Book a visit" / "Request a callback").
 *
 *   node assets/brand/remove-lead-form.mjs
 *
 * Superseded by the persistent booking bar, which offers a direct call and WhatsApp on
 * every page. The hero's "Book Appointment" button is deliberately KEPT — it is the
 * hero's only in-page call to action.
 *
 * The card is matched by depth-counting <div> open/close tags from its start tag rather
 * than by regex. The card nests several divs and a form, so a lazy or greedy regex would
 * either stop at the first inner </div> or swallow the rest of the section.
 *
 * Idempotent: re-running finds nothing and reports no change.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Return [start, end) of the element beginning at `open`, by counting tag depth. */
function elementRange(html, open, tag = 'div') {
  const openRe = new RegExp(`<${tag}\\b`, 'gi');
  const closeRe = new RegExp(`</${tag}\\s*>`, 'gi');
  let depth = 0;
  let i = open;

  while (i < html.length) {
    openRe.lastIndex = i;
    closeRe.lastIndex = i;
    const o = openRe.exec(html);
    const c = closeRe.exec(html);
    if (!c) return null;

    if (o && o.index < c.index) {
      depth += 1;
      i = o.index + o[0].length;
    } else {
      depth -= 1;
      i = c.index + c[0].length;
      if (depth === 0) return [open, i];
    }
  }
  return null;
}

const targets = ['index.html', 'variant-blue/index.html'];
let changed = 0;

for (const rel of targets) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;

  let s = readFileSync(file, 'utf8');
  const before = s.length;

  // 1. The card itself.
  const open = s.indexOf('<div class="lead-form_card">');
  if (open === -1) {
    console.log(`  ${rel.padEnd(26)} no lead-form card (already removed)`);
    continue;
  }
  const range = elementRange(s, open);
  if (!range) {
    console.error(`  ${rel}: could not find the closing tag — leaving untouched`);
    continue;
  }

  const removed = s.slice(range[0], range[1]);
  // Sanity: the slice must contain the form's own markers and must not have run on
  // into the rest of the hero.
  const ok =
    removed.includes('Request a callback') &&
    removed.includes('lead-form_note') &&
    !removed.includes('home-hero_') &&
    removed.length < 3000;
  if (!ok) {
    console.error(`  ${rel}: extracted range failed its sanity check (${removed.length} bytes) — leaving untouched`);
    continue;
  }

  s = s.slice(0, range[0]) + s.slice(range[1]);

  // 2. The handler is now dead code — nothing else calls it.
  if (!s.includes('lumoraLead(event)')) {
    const h = s.indexOf('function lumoraLead');
    if (h !== -1) {
      const sOpen = s.lastIndexOf('<script>', h);
      const sClose = s.indexOf('</script>', h);
      if (sOpen !== -1 && sClose !== -1) {
        const block = s.slice(sOpen, sClose + 9);
        // Only drop the block if it contains nothing but the handler.
        if (!/function\s+(?!lumoraLead)\w+\s*\(/.test(block.replace(/function lumoraLead/, ''))) {
          s = s.slice(0, sOpen) + s.slice(sClose + 9);
        }
      }
    }
  }

  writeFileSync(file, s);
  changed += 1;
  console.log(`  ${rel.padEnd(26)} removed ${removed.length} bytes (card) — file ${before} -> ${s.length}`);
}

console.log(`\n${changed} file(s) changed`);
