/* Disco Doodle — universal footer
   Truly identical on every page now: brand block, GitHub/License/Contact
   links, exact copyright/license line preserved from the original Plaid
   Labs footer, then a row of quick links (the three generator packs on the
   Gallery page itself, since you're already there — swapped for the pack
   links instead; the Gallery/Share links everywhere else). The Holiday
   Overlay toggle used to live here too, but now lives next to "Edit
   Categories" on the generator pages themselves, so the footer no longer
   needs to vary page to page at all. */
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

  var SHELL_URL = 'https://discodoodle.com/';
  var GALLERY_URL = 'https://discodoodle.com/wall/';
  var SUBMIT_URL = 'https://discodoodle.com/wall/submit.html';

  function injectFooter() {
    var mount = document.getElementById('sl-footer-mount');
    if (!mount) return;

    // Pages set window.SL_PAGE = 'gallery' to identify themselves, so the
    // footer can skip the self-referential "Disco Doodle Gallery" link when
    // you're already on it, and show pack links instead.
    var onGalleryPage = window.SL_PAGE === 'gallery';

    var quickLinks = onGalleryPage
      ? '<a href="' + SHELL_URL + '?pack=dailydoodle" class="holiday-chip">Daily Doodle</a> ' +
        '<a href="' + SHELL_URL + '?pack=monstermaker" class="holiday-chip">Monster Maker</a> ' +
        '<a href="' + SHELL_URL + '?pack=themepark" class="holiday-chip">Theme Park Edition</a> '
      : '<a href="' + GALLERY_URL + '" class="holiday-chip">🖼️ Disco Doodle Gallery</a> ' +
        '<a href="' + SUBMIT_URL + '" class="holiday-chip">🎨 Share Your Art</a> ';

    mount.innerHTML =
      '<footer id="sl-footer">' +
        '<span class="sl-footer-brand">Disco Doodle<br>is a division of<br>' +
          '<a href="https://theplaidscientist.github.io/" class="sl-footer-parent">' + PLAID_ICON + 'Plaid Labs</a></span>' +
        '<a href="https://github.com/theplaidscientist">GitHub</a> · ' +
        '<a href="https://theplaidscientist.github.io/CONTENT-LICENSE.md">License</a> · ' +
        '<a href="#" id="sl-contact-link" rel="nofollow noopener">Contact Us</a>' +
        '<br>' +
        '© 2026 Andy Schelb — code MIT, content CC BY-NC 4.0' +
        '<br>' +
        quickLinks +
      '</footer>';

    var contactLink = document.getElementById('sl-contact-link');
    if (contactLink) {
      contactLink.href = 'mailto:' + MAIL_USER + '@' + MAIL_HOST + '?subject=' + encodeURIComponent('Disco Doodle');
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }

  window.SL_renderFooter = injectFooter;
})();
