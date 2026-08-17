/* Sketch Lab Central — universal footer
   Identical on every page: brand line, GitHub/License links, exact
   copyright/license line preserved from the original Plaid Labs footer,
   plus a small, discoverable Holiday Overlay toggle. */
(function () {
  function injectFooter() {
    var mount = document.getElementById('sl-footer-mount');
    if (!mount) return;

    mount.innerHTML =
      '<footer id="sl-footer">' +
        '<span class="sl-footer-brand">Sketch Lab Central, a division of ' +
          '<a href="https://theplaidscientist.github.io/">Plaid Labs</a></span>' +
        '<a href="https://github.com/theplaidscientist">GitHub</a> · ' +
        '<a href="https://theplaidscientist.github.io/CONTENT-LICENSE.md">License</a> · ' +
        '© 2026 Andy Schelb — code MIT, content CC BY-NC 4.0' +
        '<br>' +
        '<button id="holiday-footer-btn" class="holiday-chip" type="button" ' +
          'aria-label="Holiday overlay settings" title="Holiday overlay">🎃🎄 Holiday overlay</button>' +
      '</footer>';

    var btn = document.getElementById('holiday-footer-btn');
    if (btn && typeof window.SL_openCategoriesPanel === 'function') {
      btn.addEventListener('click', function () {
        window.SL_openCategoriesPanel({ scrollToHoliday: true });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }

  window.SL_renderFooter = injectFooter;
})();
