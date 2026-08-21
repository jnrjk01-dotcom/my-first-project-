/**
 * Build service.html as an "All services" directory: a boxed list of service groups on
 * the left, and the selected group's description plus its treatment cards on the right.
 *
 *   node assets/brand/service-detail.mjs
 *
 * Modelled on orthodontist.co.zw/service/orthodontic-treatments/, which the practice
 * pointed at: one button per service group rather than per treatment, and beneath each
 * group's description a grid of cards naming what it actually covers.
 *
 * GROUP ORDER IS COMMERCIAL, NOT CLINICAL. The highest-value work leads: orthodontics,
 * then implants, then cosmetic, then crowns and bridges, with preventive care last.
 * That is why the four clinical headings used elsewhere on the site (preventive,
 * cosmetic, restorative, orthodontics) are not the headings here.
 *
 * SWITCHING IS PURE CSS. Each panel is a real element with a real id and the buttons are
 * ordinary anchors, so `:target` does the showing and hiding: the page works with
 * JavaScript disabled and every group has a shareable URL (service.html#implants).
 * Individual treatments keep their own ids inside the panels, so the deep links already
 * published in the Services dropdown (service.html#root-canal) still resolve; the script
 * opens the group that contains them and scrolls the treatment into view.
 *
 * The script is needed because Webflow's in-page anchor module intercepts clicks on
 * same-page links, calls preventDefault and animates a scroll, so the fragment never
 * changes and `:target` never fires on a click. It listens in the capture phase, ahead
 * of that delegated handler, and takes over.
 *
 * PHOTOS are declared per group in `photos` below: one runs full width, two sit side by
 * side, and a group with none gets no media block at all rather than an empty
 * placeholder, because an unfilled slot on a live page reads as a broken page.
 *
 * Only the clinical photographs are used on the service panels. The practice asked for
 * the chairside and portrait shots to come off implants, cosmetic and crowns, so each of
 * those shows the treatment itself and nothing else.
 *
 * To add or change one, crop the source first so the file itself is the right shape,
 * rather than leaving object-fit to do it at display time:
 *
 *   node assets/brand/fit-photo.mjs <source> assets/img/svc-<group>-1.jpg \
 *     1360x765 upper       # a single, full-width photograph (16:9)
 *   node assets/brand/fit-photo.mjs <source> assets/img/svc-<group>-1.jpg \
 *     760x475 center       # one of a pair (16:10)
 *
 * A small source is cropped to its own largest 16:10 window instead of being upscaled to
 * 760 wide; the display box is 391px at 1440, so anything from about 500px across is
 * still sharp. Then add it to that group's `photos` and re-run this script, which copies
 * it into variant-blue/assets/img/ too. Without the copy the blue variant 404s on it,
 * and the site's inline image guard swaps in a branded gradient that hides the failure.
 *
 * The script is re-runnable: it replaces whatever it built last time.
 */

