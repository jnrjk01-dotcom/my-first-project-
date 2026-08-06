# Content to replace before launch

Everything in this file is placeholder content. **This site is not fit to publish until
each section below is cleared.** A development-only red banner (`import.meta.env.DEV`)
counts the outstanding items on every page load, and `npm run assets:check` fails the
build if an asset is marked ready but missing.

Three groups, in order of how much damage they do if missed:

1. [Patient content — legally and ethically blocking](#1-patient-content--blocking)
2. [Clinic facts — wrong information costs patients money](#2-clinic-facts)
3. [Visual assets — not yet generated](#3-visual-assets)

---

## 1. Patient content — blocking

Every item here is marked in the source with `data-replace="real-patient-content"` and
can be found with:

```bash
grep -rn 'data-replace="real-patient-content"' src/
```

### 1.1 Before/after images — Smile Gallery

**Status: ships with no imagery, by design.**

The six cases in `src/data/gallery.js` have `before: null` and `after: null`. The
comparison slider, filtering, keyboard support and layout are all finished; only the
photographs are missing, and they were deliberately never generated.

A synthesised "after" photograph in a smile gallery is a simulated clinical outcome
presented as this practice's work on a real person. That is the one thing this section
must never do, so the panes render a marked awaiting-content state instead of a
plausible-looking fake that someone could ship by accident.

To go live:

- [ ] Obtain real before/after photographs with **written, specific consent** for
      marketing use on the website — general treatment consent is not enough
- [ ] Set `before` and `after` to the image paths and `status: 'ready'` on each case
- [ ] Confirm `visits` and `duration` against the actual clinical record for each case
- [ ] Confirm the `treatment` description matches what was actually done
- [ ] Keep the `data-replace` attribute until every case is real, then remove it

### 1.2 Testimonials

Six invented quotes in `src/data/testimonials.js`. **Nobody said any of these.**

- [ ] Replace every quote with a real review from the clinic's own review profile
- [ ] Confirm the patient consents to it being reproduced on the website
- [ ] Match `name`, `treatment`, `date` and `source` to the real review
- [ ] Set `clinic.reviewProfileUrl` to the real Google profile (currently a placeholder
      `place_id`)

### 1.3 Team portraits

`portrait.1` … `portrait.4` are AI-generated faces of people who do not exist,
presented as named dentists.

- [ ] Replace all four with real photographs of the actual team
- [ ] Remove `replaceWithReal: true` from those records in `src/data/assets.js`

---

## 2. Clinic facts

### 2.1 Identity and contact — `src/data/clinic.js`

Every value in this file is invented. Phone numbers use the `555-01xx` range reserved
for fictional use, so a half-configured build can never dial a real person.

| Field | Placeholder | Notes |
|---|---|---|
| `name` | Northlight Dental | |
| `specialism` | General and cosmetic dentistry | Must describe what the practice actually does |
| `city` / `neighbourhood` | Portland, Oregon / Pearl District | |
| `phone.display` / `phone.href` | (503) 555-0142 | **Reserved fictional number** |
| `email` | hello@northlightdental.example | `.example` TLD cannot receive mail |
| `address.*` | 1420 NW Marshall Street, Suite 200 | |
| `geo.lat` / `geo.lng` | 45.5335 / −122.6848 | Drives the map embed and JSON-LD |
| `hours` | Mon–Sat, Wed to 7pm | |
| `emergency` | Same-day slots until 3pm | Appears above the fold — must be true |
| `reviewProfileUrl` | `PLACEHOLDER_PLACE_ID` | |
| `social` | `PLACEHOLDER` | |
| `legal.privacyUrl` / `accessibilityUrl` | `/privacy`, `/accessibility` | **Both pages still need to be written** |

Also update in `index.html`: `<title>`, meta description, Open Graph tags, `<link
rel="canonical">`, and the `<noscript>` block (which repeats the address, phone and
hours for visitors with no JavaScript).

### 2.2 Trust bar figures — `clinic.figures`

Four claims shown directly under the hero. Each must be defensible:

- [ ] `18` years in practice
- [ ] `12,400` patients treated
- [ ] `4.8` average rating / `612 reviews · Google` — must match the live profile
- [ ] `4` dentists on staff

Ratings in structured data were **intentionally left out** of the `Dentist` JSON-LD in
`src/components/Contact.jsx`. Add `aggregateRating` only once these are the real,
current figures.

### 2.3 The team — `src/data/dentists.js`

Four invented people. Names, credentials, registration numbers, years practising,
specialisms, languages, biographies and the "one human detail" all need replacing.
`src/data/faq.js` names **Dr Hallam** in the dental-anxiety answer — update that
reference too, or the FAQ will point at someone who does not work there.

### 2.4 Services, durations and prices — `src/data/services.js`

Eight services with starting prices and typical appointment lengths.

- [ ] Confirm every price, and whether it is a true starting figure
- [ ] Confirm every appointment duration
- [ ] Confirm the named equipment is actually in the building: **iTero Element**
      intraoral scanner, cone beam CT, chairside milling unit, and lithium disilicate
      as the crown material. These are named in `services.js`, `About.jsx` and the
      video overlay cards. Naming equipment the practice does not own is a false claim.

### 2.5 Insurance — `src/data/insurance.js`

- [ ] Confirm the carrier list and, for each, whether it is `in-network`,
      `out-of-network` or `call`. **Getting this wrong costs patients money.**
- [ ] Confirm the financing terms with the finance provider: the 3-month 0% in-house
      plan, the $500 threshold, and the 6–24 month third-party terms
- [ ] Carrier **logos** are deliberately not used — they are third-party trademarks and
      displaying them implies a relationship. The grid is typographic instead. Add logos
      only with each carrier's permission.

### 2.6 Policies — `src/data/faq.js`

- [ ] Cancellation policy: 24 hours, $50 fee
- [ ] Out-of-hours arrangement: the answerphone referral to a regional emergency service
- [ ] The $120 check-up / $110 hygiene figures
- [ ] The 90-day estimate validity, which is stated in three separate places

### 2.7 Access and arrival — `src/components/Contact.jsx`

Written to reduce arrival anxiety, so it has to be accurate:

- [ ] Parking: metered on NW Marshall, garage on 14th
- [ ] Transit: the 77 bus, the NW 12th & Lovejoy streetcar stop
- [ ] Step-free entrance, 900mm doors, lift, ground-floor accessible toilet
- [ ] "What the entrance looks like": the glazed door, flat canopy, bakery and bike shop,
      the Suite 200 buzzer

### 2.8 Booking system — `src/lib/bookingAdapter.js`

**The form currently submits nowhere.** The default export is a development stub that
invents availability and resolves without sending anything.

- [ ] Implement `getAvailability()` and `submit()` against the real system (Dentrix,
      NexHealth, Calendly, Zocdoc…)
- [ ] Set `isLive: true` and update `name`
- [ ] Keep the constraints: no PHI in `localStorage`, `sessionStorage`, cookies or the
      URL, and no diagnostic questions added to the form

### 2.9 Analytics — `src/lib/track.js`

Events fire to `console.info` and nowhere else. Call `setAnalyticsProvider()` once with
a real provider. Events wired: `book_click` (with source section), `call_click`,
`directions_click`, `form_step_complete`, `booking_submitted`.

### 2.10 Fonts

Space Grotesk and Inter load from Google Fonts in `index.html`. Self-host them before
launch — it removes a third-party connection on the critical path and avoids the
privacy question of Google seeing every visitor's IP.

---

## 3. Visual assets

**None of the 17 assets have been generated.** The Higgsfield account had 10 credits
against an estimated ~480 credit run (16 images ≈ 32–60, plus 4 × Seedance 2.0 4K clips
at 110 each), so the set was not started rather than begun and abandoned half-matched.

Until they exist, `AssetImage` renders a marked, correctly proportioned unshot frame —
never a stock photograph. Boxes are already at final dimensions, so dropping the real
files in causes no layout shift.

**Every generation recipe — model, prompt, aspect ratio, resolution and reference
image — is stored in `src/data/assets.js` next to the asset it produces.** That file is
the run sheet; this is the summary.

### Generation order

Order matters. Anything with `derivesFrom` must be generated image-to-image from its
parent's finished output, or the light temperature and colour grade will not match.

| # | Asset | Derives from | Model | Target |
|---|---|---|---|---|
| 1 | `interior.master` | — | `nano_banana_pro` | `interior-master.webp` |
| 2 | `interior.operatory` | master | `nano_banana_pro` | `interior-operatory.webp` |
| 3 | `interior.scanning` | master | `nano_banana_pro` | `interior-scanning.webp` |
| 4 | `interior.consult` | master | `nano_banana_pro` | `interior-consult.webp` |
| 5 | `interior.sterilisation` | master | `nano_banana_pro` | `interior-sterilisation.webp` |
| 6 | `interior.hygiene` | master | `nano_banana_pro` | `interior-hygiene.webp` |
| 7 | `interior.entrance` | master | `nano_banana_pro` | `interior-entrance.webp` |
| 8–11 | `portrait.1`–`.4` | portrait.1 | `soul_2` | `portrait-N.webp` |
| 12 | `detail.tray` | master | `nano_banana_pro` | `detail-tray.webp` |
| 13 | `detail.scanner` | master | `nano_banana_pro` | `detail-scanner.webp` |
| 14 | `detail.ceramic` | master | `nano_banana_pro` | `detail-ceramic.webp` |
| 15 | `cutout.chair` | master | `nano_banana_pro` → `remove_background` | `cutout-chair.png` |
| 16 | `cutout.scanner` | master | `nano_banana_pro` → `remove_background` | `cutout-scanner.png` |
| 17 | The Visit video | 4 stills | `seedance_2_0` 4K | `the-visit.mp4` |

**Generate and approve `interior.master` first.** It sets the light temperature and
colour grade for every other asset on the site, and re-rolling it means re-rolling
everything downstream.

### The Visit video

Four separate clips, one per space, concatenated with hard cuts and no crossfades:

```bash
# clips.txt
file 'arrival.mp4'
file 'consultation.mp4'
file 'treatment.mp4'
file 'result.mp4'

ffmpeg -f concat -safe 0 -i clips.txt -c:v libx264 -crf 20 -preset slow -an \
  -pix_fmt yuv420p public/assets/video/the-visit.mp4
```

⚠ **After encoding, update `VISIT_VIDEO.clips[].startsAt` in `src/data/assets.js` to the
real measured cut timestamps.** The overlay data cards switch on those values via the
video's own `timeupdate` event. If the encoded durations differ from the declared 4.5s
per clip, the cards drift out of sync with the footage. `npm run assets:check` reads the
real duration back with `ffprobe` and fails if it disagrees with the manifest.

Also required:

- [ ] Poster frame pulled from the master grade → `the-visit-poster.webp`
- [ ] Confirm no face in the footage is identifiable, and that nothing reads as a real
      named patient
- [ ] Set `VISIT_VIDEO.status = 'ready'`

### After the assets land

- [ ] Set `status: 'ready'` on each record in `src/data/assets.js`
- [ ] Uncomment the hero `<link rel="preload">` in `index.html` — it is commented out so
      the build does not warn about preloading a file that does not exist
- [ ] Point the Open Graph image at the real master interior
- [ ] Run `npm run assets:check` — it must exit 0
- [ ] Re-check the alt text in `assets.js` against what each image actually shows.
      The alt text was written from the prompts, and prompts and results diverge.

---

## Pre-launch checklist

- [ ] Section 1 cleared — no `data-replace` attributes remain in `src/`
- [ ] Section 2 cleared — every fact confirmed by the practice
- [ ] Section 3 cleared — `npm run assets:check` exits 0
- [ ] Privacy Policy and Accessibility Statement written and linked
- [ ] Booking adapter live and tested end to end with a real appointment
- [ ] Analytics provider connected
- [ ] Fonts self-hosted
- [ ] Contrast re-checked against the real photographs — the hero wash was tuned for
      a bright daylit image and needs verifying against the actual one
- [ ] Keyboard pass: header → hero → services → gallery slider → dentists → carousel →
      insurance search → FAQ → all three booking steps → map, with a visible focus ring
      at every stop
- [ ] Screen reader pass over the booking form
- [ ] `prefers-reduced-motion` pass: reveals instant, no scroll hijack, The Visit still
      plays with no scale-snap
- [ ] Test with JavaScript animation disabled — the site must stay fully bookable
