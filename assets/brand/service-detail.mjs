/**
 * Rebuild service.html as an "All services" sidebar + content pane.
 *
 *   node assets/brand/service-detail.mjs
 *
 * The page shipped as four stacked accordions, one per category, each hiding its
 * content behind a click and none of them addressable. What replaces it is a two-pane
 * layout: every treatment the practice offers is listed down the left under its
 * category heading, and selecting one shows it in the pane on the right.
 *
 * SWITCHING IS PURE CSS. Each panel is a real element with a real id, and the sidebar
 * entries are ordinary anchors, so `:target` does the showing and hiding — the page
 * works with JavaScript disabled, every treatment has a shareable URL
 * (service.html#root-canal), and the browser's back button behaves. The small script
 * only mirrors the selection onto the sidebar as a highlight; nothing depends on it.
 *
 * That addressability is also why the Services dropdown is rewritten here: its 13
 * entries all pointed at bare service.html, so they landed on the page but not on the
 * treatment they named. They now deep-link.
 *
 * PHOTOS: two reserved slots per treatment, using the same `.service-item_photo`
 * markup and styling as the home page cards, and deliberately referencing no image
 * file — a filename that does not exist yet would 404, and the site's inline image
 * guard would quietly swap in a branded gradient, hiding the fact that the photo is
 * still missing. To fill one, replace the slot's contents with:
 *
 *   <img class="service-item_photo-img" src="assets/img/svc-<slug>-1.jpg"
 *        alt="<what the photo shows>" loading="lazy"/>
 *
 * Mirror any image into variant-blue/assets/img/ as well.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PHONE_HREF = '+263292263687';
const PHONE_DISPLAY = '+263 29 226 3687';
const WA_DIGITS = '263778398111';

/* ── Content ─────────────────────────────────────────────────────────────────
   Group order matches the Services dropdown. `slug` is the URL fragment and must
   stay stable — the nav links, the home page cards and any link shared by the
   practice all point at it. */

