/* Sketch Lab Central — universal footer
   Identical on every page: brand line, GitHub/License/Contact links, exact
   copyright/license line preserved from the original Plaid Labs footer.
   Below that, a row of quick links: the three generator packs (skipped on
   the Gallery page itself, since you're already there — swapped for the
   pack links instead) and the Gallery/Share links (skipped only on the
   Gallery page). The Holiday Overlay toggle only shows up on the generator
   shell, where there's an actual categories panel for it to open. */
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

  var SHELL_URL = 'https://theplaidscientist.github.io/sketchlabcentral/';
  var GALLERY_URL = 'https://theplaidscientist.github.io/sketchlabcentral/wall/';
  var SUBMIT_URL = 'https://theplaidscientist.github.io/sketchlabcentral/wall/submit.html';

  function injectFooter() {
    var mount = document.getElementById('sl-footer-mount');
    if (!mount) return;

    // The shell (Daily Doodle / Monster Maker / Theme Park) is the only
    // page with a #app mount and an actual categories panel — that's what
    // gates the Holiday Overlay button. Checked via the DOM rather than a
    // JS global so it doesn't collide with SL_PACK_LIST, which every page
    // now carries (so the header's pack dropdown always has all 3 options).
    var isShell = !!document.getElementById('app');
    // Pages set window.SL_PAGE = 'gallery' to identify themselves, so the
    // footer can skip the self-referential "Sketch Lab Gallery" link when
    // you're already on it, and show pack links instead.
    var onGalleryPage = window.SL_PAGE === 'gallery';

    var quickLinks = onGalleryPage
      ? '<a href="' + SHELL_URL + '?pack=dailydoodle" class="holiday-chip">Daily Doodle</a> ' +
        '<a href="' + SHELL_URL + '?pack=monstermaker" class="holiday-chip">Monster Maker</a> ' +
        '<a href="' + SHELL_URL + '?pack=themepark" class="holiday-chip">Theme Park Edition</a> '
      : '<a href="' + GALLERY_URL + '" class="holiday-chip">🖼️ Sketch Lab Gallery</a> ' +
        '<a href="' + SUBMIT_URL + '" class="holiday-chip">🎨 Share Your Art</a> ';

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
        quickLinks +
        (isShell
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
