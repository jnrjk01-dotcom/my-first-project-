/**
 * Single analytics entry point. Every conversion event on the site goes through
 * `track()` so a real provider drops in here and nowhere else.
 *
 * No PHI, ever. Event payloads carry the section a click came from and the shape of
 * the interaction — never a name, phone number, email, insurance carrier, or anything
 * a patient typed into the booking form.
 */

const EVENTS = /** @type {const} */ ([
  'book_click',
  'call_click',
  'directions_click',
  'form_step_complete',
  'booking_submitted',
]);

/** Swap this for GA4 / Plausible / Segment. Signature stays the same. */
let provider = null;

/** @param {(name: string, props: Record<string, unknown>) => void} fn */
export function setAnalyticsProvider(fn) {
  provider = fn;
  // Flush anything that happened before the provider loaded.
  queue.splice(0).forEach(([name, props]) => provider(name, props));
}

const queue = [];

export function track(name, props = {}) {
  if (!EVENTS.includes(name)) {
    if (import.meta.env.DEV) console.warn(`[track] unknown event "${name}"`);
    return;
  }

  const payload = { ...props, ts: Date.now() };

  if (import.meta.env.DEV) {
    console.info(`[track] ${name}`, payload);
  }

  if (provider) provider(name, payload);
  else queue.push([name, payload]);
}
