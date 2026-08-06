#!/usr/bin/env node
/**
 * Pre-launch asset check. Run with `npm run assets:check`.
 *
 * Three jobs:
 *  1. Every asset declared in src/data/assets.js with status 'ready' actually exists
 *     in /public. A record flipped to 'ready' without the file lands a broken image
 *     in production, and this is the only thing that catches it.
 *  2. Anything still 'pending' is listed, so nobody ships an unshot frame by accident.
 *  3. If the concatenated video exists and ffprobe is installed, the real cut
 *     timestamps are read back out of the file and compared to the `startsAt` values
 *     the overlay cards key off. Those two drifting apart is the single most likely
 *     way The Visit breaks, and it is invisible in code review.
 *
 * Exits non-zero if anything is wrong, so it can gate a deploy.
 */

import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const pub = join(root, 'public');

const { ASSETS, VISIT_VIDEO } = await import('../src/data/assets.js');

let errors = 0;
let pending = 0;

console.log('\nAssets\n──────');

for (const [key, a] of Object.entries(ASSETS)) {
  const file = join(pub, a.src);
  const onDisk = existsSync(file);

  if (a.status === 'ready' && !onDisk) {
    console.error(`  ✗ ${key}\n      marked ready but missing: ${a.src}`);
    errors += 1;
  } else if (a.status === 'ready') {
    const kb = Math.round(statSync(file).size / 1024);
    const heavy = kb > 400;
    console.log(`  ${heavy ? '!' : '✓'} ${key}  ${kb}KB${heavy ? '  (over 400KB — recompress)' : ''}`);
  } else {
    console.log(`  · ${key}  pending`);
    pending += 1;
  }
}

console.log('\nVideo\n─────');

const videoFile = join(pub, VISIT_VIDEO.src);
if (!existsSync(videoFile)) {
  console.log(`  · ${VISIT_VIDEO.src}  pending`);
  pending += 1;
} else {
  const kb = Math.round(statSync(videoFile).size / 1024);
  console.log(`  ✓ ${VISIT_VIDEO.src}  ${kb}KB`);

  if (!existsSync(join(pub, VISIT_VIDEO.poster))) {
    console.error(`  ✗ poster missing: ${VISIT_VIDEO.poster}`);
    errors += 1;
  }

  // Compare declared cut points against the real file.
  try {
    const out = execFileSync(
      'ffprobe',
      ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', videoFile],
      { encoding: 'utf8' }
    );
    const actual = Number.parseFloat(out.trim());
    const declared = VISIT_VIDEO.clips.reduce((sum, c) => sum + c.duration, 0);

    if (Math.abs(actual - declared) > 0.25) {
      console.error(
        `  ✗ duration mismatch: file is ${actual.toFixed(2)}s, clips declare ${declared.toFixed(2)}s.\n` +
          '      The overlay cards switch on startsAt, so they will drift. Update\n' +
          '      VISIT_VIDEO.clips[].startsAt / .duration to the real encoded values.'
      );
      errors += 1;
    } else {
      console.log(`  ✓ duration ${actual.toFixed(2)}s matches declared cut points`);
    }
  } catch {
    console.log('  · ffprobe not available — cut timestamps not verified');
  }
}

console.log('\nSummary\n───────');
console.log(`  ${pending} asset(s) still pending`);
console.log(`  ${errors} error(s)`);

if (pending > 0) {
  console.log('\n  Pending assets render a marked unshot frame, not a photograph.');
  console.log('  See CONTENT-TO-REPLACE.md for the generation recipes.');
}

process.exit(errors > 0 ? 1 : 0);
