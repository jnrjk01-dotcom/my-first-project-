/**
 * Scroll-driven services carousel, phones only.
 *
 * On a phone the services section pins to the screen and the cards travel sideways as
 * you scroll down; once the last card is reached the pin releases and the next section
 * comes up. On tablets and desktop nothing here runs and the section stays the swipe
 * rail it already is.
 *
 * WHY THIS IS NOT THE ORIGINAL INTERACTION. The template shipped this effect as a
 * Webflow IX2 interaction on .service_sticky-trigger / .scroll-mobile_camera, and it was
 * removed because it could not reach the third and fourth cards and pushed the buttons
 * off screen. The reason is height, not the animation: the rail is taller than a phone
 * viewport, so pinning it at the top of the screen puts its lower part permanently out
 * of reach. Restoring the interaction as it was would restore the same fault, so the
 * movement is driven from GSAP here instead, where the travel distance is measured
 * rather than baked in.
 *
 * IT CHECKS THAT IT FITS BEFORE IT PINS. A pinned card has to sit inside the screen
 * minus the fixed booking bar, which is around 170px tall on a phone once its buttons
 * wrap, and the card is tightened in CSS to help it fit. Where it fits, the section pins
 * and the cards travel while the page is held still. Where it does not, on a short phone
 * or after someone adds another treatment to a card, this does nothing at all and the
 * native swipe rail is left exactly as it is. That is a real limit worth knowing about:
 * the taller the booking bar and the cards get, the fewer phones see the effect.
 *
 * The class on <html> is what switches the rail from a scrolling container to a
 * transformed one, so the CSS that removes the scrollbar and the arrows applies only
 * while this script is actually driving. If the script never runs, or bails out above,
 * the rail keeps working by hand.
 */
(function () {
  'use strict';

  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);

  var ROOT = document.documentElement;
  var CLASS = 'dcc-svc-pinned';

  function start() {
    var mm = gsap.matchMedia();

    // Phones only, and only where motion is welcome: a pinned scrub hijacks the scroll,
    // which is exactly what prefers-reduced-motion asks us not to do.
    mm.add('(max-width: 767px) and (prefers-reduced-motion: no-preference)', function () {
      var list = document.querySelector('.service_list');
      var wrap = list && list.closest('.service_wrap');
      if (!list || !wrap) return;
      if (list.querySelectorAll('.service_item-wrap').length < 2) return;

      // Switch the rail to transform mode first: the measurement below has to be taken
      // in the state the carousel will actually run in, with the arrows gone and the
      // padding tightened, not in the swipe rail's taller state.
      ROOT.classList.add(CLASS);

      // Can the cards be pinned, or only slid? Pinning holds the section still while the
      // cards travel, which is the effect being restored, but it only works if the whole
      // card fits on screen above the fixed booking bar. On a short phone, or with the
      // bar at its full wrapped height, it does not, and pinning there would hide the
      // card's own button behind the bar with no way to scroll to it. The cards still
      // travel in that case, driven by the section's passage up the screen instead.
      var bar = document.querySelector('.dcc-bookbar');
      var barH = bar ? bar.getBoundingClientRect().height : 0;
      var usable = window.innerHeight - barH - 24;

      // The compacted card is what would be pinned, so the measurement has to be taken
      // with that styling applied; measuring the roomier card would refuse to pin in
      // cases that would in fact have fitted.
      ROOT.classList.add(CLASS + '-pin');
      var canPin = wrap.getBoundingClientRect().height <= usable;
      if (!canPin) ROOT.classList.remove(CLASS + '-pin');

      /**
       * How far the cards must travel for the last one to come fully into view.
       *
       * Measured from offsetLeft/offsetWidth rather than getBoundingClientRect because
       * those are layout values and ignore the transform this tween is applying; reading
       * rects mid-tween would feed the animation its own output.
       *
       * The visible width is the wrap's, not the list's. Once the list stops scrolling
       * and starts being transformed its overflow is visible, so it stretches to its own
       * content and its clientWidth reports the full width of all four cards. Subtracting
       * that from the content width gives zero travel and the carousel never moves. The
       * wrap is the element that actually clips, so it is the one that defines the window.
       */
      function travel() {
        var cards = list.querySelectorAll('.service_item-wrap');
        if (cards.length < 2) return 0;
        var last = cards[cards.length - 1];
        var content = last.offsetLeft + last.offsetWidth - cards[0].offsetLeft;
        var pad = parseFloat(getComputedStyle(list).paddingRight) || 0;
        return Math.max(0, Math.round(content - wrap.clientWidth + pad * 2));
      }

      if (travel() <= 0) {
        ROOT.classList.remove(CLASS);
        return;
      }

      // Without the pin there is nowhere to put the movement. A rail this tall is fully
      // on screen for only the difference between its height and the viewport's, which
      // on a phone is a hundred pixels or so of scrolling, against a thousand pixels of
      // travel; spending the travel over that range whips the cards past before they can
      // be read, and spending it as the section enters means the first card has already
      // gone by the time anything is visible. Both were tried. So where it cannot pin it
      // does not animate at all, and the swipe rail is left exactly as it is.
      if (!canPin) {
        ROOT.classList.remove(CLASS);
        return;
      }

      var tween = gsap.to(list, {
        x: function () { return -travel(); },
        ease: 'none',
        scrollTrigger: {
          trigger: wrap,
          // Leaves a little air above the cards rather than jamming them against the
          // top edge, and keeps their bottom clear of the booking bar.
          start: 'top 16px',
          end: function () { return '+=' + Math.max(1, travel()); },
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          // Pin by moving the element rather than by position: fixed. The rail sits
          // inside Webflow's scroll-mobile_camera, which carries a transform, and a
          // transformed ancestor becomes the containing block for fixed positioning:
          // a fixed pin inside it is positioned against that ancestor instead of the
          // viewport, so it scrolls away instead of holding still. The stray transform
          // is cleared in CSS too, but this does not depend on that having worked.
          pinType: 'transform',
          scrub: 0.5,
          // Card widths and therefore the travel distance change when the phone is
          // turned; without this the end position would keep the value it was born with.
          invalidateOnRefresh: true,
        },
      });

      // Adding the classes above changed every card's height, which moves this section
      // and everything below it. ScrollTrigger measured the old layout, including the
      // sixteen triggers the reveal engine had already created, so without this the pin
      // fires at the wrong scroll position: the rail scrolls off the top of the screen
      // before the cards begin to move.
      ScrollTrigger.refresh();

      // Runs when the media query stops matching, so rotating to landscape or resizing
      // into tablet width hands the section back to the swipe rail cleanly.
      return function () {
        if (tween.scrollTrigger) tween.scrollTrigger.kill(true);
        tween.kill();
        gsap.set(list, { clearProps: 'transform' });
        list.scrollLeft = 0;
        ROOT.classList.remove(CLASS);
        ROOT.classList.remove(CLASS + '-pin');
      };
    });
  }

  // The arrows are added by services-rail.js and change the rail's height, and the
  // booking bar is injected too; both have to exist before anything is measured.
  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
