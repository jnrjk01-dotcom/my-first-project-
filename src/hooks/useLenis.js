import { useEffect } from 'react';
import Lenis from 'lenis';
import { gsap, ScrollTrigger } from './useMotion';

/**
 * Lenis smooth scroll, driven off the GSAP ticker so ScrollTrigger and Lenis agree on
 * scroll position — running them on separate RAF loops makes pinned sections jitter.
 *
 * Disabled entirely under reduced motion: hijacking the scroll wheel is exactly the
 * kind of motion that setting is asking us not to do.
 */
export function useLenis(enabled) {
  useEffect(() => {
    if (!enabled) return undefined;

    const lenis = new Lenis({
      duration: 1.05,
      easing: (t) => Math.min(1, 1.001 - 2 ** (-10 * t)),
      smoothWheel: true,
      smoothTouch: false, // native momentum on touch is better than anything we'd fake
    });

    lenis.on('scroll', ScrollTrigger.update);

    const onTick = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(onTick);
    gsap.ticker.lagSmoothing(0);

    // Anchor links must still work with the scroll hijacked.
    const onClick = (e) => {
      const link = e.target.closest?.('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute('href');
      if (!id || id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -72 });
      // Move focus too, or keyboard users jump visually but not logically.
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    };

    document.addEventListener('click', onClick);

    return () => {
      document.removeEventListener('click', onClick);
      gsap.ticker.remove(onTick);
      lenis.destroy();
    };
  }, [enabled]);
}