import { readFileSync, writeFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

const PHONE_HREF = '+263292263687';
const PHONE_DISPLAY = '+263 29 226 3687';
const WA_DIGITS = '263778398111';

/* ── Content ─────────────────────────────────────────────────────────────────
   Treatment `slug`s must stay stable: the Services dropdown and the home page cards
   already link to them, and a group's own slug is what its button points at.

   `cards` are the sub-treatments a group's reader would recognise as separate choices.
   Where a treatment genuinely has none (root canal, an examination) the cards carry its
   stages instead, so every treatment ends up with the same grid rather than some
   trailing off into a bare paragraph. */

const GROUPS = [
  {
    slug: 'orthodontic-treatments',
    photos: [
      { file: 'svc-orthodontic-treatments-1.jpg', alt: 'Fixed braces on a patient\'s upper teeth, with an interdental brush alongside' },
      { file: 'svc-orthodontic-treatments-2.jpg', alt: 'A clear aligner being seated over the upper teeth' },
    ],
    title: 'Orthodontic Treatments',
    items: [
      {
        slug: 'braces-orthodontics',
        name: 'Braces / Orthodontics',
        lead:
          'Straightening crowded, gapped or protruding teeth, and correcting how the ' +
          'upper and lower jaws meet.',
        body: [
          'Orthodontic treatment moves teeth gradually into a better position. It is not ' +
            'only about appearance: crowded and overlapping teeth are much harder to clean, ' +
            'and an uneven bite wears the teeth unevenly and can strain the jaw joint.',
          'Treatment starts with records (x-rays, photographs and impressions) and a plan ' +
            'showing what can be achieved and roughly how long it will take. Braces are then ' +
            'fitted and adjusted at regular reviews, or a course of clear aligners is made up ' +
            'and changed at set intervals. A retainer afterwards holds the result; without ' +
            'one, teeth drift back.',
        ],
        cards: [
          ['Fixed Braces',
            'Brackets bonded to the teeth and linked by a wire that is adjusted at each ' +
            'review. The most versatile option, and the one that corrects the widest range ' +
            'of cases.'],
          ['Clear Aligners',
            'A series of removable, near-invisible trays that move the teeth in small steps. ' +
            'Taken out to eat and to clean, and far less noticeable than fixed braces, though ' +
            'they suit some cases better than others.'],
          ['Retainers',
            'Worn once treatment finishes. Teeth drift back towards where they started, so ' +
            'the retainer is what makes the result last.'],
          ['Bite and Jaw Alignment',
            'Correcting an overbite, underbite or crossbite. An uneven bite wears the teeth ' +
            'unevenly and can strain the jaw joint, so it is treated for function as much ' +
            'as for appearance.'],
          ['Adult Orthodontics',
            'There is no age limit. Treatment in adults can take longer because the bone is ' +
            'denser, but the teeth move by exactly the same mechanism.'],
        ],
      },
    ],
  },
  {
    slug: 'implants',
    photos: [
      { file: 'svc-implants-1.jpg', alt: 'A cutaway model showing an implant post seated in the jaw beside a natural tooth root' },
    ],
    title: 'Implants',
    items: [
      {
        slug: 'implants-treatment',
        name: 'Implants',
        lead: 'A titanium post placed in the jaw that acts as a new tooth root.',
        body: [
          'An implant is the closest thing to a natural tooth. A small post is placed into ' +
            'the jawbone and left to integrate with it over a few months, and a crown is ' +
            'then attached on top.',
          'Because it is anchored in bone rather than to the neighbouring teeth, those teeth ' +
            'are left untouched, and the bone in that area keeps being used instead of ' +
            'shrinking away. It does need enough healthy bone and healthy gums, which we ' +
            'assess with x-rays first.',
        ],
        cards: [
          ['Single Tooth Implant',
            'One post and one crown, replacing a single missing tooth without touching the ' +
            'teeth on either side of the gap.'],
          ['Multiple Implants',
            'Several posts restoring a run of missing teeth, carrying either individual ' +
            'crowns or a bridge between them.'],
          ['Implant-Retained Dentures',
            'A denture that clips onto implants instead of resting on the gum, so it stays ' +
            'put while you eat and speak.'],
          ['Assessment and Planning',
            'X-rays to confirm there is enough healthy bone and gum to hold an implant, ' +
            'before any surgery is booked.'],
        ],
      },
    ],
  },
  {
    slug: 'cosmetic-dentistry',
    photos: [
      { file: 'svc-cosmetic-dentistry-1.jpg', alt: 'A veneer being bonded to the front of an upper tooth' },
    ],
    title: 'Cosmetic Dentistry',
    intro:
      'Treatment aimed at how the teeth look: their shade, their shape, and the line they ' +
      'make when you smile. It is planned around teeth that are already healthy, so any ' +
      'decay or gum problem is treated first.',
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
        ],
        cards: [
          ['Porcelain Veneers',
            'Laboratory-made facings with a natural translucency that holds its shade for ' +
            'years. Made from an impression, then bonded on at a second visit.'],
          ['Composite Veneers',
            'Built up directly on the tooth in a single visit. Less costly than porcelain ' +
            'and easily repaired, though they pick up stain sooner.'],
          ['Chip and Edge Repair',
            'Rebuilding a chipped corner or a worn edge, where a full veneer is more than ' +
            'the tooth actually needs.'],
          ['Shade and Shape Planning',
            'The shade and the shape are agreed with you before anything is made, so the ' +
            'result is never a surprise.'],
        ],
      },
      {
        slug: 'teeth-whitening',
        name: 'Teeth Whitening',
        lead:
          'Professional whitening lifts the shade of your natural teeth safely and ' +
          'predictably.',
        body: [
          'Teeth darken with age and with tea, coffee, red wine and tobacco. Professional ' +
            'whitening uses a controlled gel to lift that discolouration, supervised, with ' +
            'your gums protected, at a strength over-the-counter kits do not reach.',
        ],
        cards: [
          ['In-Practice Whitening',
            'Done here in one appointment with your gums protected throughout, at the ' +
            'strongest concentration we can safely use.'],
          ['Take-Home Trays',
            'Custom trays and gel used at home over a couple of weeks. Slower, and easy to ' +
            'top up later without another appointment.'],
          ['Managing Sensitivity',
            'Sensitivity for a day or two afterwards is common and settles. We check ' +
            'beforehand how likely it is to affect you.'],
          ['What Will Not Change',
            'Fillings, crowns, bridges and veneers keep their existing shade, so some may ' +
            'need replacing afterwards to match.'],
        ],
      },
    ],
  },
  {
    slug: 'crowns-bridges-dentures',
    photos: [
      { file: 'svc-crowns-bridges-dentures-1.jpg', alt: 'A finished full upper denture held in a gloved hand' },
    ],
    title: 'Crowns, Bridges & Dentures',
    intro:
      'Rebuilding teeth that are broken down or heavily filled, and replacing those that ' +
      'are already gone, so the bite stays even and the teeth around a gap do not drift ' +
      'into it.',
    items: [
      {
        slug: 'crowns',
        name: 'Crowns',
        lead:
          'A cap that covers a weakened tooth completely, restoring its shape, strength ' +
          'and appearance.',
        body: [
          'A tooth that has been heavily filled, cracked or root treated can no longer take ' +
            'a full bite on its own, and will eventually split. A crown wraps over what ' +
            'remains and carries the load instead. We prepare the tooth, take an impression, ' +
            'and fit a temporary crown while the permanent one is made.',
        ],
        cards: [
          ['All-Ceramic Crowns',
            'The most natural looking option, with no metal edge showing at the gum line. ' +
            'Usually the choice for front teeth.'],
          ['Porcelain-Fused-to-Metal Crowns',
            'A metal core under a porcelain surface. Very strong, which suits the back teeth ' +
            'that take the heaviest load.'],
          ['Temporary Crowns',
            'Fitted while the permanent crown is made, so the prepared tooth is protected ' +
            'and you are never left with a visible gap.'],
          ['Crowns After Root Canal',
            'A root treated tooth is more brittle and will eventually split under a full ' +
            'bite. A crown takes that load instead.'],
        ],
      },
      {
        slug: 'dental-bridges',
        name: 'Dental Bridges',
        lead:
          'A fixed replacement for a missing tooth, anchored to the teeth on either side.',
        body: [
          'When a tooth is lost, the teeth beside it start to tilt into the space and the ' +
            'one opposite begins to over-erupt. A bridge closes the gap for good: the ' +
            'neighbouring teeth are prepared as supports and the replacement is joined ' +
            'between them as a single unit.',
        ],
        cards: [
          ['Fixed Bridge',
            'The standard design. The teeth on both sides of the gap are prepared as ' +
            'supports and the replacement tooth sits between them.'],
          ['Cantilever Bridge',
            'Supported from one side only, for a gap that has a sound tooth on just one of ' +
            'its sides.'],
          ['Implant-Supported Bridge',
            'Carried on implants rather than on natural teeth, so the neighbouring teeth ' +
            'are left completely untouched.'],
          ['Cleaning Underneath',
            'A bridge is cemented in, so floss threaders or an interdental brush are needed ' +
            'beneath it. We show you how at the fitting.'],
        ],
      },
      {
        slug: 'dentures',
        name: 'Dentures',
        lead: 'Removable replacements for several missing teeth, or for a full arch.',
        body: [
          'Dentures restore the ability to chew and to speak clearly, and support the shape ' +
            'of the face, which changes once the back teeth are gone. Making them takes ' +
            'several short visits: impressions, a trial fitting, then the finished denture. ' +
            'Small adjustments in the first few weeks are normal and expected.',
        ],
        cards: [
          ['Full Dentures',
            'Replacing every tooth in the upper or lower jaw, restoring the bite and ' +
            'supporting the shape of the face.'],
          ['Partial Dentures',
            'Filling several gaps while clipping around the teeth you still have, which ' +
            'also stops those teeth drifting.'],
          ['Repairs and Relines',
            'Gums change shape over time. A reline refits the denture to the ridge; a repair ' +
            'deals with a crack or a lost tooth.'],
          ['Trial Fitting',
            'A try-in before the final set is made, so the bite, the shade and the ' +
            'appearance are all checked with you first.'],
        ],
      },
    ],
  },
  {
    slug: 'restorative-treatments',
    photos: [
      { file: 'svc-restorative-treatments-1.jpg', alt: 'Close view of a patient\'s teeth being examined with a mirror and probe' },
    ],
    title: 'Restorative Treatments',
    intro:
      'Saving a tooth that has decayed or become infected, so it stays in the mouth and ' +
      'keeps doing its job rather than being taken out.',
    items: [
      {
        slug: 'filling',
        name: 'Filling',
        lead: 'Decay is cleaned out and the tooth rebuilt, so it can be used normally again.',
        body: [
          'A cavity does not heal on its own. It spreads, and the further it travels the ' +
            'closer it gets to the nerve. A filling stops it: we remove the decayed tissue, ' +
            'clean the cavity, and rebuild the tooth with a material matched to its own ' +
            'shade so the repair does not show.',
        ],
        cards: [
          ['Tooth-Coloured Fillings',
            'Composite matched to the shade of the tooth and bonded in place, so the repair ' +
            'does not show.'],
          ['Amalgam Fillings',
            'Hard-wearing silver fillings, still a sound choice for back teeth where the ' +
            'load is heaviest.'],
          ['Temporary Fillings',
            'Placed to settle a tooth or to seal it between visits, then replaced with the ' +
            'permanent restoration.'],
          ['Treating It Early',
            'A small cavity is one short appointment. Left until it reaches the nerve, the ' +
            'same tooth needs root canal treatment or a crown.'],
        ],
      },
      {
        slug: 'root-canal',
        name: 'Root Canal',
        lead:
          'When decay or injury reaches the nerve, root canal treatment saves the tooth ' +
          'instead of losing it.',
        body: [
          'Inside every tooth is a soft core of nerve and blood vessels. If bacteria reach ' +
            'it the tooth becomes painful, and an abscess can form at the root tip. Root ' +
            'canal treatment removes that infected tissue and seals the tooth so bacteria ' +
            'cannot return. Depending on the tooth, it is completed over one or two visits.',
        ],
        cards: [
          ['Local Anaesthetic',
            'The tooth is fully numbed first. The infection is the painful part, not the ' +
            'treatment for it.'],
          ['Removing the Infection',
            'The infected pulp is taken out of the crown of the tooth and out of each of ' +
            'its roots.'],
          ['Cleaning and Shaping',
            'The canals are disinfected and shaped, so nothing is left behind for bacteria ' +
            'to live on.'],
          ['Sealing and Restoring',
            'The canals are sealed and the tooth rebuilt, with a crown often recommended ' +
            'afterwards to protect it.'],
        ],
      },
    ],
  },
  {
    slug: 'oral-surgery',
    photos: [
      { file: 'svc-oral-surgery-1.jpg', alt: 'Extraction instruments laid out on a sterile tray during a surgical extraction' },
    ],
    title: 'Oral Surgery',
    intro:
      'Removing a tooth that cannot reasonably be saved, including wisdom teeth and roots ' +
      'that have broken off below the gum line.',
    items: [
      {
        slug: 'normal-extraction',
        name: 'Normal Extraction',
        lead: 'A simple extraction removes a tooth that is visible and can be lifted out whole.',
        body: [
          'We remove a tooth only when it cannot reasonably be saved, or when it is crowding ' +
            'the teeth around it. The area is fully numbed, the tooth is loosened and eased ' +
            'out, and you go home with clear aftercare. Most of the healing happens in the ' +
            'first few days.',
        ],
        cards: [
          ['Local Anaesthetic',
            'The area is fully numbed before anything is done, and we check it has taken ' +
            'before starting.'],
          ['Lifting the Tooth Out',
            'The tooth is loosened and eased out whole, with no need to cut the gum.'],
          ['The First 24 Hours',
            'Gauze, what to eat, and what to avoid, so the socket clots properly and heals ' +
            'cleanly.'],
          ['Replacing the Tooth',
            'Where the gap matters we talk through a bridge, a denture or an implant, so the ' +
            'neighbouring teeth do not drift.'],
        ],
      },
      {
        slug: 'surgical-extraction',
        name: 'Surgical Extraction',
        lead:
          'For teeth broken at the gum line or still buried in bone, including wisdom teeth.',
        body: [
          'Some teeth cannot simply be lifted out: a wisdom tooth lying sideways, a root ' +
            'that has broken off, a tooth that never came through. A surgical extraction ' +
            'reaches these through a small opening in the gum, and sometimes divides the ' +
            'tooth so it comes out in pieces rather than being forced whole.',
        ],
        cards: [
          ['Wisdom Teeth',
            'The most common reason for a surgical extraction, particularly a tooth lying ' +
            'sideways or only partly through the gum.'],
          ['Impacted Teeth',
            'A tooth still buried in the bone, reached through a small opening in the gum.'],
          ['Broken or Buried Roots',
            'A root left behind after a tooth has fractured at or below the gum line.'],
          ['Stitches and Aftercare',
            'The site is closed with stitches, with detailed aftercare and a follow-up ' +
            'visit to check the healing.'],
        ],
      },
    ],
  },
  {
    slug: 'preventive-dentistry',
    photos: [
      { file: 'svc-preventive-dentistry-1.jpg', alt: 'A polishing cup being used on an upper front tooth' },
    ],
    title: 'Preventive Dentistry',
    intro:
      'The routine work that keeps the rest of this page unnecessary: finding problems ' +
      'while they are still small, and keeping the gums healthy.',
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
        ],
        cards: [
          ['Your History and Concerns',
            'What has been bothering you, what you have noticed, and what you would like to ' +
            'change about your teeth.'],
          ['Examination',
            'The teeth, gums, tongue and soft tissues, checked properly rather than glanced ' +
            'over.'],
          ['X-Rays Where Needed',
            'To see decay between the teeth, and the state of the roots and bone below the ' +
            'gum line.'],
          ['A Plan and Costs',
            'What needs attention now, what can reasonably wait, and what each option ' +
            'involves, before you commit to anything.'],
        ],
      },
      {
        slug: 'scaling-and-polishing',
        name: 'Scaling and Polishing',
        lead:
          'A professional clean removes the hardened deposit that brushing at home cannot ' +
          'shift.',
        body: [
          'Plaque left undisturbed hardens into calculus along the gum line and between the ' +
            'teeth. Once hardened, no toothbrush will remove it, and it keeps the gums ' +
            'inflamed, which is how gum disease starts.',
        ],
        cards: [
          ['Scaling',
            'Hardened deposit lifted off the tooth surface, above and below the gum line ' +
            'where a toothbrush cannot reach.'],
          ['Polishing',
            'The enamel smoothed so new plaque takes longer to settle, and surface stain ' +
            'from tea, coffee and tobacco removed.'],
          ['Gum Check',
            'Bleeding and pocketing recorded, so gum disease is caught while it is still ' +
            'reversible.'],
          ['Cleaning at Home',
            'The brushing and interdental technique that keeps the result until your next ' +
            'visit.'],
        ],
      },
    ],
  },
];

