import { useMemo, useState } from 'react';
import { carriers, financing, paymentMethods, statusCopy, uninsured } from '../data/insurance';
import { clinic } from '../data/clinic';
import { useBooking } from '../lib/BookingContext';
import { useReveal } from '../hooks/useMotion';

/**
 * Insurance and payment.
 *
 * The carrier grid is typographic rather than a wall of logos. Carrier logos are
 * third-party trademarks and using them implies a relationship the clinic has to
 * actually have — so they are left for the clinic to add with permission, and the
 * names carry the same information in the meantime. See CONTENT-TO-REPLACE.md.
 */
export default function Insurance() {
  const headRef = useReveal();
  const { openBooking } = useBooking();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const matches = useMemo(() => {
    if (!q) return carriers;
    return carriers.filter((c) => c.name.toLowerCase().includes(q));
  }, [q]);

  // A typed carrier that matches nothing still gets an answer, rather than an
  // empty grid that reads as "no".
  const verdict = q
    ? matches.length > 0
      ? statusCopy[matches[0].status]
      : statusCopy.unknown
    : null;

  return (
    <section id="insurance" className="section bg-bone2">
      <div className="shell">
        <div ref={headRef} className="max-w-[52ch]">
          <p className="eyebrow">Insurance &amp; payment</p>
          <h2 className="display-lg mt-5">Check before you book.</h2>
        </div>

        <div className="mt-14 grid gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Left — carrier search */}
          <div>
            <label htmlFor="carrier-search" className="font-display text-[15px]">
              Search your carrier
            </label>
            <p className="mt-1.5 text-[14px] text-muted">
              Type the name on your card.
            </p>

            <input
              id="carrier-search"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Delta Dental, Cigna, Aetna…"
              autoComplete="off"
              className="mt-4 w-full rounded-soft border border-ink/15 bg-white px-4 py-3.5 text-[16px] outline-none transition-colors focus:border-accent"
            />

            {/* Announced politely so a screen reader user hears the verdict without
                the input losing focus. */}
            <div aria-live="polite" className="min-h-[76px]">
              {verdict && (
                <div
                  className={`mt-4 rounded-soft border p-4 ${
                    verdict.tone === 'yes'
                      ? 'border-accent/30 bg-accent/[0.06]'
                      : 'border-ink/12 bg-white'
                  }`}
                >
                  <p className="font-display text-[14px]">
                    {matches.length > 0 ? `${matches[0].name} — ${verdict.label}` : verdict.label}
                  </p>
                  <p className="mt-1.5 text-[14px] leading-snug text-ink2">{verdict.line}</p>
                </div>
              )}
            </div>

            <ul className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {matches.map((c) => (
                <li
                  key={c.name}
                  className="flex flex-col justify-between gap-2 rounded-soft border border-ink/[0.08] bg-white p-3.5"
                >
                  <span className="font-display text-[13px] leading-snug">{c.name}</span>
                  <span
                    className={`text-[11px] uppercase tracking-[0.12em] ${
                      c.status === 'in-network' ? 'text-accent' : 'text-muted'
                    }`}
                  >
                    {statusCopy[c.status].label}
                  </span>
                </li>
              ))}
            </ul>

            {matches.length === 0 && (
              <p className="mt-4 text-[14px] text-ink2">
                Not on the list. Call{' '}
                <a href={clinic.phone.href} className="text-accent underline underline-offset-4">
                  {clinic.phone.display}
                </a>{' '}
                and we will check it for you.
              </p>
            )}
          </div>

          {/* Right — paying */}
          <div className="space-y-10">
            <div>
              <h3 className="font-display text-[19px]">Ways to pay</h3>
              <ul className="mt-4 flex flex-wrap gap-2">
                {paymentMethods.map((m) => (
                  <li key={m} className="chip">
                    {m}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="font-display text-[19px]">Paying over time</h3>
              <div className="mt-4 space-y-3">
                {financing.map((f) => (
                  <div key={f.title} className="rounded-soft border border-ink/[0.08] bg-white p-5">
                    <h4 className="font-display text-[15px]">{f.title}</h4>
                    <p className="mt-2 text-[14px] leading-relaxed text-ink">{f.terms}</p>
                    <p className="mt-2 text-[13px] leading-relaxed text-muted">{f.detail}</p>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h3 className="font-display text-[19px]">{uninsured.title}</h3>
              <ul className="mt-4 space-y-2.5 text-[15px] leading-relaxed text-ink2">
                {uninsured.body.map((b) => (
                  <li key={b} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                    {b}
                  </li>
                ))}
              </ul>
            </div>

            <button
              type="button"
              onClick={() =>
                openBooking({
                  source: 'insurance',
                  note: 'I have a question about my insurance coverage.',
                })
              }
              className="btn-primary w-full sm:w-auto"
            >
              Check my coverage
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
