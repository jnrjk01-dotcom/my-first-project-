import { clinic, directionsUrl } from '../data/clinic';
import { useBooking } from '../lib/BookingContext';
import { track } from '../lib/track';

/**
 * Persistent action bar, under 768px only. Call | Directions | Book.
 *
 * Always visible and never covering content — `body` carries a bottom padding equal to
 * this bar's height (`--bar-h` in index.css), so the end of the document clears it.
 * Height is pinned to that variable rather than measured, so the two cannot drift.
 */
export default function MobileActionBar() {
  const { openBooking } = useBooking();

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-50 border-t border-ink/10 bg-bone/95 backdrop-blur-md md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="grid grid-cols-3 items-stretch" style={{ height: 'var(--bar-h)' }}>
        <a
          href={clinic.phone.href}
          onClick={() => track('call_click', { source: 'mobile_bar' })}
          className="flex flex-col items-center justify-center gap-0.5 border-r border-ink/10 font-display text-[13px]"
        >
          <Icon d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v4c0 .6-.4 1-1 1C10.7 21 3 13.3 3 5c0-.6.4-1 1-1Z" />
          Call
        </a>

        <a
          href={directionsUrl}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => track('directions_click', { source: 'mobile_bar' })}
          className="flex flex-col items-center justify-center gap-0.5 border-r border-ink/10 font-display text-[13px]"
        >
          <Icon d="M12 2c3.9 0 7 3.1 7 7 0 5.2-7 13-7 13S5 14.2 5 9c0-3.9 3.1-7 7-7Zm0 4.5A2.5 2.5 0 1 0 12 11a2.5 2.5 0 0 0 0-4.5Z" />
          Directions
        </a>

        <button
          type="button"
          onClick={() => openBooking({ source: 'mobile_bar' })}
          className="flex flex-col items-center justify-center gap-0.5 bg-accent font-display text-[13px] text-white"
        >
          <Icon d="M7 2v3M17 2v3M3.5 8.5h17M4 5.5h16c.6 0 1 .4 1 1V20c0 .6-.4 1-1 1H4c-.6 0-1-.4-1-1V6.5c0-.6.4-1 1-1Z" />
          Book
        </button>
      </div>
    </div>
  );
}

function Icon({ d }) {
  return (
    <svg
      width="17"
      height="17"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}