const DEFAULT_SLUG = GROUPS[0].slug;

/** treatment slug -> group slug, for the deep links already published in the nav. */
const TREATMENT_GROUP = {};
for (const g of GROUPS) for (const it of g.items) TREATMENT_GROUP[it.slug] = g.slug;

/** The Services dropdown names treatments; these are the anchors it should point at. */
const NAV_TARGETS = {
  'Consultation / Examination': 'consultation-examination',
  'Scaling and Polishing': 'scaling-and-polishing',
  Filling: 'filling',
  'Root Canal': 'root-canal',
  'Normal Extraction': 'normal-extraction',
  'Surgical Extraction': 'surgical-extraction',
  Crowns: 'crowns',
  'Dental Bridges': 'dental-bridges',
  Dentures: 'dentures',
  // The implants panel is a group of one, so its group slug is the anchor.
  Implants: 'implants',
  Veneers: 'veneers',
  'Teeth Whitening': 'teeth-whitening',
  'Braces / Orthodontics': 'braces-orthodontics',
};

/** Home page card -> the group its "View Details" button should open. */
const CARD_TARGETS = {
  'Preventive dentistry': 'preventive-dentistry',
  'Cosmetic dentistry': 'cosmetic-dentistry',
  'Restorative treatments': 'restorative-treatments',
  Orthodontics: 'orthodontic-treatments',
};

