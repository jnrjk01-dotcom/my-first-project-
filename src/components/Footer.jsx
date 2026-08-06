import { clinic, formatHoursRow } from '../data/clinic';
import { useBooking } from '../lib/BookingContext';
import { track } from '../lib/track';
import Logo from './Logo';

export default function Footer() {
  const { openBooking } = useBooking();
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-ink/10 bg-bone">
      <div className="shell py-14 md:py-16">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <a href="#top" className="flex items-center gap-2.5">
              <Logo className="h-6 w-6 text-accent" />
              <span className="font-display text-[17px] tracking-[-0.02em]">
                {clinic.name.toUpperCase()}
              </span>
            </a>
            <p className="mt-4 max-w-[34ch] text-[14px] leading-relaxed text-ink2">
              {clinic.specialism} in {clinic.neighbourhood}, {clinic.city}.
            </p>

            <button
              type="button"
              onClick={() => openBooking({ source: 'footer' })}
              className="btn-primary mt-6"
            >
              Book appointment
            </button>
          </div>

          <nav aria-label="Footer" className="md:col-span-3">
            <h2 className="eyebrow">Site</h2>
            <ul className="mt-4 space-y-2 text-[15px]">
              {[
                ['#services', 'Services'],
                ['#the-visit', 'The visit'],
                ['#gallery', 'Smile gallery'],
                ['#dentists', 'Dentists'],
                ['#insurance', 'Insurance'],
                ['#faq', 'FAQ'],
                ['#booking', 'Book'],
              ].map(([href, label]) => (
                <li key={href}>
                  <a href={href} className="text-ink2 transition-colors hover:text-ink">
                    {label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="md:col-span-2">
            <h2 className="eyebrow">Hours</h2>
            <ul className="mt-4 space-y-1.5 text-[14px] text-ink2">
              {clinic.hours.map((h) => (
                <li key={h.day} className="flex justify-between gap-3">
                  <span>{h.day.slice(0, 3)}</span>
                  <span className="text-right">{formatHoursRow(h)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h2 className="eyebrow">Contact</h2>
            <address className="mt-4 space-y-1.5 not-italic text-[15px] text-ink2">
              <p>
                {clinic.address.line1}
                <br />
                {clinic.address.line2}
                <br />
                {clinic.address.city}, {clinic.address.region} {clinic.address.postalCode}
              </p>
              <p>
                <a
                  href={clinic.phone.href}
                  onClick={() => track('call_click', { source: 'footer' })}
                  className="text-accent underline underline-offset-4"
                >
                  {clinic.phone.display}
                </a>
              </p>
              <p>
                <a href={`mailto:${clinic.email}`} className="text-accent underline underline-offset-4">
                  {clinic.email}
                </a>
              </p>
            </address>

            <ul className="mt-5 flex gap-4 text-[14px]">
              {clinic.social.map((s) => (
                <li key={s.label}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-ink2 underline underline-offset-4 transition-colors hover:text-ink"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rule my-10" />

        {/* Consent and privacy note. Required on the page, not buried in a policy PDF. */}
        <p className="max-w-[76ch] text-[12px] leading-relaxed text-muted">
          Before-and-after images and patient reviews on this site are published only with
          the written consent of the people concerned, and are individual cases rather than
          a prediction of your result. We do not collect medical information through this
          website. Enquiries sent through the booking form are used to arrange your
          appointment and nothing else.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-muted">
          <span>
            © {year} {clinic.name}
          </span>
          <a href={clinic.legal.privacyUrl} className="underline underline-offset-4 hover:text-ink">
            Privacy Policy
          </a>
          <a href={clinic.legal.accessibilityUrl} className="underline underline-offset-4 hover:text-ink">
            Accessibility Statement
          </a>
        </div>
      </div>
    </footer>
  );
}
