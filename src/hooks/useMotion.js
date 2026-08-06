import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

/**
 * Live `prefers-reduced-motion`. Reads at mount and keeps listening, because the OS
 * setting can change mid-session and a reveal that never fires would leave content
 * permanently invisible.
 */
export function useReducedMotion() {
  const [reduced, setReduced] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onChange = (e) => setReduced(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

/** Matches a media query. Used to gate desktop-only behaviour (cursor, pinning). */
export function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false;
    return window.matchMedia(query).matches;
  });

  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/**
 * Scroll-triggered reveal.
 *
 * Content is visible in the DOM from the start and only *offset* by the animation, so
 * a JS failure or a blocked bundle leaves a completely readable page. Under reduced
 * motion the element is snapped to its final state immediately.
 */
export function useReveal(options = {}) {
  const { y = 24, delay = 0, duration = 0.7, start = 'top 85%' } = options;
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    if (reduced) {
      gsap.set(el, { opacity: 1, y: 0 });
      return undefined;
    }

    const ctx = gsap.context(() => {
      gsap.fromTo(
        el,
        { opacity: 0, y },
        {
          opacity: 1,
          y: 0,
          duration,
          delay,
          ease: 'power3.out',
          scrollTrigger: { trigger: el, start, once: true },
        }
      );
    }, el);

    return () => ctx.revert();
  }, [reduced, y, delay, duration, start]);

  return ref;
}

/**
 * Counts a figure up when it scrolls into view. Renders the final value immediately
 * under reduced motion, and the final value is always the DOM text on completion so
 * assistive tech never reads a half-counted number.
 */
export function useCountUp(target, { decimals = 0, duration = 1.6 } = {}) {
  const ref = useRef(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;

    const format = (v) =>
      decimals > 0
        ? v.toFixed(decimals)
        : Math.round(v).toLocaleString('en-US');

    if (reduced) {
      el.textContent = format(target);
      return undefined;
    }

    const ctx = gsap.context(() => {
      const obj = { v: 0 };
      gsap.to(obj, {
        v: target,
        duration,
        ease: 'power2.out',
        onUpdate: () => {
          el.textContent = format(obj.v);
        },
        onComplete: () => {
          el.textContent = format(target);
        },
        scrollTrigger: { trigger: el, start: 'top 90%', once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [target, decimals, duration, reduced]);

  return ref;
}

export { gsap, ScrollTrigger };
