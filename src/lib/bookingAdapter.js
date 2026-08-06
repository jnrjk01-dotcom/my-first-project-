/**
 * BOOKING ADAPTER
 *
 * The clinic's real scheduling system (Dentrix, NexHealth, Calendly, Zocdoc, …) drops
 * in behind this one interface. The booking UI knows only these four functions and
 * nothing about the vendor.
 *
 * ⚠ The default export is a LOCAL DEVELOPMENT STUB. It invents availability and
 * resolves submissions without sending them anywhere. It must be replaced before
 * launch or the form will silently accept bookings that never reach the practice.
 *
 * Contract:
 *   getAvailability({ from, to, serviceId, dentistId }) -> Promise<Slot[]>
 *   submit(booking)  -> Promise<{ ok: true, reference: string } | { ok: false, error: string }>
 *   Slot = { start: ISOString, label: string, available: boolean }
 *
 * Privacy: no patient data is persisted client-side by this module. Nothing is written
 * to localStorage, sessionStorage, cookies or the URL. The form state lives in memory
 * for the length of the visit and is handed to `submit()` once.
 */

const OPEN_HOURS = {
  // 0 = Sunday
  0: null,
  1: [8, 17],
  2: [8, 17],
  3: [8, 19],
  4: [8, 17],
  5: [8, 15],
  6: [9, 13],
};

/** Dev stub — deterministic so the availability grid does not flicker between renders. */
function stubAvailability({ from, days = 14 }) {
  const start = new Date(from);
  start.setHours(0, 0, 0, 0);
  const out = [];

  for (let d = 0; d < days; d += 1) {
    const day = new Date(start);
    day.setDate(start.getDate() + d);
    const hours = OPEN_HOURS[day.getDay()];
    if (!hours) continue;

    const slots = [];
    for (let h = hours[0]; h < hours[1]; h += 1) {
      for (const m of [0, 30]) {
        const slot = new Date(day);
        slot.setHours(h, m, 0, 0);
        if (slot < new Date()) continue;
        // Deterministic pseudo-availability from the timestamp.
        const seed = (slot.getDate() * 31 + h * 7 + m) % 10;
        slots.push({
          start: slot.toISOString(),
          label: slot.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }),
          available: seed > 3,
        });
      }
    }
    out.push({ date: day.toISOString(), slots });
  }
  return out;
}

export const bookingAdapter = {
  name: 'dev-stub',

  /** @returns {Promise<Array<{date: string, slots: Array}>>} */
  async getAvailability({ from = new Date(), days = 14 } = {}) {
    await new Promise((r) => setTimeout(r, 180));
    return stubAvailability({ from, days });
  },

  async submit(booking) {
    await new Promise((r) => setTimeout(r, 600));

    if (import.meta.env.DEV) {
      // Log shape only — never the patient's details.
      console.info('[bookingAdapter:dev-stub] submit()', {
        service: booking.serviceId,
        dentist: booking.dentistId,
        slot: booking.slot,
        hasNote: Boolean(booking.note),
      });
    }

    return {
      ok: true,
      reference: `DEV-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
      warning: import.meta.env.DEV
        ? 'Development stub — this booking was not sent anywhere.'
        : undefined,
    };
  },

  /** Called when the form opens so a vendor SDK can warm up. */
  async init() {},

  /** True once a real system is wired in. Drives the dev warning in the form. */
  isLive: false,
};

export default bookingAdapter;