/* ── Markup ──────────────────────────────────────────────────────────────── */

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const CHEVRON =
  '<svg class="svcpage_chevron" width="8" height="13" viewBox="0 0 8 13" fill="none" ' +
  'stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ' +
  'aria-hidden="true"><path d="M1.5 1.5 6.5 6.5l-5 5"/></svg>';

/**
 * A group's photographs, or nothing at all.
 *
 * A group with no photograph gets no media block rather than an empty placeholder: an
 * unfilled slot on a live page reads as a broken page, and the practice does not have a
 * relevant photograph for every group. `is-single` runs one photograph across the full
 * width of the pane; `is-pair` puts two side by side.
 */
/** Pixel width of a JPEG, read from its SOF marker. */
function jpegWidth(file) {
  const b = readFileSync(file);
  let i = 2;
  while (i < b.length - 9) {
    if (b[i] !== 0xff) { i += 1; continue; }
    const marker = b[i + 1];
    // SOF0-SOF15, excluding the non-frame markers in that range.
    if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
      return b.readUInt16BE(i + 7);
    }
    i += 2 + b.readUInt16BE(i + 2);
  }
  return 0;
}

function media(group) {
  const photos = group.photos || [];
  if (!photos.length) return '';
  const cls = photos.length === 1 ? 'is-single' : 'is-pair';
  // Never display a photograph wider than it actually is. The pane is 816px at 1440,
  // and several of the clinical sources are 500-736px across; stretching them to fill it
  // makes a macro shot read as an unrecognisable blur. The cap is measured from the file
  // rather than declared, so it cannot drift when a photograph is replaced.
  let cap = '';
  if (photos.length === 1) {
    const w = jpegWidth(join(ROOT, 'assets/img', photos[0].file));
    if (w) cap = ` style="max-width:${w}px"`;
  }
  return (
    `<div class="svcpage_media ${cls}"${cap}>` +
    photos
      .map(
        (p) =>
          `<img class="svcpage_photo" src="assets/img/${p.file}" ` +
          `alt="${esc(p.alt)}" loading="lazy" decoding="async"/>`
      )
      .join('') +
    '</div>'
  );
}