const GROUPS = [
  {
    title: 'Preventive dentistry',
    items: [
      {
        slug: 'consultation-examination',
        name: 'Consultation / Examination',
        lead:
          'Every course of treatment starts with a proper look, so that anything we ' +
          'recommend is based on what is actually there.',
        body: [
          'We talk through your dental history, any pain or sensitivity you have noticed, ' +
            'and what you would like to change. We then examine the teeth, gums, tongue and ' +
            'soft tissues, and take x-rays where they are needed to see below the surface.',
          'You leave knowing what we found, what needs attention now, what can reasonably ' +
            'wait, and what each option involves, before you commit to anything.',
        ],
        points: [
          'A discussion of your history and your concerns',
          'Examination of the teeth, gums and soft tissues',
          'X-rays where they are needed',
          'A treatment plan you can take away',
          'Time to ask questions before you decide',
        ],
      },
      {
        slug: 'scaling-and-polishing',
        name: 'Scaling and Polishing',
        lead:
          'A professional clean removes the hardened deposit that brushing at home cannot shift.',
        body: [
          'Plaque left undisturbed hardens into calculus along the gum line and between the ' +
            'teeth. Once hardened, no toothbrush will remove it, and it keeps the gums ' +
            'inflamed, and that is how gum disease starts.',
          'Scaling lifts that deposit off the tooth surface, and polishing smooths the enamel ' +
            'so new plaque takes longer to settle. Most people are comfortable throughout, and ' +
            'the appointment is a short one.',
        ],
        points: [
          'Deposit removed above and below the gum line',
          'Polishing to smooth the enamel',
          'Stains from tea, coffee and tobacco lifted',
          'Advice on brushing and cleaning between the teeth',
          'Usually worth repeating every six months',
        ],
      },
    ],
  },
  {
    title: 'Restorative treatments',
    items: [
      {
        slug: 'filling',
        name: 'Filling',
        lead: 'Decay is cleaned out and the tooth rebuilt, so it can be used normally again.',
        body: [
          'A cavity does not heal on its own. It spreads, and the further it travels the ' +
            'closer it gets to the nerve. A filling stops it: we remove the decayed tissue, ' +
            'clean the cavity, and rebuild the tooth with a material matched to its own shade ' +
            'so the repair does not show.',
          'Treated early this is a short, straightforward appointment. Left too long, the same ' +
            'tooth may need root canal treatment or a crown instead.',
        ],
        points: [
          'Local anaesthetic, so the tooth is numb',
          'Decay removed and the cavity cleaned',
          'Tooth-coloured material shaped to the tooth',
          'The bite checked and adjusted',
          'You can usually eat again the same day',
        ],
      },
      {
        slug: 'root-canal',
        name: 'Root Canal',
        lead:
          'When decay or injury reaches the nerve, root canal treatment saves the tooth ' +
          'instead of losing it.',
        body: [
          'Inside every tooth is a soft core of nerve and blood vessels. If bacteria reach it ' +
            'the tooth becomes painful, and an abscess can form at the root tip. Root canal ' +
            'treatment removes that infected tissue, disinfects and shapes the canals, and ' +
            'seals them so bacteria cannot return.',
          'The tooth stays in place and keeps doing its job. Because a treated tooth is more ' +
            'brittle afterwards, a crown is often fitted to protect it. Depending on the tooth, ' +
            'treatment is completed over one or two visits.',
        ],
        points: [
          'Carried out under local anaesthetic',
          'Infected pulp removed from inside the tooth',
          'Canals cleaned, shaped and disinfected',
          'Canals sealed and the tooth restored',
          'A crown often recommended afterwards',
        ],
      },
      {
        slug: 'normal-extraction',
        name: 'Normal Extraction',
        lead: 'A simple extraction removes a tooth that is visible and can be lifted out whole.',
        body: [
          'We remove a tooth only when it cannot reasonably be saved, or when it is crowding ' +
            'the teeth around it. The area is fully numbed, the tooth is loosened and eased ' +
            'out, and you go home with clear aftercare. Most of the healing happens in the ' +
            'first few days.',
          'We will also talk about filling the gap where that matters, with a bridge, a ' +
            'denture or an implant, so the neighbouring teeth do not drift into it.',
        ],
        points: [
          'Local anaesthetic',
          'The tooth loosened and lifted out whole',
          'Written aftercare to take home',
          'Guidance on the first 24 hours',
          'Options for replacing the tooth, if it should be replaced',
        ],
      },
      {
        slug: 'surgical-extraction',
        name: 'Surgical Extraction',
        lead:
          'For teeth broken at the gum line or still buried in bone, including wisdom teeth.',
        body: [
          'Some teeth cannot simply be lifted out: a wisdom tooth lying sideways, a root that ' +
            'has broken off, a tooth that never came through. A surgical extraction reaches ' +
            'these through a small opening in the gum, and sometimes divides the tooth so it ' +
            'comes out in pieces rather than being forced whole.',
          'It is a longer appointment than a simple extraction and the first few days need more ' +
            'care, but it is routine work and you will know exactly what to expect beforehand.',
        ],
        points: [
          'X-rays first, to see the roots and their position',
          'Local anaesthetic',
          'A small incision, and the tooth sectioned if needed',
          'Stitches to close the site',
          'Detailed aftercare and a follow-up visit',
        ],
      },
      {
        slug: 'crowns',
        name: 'Crowns',
        lead:
          'A cap that covers a weakened tooth completely, restoring its shape, strength and ' +
          'appearance.',
        body: [
          'A tooth that has been heavily filled, cracked or root treated can no longer take a ' +
            'full bite on its own, and will eventually split. A crown wraps over what remains ' +
            'and carries the load instead.',
          'We prepare the tooth, take an impression, and fit a temporary crown while the ' +
            'permanent one is made. At the second visit it is tried in, adjusted and cemented, ' +
            'with the shade matched to the teeth around it.',
        ],
        points: [
          'An assessment of how much natural tooth remains',
          'The tooth shaped and an impression taken',
          'A temporary crown in the meantime',
          'The permanent crown fitted, adjusted and cemented',
          'Shade matched to the surrounding teeth',
        ],
      },
      {
        slug: 'dental-bridges',
        name: 'Dental Bridges',
        lead: 'A fixed replacement for a missing tooth, anchored to the teeth on either side.',
        body: [
          'When a tooth is lost, the teeth beside it start to tilt into the space and the one ' +
            'opposite begins to over-erupt. A bridge closes the gap for good: the neighbouring ' +
            'teeth are prepared as supports and the replacement is joined between them as a ' +
            'single unit.',
          'It is cemented in place rather than taken out at night, so cleaning underneath it ' +
            'matters, and we show you how at the fitting.',
        ],
        points: [
          'Suitable for one or more missing teeth in a row',
          'The supporting teeth prepared and an impression taken',
          'Fixed in place, not removable',
          'Shade matched so it blends with your own teeth',
          'Cleaning technique shown at the fitting',
        ],
      },
      {
        slug: 'dentures',
        name: 'Dentures',
        lead: 'Removable replacements for several missing teeth, or for a full arch.',
        body: [
          'Dentures restore the ability to chew and to speak clearly, and support the shape of ' +
            'the face, which changes once the back teeth are gone. They can be full, replacing ' +
            'every tooth in the upper or lower jaw, or partial, clipping around the teeth you ' +
            'still have.',
          'Making them takes several short visits: impressions, a trial fitting to check the ' +
            'bite and the appearance with you, then the finished denture. Small adjustments in ' +
            'the first few weeks are normal and expected.',
        ],
        points: [
          'Full or partial, upper or lower',
          'Impressions and a trial fitting before the final set',
          'The bite and appearance checked with you',
          'Adjustments in the first weeks',
          'Advice on cleaning and overnight care',
        ],
      },
      {
        slug: 'implants',
        name: 'Implants',
        lead: 'A titanium post placed in the jaw that acts as a new tooth root.',
        body: [
          'An implant is the closest thing to a natural tooth. A small post is placed into the ' +
            'jawbone and left to integrate with it over a few months, and a crown is then ' +
            'attached on top.',
          'Because it is anchored in bone rather than to the neighbouring teeth, those teeth are ' +
            'left untouched, and the bone in that area keeps being used instead of shrinking ' +
            'away. It does need enough healthy bone and healthy gums, which we assess with ' +
            'x-rays first.',
        ],
        points: [
          'X-rays and an assessment of bone and gum health',
          'The post placed under local anaesthetic',
          'A healing period while bone integrates with the implant',
          'The crown attached and the bite checked',
          'Cared for like a natural tooth, with regular reviews',
        ],
      },
    ],
  },
  {
    title: 'Cosmetic dentistry',
    items: [
      {
        slug: 'veneers',
        name: 'Veneers',
        lead:
          'Thin facings bonded to the front of the teeth to change their shape, shade or ' +
          'alignment.',
        body: [
          'Veneers are for teeth that are sound but do not look the way you want them to: ' +
            'chipped edges, deep staining that whitening will not lift, small gaps, or teeth ' +
            'slightly out of line. A very thin layer of the front surface is prepared and a ' +
            'custom facing is bonded over it.',
          'We agree the shade and the shape before anything is made, so there are no surprises. ' +
            'Veneers are cosmetic: the teeth underneath need to be healthy first.',
        ],
        points: [
          'A conversation about shape, shade and what is realistic',
          'Minimal preparation of the front surface',
          'Custom facings made to the agreed design',
          'Bonded in place and polished',
          'Best done once the mouth is healthy',
        ],
      },
      {
        slug: 'teeth-whitening',
        name: 'Teeth Whitening',
        lead: 'Professional whitening lifts the shade of your natural teeth safely and predictably.',
        body: [
          'Teeth darken with age and with tea, coffee, red wine and tobacco. Professional ' +
            'whitening uses a controlled gel to lift that discolouration, supervised, with your ' +
            'gums protected, at a strength over-the-counter kits do not reach.',
          'We check first that the teeth and gums are healthy and that the discolouration is the ' +
            'kind whitening actually treats. Sensitivity for a day or two afterwards is common ' +
            'and settles.',
        ],
        points: [
          'A check that whitening suits your teeth',
          'Gums protected throughout',
          'In-practice treatment, take-home trays, or both',
          'Guidance on keeping the result',
          'Existing fillings and crowns will not change shade',
        ],
      },
    ],
  },
  {
    title: 'Orthodontics',
    items: [
      {
        slug: 'braces-orthodontics',
        name: 'Braces / Orthodontics',
        lead:
          'Straightening crowded, gapped or protruding teeth, and correcting how the jaws meet.',
        body: [
          'Orthodontic treatment moves teeth gradually into a better position. It is not only ' +
            'about appearance: crowded and overlapping teeth are much harder to clean, and an ' +
            'uneven bite wears the teeth unevenly and can strain the jaw joint.',
          'Treatment starts with records (x-rays, photographs and impressions) and a plan ' +
            'showing what can be achieved and roughly how long it will take. Braces are then ' +
            'fitted and adjusted at regular reviews. A retainer afterwards holds the result; ' +
            'without one, teeth drift back.',
        ],
        points: [
          'Records and a plan before anything is fitted',
          'Suitable for teenagers and adults',
          'Short review appointments at regular intervals',
          'Treatment length depends on the case',
          'A retainer afterwards to hold the result',
        ],
      },
    ],
  },
];

