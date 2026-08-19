/**
 * Fix the services section: make it usable, and list the real treatments.
 *
 *   node assets/brand/fix-services.mjs
 *
 * THE BUG, as measured in the browser at 1440x900 before this change:
 *   - the pinned trigger was only 526px tall, so the horizontal rig had almost no
 *     scroll runway; over the whole section the track advanced from card 1 to card 2
 *     and cards 3 and 4 were never reachable (0% visible throughout, 4% at the end)
 *   - each card is 90cqw — 1044px inside a 1160px container — so for most of the
 *     scroll two cards sat half-visible at once (e.g. 50% and 84%) and neither could
 *     be read
 *   - the "View Details" button was outside the viewport for most of the scroll, so
 *     it could not be clicked at all
 *
 * THE FIX: the Webflow IX2 horizontal rig is replaced with a native CSS scroll-snap
 * carousel. The markup is untouched — only the layout rules change — so nothing
 * depends on the compiled interaction data any more. Native scrolling brings drag,
 * swipe, shift+wheel, keyboard and a real scrollbar for free, every card snaps fully
 * into view, and every button is always inside the viewport.
 *
 * The IX2 transform is overridden with `transform: none !important`, which beats the
 * inline style Webflow writes onto the track.
 */

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

/** Treatments per category — the same grouping as the Services nav dropdown. */
const TREATMENTS = {
  'Preventive dentistry': ['Consultation / Examination', 'Scaling and Polishing'],
  'Cosmetic dentistry': ['Veneers', 'Teeth Whitening'],
  'Restorative treatments': [
    'Filling', 'Root Canal', 'Normal Extraction', 'Surgical Extraction',
    'Crowns', 'Dental Bridges', 'Dentures', 'Implants',
  ],
  Orthodontics: ['Braces / Orthodontics'],
};

const listFor = (title) =>
  '<ul class="service-item_list">' +
  TREATMENTS[title].map((t) => `<li>${t}</li>`).join('') +
  '</ul>';

const CSS_MARKER = '/* --- services: native snap carousel --- */';
const CSS = `
${CSS_MARKER}
/* The pinned horizontal rig could not reach cards 3 and 4 and left the buttons
   outside the viewport. Native scroll-snap replaces it; the markup is unchanged. */
.service_sticky-trigger { height: auto !important; }
.service_sticky-camera { position: static !important; top: auto !important; }
.scroll-mobile_trigger { height: auto !important; padding-bottom: 0 !important; }
.scroll-mobile_camera { position: static !important; top: auto !important; }

.service_wrap { display: block !important; container-type: normal !important; }
/* Beats the inline transform Webflow's interaction writes onto the track. */
.scroll_track { transform: none !important; display: block !important; }
.scroll_list { margin-right: 0 !important; display: block !important; }
.collection-list-wrapper { width: 100%; }

.service_list {
  display: flex !important;
  flex-wrap: nowrap !important;
  gap: 24px;
  overflow-x: auto;
  overscroll-behavior-x: contain;
  scroll-snap-type: x mandatory;
  scroll-padding-left: 0;
  padding: 4px 4px 20px;
  /* Cards take their natural height. Stretching them all to the tallest (Restorative,
     with eight treatments) left the shorter cards with a large empty band below their
     content. */
  align-items: flex-start;
  -webkit-overflow-scrolling: touch;
}
.service_item-wrap {
  flex: 0 0 auto !important;
  width: min(520px, 84vw) !important;
  max-width: none !important;
  height: auto !important;
  scroll-snap-align: start;
}
/* The showcase block carries a hardcoded min-height/height of 446px from the original
   wide-card design, wrapping an image only 128px tall. In the narrower rail card that
   is ~320px of dead space below the content, which is what pushed the buttons out of
   reach in the first place. */
.service-item_showcase { min-height: 0 !important; height: auto !important; }

.service_item {
  height: auto !important;
  display: flex !important;
  flex-direction: column !important;
  gap: 18px;
}

/* Treatments listed inside each card. */
.service-item_list {
  list-style: none;
  margin: 14px 0 0;
  padding: 0;
  display: grid;
  gap: 7px 18px;
  grid-template-columns: 1fr 1fr;
}
.service-item_list li {
  position: relative;
  padding-left: 16px;
  font-size: 15px;
  line-height: 1.35;
}
.service-item_list li::before {
  content: "";
  position: absolute;
  left: 0; top: 0.55em;
  width: 6px; height: 6px;
  border-radius: 50%;
  background: currentColor;
  opacity: 0.45;
}

/* Arrows and hint sit under the rail. */
.service-rail_controls {
  display: flex; align-items: center; gap: 10px;
  margin-top: 6px;
}
.service-rail_btn {
  width: 44px; height: 44px; border-radius: 50%;
  border: 1px solid rgba(1,31,35,.22); background: transparent;
  display: inline-flex; align-items: center; justify-content: center;
  cursor: pointer; color: inherit;
  transition: background-color .2s, border-color .2s, opacity .2s;
}
.service-rail_btn:hover:not(:disabled) { background: rgba(1,31,35,.06); border-color: rgba(1,31,35,.5); }
.service-rail_btn:disabled { opacity: .3; cursor: default; }
.service-rail_btn:focus-visible { outline: 3px solid #3389CC; outline-offset: 2px; }
.service-rail_hint { font-size: 13px; opacity: .6; }

@media screen and (max-width: 767px) {
  .service_item-wrap { width: 86vw !important; }
  .service-item_list { grid-template-columns: 1fr; }
  .service-rail_hint { display: none; }
}
`;

