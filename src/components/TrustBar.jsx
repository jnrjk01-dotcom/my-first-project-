import { clinic } from '../data/clinic';
import { useCountUp } from '../hooks/useMotion';

/**
 * Thin strip under the hero. Four figures, counted up on enter.
 * Small and factual by instruction — no icon is larger than the number beside it.
 */
export default function TrustBar() {
  return (
    <section aria-label="Practice at a glance" className="border-y border-ink/[0.08] bg-bone2">
      <div className="shell grid grid-cols-2 divide-ink/[0.08] py-8 sm:grid-cols-4 sm:divide-x md:py-10">
        {clinic.figures.map((f, i) => (
          <Figure key={f.label} {...f} className={i < 2 ? 'max-sm:border-b max-sm:border-ink/[0.08] max-sm:pb-5' : 'max-sm:pt-5'} />
        ))}
      </div>
    </section>
  );
}

function Figure({ value, decimals = 0, suffix = '', label, sub, className = '' }) {
  const ref = useCountUp(value, { decimals });

  return (
    <div className={`px-0 sm:px-6 sm:first:pl-0 sm:last:pr-0 ${className}`}>
      <div className="font-display text-[34px] leading-none tracking-[-0.04em] md:text-[44px]">
        {/* Server-rendered fallback is the real number, so a JS failure shows the
            figure rather than a zero. */}
        <span ref={ref}>{decimals > 0 ? value.toFixed(decimals) : value.toLocaleString('en-US')}</span>
        {suffix}
      </div>
      <div className="mt-2 text-[13px] text-ink2">{label}</div>
      {sub && <div className="mt-0.5 text-[12px] text-muted">{sub}</div>}
    </div>
  );
}
