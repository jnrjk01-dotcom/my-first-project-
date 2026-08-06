import { useEffect, useRef, useState } from 'react';
import { VISIT_CARDS, VISIT_VIDEO } from '../data/assets';
import { useBooking } from '../lib/BookingContext';
import { useMediaQuery, useReducedMotion, gsap } from '../hooks/useMotion';

/**
 * THE VISIT — pinned video reveal.
 *
 * Two independent systems, deliberately not connected to each other:
 *
 *   1. SCROLL controls the FRAME. Pinning, the scale-snap from a small framed element
 *      to full-bleed, the headline halves pushing apart, the accent line.
 *   2. THE VIDEO controls the TEXT. The overlay data card is switched from the video's
 *      own `timeupdate` at the known clip boundaries.
 *
 * The footage is never seeked and playback is never tied to scroll position.
 * `currentTime` is read, never assigned. Driving cards from scroll progress would look
 * fine on a slow deliberate scroll and drift badly on every other one, because playback
 * runs at its own rate regardless of how fast someone is scrolling past.
 *
 * Under 768px the section unpins entirely: the video plays inline at full width with
 * the card stacked beneath it, same `timeupdate` sync, no scale-snap.
 */
export default function TheVisit() {
  const { openBooking } = useBooking();
  const reduced = useReducedMotion();
  const desktop = useMediaQuery('(min-width: 768px)');

  // The scale-snap is the only thing reduced motion removes here. The sequence itself
  // still plays, because it is content.
  const pinned = desktop && !reduced;

  const sectionRef = useRef(null);
  const frameRef = useRef(null);
  const headTopRef = useRef(null);
  const headBottomRef = useRef(null);
  const lineRef = useRef(null);
  const videoRef = useRef(null);

  const [cut, setCut] = useState(0);
  const videoReady = VISIT_VIDEO.status === 'ready';

  // ── The video drives the cards ────────────────────────────────────────────
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoReady) return undefined;

    const bounds = VISIT_VIDEO.clips.map((c) => c.startsAt);

    const onTimeUpdate = () => {
      const t = video.currentTime; // read only — never assigned
      let i = 0;
      for (let k = 0; k < bounds.length; k += 1) {
        if (t >= bounds[k]) i = k;
      }
      setCut((prev) => (prev === i ? prev : i));
    };

    video.addEventListener('timeupdate', onTimeUpdate);
    // Loop restarts fire `seeked`, not necessarily a timely `timeupdate`.
    video.addEventListener('play', onTimeUpdate);

    return () => {
      video.removeEventListener('timeupdate', onTimeUpdate);
      video.removeEventListener('play', onTimeUpdate);
    };
  }, [videoReady]);

  // Autoplay can be refused (low power mode, data saver). Nothing breaks if it is —
  // the poster stays up and the controls below let the visitor start it.
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !videoReady) return;
    const attempt = video.play();
    if (attempt?.catch) attempt.catch(() => {});
  }, [videoReady]);

  // ── Scroll drives the frame ───────────────────────────────────────────────
  useEffect(() => {
    if (!pinned) return undefined;

    const section = sectionRef.current;
    if (!section) return undefined;

    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          // Long pin: the snap happens early, then the section holds while the edit
          // plays its full run of cuts before scroll is released.
          end: '+=260%',
          pin: true,
          scrub: 0.35,
          anticipatePin: 1,
        },
      });

      // Snap, not grow: the whole expansion is spent in the first 18% of the pin and
      // eased so most of the movement lands in a fraction of that.
      tl.fromTo(
        frameRef.current,
        { width: '44vw', height: '24.75vw', borderRadius: 14 },
        {
          width: '100vw',
          height: '100svh',
          borderRadius: 0,
          duration: 0.18,
          ease: 'expo.inOut',
        },
        0
      )
        .fromTo(
          headTopRef.current,
          { yPercent: 0, opacity: 1 },
          { yPercent: -140, opacity: 0.92, duration: 0.18, ease: 'expo.inOut' },
          0
        )
        .fromTo(
          headBottomRef.current,
          { yPercent: 0, opacity: 1 },
          { yPercent: 140, opacity: 0.92, duration: 0.18, ease: 'expo.inOut' },
          0
        )
        .fromTo(
          lineRef.current,
          { scaleX: 0.12 },
          { scaleX: 1, duration: 0.18, ease: 'expo.inOut' },
          0
        )
        // Hold. This empty span is what keeps the section pinned while the footage runs.
        .to({}, { duration: 0.82 });
    }, section);

    return () => ctx.revert();
  }, [pinned]);

  const card = VISIT_CARDS[cut];

  return (
    <section
      id="the-visit"
      ref={sectionRef}
      className="relative isolate overflow-hidden bg-ink text-bone"
    >
      <div
        className={
          pinned
            ? 'relative flex h-[100svh] flex-col items-center justify-center'
            : 'relative flex flex-col py-20 md:py-28'
        }
      >
        {/* Headline, top half. Split above and below the frame so type never collides
            with the footage. */}
        <div
          ref={headTopRef}
          className={pinned ? 'pointer-events-none absolute inset-x-0 top-[12vh] z-20 text-center' : 'shell mb-8'}
        >
          <p className="eyebrow text-bone/55">The visit</p>
          {/* The headline is one sentence split above and below the video frame. It is
              a single h2 for the document outline, read out whole; the two visible
              halves are presentational so the heading is not announced twice. */}
          <h2 className="sr-only">One appointment, start to finish.</h2>
          <p aria-hidden="true" className="display-lg mt-4 text-bone">
            One appointment,
          </p>
        </div>

        {/* The frame. On desktop this is what the scroll animates. */}
        <div
          ref={frameRef}
          className={`relative z-10 overflow-hidden bg-black ${
            pinned ? '' : 'aspect-video w-full'
          }`}
          style={pinned ? { width: '44vw', height: '24.75vw', borderRadius: 14 } : undefined}
        >
          {videoReady ? (
            <video
              ref={videoRef}
              className="h-full w-full object-cover"
              src={VISIT_VIDEO.src}
              poster={VISIT_VIDEO.poster}
              preload="metadata"
              autoPlay
              muted
              loop
              playsInline
              // Decorative-adjacent, but it carries information, so it is described.
              aria-label="A walk through one appointment: arrival, consultation, treatment, and the finished result."
            />
          ) : (
            <PendingFrame />
          )}

          {/* Overlay data card, bottom-left, inside the frame on desktop. */}
          {videoReady && pinned && (
            <DataCard card={card} className="absolute bottom-8 left-8 z-20" />
          )}
        </div>

        {/* Thin accent line tracking the expansion. */}
        <div
          ref={lineRef}
          aria-hidden="true"
          className={`z-20 h-px w-full origin-center bg-accentHi ${
            pinned ? 'absolute inset-x-0 top-1/2' : 'my-6'
          }`}
        />

        {/* Headline, bottom half. */}
        <div
          ref={headBottomRef}
          className={
            pinned
              ? 'pointer-events-none absolute inset-x-0 bottom-[12vh] z-20 text-center'
              : 'shell'
          }
        >
          <p aria-hidden="true" className="display-lg text-accentHi">
            start to finish.
          </p>
        </div>

        {/* Mobile and reduced-motion: the card stacks beneath the video, same sync. */}
        {!pinned && (
          <div className="shell mt-8">
            {videoReady ? (
              <DataCard card={card} />
            ) : (
              <ol className="grid gap-4 sm:grid-cols-2">
                {VISIT_CARDS.map((c) => (
                  <li key={c.n}>
                    <DataCard card={c} />
                  </li>
                ))}
              </ol>
            )}
          </div>
        )}
      </div>

      {/* Closing CTA. The visitor is warmest here. */}
      <div className="shell relative z-20 pb-20 pt-4 text-center md:pb-28">
        <button
          type="button"
          onClick={() => openBooking({ source: 'the_visit' })}
          className="btn-onaccent"
        >
          Book appointment
        </button>
      </div>

      {/* The four cuts, always in the DOM for assistive tech and for a no-JS visit.
          Visually hidden because the same content is shown in the card above. */}
      <ol className="sr-only">
        {VISIT_CARDS.map((c) => (
          <li key={c.n}>
            {c.label}: {c.figure}. {c.line}
          </li>
        ))}
      </ol>
    </section>
  );
}