/** Small controller: arrow buttons that page the rail by one card. */
const JS = `/**
 * Arrows for the services rail.
 *
 * The rail itself is a native scroll-snap container — drag, swipe, shift+wheel and
 * keyboard already work without any script. This only adds visible paging controls,
 * because a horizontal rail is easy to miss with a mouse, and keeps their disabled
 * state in sync with the scroll position.
 */
(function () {
  'use strict';
  function init() {
    var rail = document.querySelector('.service_list');
    if (!rail || rail.dataset.railReady) return;
    rail.dataset.railReady = '1';

    rail.setAttribute('tabindex', '0');
    rail.setAttribute('role', 'region');
    rail.setAttribute('aria-label', 'Our services');

    var wrap = document.createElement('div');
    wrap.className = 'service-rail_controls';
    wrap.innerHTML =
      '<button type="button" class="service-rail_btn" data-dir="-1" aria-label="Previous services">' +
      '<svg width="17" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 7H1m6-5L1 7l6 5"/></svg></button>' +
      '<button type="button" class="service-rail_btn" data-dir="1" aria-label="Next services">' +
      '<svg width="17" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 7h14M9 2l6 5-6 5"/></svg></button>' +
      '<span class="service-rail_hint">Scroll or drag to see all services</span>';

    var host = rail.closest('.service_wrap') || rail.parentElement;
    host.appendChild(wrap);

    function step() {
      var card = rail.querySelector('.service_item-wrap');
      return card ? card.getBoundingClientRect().width + 24 : rail.clientWidth * 0.8;
    }

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-dir]');
      if (!btn) return;
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      rail.scrollBy({ left: Number(btn.dataset.dir) * step(), behavior: reduce ? 'auto' : 'smooth' });
    });

    function sync() {
      var max = rail.scrollWidth - rail.clientWidth - 2;
      wrap.querySelector('[data-dir="-1"]').disabled = rail.scrollLeft <= 2;
      wrap.querySelector('[data-dir="1"]').disabled = rail.scrollLeft >= max;
    }
    rail.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
`;

/* ── Apply ──────────────────────────────────────────────────────────────── */
const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

let changed = 0;
for (const rel of ['index.html', 'variant-blue/index.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);

  // Insert the treatment list after each card's paragraph.
  if (!s.includes('service-item_list')) {
    for (const title of Object.keys(TREATMENTS)) {
      const re = new RegExp(
        `(service-item_info-title">${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}</div>\\s*<p>[^<]*</p>)`
      );
      const m = re.exec(s);
      if (!m) {
        console.error(`  ${rel}: card "${title}" not found`);
        continue;
      }
      s = s.slice(0, m.index + m[0].length) + listFor(title) + s.slice(m.index + m[0].length);
    }
  }

  // Include the rail controller.
  const tag = '<script src="assets/js/services-rail.js" defer></script>';
  if (!s.includes('services-rail.js')) {
    s = s.replace('</body>', `    ${tag}\n  </body>`);
  }

  const after = counts(s);
  if (after.div !== after.divClose || after.section !== before.section) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    writeFileSync(file, original);
    process.exitCode = 1;
    continue;
  }

  if (s !== original) {
    writeFileSync(file, s);
    changed += 1;
    console.log(`  ${rel.padEnd(26)} treatments listed, rail script included`);
  } else {
    console.log(`  ${rel.padEnd(26)} already up to date`);
  }
}

for (const js of ['assets/js/services-rail.js', 'variant-blue/assets/js/services-rail.js']) {
  writeFileSync(join(ROOT, js), JS);
  console.log(`  ${js.padEnd(38)} written`);
}

for (const css of ['assets/css/lumora.css', 'variant-blue/assets/css/lumora.css']) {
  const p = join(ROOT, css);
  const s = readFileSync(p, 'utf8');
  if (!s.includes(CSS_MARKER)) {
    writeFileSync(p, s + CSS);
    console.log(`  ${css.padEnd(38)} +carousel styles`);
  }
}

console.log(`\n${changed} page(s) updated`);
