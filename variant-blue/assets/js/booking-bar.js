/**
 * Persistent booking bar.
 *
 * A translucent bar pinned to the bottom of the viewport on every page, offering two
 * ways to book: a direct call and a WhatsApp message.
 *
 * Why this is one JS file rather than markup pasted into each page: the site has 18
 * pages across two trees, and the legal pages do not load lumora.css at all — they carry
 * their own inline <style>. Injecting both the styles and the markup from here means one
 * file to edit, and no chance of the trees drifting apart.
 *
 * Include with:  <script src="assets/js/booking-bar.js" defer></script>
 *
 * Every value below can be overridden per-page with data attributes on that script tag,
 * e.g. data-phone="+27216711504" — useful if a location ever gets its own number.
 */
(function () {
  'use strict';

  var script = document.currentScript ||
    (function () {
      var all = document.getElementsByTagName('script');
      return all[all.length - 1];
    })();

  var cfg = {
    phone: '+263292263687',
    phoneDisplay: '+263 29 226 3687',
    whatsapp: '263778398111', // international format, no +, no spaces
    whatsappText: 'Hi Dental Care Centre, I would like to book an appointment.',
    // Empty means "book over WhatsApp", the same chat the bar's own WhatsApp button
    // opens. Booking here happens on WhatsApp, so there is no separate scheduling page
    // to send people to. Set data-book-url on the script tag to point the button at a
    // real booking system if the practice ever adopts one.
    bookUrl: '',
    label: 'Give us a call to schedule an appointment',
    cta: 'Book Appointment',
  };

  if (script && script.dataset) {
    Object.keys(cfg).forEach(function (k) {
      if (script.dataset[k]) cfg[k] = script.dataset[k];
    });
  }

  var KEY = 'dcc-bookbar-dismissed';
  try {
    if (window.sessionStorage && sessionStorage.getItem(KEY) === '1') return;
  } catch (e) {
    /* storage blocked — show the bar, which is the safe default */
  }

  /* ── Styles ──────────────────────────────────────────────────────────────
     The bar is translucent so the page reads through it. The base colour is dark
     enough that even at 0.82 alpha over pure white the effective background is
     ~rgb(52,58,73), which keeps white text far above 4.5:1. Where backdrop-filter
     is unsupported the alpha is raised instead of relying on the blur. */
  var css =
    '.dcc-bookbar{position:fixed;left:0;right:0;bottom:0;z-index:9990;' +
    'background:rgba(13,20,38,.92);color:#fff;' +
    "font-family:Sora,'Helvetica Neue',Arial,sans-serif;" +
    'box-shadow:0 -6px 28px rgba(0,0,0,.22);' +
    'border-top:1px solid rgba(255,255,255,.14);' +
    'transform:translateY(100%);transition:transform .45s cubic-bezier(.22,1,.36,1)}' +
    '.dcc-bookbar.is-in{transform:translateY(0)}' +
    '@supports ((backdrop-filter:blur(10px)) or (-webkit-backdrop-filter:blur(10px))){' +
    '.dcc-bookbar{background:rgba(13,20,38,.82);' +
    '-webkit-backdrop-filter:blur(12px) saturate(140%);backdrop-filter:blur(12px) saturate(140%)}}' +

    '.dcc-bookbar__inner{max-width:1160px;margin:0 auto;padding:14px 56px 14px 20px;' +
    'display:flex;align-items:center;gap:18px;flex-wrap:wrap;justify-content:center}' +
    '.dcc-bookbar__label{font-size:14px;font-weight:600;letter-spacing:.02em;' +
    'text-transform:uppercase;margin:0;flex:1 1 auto;min-width:180px}' +
    '.dcc-bookbar__actions{display:flex;align-items:center;gap:10px;flex-wrap:wrap;' +
    'justify-content:center}' +

    '.dcc-bookbar a{display:inline-flex;align-items:center;gap:8px;text-decoration:none;' +
    'border-radius:999px;font-size:14px;font-weight:600;white-space:nowrap;' +
    'padding:11px 18px;transition:background-color .2s,border-color .2s,color .2s}' +
    '.dcc-bookbar__call,.dcc-bookbar__wa{color:#fff;border:1px solid rgba(255,255,255,.42)}' +
    '.dcc-bookbar__call:hover,.dcc-bookbar__wa:hover{background:rgba(255,255,255,.14);' +
    'border-color:rgba(255,255,255,.8)}' +
    '.dcc-bookbar__wa svg{color:#4ade80}' +
    '.dcc-bookbar__cta{background:#3389CC;color:#fff;border:1px solid #3389CC}' +
    '.dcc-bookbar__cta:hover{background:#2C77B1;border-color:#2C77B1}' +

    '.dcc-bookbar__close{position:absolute;top:8px;right:10px;width:34px;height:34px;' +
    'display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,.14);' +
    'border:0;border-radius:50%;color:#fff;font-size:15px;line-height:1;cursor:pointer;' +
    'padding:0;transition:background-color .2s}' +
    '.dcc-bookbar__close:hover{background:rgba(255,255,255,.3)}' +

    '.dcc-bookbar a:focus-visible,.dcc-bookbar__close:focus-visible{' +
    'outline:3px solid #7fc2f0;outline-offset:2px}' +

    /* One row under 768px. Stacked, this bar was 194px tall on a 390px screen once the
       label wrapped and the buttons went to two rows: roughly a quarter of the phone
       held permanently by a bar, on every page. A single row is about 66px.

       The label goes. It said "give us a call to schedule an appointment" above a button
       reading "Call +263 29 226 3687", so it was telling people what the button under it
       already said. Call and WhatsApp keep their icons only, and their text is moved out
       of sight rather than removed, so the links still announce themselves properly to a
       screen reader and still carry an accessible name. Book Appointment keeps its words
       and takes the rest of the row, since it is the one action worth reading. */
    '@media (max-width:767px){' +
    '.dcc-bookbar__inner{padding:10px 44px 10px 12px;gap:8px;' +
    'flex-direction:row;align-items:center;flex-wrap:nowrap}' +
    '.dcc-bookbar__label{display:none}' +
    '.dcc-bookbar__actions{flex:1 1 auto;display:flex;flex-wrap:nowrap;gap:8px;min-width:0}' +
    '.dcc-bookbar a{justify-content:center;padding:12px 10px;font-size:14px}' +
    '.dcc-bookbar__call,.dcc-bookbar__wa{flex:0 0 auto;width:48px;padding:12px 0;gap:0}' +
    '.dcc-bookbar__call>span:not(.dcc-sr),.dcc-bookbar__wa>span:not(.dcc-sr){' +
    'position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;' +
    'clip:rect(0 0 0 0);clip-path:inset(50%);white-space:nowrap;border:0}' +
    '.dcc-bookbar__cta{flex:1 1 auto;min-width:0}' +
    '.dcc-bookbar__close{top:50%;bottom:auto;transform:translateY(-50%);' +
    'right:8px;width:30px;height:30px}}' +

    '@media (prefers-reduced-motion:reduce){' +
    '.dcc-bookbar{transition:none;transform:translateY(0)}}' +

    /* Never print a fixed overlay across the page. */
    '@media print{.dcc-bookbar{display:none!important}}';

  var style = document.createElement('style');
  style.id = 'dcc-bookbar-styles';
  style.appendChild(document.createTextNode(css));
  document.head.appendChild(style);

  /* ── Markup ─────────────────────────────────────────────────────────────── */
  var phoneIcon =
    '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
    'stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' +
    '<path d="M4 4h4l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v4c0 .6-.4 1-1 1C10.7 21 3 13.3 3 5c0-.6.4-1 1-1Z"/></svg>';

  var waIcon =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' +
    '<path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91C21.96 6.45 17.5 2 12.04 2Zm5.8 14.16c-.24.68-1.42 1.31-1.95 1.36-.5.05-.98.23-3.3-.69-2.77-1.09-4.53-3.92-4.67-4.1-.14-.18-1.12-1.49-1.12-2.85 0-1.35.71-2.02.96-2.29.25-.27.55-.34.73-.34.18 0 .37 0 .53.01.17.01.4-.06.62.48.24.57.8 1.97.87 2.11.07.14.12.31.02.49-.09.18-.14.29-.28.45-.14.16-.29.35-.42.47-.14.14-.28.29-.12.57.16.27.72 1.18 1.54 1.92 1.06.94 1.95 1.24 2.23 1.38.27.14.43.12.59-.07.16-.18.68-.79.86-1.07.18-.27.36-.22.61-.13.25.09 1.6.75 1.87.89.27.14.46.2.53.32.07.11.07.66-.17 1.34Z"/></svg>';

  var bar = document.createElement('aside');
  bar.className = 'dcc-bookbar';
  bar.setAttribute('role', 'region');
  bar.setAttribute('aria-label', 'Book an appointment');
  bar.style.position = 'fixed';

  var waHref =
    'https://wa.me/' + cfg.whatsapp + '?text=' + encodeURIComponent(cfg.whatsappText);

  bar.innerHTML =
    '<div class="dcc-bookbar__inner">' +
    '<p class="dcc-bookbar__label">' + cfg.label + '</p>' +
    '<div class="dcc-bookbar__actions">' +
    '<a class="dcc-bookbar__call" href="tel:' + cfg.phone + '">' +
    phoneIcon + '<span>Call ' + cfg.phoneDisplay + '</span></a>' +
    '<a class="dcc-bookbar__wa" href="' + waHref + '" target="_blank" rel="noopener noreferrer">' +
    waIcon + '<span>WhatsApp</span><span class="dcc-sr">, opens WhatsApp in a new tab</span></a>' +
    '<a class="dcc-bookbar__cta" href="' + (cfg.bookUrl || waHref) + '" target="_blank" rel="noopener noreferrer">' +
    cfg.cta + '</a>' +
    '</div></div>' +
    '<button type="button" class="dcc-bookbar__close" aria-label="Close the booking bar">' +
    '<span aria-hidden="true">&#10005;</span></button>';

  // Screen-reader-only text for the "opens in a new tab" hints.
  var srStyle = document.createElement('style');
  srStyle.appendChild(
    document.createTextNode(
      '.dcc-sr{position:absolute;width:1px;height:1px;padding:0;margin:-1px;' +
      'overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}'
    )
  );
  document.head.appendChild(srStyle);

  function mount() {
    document.body.appendChild(bar);

    /* The bar must never cover content. Pad the document by the bar's real measured
       height rather than a guessed constant, because the stacked mobile layout is
       roughly twice the height of the desktop row and both change with font size. */
    var prevPad = document.body.style.paddingBottom;

    function syncPadding() {
      document.body.style.paddingBottom = bar.offsetHeight + 'px';
    }

    syncPadding();
    requestAnimationFrame(function () {
      bar.classList.add('is-in');
    });

    if (window.ResizeObserver) {
      new ResizeObserver(syncPadding).observe(bar);
    } else {
      window.addEventListener('resize', syncPadding);
    }

    bar.querySelector('.dcc-bookbar__close').addEventListener('click', function () {
      bar.style.display = 'none';
      document.body.style.paddingBottom = prevPad;
      try {
        sessionStorage.setItem(KEY, '1');
      } catch (e) {
        /* storage blocked — it will simply reappear on the next page */
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mount);
  } else {
    mount();
  }
})();
