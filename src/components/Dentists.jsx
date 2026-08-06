import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { dentists } from '../data/dentists';
import { useBooking } from '../lib/BookingContext';
import { useReducedMotion, useReveal } from '../hooks/useMotion';
import AssetImage from './AssetImage';

/**
 * Four portraits in a tight grid.
 *
 * The hover layer is progressive enhancement only — every fact it reveals is also in
 * the bio panel, which opens on click and works from the keyboard. Nothing is available
 * to a mouse that is not available without one.
 */
export default function Dentists() {
  const headRef = useReveal();
  const [openId, setOpenId] = useState(null);
  const reduced = useReducedMotion();

  const open = dentists.find((d) => d.id === openId) ?? null;

  return (
    <section id="dentists" className="section">
      <div className="shell">
        <div ref={headRef} className="max-w-[52ch]">
          <p className="eyebrow">The team</p>
          <h2 className="display-lg mt-5">Meet the dentists.</h2>
          <p className="mt-6 text-[16px] leading-relaxed text-ink2 md:text-[17px]">
            You can ask for the same dentist every time. Say who when you book.
          </p>
        </div>

        <ul className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
          {dentists.map((d) => (
            <li key={d.id}>
              <DentistCard
                dentist={d}
                isOpen={openId === d.id}
                onToggle={() => setOpenId((cur) => (cur === d.id ? null : d.id))}
              />
            </li>
          ))}
        </ul>

        <AnimatePresence initial={false} mode="wait">
          {open && (
            <motion.div
              key={open.id}
              id={`bio-${open.id}`}
              initial={reduced ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={{ duration: reduced ? 0 : 0.42, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <BioPanel dentist={open} onClose={() => setOpenId(null)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}

function DentistCard({ dentist, isOpen, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={isOpen}
      aria-controls={`bio-${dentist.id}`}
      className={`group block w-full overflow-hidden rounded-soft text-left transition-colors duration-300 ease-calm ${
        isOpen ? 'ring-2 ring-accent' : ''
      }`}
    >
      <div className="relative">
        <AssetImage
          assetKey={dentist.portrait}
          className="w-full"
          alt={`${dentist.name}, ${dentist.role} at the practice.`}
          sizes="(max-width: 640px) 50vw, 25vw"
        />

        {/* Hover / focus reveal. Hidden from assistive tech because the bio panel is
            the accessible route to the same information. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-ink/92 via-ink/45 to-transparent p-4 opacity-0 transition-opacity duration-300 ease-calm group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <p className="font-display text-[12px] text-bone/95">{dentist.credentials}</p>
          <p className="mt-1 text-[12px] text-bone/75">
            {dentist.years} years · {dentist.specialism}
          </p>
          <p className="mt-1 text-[12px] text-bone/75">{dentist.languages.join(', ')}</p>
          <p className="mt-2 border-t border-bone/20 pt-2 text-[12px] leading-snug text-bone/70">
            {dentist.human}
          </p>
        </div>
      </div>

      <div className="pt-3">
        <h3 className="font-display text-[16px] leading-tight">{dentist.name}</h3>
        <p className="mt-0.5 text-[13px] text-muted">{dentist.role}</p>
      </div>
    </button>
  );
}

function BioPanel({ dentist, onClose }) {
  const { openBooking } = useBooking();

  return (
    <div className="mt-8 rounded-softer border border-ink/[0.08] bg-white p-6 md:p-10">
      <div className="grid gap-8 md:grid-cols-12">
        <div className="md:col-span-7">
          <h3 className="display-md">{dentist.name}</h3>
          <p className="mt-2 text-[14px] text-muted">
            {dentist.role} · {dentist.credentials}
          </p>

          <div className="mt-6 space-y-4 text-[16px] leading-relaxed text-ink2">
            {dentist.bio.map((p) => (
              <p key={p}>{p}</p>
            ))}
          </div>
        </div>

        <dl className="space-y-4 text-[14px] md:col-span-4 md:col-start-9">
          <Row label="Years practising" value={`${dentist.years}`} />
          <Row label="Specialism" value={dentist.specialism} />
          <Row label="Languages" value={dentist.languages.join(', ')} />
          <Row label="Also" value={dentist.human} />
        </dl>
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            openBooking({ source: `dentist:${dentist.id}`, dentistId: dentist.id })
          }
          className="btn-primary"
        >
          Book with {dentist.name.split(' ').slice(0, 2).join(' ')}
        </button>
        <button type="button" onClick={onClose} className="btn-secondary">
          Close
        </button>
      </div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="border-t border-ink/10 pt-3">
      <dt className="text-[12px] uppercase tracking-[0.14em] text-muted">{label}</dt>
      <dd className="mt-1 leading-snug">{value}</dd>
    </div>
  );
}
