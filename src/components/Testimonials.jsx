import { useCallback, useRef } from 'react';
import { clinic } from '../data/clinic';
import { testimonials } from '../data/testimonials';
import { useReveal } from '../hooks/useMotion';

/**
 * Horizontal scroll-snap carousel. Three cards visible at 1440px, one on mobile.
 *
 * Auto-advance is off, deliberately and permanently — a carousel that moves on its own
 * is a WCAG 2.2.2 problem and it steals reading time from people who are slower.
 * Movement comes from drag, from the arrow buttons, and from the arrow keys.
 *
 * ⚠ Every quote is placeholder content. See src/data/testimonials.js.
 */
export default function Testimonials() {
  const headRef = useReveal();
  const trackRef = useRef(null);

  const scrollByCard = useCallback((dir) => {
    const track = trackRef.current;
    if (!track) return;
    const card = track.querySelector('[data-card]');
    const amount = card ? card.getBoundingClientRect().width + 16 : track.clientWidth * 0.8;
    track.scrollBy({
      left: dir * amount,
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
        ? 'auto'
        : 'smooth',
    });
  }, []);

  const onKeyDown = (e) => {
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      scrollByCard(1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      scrollByCard(-1);
    }
  };

  return (
    <section id="testimonials" className="section">
      <div className="shell">
        <div ref={headRef} className="flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-[46ch]">
            <p className="eyebrow">Patients</p>
            <h2 className="display-lg mt-5">What people say.</h2>
          </div>

          <div className="flex gap-2">
            <ArrowButton dir={-1} onClick={() => scrollByCard(-1)} label="Previous reviews" />
            <ArrowButton dir={1} onClick={() => scrollByCard(1)} label="Next reviews" />
          </div>
        </div>
      </div>

      {/* Full-bleed track so cards run to the viewport edge, with the shell padding
          reproduced as scroll padding so the first card still lines up with the grid. */}
      <div
        ref={trackRef}
        role="region"
        aria-label="Patient reviews"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="no-scrollbar mt-12 flex snap-x snap-mandatory gap-4 overflow-x-auto overscroll-x-contain pb-2"
        style={{
          scrollPaddingInline: 'var(--shell-x)',
          paddingInline: 'var(--shell-x)',
        }}
      >
        {testimonials.map((t) => (
          <article
            key={t.id}
            data-card
            data-replace="real-patient-content"
            className="card flex w-[82vw] shrink-0 snap-start flex-col p-6 sm:w-[52vw] lg:w-[calc((1440px-2*var(--shell-x)-2rem)/3)] lg:max-w-[420px]"
          >
            <blockquote className="text-[17px] leading-relaxed text-ink">
              &ldquo;{t.quote}&rdquo;
            </blockquote>

            <footer className="mt-auto pt-6">
              <div className="rule mb-4" />
              <p className="font-display text-[14px]">{t.name}</p>
              <p className="mt-1 text-[13px] text-muted">
                {t.treatment} · {t.date} · {t.source}
              </p>
            </footer>
          </article>
        ))}
      </div>

      <div className="shell mt-8">
        <a
          href={clinic.reviewProfileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="font-display text-[15px] text-accent underline underline-offset-4"
        >
          Read every review on Google
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
      </div>
    </section>
  );
}

function ArrowButton({ dir, onClick, label }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 transition-colors hover:border-ink/50"
    >
      <svg
        width="16"
        height="14"
        viewBox="0 0 16 14"
        aria-hidden="true"
        className={dir < 0 ? 'rotate-180' : ''}
      >
        <path
          d="M1 7h13M9 2l5 5-5 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