function treatmentBlock(item, showTitle) {
  return (
    `<div class="svcpage_treatment" id="${item.slug}">` +
    (showTitle
      ? `<h3 class="svcpage_treatment-title">${esc(item.name)}</h3>` +
        `<p class="svcpage_treatment-lead">${esc(item.lead)}</p>`
      : '') +
    item.body.map((p) => `<p class="svcpage_body">${esc(p)}</p>`).join('') +
    '<div class="svcpage_cards">' +
    item.cards
      .map(
        ([t, d]) =>
          '<div class="svcpage_card">' +
          `<h4 class="svcpage_card-title">${esc(t)}</h4>` +
          `<p class="svcpage_card-text">${esc(d)}</p>` +
          '</div>'
      )
      .join('') +
    '</div></div>'
  );
}

function panel(group) {
  const single = group.items.length === 1;
  const intro = group.intro || group.items[0].lead;
  const waText = encodeURIComponent(
    `Hi Dental Care Centre, I would like to ask about ${group.title}.`
  );
  return (
    `<article class="svcpage_panel" id="${group.slug}" aria-labelledby="${group.slug}-title">` +
    media(group) +
    `<h2 class="svcpage_title" id="${group.slug}-title">${esc(group.title)}</h2>` +
    `<p class="svcpage_lead">${esc(intro)}</p>` +
    group.items.map((it) => treatmentBlock(it, !single)).join('') +
    '<div class="svcpage_actions">' +
    `<a class="svcpage_action is-primary" href="tel:${PHONE_HREF}">Call ${PHONE_DISPLAY}</a>` +
    `<a class="svcpage_action" href="https://wa.me/${WA_DIGITS}?text=${waText}" ` +
    'target="_blank" rel="noopener noreferrer">Ask about this on WhatsApp' +
    '<span class="dcc-sr">, opens WhatsApp in a new tab</span></a>' +
    '</div></article>'
  );
}

function layout() {
  const buttons = GROUPS.map(
    (g) =>
      '<li><a class="svcpage_nav-link" ' +
      `href="#${g.slug}" data-svc="${g.slug}">` +
      `<span>${esc(g.title)}</span>${CHEVRON}</a></li>`
  ).join('');

  return (
    '<div class="svcpage_layout">' +
    '<aside class="svcpage_nav" aria-label="All services">' +
    '<p class="svcpage_nav-title">All services</p>' +
    `<ul class="svcpage_nav-list">${buttons}</ul>` +
    '</aside>' +
    '<div class="svcpage_pane">' +
    GROUPS.map(panel).join('') +
    '</div></div>'
  );
}

/* ── Styles ──────────────────────────────────────────────────────────────── */

