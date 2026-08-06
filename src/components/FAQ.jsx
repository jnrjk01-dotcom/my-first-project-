import { useEffect, useRef, useState } from 'react';
import { faqs } from '../data/faq';
import { useReducedMotion, useReveal, gsap } from '../hooks/useMotion';

/**
 * Single-open accordion with GSAP height animation.
 *
 * Height is animated to a measured 'auto' rather than a hardcoded value, so answers of
 * different lengths all land correctly, and the panel is left at `height: auto` when the
 * animation finishes so reflow (a resize, a font swap) does not clip it.
 *
 * Panels stay in the DOM whether open or closed. A closed panel is hidden with the
 * `hidden` attribute only after its collapse finishes, so the content is findable by
 * in-page search and readable with no JS at all.
 */
export default function FAQ() {
  const headRef = useReveal();
  const [openId, setOpenId] = useState(faqs[0]?.id ?? null);

  return (
    <section id="faq" className="section">
      <div className="shell grid gap-12 lg:grid-cols-12 lg:gap-16">
        <div ref={headRef} className="lg:col-span-4">
          <p className="eyebrow">Questions</p>
          <h2 className="display-lg mt-5">Before you call.</h2>
        </div>

        <div className="lg:col-span-7 lg:col-start-6">
          <ul className="border-t border-ink/10">
            {faqs.map((f) => (
              <FaqRow
                key={f.id}
                faq={f}
                isOpen={openId === f.id}
                onToggle={() => setOpenId((cur) => (cur === f.id ? null : f.id))}
              />
            ))}
          </ul>
        </div>
      </div>

      <FaqSchema />
    </section>
  );
}

function FaqRow({ faq, isOpen, onToggle }) {
  const panelRef = useRef(null);
  const reduced = useReducedMotion();
  const first = useRef(true);

  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return undefined;

    // Set the initial state without animating it.
    if (first.current) {
      first.current = false;
      if (!isOpen) {
        gsap.set(panel, { height: 0 });
        panel.hidden = true;
      } else {
        gsap.set(panel, { height: 'auto' });
      }
      return undefined;
    }

    if (reduced) {
      panel.hidden = !isOpen;
      gsap.set(panel, { height: isOpen ? 'auto' : 0 });
      return undefined;
    }

    let tween;
    if (isOpen) {
      panel.hidden = false;
      tween = gsap.fromTo(
        panel,
        { height: 0 },
        {
          height: 'auto',
          duration: 0.42,
          ease: 'power3.out',
          // Leave it at auto so later reflow cannot clip the answer.
          onComplete: () => gsap.set(panel, { height: 'auto' }),
        }
      );
    } else {
      tween = gsap.to(panel, {
        height: 0,
        duration: 0.32,
        ease: 'power3.inOut',
        onComplete: () => {
          panel.hidden = true;
        },
      });
    }

    return () => tween?.kill();
  }, [isOpen, reduced]);

  return (
    <li className="border-b border-ink/10">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={isOpen}
          aria-controls={`faq-panel-${faq.id}`}
          id={`faq-button-${faq.id}`}
          className="flex w-full items-start justify-between gap-6 py-5 text-left"
        >
          <span className="font-display text-[17px] leading-snug md:text-[19px]">{faq.q}</span>
          <span
            aria-hidden="true"
            className={`mt-1.5 shrink-0 transition-transform duration-300 ease-calm ${
              isOpen ? 'rotate-45' : ''
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" className="text-accent">
              <path d="M7 1v12M1 7h12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
        </button>
      </h3>

      <div
        ref={panelRef}
        id={`faq-panel-${faq.id}`}
        role="region"
        aria-labelledby={`faq-button-${faq.id}`}
        className="overflow-hidden"
      >
        <p className="max-w-[62ch] pb-6 pr-8 text-[15px] leading-relaxed text-ink2 md:text-[16px]">
          {faq.a}
        </p>
      </div>
    </li>
  );
}

/** FAQPage structured data, generated from the same source as the visible answers. */
function FaqSchema() {
  const json = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
