/**
 * Service group switching.
 *
 * The panels are real elements with real ids and the buttons are ordinary anchors, so
 * the stylesheet can switch between them with :target and the page works with this file
 * blocked. It cannot do the job alone, though: Webflow's in-page anchor module
 * intercepts clicks on same-page links, calls preventDefault and animates a scroll, so
 * the fragment never changes and :target never fires. This listens in the capture phase,
 * ahead of that delegated handler, and takes over.
 *
 * It also resolves the per-treatment deep links published in the Services dropdown
 * (service.html#root-canal) to the group that contains them.
 */
(function () {
  'use strict';
  var DEFAULT = "orthodontic-treatments";
  var IN_GROUP = {"braces-orthodontics":"orthodontic-treatments","implants-treatment":"implants","veneers":"cosmetic-dentistry","teeth-whitening":"cosmetic-dentistry","crowns":"crowns-bridges-dentures","dental-bridges":"crowns-bridges-dentures","dentures":"crowns-bridges-dentures","filling":"restorative-treatments","root-canal":"restorative-treatments","normal-extraction":"oral-surgery","surgical-extraction":"oral-surgery","consultation-examination":"preventive-dentistry","scaling-and-polishing":"preventive-dentistry"};

  function init() {
    var nav = document.querySelector('.svcpage_nav');
    var pane = document.querySelector('.svcpage_pane');
    if (!nav || !pane || pane.dataset.ready) return;
    pane.dataset.ready = '1';
    pane.classList.add('is-scripted');

    var links = [].slice.call(nav.querySelectorAll('.svcpage_nav-link'));
    var panels = [].slice.call(pane.querySelectorAll('.svcpage_panel'));

    /** A fragment may name a group or a single treatment inside one. */
    function groupFor(slug) {
      for (var i = 0; i < links.length; i++) {
        if (links[i].dataset.svc === slug) return slug;
      }
      return IN_GROUP[slug] || null;
    }

    function show(slug) {
      var group = groupFor(slug) || DEFAULT;
      for (var i = 0; i < panels.length; i++) {
        panels[i].classList.toggle('is-shown', panels[i].id === group);
      }
      for (var j = 0; j < links.length; j++) {
        var on = links[j].dataset.svc === group;
        links[j].classList.toggle('is-current', on);
        if (on) links[j].setAttribute('aria-current', 'true');
        else links[j].removeAttribute('aria-current');
      }
      return group;
    }

    function fromHash() {
      show((location.hash || '').replace(/^#/, ''));
    }

    nav.addEventListener(
      'click',
      function (e) {
        var link = e.target.closest ? e.target.closest('.svcpage_nav-link') : null;
        if (!link) return;
        // Modified clicks should still open a new tab or window.
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();

        var group = show(link.dataset.svc);
        try {
          history.pushState(null, '', '#' + group);
        } catch (err) {
          location.hash = group;
        }

        // Stacked under 992px the list sits above the content, so the new panel would
        // otherwise open off-screen. Beside the content, staying put is the point.
        if (window.matchMedia('(max-width: 991px)').matches) {
          var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          pane.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        }
      },
      true
    );

    window.addEventListener('hashchange', fromHash);
    window.addEventListener('popstate', fromHash);

    var slug = (location.hash || '').replace(/^#/, '');
    show(slug);

    // Arriving on a deep link: the browser could not scroll to a panel that was hidden
    // when it tried, so place the view now that the right one is open. A link naming a
    // treatment lands on that treatment; a link naming a group lands on the group.
    if (slug && groupFor(slug)) {
      requestAnimationFrame(function () {
        var el = document.getElementById(slug);
        var target = el && el.classList.contains('svcpage_treatment')
          ? el
          : document.querySelector('.svcpage_layout');
        if (target) target.scrollIntoView({ block: 'start' });
      });
    }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
