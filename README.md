# Northlight Dental

Marketing site for a general and cosmetic dental practice. Every element on the page
exists to move a visitor toward booking an appointment.

> **⚠ Not fit to publish.** All clinic details, staff, prices, reviews and before/after
> content are placeholders, and none of the 17 visual assets have been generated.
> See **[CONTENT-TO-REPLACE.md](./CONTENT-TO-REPLACE.md)**.

```bash
npm install
npm run dev            # http://localhost:5173
npm run build
npm run assets:check   # verifies declared assets exist; fails a deploy if not
```

## Stack

React + Vite · Tailwind · GSAP + ScrollTrigger · Three.js (r128) · Lenis · Framer Motion

## How it is put together

**Mobile-first.** Designed at 390px, then 768px, then 1440px. A persistent
`Call | Directions | Book` bar is pinned under 768px, and the page reserves its height
(`--bar-h`) so it never covers content.

**Animation is never load-bearing.** Content is in the DOM and readable before any
animation runs; reveals only offset it. `prefers-reduced-motion` is honoured throughout:
reveals become instant, Lenis is disabled entirely, the custom cursor does not mount,
and The Visit still plays with the scale-snap removed.

**Assets go through one manifest.** `src/data/assets.js` declares every image with its
Higgsfield generation recipe — model, prompt, aspect ratio, and the parent it derives
from. Components call `asset(key)`; nothing hardcodes a path. Until a file exists,
`AssetImage` renders a marked, correctly proportioned unshot frame rather than a stock
photo, so dropping the real files in causes no layout shift and nothing ships pretending
to be a photograph of this building.

**The Visit** (`src/components/TheVisit.jsx`) is the one piece worth reading before
editing. Scroll controls the *frame* — pinning, the scale-snap, the headline halves
pushing apart. The video controls the *text* — overlay cards switch on the video's own
`timeupdate` at the known clip boundaries. The two are deliberately not connected;
`currentTime` is read, never assigned. Driving the cards from scroll progress would look
correct on a slow scroll and drift on every other one.

**Booking** is a real section, not a modal, so nothing traps focus and the back button
keeps working. Any section can pre-fill it through `useBooking()`. The scheduling vendor
drops in behind `src/lib/bookingAdapter.js`; the form knows only that interface. No PHI
is persisted client-side and the form asks no diagnostic questions.

**Analytics** funnel through `track()` in `src/lib/track.js` — `book_click` (with source
section), `call_click`, `directions_click`, `form_step_complete`, `booking_submitted`.
Call `setAnalyticsProvider()` once to connect a real provider.

## Healthcare constraints

Three rules are enforced in the code, not just documented:

1. **No simulated clinical outcomes.** Before/after images were never generated. The
   comparison slider is complete but ships with marked awaiting-content panes, because a
   synthesised "after" in a smile gallery is a fabricated result attributed to this
   practice. Every such element carries `data-replace="real-patient-content"`, and a
   dev-only banner counts them on load.
2. **No claims the clinic has not made.** Copy describes process and equipment, never
   promised results. `aggregateRating` is deliberately absent from the JSON-LD until the
   review figures are real.
3. **Results vary**, stated under the Smile Gallery, with a consent and privacy note in
   the footer alongside Privacy Policy and Accessibility Statement links.

## Accessibility

Targeting WCAG 2.1 AA: semantic landmarks, one `h1`, accent-coloured focus rings on
everything, 4.5:1 minimum contrast, meaningful alt text, and a fully keyboard-operable
booking flow. The before/after control is a real `input[type=range]`, so drag, arrow
keys, Home/End and screen reader support come from the platform. The testimonial
carousel never auto-advances.

Verified across 390 / 768 / 1440 and in a reduced-motion pass: landmarks and section
anchors, the three-step booking flow including inline validation and the confirmation
state, no PHI written to storage, keyboard operation of the comparison slider, the
single-open FAQ, the insurance search, and the dentist bio panels.
