/* Sketch Lab Central — universal footer
   Identical on every page: brand line, GitHub/License/Contact links, exact
   copyright/license line preserved from the original Plaid Labs footer,
   plus a link to the Sketch Lab Gallery. The Holiday Overlay toggle only
   shows up on pages that actually have a generator pack loaded (it opens
   the categories panel, which doesn't exist on the Gallery/Submit/Admin
   pages). */
(function () {
  // The Plaid Labs "experiment" icon, placed just before "Plaid Labs" any
  // time that name appears. Uses a plain emoji glyph rather than an
  // external image — renders instantly everywhere, no network request,
  // no dependency on a third-party asset URL.
  var PLAID_ICON = '<span aria-hidden="true">🧪</span> ';

  // Contact email is assembled at runtime (never written out as a literal
  // string in the page source) and only attached to the link after it's
  // in the DOM, as a light deterrent against address-harvesting bots.
  var MAIL_USER = 'plaidlabs';
  var MAIL_HOST = 'gmail.com';

  function injectFooter() {
    var mount = document.getElementById('sl-footer-mount');
    if (!mount) return;

    // Only present on the generator shell (Daily Doodle / Monster Maker /
    // Theme Park) — not on the Gallery, Submit, or Admin pages, where
    // there's no categories panel for it to open. window.SL_PACK_LIST is
    // set synchronously by the shell's inline bootstrap script before any
    // deferred script runs, so it's a reliable page-type signal even
    // though the categories panel itself (window.SL_openCategoriesPanel)
    // isn't defined until the lazily-loaded pack finishes rendering.
    var hasHolidayOverlay = typeof window.SL_PACK_LIST !== 'undefined';

    mount.innerHTML =
      '<footer id="sl-footer">' +
        '<span class="sl-footer-brand">Sketch Lab Central, a division of ' +
          '<a href="https://theplaidscientist.github.io/">' + PLAID_ICON + 'Plaid Labs</a></span>' +
        '<a href="https://github.com/theplaidscientist">GitHub</a> · ' +
        '<a href="https://theplaidscientist.github.io/CONTENT-LICENSE.md">License</a> · ' +
        '<a href="#" id="sl-contact-link" rel="nofollow noopener">Contact Us</a>' +
        '<br>' +
        '© 2026 Andy Schelb — code MIT, content CC BY-NC 4.0' +
        '<br>' +
        '<a href="https://theplaidscientist.github.io/sketchlabcentral/wall/" class="holiday-chip">🖼️ Sketch Lab Gallery</a> ' +
        '<a href="https://theplaidscientist.github.io/sketchlabcentral/wall/submit.html" class="holiday-chip">🎨 Share Your Art</a> ' +
        (hasHolidayOverlay
          ? '<button id="holiday-footer-btn" class="holiday-chip" type="button" ' +
            'aria-label="Holiday overlay settings" title="Holiday overlay">🎃🎄 Holiday overlay</button>'
          : '') +
      '</footer>';

    var btn = document.getElementById('holiday-footer-btn');
    if (btn) {
      btn.addEventListener('click', function () {
        if (typeof window.SL_openCategoriesPanel === 'function') {
          window.SL_openCategoriesPanel({ scrollToHoliday: true });
        }
      });
    }

    var contactLink = document.getElementById('sl-contact-link');
    if (contactLink) {
      contactLink.href = 'mailto:' + MAIL_USER + '@' + MAIL_HOST + '?subject=' + encodeURIComponent('Sketch Lab Central');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }

  window.SL_renderFooter = injectFooter;
})();