const ALL = GROUPS.flatMap((g) => g.items.map((it) => ({ ...it, group: g.title })));
const DEFAULT_SLUG = ALL[0].slug;

/** Home page card -> the treatment its "View Details" button should open. */
const CARD_TARGETS = {
  'Preventive dentistry': 'consultation-examination',
  'Cosmetic dentistry': 'veneers',
  'Restorative treatments': 'filling',
  Orthodontics: 'braces-orthodontics',
};

/* ── Markup ──────────────────────────────────────────────────────────────── */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const photoSlot = (slug, n) =>
  `<div class="service-item_photo" data-photo-slot="svc-${slug}-${n}">` +
  '<span class="service-item_photo-label">Photo</span></div>';

function panel(item) {
  const waText = encodeURIComponent(
    `Hi Dental Care Centre, I would like to ask about ${item.name}.`
  );
  return (
    `<article class="svcpage_panel" id="${item.slug}" aria-labelledby="${item.slug}-title">` +
    '<div class="svcpage_media">' +
    photoSlot(item.slug, 1) +
    photoSlot(item.slug, 2) +
    '</div>' +
    `<p class="svcpage_eyebrow">${esc(item.group)}</p>` +
    `<h2 class="svcpage_title" id="${item.slug}-title">${esc(item.name)}</h2>` +
    `<p class="svcpage_lead">${esc(item.lead)}</p>` +
    item.body.map((p) => `<p class="svcpage_body">${esc(p)}</p>`).join('') +
    '<div class="svcpage_expect">' +
    '<p class="svcpage_expect-title">What to expect</p>' +
    '<ul class="svcpage_list">' +
    item.points.map((p) => `<li>${esc(p)}</li>`).join('') +
    '</ul></div>' +
    '<div class="svcpage_actions">' +
    `<a class="svcpage_action is-primary" href="tel:${PHONE_HREF}">Call ${PHONE_DISPLAY}</a>` +
    `<a class="svcpage_action" href="https://wa.me/${WA_DIGITS}?text=${waText}" ` +
    'target="_blank" rel="noopener noreferrer">Ask about this on WhatsApp' +
    '<span class="dcc-sr">, opens WhatsApp in a new tab</span></a>' +
    '</div></article>'
  );
}

