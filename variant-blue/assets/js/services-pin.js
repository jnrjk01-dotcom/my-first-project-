/**
 * Scroll-driven services carousel, phones only.
 *
 * On a phone the services section pins to the screen and the cards travel sideways as
 * you scroll down; once the last card is reached the pin releases and the next section
 * comes up. On tablets and desktop nothing here runs and the section stays the swipe
 * rail it already is.
 *
 * IT USES THE TEMPLATE'S OWN RIG. scroll-mobile_camera sticks with CSS and
 * scroll-mobile_trigger is a tall spacer for it to stick through, which is how the
 * original template did it and how the reference build still does. GSAP drives only the
 * sideways travel. Measured against that reference: the cards begin moving with the
 * camera about 300px down the screen, the camera then locks near the top, and the rest
 * of the travel happens while it is held.
 *
 * Keeping the lock and the animation separate is the point. A GSAP pin owns both, so
 * nothing can move until it engages and the cards sit still until the section locks. The
 * reference has them already sliding as the section rises.
 *
 * WHAT DOES DIFFER FROM THE REFERENCE. It has no fixed booking bar and its four cards are
 * the same height; ours vary, and the bar takes about 70px. So this measures whether a
 * card actually fits above the bar before committing, and the card is tightened in CSS
 * while pinned to help it. Where it does not fit, on a short phone like an SE or after
 * someone adds another treatment to a card, none of this runs and the native swipe rail
 * is left exactly as it is.
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

      // Without the lock there is nowhere to put the movement. A rail this tall is fully
      // on screen for only the difference between its height and the viewport, which on a
      // phone is a hundred pixels or so of scrolling against a thousand pixels of travel;
      // spending the travel over that range whips the cards past before they can be read,
      // and spending it as the section enters means the first card has already gone by
      // the time anything is visible. Both were tried. So where it cannot lock it does
      // not animate at all, and the swipe rail is left exactly as it is.
      if (!canPin) {
        ROOT.classList.remove(CLASS);
        return;
      }

      /* The rig is Webflow's own, the one the original template used and the one the
         reference build still runs: scroll-mobile_camera sticks with CSS, and
         scroll-mobile_trigger is a tall spacer that gives it something to stick through.
         GSAP only drives the sideways travel.

         This replaced a GSAP pin, which produced the same locked section but a different
         entry. A pinned trigger cannot start animating before it pins, so the cards sat
         still until the section locked and then began to move. In the reference the cards
         are already sliding as the section rises, and the lock happens underneath that,
         because the sticky position and the animation's range are independent things.
         Keeping them independent is the whole point of doing it this way. */
      var camera = wrap.closest('.scroll-mobile_camera');
      var spacer = camera && camera.closest('.scroll-mobile_trigger');
      if (!camera || !spacer) {
        ROOT.classList.remove(CLASS);
        ROOT.classList.remove(CLASS + '-pin');
        return;
      }

      // The spacer has to be the camera's height plus the distance the cards travel, or
      // the section unsticks before the last card has arrived.
      // Set with priority: an earlier rule pins this element's height to auto with
      // !important, which a plain inline style loses to, leaving the spacer collapsed
      // and the section unsticking immediately.
      function sizeSpacer() {
        var h = Math.round(camera.getBoundingClientRect().height) + travel();
        spacer.style.setProperty('height', h + 'px', 'important');
        return h;
      }
      sizeSpacer();

      var tween = gsap.to(list, {
        x: function () { return -travel(); },
        ease: 'none',
        scrollTrigger: {
          trigger: spacer,
          // Begins while the section is still rising, so the cards are already moving
          // by the time it settles, and finishes as the spacer runs out. 42% is where
          // the reference build starts its travel, measured off it rather than picked.
          start: 'top 42%',
          end: 'bottom bottom',
          scrub: 0.5,
          // Card widths, and so the travel distance and the spacer's height, change when
          // the phone is turned; without this they would keep the values they were born
          // with.
          invalidateOnRefresh: true,
          onRefresh: sizeSpacer,
        },
      });

      // Adding the classes above changed every card's height, which moves this section
      // and everything below it. ScrollTrigger measured the old layout, including the
      // sixteen triggers the reveal engine had already created, so without this the pin
      // fires at the wrong scroll position: the rail scrolls off the top of the screen
      // before the cards begin to move.
      ScrollTrigger.refresh();

      // Sora is loaded with font-display: swap, so the page can be laid out in a fallback
      // face and reflow when the real one arrives. Every card gets taller at that moment,
      // which moves the start of the pin: measured before the swap, the section pins tens
      // of pixels lower than intended and its last rows end up behind the booking bar.
      // Waiting for the fonts to settle and measuring again costs nothing when they were
      // already loaded, since the promise is resolved by then.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
      }

      // Runs when the media query stops matching, so rotating to landscape or resizing
      // into tablet width hands the section back to the swipe rail cleanly.
      return function () {
        if (tween.scrollTrigger) tween.scrollTrigger.kill(true);
        tween.kill();
        gsap.set(list, { clearProps: 'transform' });
        list.scrollLeft = 0;
        spacer.style.removeProperty('height');
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