const CSS_MARKER = '/* --- services page: sidebar + panel --- */';
const CSS = `
${CSS_MARKER}
/* The services section is the one light area of this page. Everywhere else the site
   sits on the deep brand colour, but this section carries long descriptive copy and a
   boxed directory, both of which read better on a light ground.

   Tokens are derived from the brand colour with color-mix so the teal tree and the blue
   tree each tint their own neutrals; the plain values before each @supports block are
   what a browser without color-mix falls back to. */
.section_service.is-service-showcase {
  --svc-ground: #f4f6f8;
  --svc-card: #ffffff;
  --svc-ink: var(--primitive-color--primary-900);
  --svc-ink-soft: #55636b;
  --svc-line: rgba(1, 31, 35, .1);
  --svc-line-strong: rgba(1, 31, 35, .16);
  background-color: var(--svc-ground);
}
@supports (color: color-mix(in srgb, red 50%, white)) {
  .section_service.is-service-showcase {
    --svc-ground: color-mix(in srgb, var(--primitive-color--primary-500) 5%, #f5f7f9);
    --svc-ink-soft: color-mix(in srgb, var(--primitive-color--primary-900) 68%, #ffffff);
    --svc-line: color-mix(in srgb, var(--primitive-color--primary-900) 11%, transparent);
    --svc-line-strong: color-mix(in srgb, var(--primitive-color--primary-900) 18%, transparent);
  }
}
/* The section heading was written for the dark ground it used to sit on. */
.section_service.is-service-showcase .service_header h2,
.section_service.is-service-showcase .section_tag { color: var(--svc-ink); }
.section_service.is-service-showcase .section_tag {
  background-color: var(--svc-card);
  border: 1px solid var(--svc-line);
}
/* The accent clears 3:1 on this ground, which is the bar for large text; at 56px the
   heading qualifies. It is not used for anything smaller here. */
.section_service.is-service-showcase .text-highlighted {
  color: var(--primitive-color--primary-600);
}

.svcpage_layout {
  display: grid;
  grid-template-columns: 316px minmax(0, 1fr);
  gap: 44px;
  align-items: start;
}

/* ── The "All services" box ─────────────────────────────────────────────── */
.svcpage_nav {
  position: sticky;
  top: 108px;
  border-radius: 14px;
  overflow: hidden;
  background: #eceff1;
  box-shadow: 0 1px 2px rgba(1, 31, 35, .05), 0 12px 30px -18px rgba(1, 31, 35, .35);
}
@supports (color: color-mix(in srgb, red 50%, white)) {
  .svcpage_nav { background: color-mix(in srgb, var(--svc-ink) 7%, var(--svc-card)); }
}
.svcpage_nav-title {
  margin: 0;
  padding: 20px 24px;
  background: var(--primitive-color--primary-900);
  color: #fff;
  font-size: 19px;
  font-weight: 600;
  letter-spacing: 0;
  text-transform: none;
}
.svcpage_nav-list {
  list-style: none;
  margin: 0;
  padding: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  /* Seven groups fit a tall viewport; on a short one the box scrolls rather than
     running off the bottom of a sticky element. */
  max-height: calc(100vh - 220px);
  overflow-y: auto;
  overscroll-behavior: contain;
}
.svcpage_nav-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 18px;
  border-radius: 8px;
  background: var(--svc-card);
  border: 1px solid var(--svc-line);
  color: var(--svc-ink);
  font-size: 16px;
  font-weight: 600;
  line-height: 1.25;
  text-decoration: none;
  transition: background-color .18s, color .18s, border-color .18s;
}
.svcpage_nav-link .svcpage_chevron { flex: 0 0 auto; opacity: .55; }
.svcpage_nav-link:hover {
  border-color: var(--primitive-color--primary-500);
}
/* Accent fill with primary-900 text rather than white: measured on both trees, white on
   the accent is 3.0:1 (teal) and 3.7:1 (blue), which fails at this text size. */
.svcpage_nav-link.is-current,
.svcpage_nav-link[aria-current="true"] {
  background: var(--primitive-color--primary-500);
  border-color: var(--primitive-color--primary-500);
  color: var(--primitive-color--primary-900);
}
.svcpage_nav-link.is-current .svcpage_chevron { opacity: 1; }
.svcpage_nav-link:focus-visible {
  outline: 3px solid var(--primitive-color--primary-600);
  outline-offset: 2px;
}

/* ── Panels ─────────────────────────────────────────────────────────────── */
.svcpage_panel { display: none; scroll-margin-top: 118px; }
/* Scoped to :not(.is-scripted) rather than left to cascade order: the default-panel
   rule is high specificity and would otherwise keep the first panel visible underneath
   whichever one the script has selected. The :has() variant matches a treatment anchor
   inside a panel, so the published per-treatment deep links still open their group. */
.svcpage_pane:not(.is-scripted) > .svcpage_panel:target,
.svcpage_pane:not(.is-scripted) > .svcpage_panel:has(:target) { display: block; }
.svcpage_pane:not(.is-scripted):not(:has(:target)) > .svcpage_panel:first-child {
  display: block;
}
/* With the script running it owns the switching, because Webflow's in-page anchor
   module intercepts clicks on same-page links and animates a scroll instead of letting
   the fragment change, so :target never fires on a click. */
.svcpage_pane.is-scripted > .svcpage_panel { display: none; }
.svcpage_pane.is-scripted > .svcpage_panel.is-shown { display: block; }

.svcpage_media {
  display: grid;
  gap: 18px;
  margin-bottom: 28px;
}
.svcpage_media.is-single { grid-template-columns: 1fr; }
.svcpage_media.is-pair { grid-template-columns: 1fr 1fr; }
.svcpage_photo {
  display: block;
  width: 100%;
  height: 100%;
  /* The sources are cropped to these ratios by assets/brand/fit-photo.mjs, so object-fit
     only has to absorb rounding. It is stated so a later replacement at the wrong ratio
     is letterboxed rather than stretched. */
  object-fit: cover;
  border-radius: 12px;
}
.svcpage_media.is-single .svcpage_photo { aspect-ratio: 16 / 9; }
.svcpage_media.is-pair .svcpage_photo { aspect-ratio: 16 / 10; }
.svcpage_title { margin: 0 0 16px; color: var(--svc-ink); font-size: 44px; }
.svcpage_lead {
  margin: 0 0 8px;
  max-width: 62ch;
  font-size: 19px;
  line-height: 1.55;
  color: var(--svc-ink-soft);
}
.svcpage_body {
  margin: 16px 0 0;
  max-width: 68ch;
  color: var(--svc-ink-soft);
}

.svcpage_treatment { margin-top: 34px; }
.svcpage_treatment + .svcpage_treatment {
  margin-top: 44px;
  padding-top: 40px;
  border-top: 1px solid var(--svc-line);
}
.svcpage_treatment-title { margin: 0 0 10px; color: var(--svc-ink); font-size: 28px; }
.svcpage_treatment-lead {
  margin: 0;
  max-width: 62ch;
  font-size: 17.5px;
  line-height: 1.5;
  color: var(--svc-ink-soft);
}

/* ── Sub-treatment cards ────────────────────────────────────────────────── */
.svcpage_cards {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 18px;
  margin-top: 26px;
}
.svcpage_card {
  padding: 22px 24px;
  border-radius: 10px;
  background: var(--svc-card);
  border: 1px solid var(--svc-line);
}
.svcpage_card-title {
  margin: 0 0 10px;
  font-size: 17px;
  font-weight: 600;
  color: var(--primitive-color--primary-700);
}
.svcpage_card-text { margin: 0; font-size: 15.5px; line-height: 1.55; color: var(--svc-ink-soft); }

/* ── Actions ────────────────────────────────────────────────────────────── */
.svcpage_actions { display: flex; flex-wrap: wrap; gap: 12px; margin-top: 36px; }
.svcpage_action {
  display: inline-flex;
  align-items: center;
  padding: 13px 22px;
  border-radius: 999px;
  font-size: 15px;
  font-weight: 600;
  text-decoration: none;
  color: var(--svc-ink);
  background: var(--svc-card);
  border: 1px solid var(--svc-line-strong);
  transition: background-color .2s, color .2s, border-color .2s;
}
.svcpage_action:hover { border-color: var(--primitive-color--primary-500); }
.svcpage_action.is-primary {
  background: var(--primitive-color--primary-500);
  border-color: var(--primitive-color--primary-500);
  color: var(--primitive-color--primary-900);
}
.svcpage_action.is-primary:hover {
  background: var(--primitive-color--primary-600);
  border-color: var(--primitive-color--primary-600);
}
.svcpage_action:focus-visible {
  outline: 3px solid var(--primitive-color--primary-600);
  outline-offset: 2px;
}

/* Also defined by booking-bar.js, but that script returns early once the bar has been
   dismissed for the session, and without this the hint text would become visible. */
.dcc-sr {
  position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px;
  overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0;
}

@media screen and (max-width: 991px) {
  .svcpage_layout { grid-template-columns: 1fr; gap: 30px; }
  /* Sticky is only useful beside the content; stacked, it would cover it. */
  .svcpage_nav { position: static; }
  .svcpage_nav-list { max-height: none; overflow: visible; }
  .svcpage_title { font-size: 36px; }
  .svcpage_panel { scroll-margin-top: 92px; }
}
@media screen and (max-width: 767px) {
  .svcpage_media.is-pair { grid-template-columns: 1fr; }
  .svcpage_cards { grid-template-columns: 1fr; }
  .svcpage_nav-title { font-size: 17px; padding: 17px 20px; }
  .svcpage_nav-list { padding: 14px; gap: 8px; }
  .svcpage_nav-link { padding: 14px 16px; font-size: 15px; }
  .svcpage_title { font-size: 30px; }
  .svcpage_lead { font-size: 17px; }
  .svcpage_treatment-title { font-size: 23px; }
  .svcpage_actions .svcpage_action { width: 100%; justify-content: center; }
}
`;