function layout() {
  const nav = GROUPS.map(
    (g) =>
      '<div class="svcpage_nav-group">' +
      `<p class="svcpage_nav-group-title">${esc(g.title)}</p>` +
      '<ul class="svcpage_nav-list">' +
      g.items
        .map(
          (it) =>
            `<li><a class="svcpage_nav-link" href="#${it.slug}" ` +
            `data-svc="${it.slug}">${esc(it.name)}</a></li>`
        )
        .join('') +
      '</ul></div>'
  ).join('');

  return (
    '<div class="svcpage_layout">' +
    '<aside class="svcpage_nav" aria-label="All services">' +
    '<p class="svcpage_nav-title">All services</p>' +
    nav +
    '</aside>' +
    '<div class="svcpage_pane">' +
    ALL.map(panel).join('') +
    '</div></div>'
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */

const CSS_MARKER = '/* --- services page: sidebar + panel --- */';
const CSS = `
${CSS_MARKER}
/* Two panes: every treatment listed on the left, the selected one shown on the right.
   Selection is done with :target, so the page works without JavaScript and each
   treatment has its own shareable URL.

   COLOUR NOTE: this section's background is the deep brand colour (#022f34 teal,
   #0b2a55 blue), so everything here is built from white alphas rather than the
   dark tints used elsewhere in the sheet, and every value below was measured against
   those two backgrounds. In particular the selected item and the call button are
   accent-filled with primary-900 text (5.6:1 teal, 4.8:1 blue) — white on the accent
   would be 3.0:1 and 3.7:1, which fails at this text size. */
.svcpage_layout {
  display: grid;
  grid-template-columns: 288px minmax(0, 1fr);
  gap: 56px;
  align-items: start;
}

.svcpage_nav {
  position: sticky;
  top: 112px;
  max-height: calc(100vh - 144px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding-right: 4px;
}
.svcpage_nav-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 18px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .16em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .72);
}
/* The accent appears as a mark rather than as text: as a colour it clears the 3:1
   bar for a graphic on both backgrounds, but not the 4.5:1 bar for label text. */
.svcpage_nav-title::before,
.svcpage_eyebrow::before {
  content: "";
  flex: 0 0 auto;
  width: 18px;
  height: 2px;
  border-radius: 2px;
  background: var(--primitive-color--primary-500);
}
.svcpage_nav-group + .svcpage_nav-group { margin-top: 22px; }
.svcpage_nav-group-title {
  margin: 0 0 8px;
  font-size: 12.5px;
  font-weight: 600;
  letter-spacing: .1em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .55);
}
.svcpage_nav-list { list-style: none; margin: 0; padding: 0; }
.svcpage_nav-link {
  display: block;
  padding: 11px 16px;
  border-radius: 10px;
  font-size: 15.5px;
  line-height: 1.3;
  color: #fff;
  text-decoration: none;
  border: 1px solid transparent;
  transition: background-color .18s, color .18s, border-color .18s;
}
.svcpage_nav-link:hover { background: rgba(255, 255, 255, .09); }
.svcpage_nav-link.is-current,
.svcpage_nav-link[aria-current="true"] {
  background: var(--primitive-color--primary-500);
  border-color: var(--primitive-color--primary-500);
  color: var(--primitive-color--primary-900);
  font-weight: 600;
}
.svcpage_nav-link:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }

.svcpage_panel { display: none; scroll-margin-top: 124px; }
/* Scoped to :not(.is-scripted) rather than left to cascade order: the default-panel
   rule below is specificity (0,6,0) and would otherwise keep the first panel visible
   underneath whichever one the script has selected. */
.svcpage_pane:not(.is-scripted) > .svcpage_panel:target { display: block; }
.svcpage_pane:not(.is-scripted):not(:has(.svcpage_panel:target)) > .svcpage_panel:first-child {
  display: block;
}

/* Once the script is running it takes over the switching, because Webflow's own
   in-page-anchor module intercepts clicks on same-page links, calls preventDefault and
   animates a scroll, so the fragment never changes and :target never fires. The rules
   above are what the page does when the script does not run. */
.svcpage_pane.is-scripted > .svcpage_panel { display: none; }
.svcpage_pane.is-scripted > .svcpage_panel.is-shown { display: block; }

.svcpage_media {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 34px;
}
/* The shared photo-slot styling is tuned for the light home page cards; on this dark
   section its dark tint and dashed rule are invisible. */
.svcpage_media .service-item_photo {
  background: rgba(255, 255, 255, .05);
  border-color: rgba(255, 255, 255, .22);
}
.svcpage_media .service-item_photo-label { color: #fff; opacity: .5; }

.svcpage_eyebrow {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .72);
}
.svcpage_title { margin: 0 0 18px; color: #fff; }
.svcpage_lead {
  font-size: 20px;
  line-height: 1.55;
  margin: 0 0 22px;
  max-width: 60ch;
  color: #fff;
}
.svcpage_body {
  margin: 0 0 16px;
  max-width: 66ch;
  color: rgba(255, 255, 255, .82);
}

.svcpage_expect {
  margin: 34px 0 0;
  padding: 26px 28px;
  border-radius: 16px;
  background: rgba(255, 255, 255, .06);
  border: 1px solid rgba(255, 255, 255, .1);
}
.svcpage_expect-title {
  margin: 0 0 16px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: .14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, .72);
}
.svcpage_list { list-style: none; margin: 0; padding: 0; display: grid; gap: 11px; }
.svcpage_list li {
  position: relative;
  padding-left: 28px;
  line-height: 1.45;
  color: rgba(255, 255, 255, .9);
}
.svcpage_list li::before {
  content: "";
  position: absolute;
  left: 0; top: .35em;
  width: 16px; height: 16px;
  border-radius: 50%;
  background: var(--primitive-color--primary-500);
}
.svcpage_list li::after {
  content: "";
  position: absolute;
  left: 4.6px; top: .62em;
  width: 7px; height: 3.5px;
  border-left: 2px solid var(--primitive-color--primary-900);
  border-bottom: 2px solid var(--primitive-color--primary-900);
  transform: rotate(-45deg);
}

.svcpage_actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 30px; }
.svcpage_action {
  display: inline-flex;
  align-items: center;
  padding: 13px 22px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  color: #fff;
  border: 1px solid rgba(255, 255, 255, .38);
  transition: background-color .2s, color .2s, border-color .2s;
}
.svcpage_action:hover {
  background: rgba(255, 255, 255, .12);
  border-color: rgba(255, 255, 255, .8);
}
.svcpage_action.is-primary {
  background: var(--primitive-color--primary-500);
  border-color: var(--primitive-color--primary-500);
  color: var(--primitive-color--primary-900);
}
.svcpage_action.is-primary:hover {
  background: var(--primitive-color--primary-600);
  border-color: var(--primitive-color--primary-600);
}
.svcpage_action:focus-visible { outline: 3px solid #fff; outline-offset: 2px; }

/* Also defined by booking-bar.js, but that script returns early once the bar has been
   dismissed for the session — without this the hint text would become visible. */
.dcc-sr {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

@media screen and (max-width: 991px) {
  .svcpage_layout { grid-template-columns: 1fr; gap: 34px; }
  /* Sticky is only useful beside the content; stacked, it would cover it. */
  .svcpage_nav { position: static; max-height: none; overflow: visible; }
  /* flex-direction is stated because the sheet already sets ul { flex-direction: column }
     further up, which would otherwise leave these as 13 full-width rows. */
  .svcpage_nav-list {
    display: flex;
    flex-direction: row;
    flex-wrap: wrap;
    align-items: flex-start;
    gap: 8px;
  }
  .svcpage_nav-list li { display: flex; }
  /* Chips that wrap, not 13 full-width rows: stacked, a block list would push the
     treatment itself most of a screen further down. */
  .svcpage_nav-link {
    display: inline-flex;
    align-items: center;
    border-color: rgba(255, 255, 255, .28);
    border-radius: 999px;
    padding: 9px 15px;
    font-size: 14.5px;
  }
  .svcpage_panel { scroll-margin-top: 96px; }
}
@media screen and (max-width: 767px) {
  .svcpage_media { grid-template-columns: 1fr; }
  .svcpage_lead { font-size: 18px; }
  .svcpage_expect { padding: 22px 20px; }
  .svcpage_actions .svcpage_action { width: 100%; justify-content: center; }
}
`;

/* ── Highlight script ────────────────────────────────────────────────────── */

const JS = `/**
 * Treatment switching for the services page.
 *
 * The panels are real elements with real ids and the sidebar entries are ordinary
 * anchors, so the stylesheet can switch between them with :target and the page works
 * with this file blocked. It cannot do the job on its own, though: Webflow's in-page
 * anchor module intercepts clicks on same-page links, calls preventDefault and animates
 * a scroll, so the fragment never changes and :target never fires. This listens in the
 * capture phase — ahead of that delegated handler — and takes over.
 *
 * With the script running the page also stays where it is when you switch on a wide
 * screen: the list is beside the content, so scrolling would only move it away.
 */
(function () {
  'use strict';
  var DEFAULT = ${JSON.stringify(DEFAULT_SLUG)};

  function init() {
    var nav = document.querySelector('.svcpage_nav');
    var pane = document.querySelector('.svcpage_pane');
    if (!nav || !pane || pane.dataset.ready) return;
    pane.dataset.ready = '1';
    pane.classList.add('is-scripted');

    var links = [].slice.call(nav.querySelectorAll('.svcpage_nav-link'));

    function known(slug) {
      for (var i = 0; i < links.length; i++) {
        if (links[i].dataset.svc === slug) return true;
      }
      return false;
    }

    function show(slug) {
      if (!known(slug)) slug = DEFAULT;
      var panels = pane.querySelectorAll('.svcpage_panel');
      for (var i = 0; i < panels.length; i++) {
        panels[i].classList.toggle('is-shown', panels[i].id === slug);
      }
      for (var j = 0; j < links.length; j++) {
        var on = links[j].dataset.svc === slug;
        links[j].classList.toggle('is-current', on);
        if (on) links[j].setAttribute('aria-current', 'true');
        else links[j].removeAttribute('aria-current');
      }
      return slug;
    }

    function fromHash() {
      show((location.hash || '').replace(/^#/, ''));
    }

    nav.addEventListener(
      'click',
      function (e) {
        var link = e.target.closest ? e.target.closest('.svcpage_nav-link') : null;
        if (!link) return;
        // Modified clicks should still open a new tab or window.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        var slug = show(link.dataset.svc);
        try {
          history.pushState(null, '', '#' + slug);
        } catch (err) {
          location.hash = slug;
        }

        // Stacked under 992px the list sits above the content, so the new panel would
        // otherwise open off-screen. Beside the content, staying put is the point.
        if (window.matchMedia('(max-width: 991px)').matches) {
          var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          pane.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        }
      },
      true
    );

    window.addEventListener('hashchange', fromHash);
    window.addEventListener('popstate', fromHash);

    fromHash();
    // Arriving on a deep link: the browser could not scroll to a hidden panel, so put
    // the layout itself in view instead.
    if (location.hash && known(location.hash.replace(/^#/, ''))) {
      var layout = document.querySelector('.svcpage_layout');
      if (layout) {
        requestAnimationFrame(function () {
          layout.scrollIntoView({ block: 'start' });
        });
      }
    }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
`;

/* ── Apply ───────────────────────────────────────────────────────────────── */

const counts = (s) => ({
  div: (s.match(/<div\b/g) || []).length,
  divClose: (s.match(/<\/div>/g) || []).length,
  section: (s.match(/<section\b/g) || []).length,
  sectionClose: (s.match(/<\/section>/g) || []).length,
  script: (s.match(/<script\b/g) || []).length,
});

/** End index of the element opened at `open`, counting nested divs. */
function endOfDiv(html, open) {
  const o = /<div\b/gi;
  const c = /<\/div\s*>/gi;
  let depth = 0;
  let i = open;
  while (i < html.length) {
    o.lastIndex = i;
    c.lastIndex = i;
    const a = o.exec(html);
    const b = c.exec(html);
    if (!b) return -1;
    if (a && a.index < b.index) {
      depth += 1;
      i = a.index + a[0].length;
    } else {
      depth -= 1;
      i = b.index + b[0].length;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Point every Services dropdown entry at its own treatment. */
function relinkDropdown(s, prefix) {
  let n = 0;
  for (const item of ALL) {
    // Match the anchor by the text it carries, not by position: the columns are
    // ordered by category, which is not the order of ALL.
    const re = new RegExp(
      '(<a href=")([^"]*)(" data-animation="text-flip" class="navbar-dropdown_link w-inline-block">' +
        '<div>' +
        item.name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        '</div></a>)'
    );
    const m = re.exec(s);
    if (!m) continue;
    const want = `${prefix}service.html#${item.slug}`;
    if (m[2] === want) continue;
    s = s.slice(0, m.index) + m[1] + want + m[3] + s.slice(m.index + m[0].length);
    n += 1;
  }
  return { s, n };
}

/* Every HTML page in both trees, for the dropdown re-link. */
function pages() {
  const out = [];
  for (const dir of ['', 'variant-blue']) {
    const base = dir ? join(ROOT, dir) : ROOT;
    for (const f of readdirSync(base)) {
      if (f.endsWith('.html')) out.push(dir ? `${dir}/${f}` : f);
    }
  }
  return out;
}

let built = 0;

/* 1. Rebuild the two service pages. */
for (const rel of ['service.html', 'variant-blue/service.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);

  if (s.includes('svcpage_layout')) {
    console.log(`  ${rel.padEnd(28)} already rebuilt`);
    continue;
  }

  const anchor = s.indexOf('is-service-showcase');
  if (anchor === -1) {
    console.error(`  ${rel}: service showcase section not found — skipped`);
    process.exitCode = 1;
    continue;
  }
  const start = s.indexOf('<div class="w-dyn-list">', anchor);
  if (start === -1) {
    console.error(`  ${rel}: collection list not found — skipped`);
    process.exitCode = 1;
    continue;
  }
  const end = endOfDiv(s, start);
  const span = end === -1 ? '' : s.slice(start, end);
  // Sanity: the span must be the four accordions and nothing beyond them.
  if (
    end === -1 ||
    /<\/(section|main|body)>/i.test(span) ||
    (span.match(/service-item_wrap/g) || []).length !== 4
  ) {
    console.error(`  ${rel}: collection list failed its sanity check — skipped`);
    process.exitCode = 1;
    continue;
  }

  s = s.slice(0, start) + layout() + s.slice(end);

  // Reword the section heading: the page is now a directory, not a summary.
  s = s.replace(
    /What <span class="text-highlighted">We Provide<\/span>\s*For Every Generation/,
    'Every <span class="text-highlighted">Treatment</span>\n                                            We Offer'
  );

  const tag = '<script src="assets/js/service-detail.js" defer></script>';
  if (!s.includes('service-detail.js')) {
    s = s.replace('</body>', `    ${tag}\n  </body>`);
  }

  const after = counts(s);
  if (
    after.div !== after.divClose ||
    after.section !== before.section ||
    after.sectionClose !== before.sectionClose ||
    after.script !== before.script + 1
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    writeFileSync(file, original);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  built += 1;
  console.log(
    `  ${rel.padEnd(28)} ${ALL.length} treatments, ${ALL.length * 2} photo slots ` +
      `(${original.length.toLocaleString()} -> ${s.length.toLocaleString()} bytes)`
  );
}

/* 2. Deep-link the Services dropdown on every page in both trees. */
let relinked = 0;
for (const rel of pages()) {
  const file = join(ROOT, rel);
  const original = readFileSync(file, 'utf8');
  if (!original.includes('navbar-dropdown_link')) continue;
  const { s, n } = relinkDropdown(original, '');
  if (n === 0) continue;
  const a = counts(original);
  const b = counts(s);
  if (a.div !== b.div || a.divClose !== b.divClose) {
    console.error(`  ${rel}: ABORTED — structure drifted while re-linking`);
    process.exitCode = 1;
    continue;
  }
  writeFileSync(file, s);
  relinked += 1;
}
if (relinked) console.log(`  dropdown deep-linked on ${relinked} page(s)`);

/* 3. Point the home page cards' "View Details" at the matching treatment. */
for (const rel of ['index.html', 'variant-blue/index.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  let s = original;
  for (const [card, slug] of Object.entries(CARD_TARGETS)) {
    const head = s.indexOf(`class="service-item_info-title">${card}<`);
    if (head === -1) {
      console.error(`  ${rel}: card "${card}" not found`);
      continue;
    }
    const link = s.indexOf('href="service.html', head);
    if (link === -1) continue;
    const close = s.indexOf('"', link + 6);
    const current = s.slice(link + 6, close);
    const want = `service.html#${slug}`;
    if (current === want) continue;
    s = s.slice(0, link + 6) + want + s.slice(close);
  }
  if (s !== original) {
    writeFileSync(file, s);
    console.log(`  ${rel.padEnd(28)} card buttons deep-linked`);
  }
}

/* 4. Assets, mirrored into both trees. */
for (const js of ['assets/js/service-detail.js', 'variant-blue/assets/js/service-detail.js']) {
  writeFileSync(join(ROOT, js), JS);
  console.log(`  ${js.padEnd(44)} written`);
}
for (const css of ['assets/css/lumora.css', 'variant-blue/assets/css/lumora.css']) {
  const p = join(ROOT, css);
  let s = readFileSync(p, 'utf8');
  // Re-runnable: drop any previous copy of this block first, stopping at the next
  // appended block's marker so a later one is never swallowed.
  const at = s.indexOf(CSS_MARKER);
  if (at !== -1) {
    const next = s.indexOf('\n/* --- ', at + CSS_MARKER.length);
    s = (s.slice(0, at) + (next === -1 ? '' : s.slice(next + 1))).replace(/\s+$/, '') + '\n';
  }
  writeFileSync(p, s + CSS);
  console.log(`  ${css.padEnd(44)} services page styles ${at === -1 ? 'added' : 'refreshed'}`);
}

console.log(`\n${built} service page(s) rebuilt`);
console.log(`  default treatment: ${DEFAULT_SLUG}`);
