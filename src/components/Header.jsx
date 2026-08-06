import { useEffect, useState } from 'react';
import { clinic } from '../data/clinic';
import { useBooking } from '../lib/BookingContext';
import { track } from '../lib/track';
import Logo from './Logo';

const NAV = [
  { href: '#services', label: 'Services' },
  { href: '#the-visit', label: 'The visit' },
  { href: '#dentists', label: 'Dentists' },
  { href: '#insurance', label: 'Insurance' },
  { href: '#faq', label: 'FAQ' },
  { href: '#contact', label: 'Contact' },
];

export default function Header() {
  const { openBooking } = useBooking();
  const [solid, setSolid] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on Escape, and return focus sensibly.
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ease-calm ${
        solid ? 'bg-bone/90 backdrop-blur-md border-b border-ink/[0.08]' : 'bg-transparent'
      }`}
    >
      <a
        href="#main"
        className="sr-only-focusable absolute left-4 top-3 z-10 rounded-full bg-accent px-4 py-2 text-white"
      >
        Skip to content
      </a>

      <div className="shell flex h-[68px] items-center justify-between gap-6">
        <a href="#top" className="flex items-center gap-2.5" aria-label={`${clinic.name} — home`}>
          <Logo className="h-6 w-6 text-accent" />
          <span className="font-display text-[17px] tracking-[-0.02em]">
            {clinic.name.toUpperCase()}
          </span>
        </a>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-7">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  className="text-[14px] text-ink2 transition-colors hover:text-ink"
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <a
            href={clinic.phone.href}
            onClick={() => track('call_click', { source: 'header' })}
            className="hidden font-display text-[14px] text-ink transition-colors hover:text-accent md:inline"
          >
            {clinic.phone.display}
          </a>

          <button
            type="button"
            onClick={() => openBooking({ source: 'header' })}
            className="btn-primary hidden px-5 py-2.5 text-[14px] sm:inline-flex"
          >
            Book appointment
          </button>

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 lg:hidden"
          >
            <span className="sr-only">{menuOpen ? 'Close menu' : 'Open menu'}</span>
            <svg width="18" height="14" viewBox="0 0 18 14" aria-hidden="true">
              {menuOpen ? (
                <g stroke="currentColor" strokeWidth="1.6">
                  <line x1="2" y1="2" x2="16" y2="12" />
                  <line x1="16" y1="2" x2="2" y2="12" />
                </g>
              ) : (
                <g stroke="currentColor" strokeWidth="1.6">
                  <line x1="0" y1="2" x2="18" y2="2" />
                  <line x1="0" y1="7" x2="18" y2="7" />
                  <line x1="0" y1="12" x2="18" y2="12" />
                </g>
              )}
            </svg>
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav
          id="mobile-nav"
          aria-label="Main"
          className="border-t border-ink/[0.08] bg-bone/97 backdrop-blur-md lg:hidden"
        >
          <ul className="shell grid gap-1 py-4">
            {NAV.map((item) => (
              <li key={item.href}>
                <a
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-2.5 font-display text-[19px]"
                >
                  {item.label}
                </a>
              </li>
            ))}
            <li className="pt-3">
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  openBooking({ source: 'mobile_menu' });
                }}
                className="btn-primary w-full"
              >
                Book appointment
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
