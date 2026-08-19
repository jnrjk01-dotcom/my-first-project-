/**
 * Arrows for the services rail.
 *
 * The rail itself is a native scroll-snap container — drag, swipe, shift+wheel and
 * keyboard already work without any script. This only adds visible paging controls,
 * because a horizontal rail is easy to miss with a mouse, and keeps their disabled
 * state in sync with the scroll position.
 */
(function () {
  'use strict';
  function init() {
    var rail = document.querySelector('.service_list');
    if (!rail || rail.dataset.railReady) return;
    rail.dataset.railReady = '1';

    rail.setAttribute('tabindex', '0');
    rail.setAttribute('role', 'region');
    rail.setAttribute('aria-label', 'Our services');

    var wrap = document.createElement('div');
    wrap.className = 'service-rail_controls';
    wrap.innerHTML =
      '<button type="button" class="service-rail_btn" data-dir="-1" aria-label="Previous services">' +
      '<svg width="17" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 7H1m6-5L1 7l6 5"/></svg></button>' +
      '<button type="button" class="service-rail_btn" data-dir="1" aria-label="Next services">' +
      '<svg width="17" height="14" viewBox="0 0 16 14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 7h14M9 2l6 5-6 5"/></svg></button>' +
      '<span class="service-rail_hint">Scroll or drag to see all services</span>';

    var host = rail.closest('.service_wrap') || rail.parentElement;
    host.appendChild(wrap);

    function step() {
      var card = rail.querySelector('.service_item-wrap');
      return card ? card.getBoundingClientRect().width + 24 : rail.clientWidth * 0.8;
    }

    wrap.addEventListener('click', function (e) {
      var btn = e.target.closest('[data-dir]');
      if (!btn) return;
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      rail.scrollBy({ left: Number(btn.dataset.dir) * step(), behavior: reduce ? 'auto' : 'smooth' });
    });

    function sync() {
      var max = rail.scrollWidth - rail.clientWidth - 2;
      wrap.querySelector('[data-dir="-1"]').disabled = rail.scrollLeft <= 2;
      wrap.querySelector('[data-dir="1"]').disabled = rail.scrollLeft >= max;
    }
    rail.addEventListener('scroll', sync, { passive: true });
    window.addEventListener('resize', sync);
    sync();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
