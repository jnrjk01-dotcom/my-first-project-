import {
  clinic,
  directionsUrl,
  formatHoursRow,
  fullAddress,
  mapEmbedUrl,
} from '../data/clinic';
import { track } from '../lib/track';
import { useReveal } from '../hooks/useMotion';
import AssetImage from './AssetImage';

/**
 * Contact and location.
 *
 * The arrival notes are here on purpose. Not knowing where to park, whether there is a
 * step, or which door is the right one is a real reason people put off an appointment —
 * so the entrance is described in plain words and shown as a photograph.
 *
 * The map is an OpenStreetMap embed, which needs no API key and sets no third-party
 * cookies. Swap for Google Maps if the clinic wants Street View; keep the accent marker
 * overlay and the directions link either way.
 */
export default function Contact() {
  const headRef = useReveal();

  return (
    <section id="contact" className="section bg-bone2">
      <div className="shell">
        <div ref={headRef} className="max-w-[52ch]">
          <p className="eyebrow">Find us</p>
          <h2 className="display-lg mt-5">{clinic.neighbourhood}.</h2>
        </div>

        <div className="mt-14 grid gap-10 lg:grid-cols-2 lg:gap-14">
          {/* Left — the facts */}
          <div>
            <address className="not-italic">
              <p className="font-display text-[19px] leading-snug">
                {clinic.address.line1}
                <br />
                {clinic.address.line2}
                <br />
                {clinic.address.city}, {clinic.address.region} {clinic.address.postalCode}
              </p>

              <p className="mt-5 flex flex-col gap-1.5 text-[16px]">
                <a
                  href={clinic.phone.href}
                  onClick={() => track('call_click', { source: 'contact' })}
                  className="text-accent underline underline-offset-4"
                >
                  {clinic.phone.display}
                </a>
                <a
                  href={`mailto:${clinic.email}`}
                  className="text-accent underline underline-offset-4"
                >
                  {clinic.email}
                </a>
              </p>
            </address>

            <table className="mt-9 w-full max-w-md border-collapse text-[15px]">
              <caption className="mb-3 text-left font-display text-[15px]">Opening hours</caption>
              <tbody>
                {clinic.hours.map((row) => (
                  <tr key={row.day} className="border-b border-ink/10">
                    <th scope="row" className="py-2.5 text-left font-normal text-ink2">
                      {row.day}
                    </th>
                    <td className="py-2.5 text-right font-display">{formatHoursRow(row)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <p className="mt-4 text-[14px] text-accent">{clinic.emergency}</p>

            <div className="mt-10 space-y-6">
              <Note title="Getting here">
                Metered street parking on NW Marshall, and a paid garage on the corner of
                14th, about two minutes on foot. The 77 bus stops one block north, and it
                is a nine-minute walk from the NW 12th &amp; Lovejoy streetcar stop.
              </Note>

              <Note title="Access">
                The entrance is flush with the pavement, with no step and no ramp needed.
                Doors are 900mm wide. There is a lift to the first floor and an accessible
                toilet on the ground floor. If you need a ground-floor treatment room, say
                so when you book and we will allocate one.
              </Note>

              <Note title="What the entrance looks like">
                A plain glazed door under a flat canopy, between a bakery and a bike shop.
                There is no big sign. Press the buzzer marked Suite 200, or walk straight in
                during opening hours — reception is immediately on your left.
              </Note>
            </div>

            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => track('directions_click', { source: 'contact' })}
              className="btn-primary mt-9"
            >
              Get directions
              <span className="sr-only"> (opens in a new tab)</span>
            </a>
          </div>

          {/* Right — map and the entrance photograph */}
          <div className="space-y-4">
            <div className="relative overflow-hidden rounded-softer border border-ink/[0.08]">
              <iframe
                title={`Map showing ${clinic.name} at ${fullAddress}`}
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="aspect-[4/3] w-full grayscale-[0.35]"
              />

              {/* Custom accent marker, drawn over the embed. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full"
              >
                <svg width="34" height="44" viewBox="0 0 34 44" fill="none">
                  <path
                    d="M17 43s14-15.4 14-25A14 14 0 1 0 3 18c0 9.6 14 25 14 25Z"
                    fill="#0E5C5C"
                    stroke="#fff"
                    strokeWidth="2"
                  />
                  <circle cx="17" cy="17" r="5" fill="#fff" />
                </svg>
              </span>
            </div>

            <AssetImage
              assetKey="interior.entrance"
              className="rounded-softer border border-ink/[0.08]"
              sizes="(max-width: 1024px) 100vw, 46vw"
            />
          </div>
        </div>
      </div>

      <LocalBusinessSchema />
    </section>
  );
}

function Note({ title, children }) {
  return (
    <div>
      <h3 className="font-display text-[15px]">{title}</h3>
      <p className="mt-2 max-w-[58ch] text-[15px] leading-relaxed text-ink2">{children}</p>
    </div>
  );
}

/** Dentist (a LocalBusiness subtype) structured data, built from the clinic record. */
function LocalBusinessSchema() {
  const DAY = {
    Monday: 'Mo', Tuesday: 'Tu', Wednesday: 'We', Thursday: 'Th',
    Friday: 'Fr', Saturday: 'Sa', Sunday: 'Su',
  };

  const json = {
    '@context': 'https://schema.org',
    '@type': 'Dentist',
    name: clinic.name,
    description: `${clinic.specialism} in ${clinic.neighbourhood}, ${clinic.city}.`,
    telephone: clinic.phone.display,
    email: clinic.email,
    address: {
      '@type': 'PostalAddress',
      streetAddress: [clinic.address.line1, clinic.address.line2].filter(Boolean).join(', '),
      addressLocality: clinic.address.city,
      addressRegion: clinic.address.region,
      postalCode: clinic.address.postalCode,
      addressCountry: clinic.address.country,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: clinic.geo.lat,
      longitude: clinic.geo.lng,
    },
    openingHoursSpecification: clinic.hours
      .filter((h) => h.open)
      .map((h) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: `https://schema.org/${h.day}`,
        opens: h.open,
        closes: h.close,
      })),
    // NOTE: aggregateRating is intentionally omitted. Publishing a rating in structured
    // data requires it to be genuine and verifiable — add it only once the figures in
    // clinic.figures are the practice's real, current review numbers.
    hasMap: directionsUrl,
    isAcceptingNewPatients: true,
    availableService: [
      { '@type': 'MedicalProcedure', name: 'General dentistry' },
      { '@type': 'MedicalProcedure', name: 'Cosmetic dentistry' },
      { '@type': 'MedicalProcedure', name: 'Dental implants' },
      { '@type': 'MedicalProcedure', name: 'Clear aligners' },
      { '@type': 'MedicalProcedure', name: 'Emergency dental care' },
    ],
    dayOfWeek: Object.values(DAY),
  };

  return (
    <script
      type="application/ld+json"
      // eslint-disable-next-line react/no-danger
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
