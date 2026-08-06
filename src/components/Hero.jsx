import { lazy, Suspense, useEffect, useRef } from 'react';
import { clinic } from '../data/clinic';
import { useBooking } from '../lib/BookingContext';
import { track } from '../lib/track';
import { useMediaQuery, useReducedMotion } from '../hooks/useMotion';
import AssetImage from './AssetImage';

const HeroDepth = lazy(() => import('./HeroDepth'));

/**
 * First screen. It has to answer what, where, and how do I book without scrolling,
 * so nothing decorative is allowed above the buttons.
 *
 * Pointer parallax is written directly to CSS custom properties in a RAF loop, never
 * through React state — the hero must not re-render on mousemove.
 */
export default function Hero() {
  const { openBooking } = useBooking();
  const reduced = useReducedMotion();
  const fine = useMediaQuery('(pointer: fine)');
  const sectionRef = useRef(null);
  const pointer = useRef({ nx: 0.5, ny: 0.5 });

  useEffect(() => {
    const el = sectionRef.current;
    if (!el || reduced || !fine) return undefined;

    const state = { nx: 0.5, ny: 0.5 };
    let raf = 0;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      pointer.current.nx = (e.clientX - r.left) / r.width;
      pointer.current.ny = (e.clientY - r.top) / r.height;
    };

    const loop = () => {
      state.nx += (pointer.current.nx - state.nx) * 0.07;
      state.ny += (pointer.current.ny - state.ny) * 0.07;
      // -1..1, so the offsets read naturally in the stylesheet.
      el.style.setProperty('--px', (state.nx * 2 - 1).toFixed(4));
      el.style.setProperty('--py', (state.ny * 2 - 1).toFixed(4));
      raf = requestAnimationFrame(loop);
    };

    el.addEventListener('mousemove', onMove, { passive: true });
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      el.removeEventListener('mousemove', onMove);
    };
  }, [reduced, fine]);

  return (
    <section
      id="top"
      ref={sectionRef}
      className="relative isolate flex min-h-[100svh] flex-col justify-end overflow-hidden pt-[68px]"
      // The hero is bottom-aligned and full-height, so on mobile its last row would sit
      // under the fixed action bar. Body padding only clears the end of the document,
      // not a viewport-height section, so the bar height is added here too.
      style={{
        '--px': 0,
        '--py': 0,
        paddingBottom: 'calc(2.5rem + var(--bar-h))',
      }}
    >
      {/* Image layer. Scaled slightly past the frame so the parallax offset never
          exposes an edge. */}
      <div
        className="absolute inset-0 -z-10"
        style={{
          transform:
            'scale(1.06) translate3d(calc(var(--px) * -14px), calc(var(--py) * -14px), 0)',
        }}
      >
        <AssetImage
          assetKey="interior.master"
          className="h-full w-full"
          imgClassName="object-cover"
          sizes="100vw"
        />
      </div>

      {/* Legibility wash. Needed to hold 4.5:1 over a bright daylit photograph. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-gradient-to-t from-bone via-bone/85 to-bone/25"
      />

      {!reduced && fine && (
        <Suspense fallback={null}>
          <div className="absolute inset-0 -z-10">
            <HeroDepth pointer={pointer} />
          </div>
        </Suspense>
      )}

      <div className="shell relative w-full">
        <p className="eyebrow mb-5">
          {clinic.neighbourhood} · {clinic.city}
        </p>

        <h1
          className="display-xl max-w-[16ch]"
          style={{
            transform: 'translate3d(calc(var(--px) * 6px), calc(var(--py) * 4px), 0)',
          }}
        >
          <span className="block">Dentistry</span>
          <span className="block text-accent">without the wait.</span>
        </h1>

        <p className="mt-6 max-w-[46ch] text-[17px] leading-relaxed text-ink2 md:text-[19px]">
          {clinic.specialism} in {clinic.neighbourhood}. Scanned, not moulded — and most
          crowns are milled and fitted in a single visit.
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
          <button
            type="button"
            onClick={() => openBooking({ source: 'hero' })}
            className="btn-primary w-full sm:w-auto"
          >
            Book appointment
          </button>

          <a
            href={clinic.phone.href}
            onClick={() => track('call_click', { source: 'hero' })}
            className="btn-secondary w-full sm:w-auto"
          >
            Call {clinic.phone.display}
          </a>
        </div>

        {/* Micro-proof. Emergency availability is here, above the fold, not in the FAQ. */}
        <ul className="mt-7 flex flex-wrap gap-2">
          {[
            'New patients welcome',
            'Same-day emergency slots',
            'Most insurance accepted',
          ].map((chip) => (
            <li key={chip} className="chip">
              <Tick />
              {chip}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function Tick() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" aria-hidden="true" className="text-accent">
      <path
        d="M1.5 6.5 4.5 9.5 10.5 2.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
