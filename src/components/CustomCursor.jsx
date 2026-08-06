import { useEffect, useRef } from 'react';
import { useMediaQuery, useReducedMotion } from '../hooks/useMotion';

/**
 * Desktop-only custom cursor. Mounted behind `(pointer: fine)` so touch devices never
 * pay for it, and skipped under reduced motion where a lagging dot is just noise.
 *
 * Position is written straight to the transform in a RAF loop rather than through
 * React state — re-rendering on mousemove would be the most expensive thing on the page.
 */
export default function CustomCursor() {
  const fine = useMediaQuery('(pointer: fine)');
  const reduced = useReducedMotion();
  const dot = useRef(null);

  useEffect(() => {
    if (!fine || reduced) return undefined;

    const el = dot.current;
    if (!el) return undefined;

    document.body.classList.add('has-custom-cursor');

    const target = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pos = { ...target };
    let scale = 1;
    let targetScale = 1;
    let raf = 0;

    const onMove = (e) => {
      // Stay hidden until the mouse actually moves. On a hybrid device — a touchscreen
      // laptop reports `pointer: fine` — the dot would otherwise sit parked in the
      // middle of the viewport for a visitor who only ever touches the screen.
      if (el.style.opacity !== '1') {
        pos.x = e.clientX;
        pos.y = e.clientY;
        el.style.opacity = '1';
      }
      target.x = e.clientX;
      target.y = e.clientY;
      const interactive = e.target.closest?.('a, button, input, [role="button"], [data-cursor="grow"]');
      targetScale = interactive ? 2.6 : 1;
    };

    const loop = () => {
      pos.x += (target.x - pos.x) * 0.22;
      pos.y += (target.y - pos.y) * 0.22;
      scale += (targetScale - scale) * 0.18;
      el.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0) translate(-50%, -50%) scale(${scale})`;
      raf = requestAnimationFrame(loop);
    };

    const onLeave = () => {
      el.style.opacity = '0';
    };
    const onEnter = () => {
      el.style.opacity = '1';
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseleave', onLeave);
    document.addEventListener('mouseenter', onEnter);
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseleave', onLeave);
      document.removeEventListener('mouseenter', onEnter);
      document.body.classList.remove('has-custom-cursor');
    };
  }, [fine, reduced]);

  if (!fine || reduced) return null;

  return (
    <div ref={dot} className="cursor-dot" aria-hidden="true" style={{ opacity: 0 }}>
      <div className="h-3 w-3 rounded-full bg-white" />
    </div>
  );
}
