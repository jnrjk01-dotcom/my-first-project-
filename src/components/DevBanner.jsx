import { useEffect, useState } from 'react';
import { ASSETS, VISIT_VIDEO } from '../data/assets';
import bookingAdapter from '../lib/bookingAdapter';

/**
 * Unmissable development-only warning. Renders only when `import.meta.env.DEV` is true,
 * so it is compiled out of the production bundle entirely — it is a guard for whoever
 * is building the site, not a disclaimer for patients.
 *
 * It counts the three things that must not reach production unnoticed:
 * simulated patient content, ungenerated assets, and a booking form wired to a stub.
 */
export default function DevBanner() {
  if (!import.meta.env.DEV) return null;
  return <Banner />;
}

function Banner() {
  const [open, setOpen] = useState(true);
  const [counts, setCounts] = useState({ replace: 0, pending: 0 });

  useEffect(() => {
    // Count the live DOM rather than the data files, so anything hand-rolled into a
    // component with data-replace is caught too.
    const replace = document.querySelectorAll('[data-replace="real-patient-content"]').length;
    const pending =
      Object.values(ASSETS).filter((a) => a.status !== 'ready').length +
      (VISIT_VIDEO.status !== 'ready' ? 1 : 0);
    setCounts({ replace, pending });
  }, []);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-2 left-2 z-[100] rounded-full bg-red-600 px-3 py-1.5 font-display text-[11px] text-white"
      >
        Dev warnings ({counts.replace + counts.pending})
      </button>
    );
  }

  return (
    <div
      role="status"
      className="fixed inset-x-0 top-0 z-[100] border-b-4 border-red-700 bg-red-600 px-4 py-3 text-white"
    >
      <div className="mx-auto flex max-w-shell flex-wrap items-start gap-x-6 gap-y-2 text-[13px] leading-snug">
        <strong className="font-display uppercase tracking-[0.14em]">
          Development build — not fit to publish
        </strong>

        <span>
          <b>{counts.replace}</b> element(s) marked{' '}
          <code className="rounded bg-black/25 px-1">data-replace=&quot;real-patient-content&quot;</code>{' '}
          — simulated before/after and testimonial content. Replace with consented
          patient material before launch.
        </span>

        <span>
          <b>{counts.pending}</b> asset(s) not yet generated.
        </span>

        {!bookingAdapter.isLive && (
          <span>
            Booking adapter is <code className="rounded bg-black/25 px-1">{bookingAdapter.name}</code> —
            submissions go nowhere.
          </span>
        )}

        <button
          type="button"
          onClick={() => setOpen(false)}
          className="ml-auto shrink-0 rounded border border-white/50 px-2 py-1 font-display text-[11px] hover:bg-white/15"
        >
          Hide
        </button>
      </div>
    </div>
  );
}