/* ── Switching script ────────────────────────────────────────────────────── */

const JS = `/**
 * Service group switching.
 *
 * The panels are real elements with real ids and the buttons are ordinary anchors, so
 * the stylesheet can switch between them with :target and the page works with this file
 * blocked. It cannot do the job alone, though: Webflow's in-page anchor module
 * intercepts clicks on same-page links, calls preventDefault and animates a scroll, so
 * the fragment never changes and :target never fires. This listens in the capture phase,
 * ahead of that delegated handler, and takes over.
 *
 * It also resolves the per-treatment deep links published in the Services dropdown
 * (service.html#root-canal) to the group that contains them.
 */
(function () {
  'use strict';
  var DEFAULT = ${JSON.stringify(DEFAULT_SLUG)};
  var IN_GROUP = ${JSON.stringify(TREATMENT_GROUP)};

  function init() {
    var nav = document.querySelector('.svcpage_nav');
    var pane = document.querySelector('.svcpage_pane');
    if (!nav || !pane || pane.dataset.ready) return;
    pane.dataset.ready = '1';
    pane.classList.add('is-scripted');

    var links = [].slice.call(nav.querySelectorAll('.svcpage_nav-link'));
    var panels = [].slice.call(pane.querySelectorAll('.svcpage_panel'));

    /** A fragment may name a group or a single treatment inside one. */
    function groupFor(slug) {
      for (var i = 0; i < links.length; i++) {
        if (links[i].dataset.svc === slug) return slug;
      }
      return IN_GROUP[slug] || null;
    }

    function show(slug) {
      var group = groupFor(slug) || DEFAULT;
      for (var i = 0; i < panels.length; i++) {
        panels[i].classList.toggle('is-shown', panels[i].id === group);
      }
      for (var j = 0; j < links.length; j++) {
        var on = links[j].dataset.svc === group;
        links[j].classList.toggle('is-current', on);
        if (on) links[j].setAttribute('aria-current', 'true');
        else links[j].removeAttribute('aria-current');
      }
      return group;
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

        var group = show(link.dataset.svc);
        try {
          history.pushState(null, '', '#' + group);
        } catch (err) {
          location.hash = group;
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

    var slug = (location.hash || '').replace(/^#/, '');
    show(slug);

    // Arriving on a deep link: the browser could not scroll to a panel that was hidden
    // when it tried, so place the view now that the right one is open. A link naming a
    // treatment lands on that treatment; a link naming a group lands on the group.
    if (slug && groupFor(slug)) {
      requestAnimationFrame(function () {
        var el = document.getElementById(slug);
        var target = el && el.classList.contains('svcpage_treatment')
          ? el
          : document.querySelector('.svcpage_layout');
        if (target) target.scrollIntoView({ block: 'start' });
      });
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

/** Point every Services dropdown entry at its treatment's anchor. */
function relinkDropdown(s) {
  let n = 0;
  for (const [name, slug] of Object.entries(NAV_TARGETS)) {
    // Match the anchor by the text it carries, not by position: the dropdown columns
    // are ordered by clinical category, which is not the order used on this page.
    const re = new RegExp(
      '(<a href=")([^"]*)(" data-animation="text-flip" class="navbar-dropdown_link w-inline-block">' +
        '<div>' +
        name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') +
        '</div></a>)'
    );
    const m = re.exec(s);
    if (!m) continue;
    const want = `service.html#${slug}`;
    if (m[2] === want) continue;
    s = s.slice(0, m.index) + m[1] + want + m[3] + s.slice(m.index + m[0].length);
    n += 1;
  }
  return { s, n };
}

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