/**
 * One cut's information. The card is swapped wholesale as the footage cuts — hard and
 * fast, no crossfade, matching the edit.
 *
 * aria-live is intentionally omitted: this changes every 4.5 seconds on a loop, and
 * announcing it would make the page unusable with a screen reader. The same content is
 * available as a static list at the end of the section.
 */
function DataCard({ card, className = '' }) {
  return (
    <div
      key={card.n}
      className={`w-[min(320px,80vw)] rounded-soft bg-ink/70 p-5 backdrop-blur-sm ${className}`}
    >
      <div className="font-display text-[11px] tracking-[0.2em] text-accentHi">
        {card.n} / 04
      </div>
      <div className="mt-3 font-display text-[11px] uppercase tracking-[0.28em] text-bone/60">
        {card.label}
      </div>
      <div className="mt-1.5 font-display text-[40px] leading-none tracking-[-0.04em] text-bone">
        {card.figure}
      </div>
      <p className="mt-3 text-[13px] leading-snug text-bone/70">{card.line}</p>
    </div>
  );
}

function PendingFrame() {
  return (
    <div
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-ink2/40 text-center"
      data-asset-pending="video.the-visit"
    >
      <span className="font-display text-[10px] uppercase tracking-[0.22em] text-accentHi">
        Awaiting asset
      </span>
      <span className="font-mono text-[11px] text-bone/50">{VISIT_VIDEO.src}</span>
    </div>
  );
}
