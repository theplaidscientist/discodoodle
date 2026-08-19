/* Disco Doodle — universal header
   Injects identical header markup on every page. Single source of truth so
   navigating between packs (or any standalone page, e.g. the Gallery)
   never feels like a different site.

   The pack switcher used to be a single dropdown showing the CURRENT pack
   — which meant the other two packs were invisible unless you happened to
   click it. It's now a row of small pill buttons showing only the OTHER
   packs (never the one you're already on, since there's no reason to
   click "Daily Doodle" while looking at Daily Doodle) — always visible,
   no click-to-discover required. */
(function () {
  function injectHeader() {
    var mount = document.getElementById('sl-header-mount');
    if (!mount) return;

    var packs = window.SL_PACK_LIST || [
      { id: 'dailydoodle', label: 'Daily Doodle' }
    ];
    var current = window.SL_CURRENT_PACK || packs[0].id;
    var otherPacks = packs.filter(function (p) { return p.id !== current; });

    var pills = otherPacks.map(function (p) {
      return '<button type="button" class="pack-pill" data-pack="' + p.id + '" ' +
        'aria-label="Switch to ' + p.label + '">' + p.label + '</button>';
    }).join('');

    // Home always means the shell (index.html) — relative, one directory
    // up from the Gallery/Submit/Admin pages, same directory everywhere else.
    var homeHref = (window.location.pathname.indexOf('/wall/') !== -1) ? '../index.html' : 'index.html';

    mount.innerHTML =
      '<header id="sl-header">' +
        '<a href="' + homeHref + '" class="dd-logo" aria-label="Disco Doodle — home">' +
          '<span class="dd-logo-ball" aria-hidden="true">🪩</span>' +
          '<span class="dd-logo-line dd-logo-line--disco">disco</span>' +
          '<span class="dd-logo-line dd-logo-line--doodle">doodle</span>' +
        '</a>' +
        '<div id="pack-pills">' + pills + '</div>' +
      '</header>' +
      '<div id="holiday-accent" aria-hidden="true"></div>';

    document.querySelectorAll('#pack-pills .pack-pill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-pack');
        if (typeof window.SL_onPackChange === 'function') {
          // We're on the shell itself — switch packs in place.
          window.SL_onPackChange(id);
        } else {
          // Standalone page (e.g. the Gallery, one directory down) — jump
          // to that pack's dedicated landing page. Relative + prefixed with
          // "../" on purpose: no hardcoded domain, so this keeps working
          // through a domain change or a GitHub Pages subpath without an
          // edit here.
          var landing = (window.SL_PACK_LANDING && window.SL_PACK_LANDING[id]) || ('?pack=' + id);
          window.location.href = '../' + landing;
        }
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }

  // Exposed so the shell can re-render the select after packs load lazily.
  window.SL_renderHeader = injectHeader;
})();