/* 1. Build (or rebuild) the two service pages. */
for (const rel of ['service.html', 'variant-blue/service.html']) {
  const file = join(ROOT, rel);
  if (!existsSync(file)) continue;
  const original = readFileSync(file, 'utf8');
  let s = original;
  const before = counts(s);

  const anchor = s.indexOf('is-service-showcase');
  if (anchor === -1) {
    console.error(`  ${rel}: service showcase section not found — skipped`);
    process.exitCode = 1;
    continue;
  }

  // Either the block this script wrote last time, or the original Webflow collection.
  let start = s.indexOf('<div class="svcpage_layout">', anchor);
  let kind = 'rebuilt';
  if (start === -1) {
    start = s.indexOf('<div class="w-dyn-list">', anchor);
    kind = 'built';
  }
  if (start === -1) {
    console.error(`  ${rel}: nothing to replace in the showcase section — skipped`);
    process.exitCode = 1;
    continue;
  }

  const end = endOfDiv(s, start);
  const span = end === -1 ? '' : s.slice(start, end);
  // Sanity: the span must stop inside the section.
  if (end === -1 || /<\/(section|main|body)>/i.test(span)) {
    console.error(`  ${rel}: replacement span failed its sanity check — skipped`);
    process.exitCode = 1;
    continue;
  }

  s = s.slice(0, start) + layout() + s.slice(end);

  // The section heading described a summary; the page is now a directory.
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
    after.script < before.script
  ) {
    console.error(`  ${rel}: ABORTED — structure drifted`);
    console.error(`    before ${JSON.stringify(before)}  after ${JSON.stringify(after)}`);
    writeFileSync(file, original);
    process.exitCode = 1;
    continue;
  }

  writeFileSync(file, s);
  built += 1;
  const treatments = GROUPS.reduce((n, g) => n + g.items.length, 0);
  const cards = GROUPS.reduce(
    (n, g) => n + g.items.reduce((m, it) => m + it.cards.length, 0),
    0
  );
  const photos = GROUPS.reduce((n, g) => n + (g.photos || []).length, 0);
  const bare = GROUPS.filter((g) => !(g.photos || []).length).map((g) => g.slug);
  console.log(
    `  ${rel.padEnd(28)} ${kind}: ${GROUPS.length} groups, ${treatments} treatments, ` +
      `${cards} cards, ${photos} photos` +
      (bare.length ? ` (no photo: ${bare.join(', ')})` : '')
  );
}

/* 2. Deep-link the Services dropdown on every page in both trees. */
let relinked = 0;
for (const rel of pages()) {
  const file = join(ROOT, rel);
  const original = readFileSync(file, 'utf8');
  if (!original.includes('navbar-dropdown_link')) continue;
  const { s, n } = relinkDropdown(original);
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

/* 3. Point the home page cards' "View Details" at the matching group. */
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
    const want = `service.html#${slug}`;
    if (s.slice(link + 6, close) === want) continue;
    s = s.slice(0, link + 6) + want + s.slice(close);
  }
  if (s !== original) {
    writeFileSync(file, s);
    console.log(`  ${rel.padEnd(28)} card buttons deep-linked`);
  }
}

/* 4. Assets, mirrored into both trees. */
/* The two trees have independent asset directories; a photograph written only to the
   root one 404s on the blue variant, where the site's image guard would quietly swap in
   a branded gradient and hide the fact. */
let mirrored = 0;
for (const g of GROUPS) {
  for (const ph of g.photos || []) {
    const src = join(ROOT, 'assets/img', ph.file);
    if (!existsSync(src)) {
      console.error(`  MISSING SOURCE assets/img/${ph.file} — the page will 404 on it`);
      process.exitCode = 1;
      continue;
    }
    const dst = join(ROOT, 'variant-blue/assets/img', ph.file);
    const bytes = readFileSync(src);
    if (!existsSync(dst) || Buffer.compare(readFileSync(dst), bytes) !== 0) {
      writeFileSync(dst, bytes);
      mirrored += 1;
    }
  }
}
if (mirrored) console.log(`  ${mirrored} photo(s) mirrored into variant-blue/assets/img/`);

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

console.log(`\n${built} service page(s) written`);
console.log('  groups: ' + GROUPS.map((g) => g.slug).join(', '));
