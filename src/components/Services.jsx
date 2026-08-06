import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { services } from '../data/services';
import { useBooking } from '../lib/BookingContext';
import { useMediaQuery, useReducedMotion, useReveal, gsap } from '../hooks/useMotion';
import AssetImage from './AssetImage';

/**
 * Asymmetric service grid.
 *
 * Cards expand in place — no route change, and no modal, so nothing traps focus and
 * the back button is never hijacked. Expansion is a plain disclosure: the trigger is a
 * <button> with aria-expanded/aria-controls, and the panel is a sibling region.
 */
export default function Services() {
  const headRef = useReveal();
  const [openId, setOpenId] = useState(null);

  return (
    <section id="services" className="section relative overflow-hidden">
      <FloatingCutouts />

      <div className="shell relative">
        <div ref={headRef} className="max-w-[52ch]">
          <p className="eyebrow">Treatments</p>
          <h2 className="display-lg mt-5">What we do, and what it costs.</h2>
          <p className="mt-6 text-[16px] leading-relaxed text-ink2 md:text-[17px]">
            Prices below are starting figures. You get a written estimate before anything
            begins, and it holds for 90 days.
          </p>
        </div>

        <ul className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              isOpen={openId === service.id}
              onToggle={() => setOpenId((cur) => (cur === service.id ? null : service.id))}
            />
          ))}
        </ul>
      </div>
    </section>
  );
}

function ServiceCard({ service, isOpen, onToggle }) {
  const { openBooking } = useBooking();
  const reduced = useReducedMotion();
  const fine = useMediaQuery('(pointer: fine)');
  const cardRef = useRef(null);
  const panelId = `service-panel-${service.id}`;

  // 3D tilt on hover. Pointer devices only, and off under reduced motion.
  useEffect(() => {
    const el = cardRef.current;
    if (!el || reduced || !fine) return undefined;

    const onMove = (e) => {
      const r = el.getBoundingClientRect();
      const nx = (e.clientX - r.left) / r.width - 0.5;
      const ny = (e.clientY - r.top) / r.height - 0.5;
      gsap.to(el, {
        rotateY: nx * 7,
        rotateX: -ny * 7,
        duration: 0.5,
        ease: 'power3.out',
        transformPerspective: 900,
      });
    };

    const onLeave = () => {
      gsap.to(el, { rotateX: 0, rotateY: 0, duration: 0.6, ease: 'power3.out' });
    };

    el.addEventListener('mousemove', onMove);
    el.addEventListener('mouseleave', onLeave);
    return () => {
      el.removeEventListener('mousemove', onMove);
      el.removeEventListener('mouseleave', onLeave);
    };
  }, [reduced, fine]);

  const wide = service.span === 'wide';

  return (
    <li className={wide ? 'lg:col-span-2' : ''}>
      <div
        ref={cardRef}
        className={`card h-full p-6 transition-colors duration-300 ease-calm md:p-7 ${
          isOpen ? 'border-accent/40' : 'hover:border-ink/20'
        }`}
        style={{ transformStyle: 'preserve-3d' }}
      >
        <div className="flex items-start justify-between gap-4">
          <h3 className="display-md max-w-[16ch]">{service.name}</h3>
          {service.urgent && (
            <span className="shrink-0 rounded-full bg-accent/10 px-2.5 py-1 font-display text-[11px] uppercase tracking-[0.14em] text-accent">
              Same day
            </span>
          )}
        </div>

        <p className="mt-3.5 text-[15px] leading-relaxed text-ink2">{service.blurb}</p>

        <dl className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2 text-[13px]">
          <div className="flex items-baseline gap-2">
            <dt className="text-muted">Typical</dt>
            <dd className="font-display">{service.duration}</dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="text-muted">Cost</dt>
            <dd className="font-display">{service.price}</dd>
          </div>
        </dl>

        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={panelId}
          className="mt-6 inline-flex items-center gap-2 font-display text-[14px] text-accent"
        >
          {isOpen ? 'Close' : 'What happens'}
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            aria-hidden="true"
            className={`transition-transform duration-300 ease-calm ${isOpen ? 'rotate-45' : ''}`}
          >
            <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
        </button>

        <AnimatePresence initial={false}>
          {isOpen && (
            <motion.div
              id={panelId}
              key="panel"
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <div className="pt-6">
                <div className="rule mb-6" />
                <ul className="space-y-3 text-[15px] leading-relaxed text-ink2">
                  {service.detail.map((line) => (
                    <li key={line} className="flex gap-3">
                      <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-accent" />
                      {line}
                    </li>
                  ))}
                </ul>

                <button
                  type="button"
                  onClick={() =>
                    openBooking({ source: `service:${service.id}`, serviceId: service.id })
                  }
                  className="btn-primary mt-6 w-full sm:w-auto"
                >
                  Book this
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </li>
  );
}

/**
 * The two background-removed cutouts, floating behind the grid with a slow parallax.
 * Purely decorative: aria-hidden, and skipped under reduced motion.
 */
function FloatingCutouts() {
  const reduced = useReducedMotion();
  const wrapRef = useRef(null);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el || reduced) return undefined;

    const ctx = gsap.context(() => {
      gsap.to('[data-float="chair"]', {
        yPercent: -22,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      });
      gsap.to('[data-float="scanner"]', {
        yPercent: -38,
        ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: 0.6 },
      });
    }, el);

    return () => ctx.revert();
  }, [reduced]);

  return (
    <div ref={wrapRef} aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10">
      <div
        data-float="chair"
        className="absolute -left-24 top-[18%] w-[280px] opacity-[0.13] md:w-[420px] lg:-left-16"
      >
        <AssetImage assetKey="cutout.chair" className="w-full" />
      </div>
      <div
        data-float="scanner"
        className="absolute -right-16 bottom-[8%] w-[200px] opacity-[0.13] md:w-[300px]"
      >
        <AssetImage assetKey="cutout.scanner" className="w-full" />
      </div>
    </div>
  );
}
