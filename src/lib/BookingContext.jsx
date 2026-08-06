import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { track } from './track';

/**
 * Lets any section pre-fill and jump to the booking form — "Book this" on a service
 * card, "Book with Dr Hallam" on a bio, "Check my coverage" in Insurance.
 *
 * The booking form is a real section on the page, not a modal, so this only seeds
 * state and scrolls. Nothing gets trapped and the back button keeps working.
 */

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [prefill, setPrefill] = useState({ serviceId: '', dentistId: '', note: '' });

  const openBooking = useCallback((opts = {}) => {
    const { source = 'unknown', serviceId = '', dentistId = '', note = '' } = opts;

    setPrefill((prev) => ({
      serviceId: serviceId || prev.serviceId,
      dentistId: dentistId || prev.dentistId,
      note: note || prev.note,
    }));

    track('book_click', { source });

    const target = document.getElementById('booking');
    if (!target) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduced ? 'auto' : 'smooth', block: 'start' });

    // Send focus to the section heading so keyboard and screen reader users land
    // where sighted users just got scrolled to.
    const heading = target.querySelector('h2');
    if (heading) {
      heading.setAttribute('tabindex', '-1');
      heading.focus({ preventScroll: true });
    }
  }, []);

  const value = useMemo(() => ({ prefill, openBooking }), [prefill, openBooking]);

  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}

export function useBooking() {
  const ctx = useContext(BookingContext);
  if (!ctx) throw new Error('useBooking must be used inside <BookingProvider>');
  return ctx;
}
