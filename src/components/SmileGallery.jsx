import { useMemo, useState } from 'react';
import { galleryCases, galleryFilters, RESULTS_VARY } from '../data/gallery';
import { useBooking } from '../lib/BookingContext';
import { useReveal } from '../hooks/useMotion';

/**
 * Smile gallery.
 *
 * ⚠ Every case in here is placeholder structure. See src/data/gallery.js for why the
 * before/after panes ship without generated imagery: a synthesised "after" in a smile
 * gallery is a simulated clinical outcome presented as this practice's work on a real
 * person. The slider, the filtering, the keyboard support and the layout are all final;
 * only the two photographs per case are missing, and they must be real and consented.
 *
 * Every case carries data-replace="real-patient-content".
 */
export default function SmileGallery() {
  const headRef = useReveal();
  const { openBooking } = useBooking();
  const [filter, setFilter] = useState('all');

  const shown = useMemo(
    () => (filter === 'all' ? galleryCases : galleryCases.filter((c) => c.type === filter)),
    [filter]
  );

  return (
    <section id="gallery" className="section bg-bone2">
      <div className="shell">
        <div ref={headRef} className="max-w-[52ch]">
          <p className="eyebrow">Smile gallery</p>
          <h2 className="display-lg mt-5">Before and after.</h2>
          <p className="mt-6 text-[16px] leading-relaxed text-ink2 md:text-[17px]">
            Each case shows the treatment, how many visits it took, and how long it ran
            from the first appointment to the final result.
          </p>
        </div>

        {/* Filter. A real toolbar of toggle buttons, not a fake select. */}
        <div
          role="group"
          aria-label="Filter cases by treatment"
          className="mt-10 flex flex-wrap gap-2"
        >
          {galleryFilters.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(f.id)}
                className={`rounded-full border px-4 py-2 font-display text-[13px] transition-colors duration-200 ease-calm ${
                  active
                    ? 'border-accent bg-accent text-white'
                    : 'border-ink/15 text-ink2 hover:border-ink/40'
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>

        <ul className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {shown.map((c) => (
            <li key={c.id}>
              <CaseCard case={c} />
            </li>
          ))}
        </ul>

        {/* Results-vary line. Directly under the grid, not buried in the footer. */}
        <p className="mt-10 max-w-[68ch] text-[13px] leading-relaxed text-muted">
          {RESULTS_VARY}
        </p>

        <div className="mt-10">
          <button
            type="button"
            onClick={() => openBooking({ source: 'gallery' })}
            className="btn-primary"
          >
            Book a consultation
          </button>
        </div>
      </div>
    </section>
  );
}

function CaseCard({ case: c }) {
  return (
    <figure className="card overflow-hidden" data-replace="real-patient-content">
      <BeforeAfter caseData={c} />

      <figcaption className="p-5">
        <h3 className="font-display text-[17px]">{c.treatment}</h3>
        <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1.5 text-[13px]">
          <div className="flex gap-2">
            <dt className="text-muted">Visits</dt>
            <dd className="font-display">{c.visits}</dd>
          </div>
          <div className="flex gap-2">
            <dt className="text-muted">Start to finish</dt>
            <dd className="font-display">{c.duration}</dd>
          </div>
        </dl>
      </figcaption>
    </figure>
  );
}

/**
 * Draggable before/after comparison.
 *
 * The control is a real <input type="range"> stretched across the image, so dragging,
 * arrow keys, Home/End, touch and screen reader support all come from the platform
 * rather than from hand-rolled pointer maths. The visible handle is drawn on top and
 * tracks the input's value.
 */
function BeforeAfter({ caseData }) {
  const [pos, setPos] = useState(50);
  const hasImages = Boolean(caseData.before && caseData.after);

  return (
    <div className="relative aspect-[4/3] select-none overflow-hidden bg-bone2">
      {/* After — the full-width base layer. */}
      <Pane
        src={caseData.after}
        hasImages={hasImages}
        label="After"
        alt={hasImages ? `After: ${caseData.treatment}` : undefined}
      />

      {/* Before — clipped to the handle position. */}
      <div
        className="absolute inset-0"
        style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}
        aria-hidden="true"
      >
        <Pane src={caseData.before} hasImages={hasImages} label="Before" tone="dark" />
      </div>

      {/* Visible handle. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 z-10 w-px bg-white/90 shadow-[0_0_0_1px_rgba(0,0,0,0.12)]"
        style={{ left: `${pos}%` }}
      >
        <span className="absolute top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-ink/10 bg-white">
          <svg width="16" height="12" viewBox="0 0 16 12" aria-hidden="true" className="text-ink">
            <path
              d="M6 1 1.5 6 6 11M10 1l4.5 5L10 11"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>

      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={pos}
        onChange={(e) => setPos(Number(e.target.value))}
        aria-label={`Reveal the before and after images for ${caseData.treatment}. ${pos}% before.`}
        className="absolute inset-0 z-20 h-full w-full cursor-ew-resize appearance-none bg-transparent opacity-0"
      />
    </div>
  );
}

function Pane({ src, hasImages, label, alt, tone = 'light' }) {
  if (hasImages) {
    return (
      <img
        src={src}
        alt={alt ?? ''}
        aria-hidden={alt ? undefined : true}
        loading="lazy"
        decoding="async"
        data-replace="real-patient-content"
        className="h-full w-full object-cover"
      />
    );
  }

  return (
    <div
      className={`flex h-full w-full flex-col items-center justify-center gap-2 text-center ${
        tone === 'dark' ? 'bg-grey' : 'bg-bone2'
      }`}
      data-replace="real-patient-content"
    >
      <span className="font-display text-[10px] uppercase tracking-[0.22em] text-accent">
        {label}
      </span>
      <span className="max-w-[22ch] px-4 text-[11px] leading-snug text-muted">
        Awaiting the clinic&rsquo;s own consented patient photograph.
      </span>
    </div>
  );
}
