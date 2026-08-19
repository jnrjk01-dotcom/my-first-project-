/**
 * Treatment switching for the services page.
 *
 * The panels are real elements with real ids and the sidebar entries are ordinary
 * anchors, so the stylesheet can switch between them with :target and the page works
 * with this file blocked. It cannot do the job on its own, though: Webflow's in-page
 * anchor module intercepts clicks on same-page links, calls preventDefault and animates
 * a scroll, so the fragment never changes and :target never fires. This listens in the
 * capture phase — ahead of that delegated handler — and takes over.
 *
 * With the script running the page also stays where it is when you switch on a wide
 * screen: the list is beside the content, so scrolling would only move it away.
 */
(function () {
  'use strict';
  var DEFAULT = "consultation-examination";

  function init() {
    var nav = document.querySelector('.svcpage_nav');
    var pane = document.querySelector('.svcpage_pane');
    if (!nav || !pane || pane.dataset.ready) return;
    pane.dataset.ready = '1';
    pane.classList.add('is-scripted');

    var links = [].slice.call(nav.querySelectorAll('.svcpage_nav-link'));

    function known(slug) {
      for (var i = 0; i < links.length; i++) {
        if (links[i].dataset.svc === slug) return true;
      }
      return false;
    }

    function show(slug) {
      if (!known(slug)) slug = DEFAULT;
      var panels = pane.querySelectorAll('.svcpage_panel');
      for (var i = 0; i < panels.length; i++) {
        panels[i].classList.toggle('is-shown', panels[i].id === slug);
      }
      for (var j = 0; j < links.length; j++) {
        var on = links[j].dataset.svc === slug;
        links[j].classList.toggle('is-current', on);
        if (on) links[j].setAttribute('aria-current', 'true');
        else links[j].removeAttribute('aria-current');
      }
      return slug;
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

        var slug = show(link.dataset.svc);
        try {
          history.pushState(null, '', '#' + slug);
        } catch (err) {
          location.hash = slug;
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

    fromHash();
    // Arriving on a deep link: the browser could not scroll to a hidden panel, so put
    // the layout itself in view instead.
    if (location.hash && known(location.hash.replace(/^#/, ''))) {
      var layout = document.querySelector('.svcpage_layout');
      if (layout) {
        requestAnimationFrame(function () {
          layout.scrollIntoView({ block: 'start' });
        });
      }
    }
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
