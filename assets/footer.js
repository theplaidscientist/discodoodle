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

    // Gallery page still gets the pack-link pills (you're already on the
    // Gallery, so those are the useful shortcut). Everywhere else, this is
    // now one plain sentence instead of two pill buttons — same treatment
    // as the "other packs" links on generator pages: bold text links, no
    // pill background, no emoji.
    var quickLinksHtml = onGalleryPage
      ? '<div class="sl-footer-links">' +
          '<a href="' + SHELL_URL + '?pack=dailydoodle" class="holiday-chip">Daily Doodle</a> ' +
          '<a href="' + SHELL_URL + '?pack=monstermaker" class="holiday-chip">Monster Maker</a> ' +
          '<a href="' + SHELL_URL + '?pack=themepark" class="holiday-chip">Theme Park Edition</a> ' +
        '</div>'
      : '<p class="other-packs-line sl-footer-share-line">' +
          '<a href="' + SUBMIT_URL + '" class="other-pack-link">Share Your Art</a> in our ' +
          '<a href="' + GALLERY_URL + '" class="other-pack-link">Doodle Gallery</a>' +
        '</p>';

    // Sentence/pills first (the more useful, actionable row), then
    // everything else — GitHub/License/Contact/copyright/Plaid Labs credit
    // — folded into one plain text line below instead of stacked across
    // several <br>s. "Disco Doodle is a division of" is dropped; "Plaid
    // Labs" just closes out the line in the same bold/icon treatment it
    // always had.
    mount.innerHTML =
      '<footer id="sl-footer">' +
        quickLinksHtml +
        '<p class="sl-footer-line">' +
          '<a href="https://github.com/theplaidscientist">GitHub</a> · ' +
          '<a href="https://theplaidscientist.github.io/CONTENT-LICENSE.md">License</a> · ' +
          '<a href="/contact.html">Contact Us</a> · ' +
          '<a href="/privacy.html">Privacy</a> · ' +
          '© 2026 Andy Schelb — code MIT, content CC BY-NC 4.0 · ' +
          '<a href="https://theplaidscientist.github.io/" class="sl-footer-parent">' + PLAID_ICON + 'Plaid Labs</a>' +
        '</p>' +
      '</footer>';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectFooter);
  } else {
    injectFooter();
  }

  window.SL_renderFooter = injectFooter;
})();
