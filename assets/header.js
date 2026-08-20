/* Disco Doodle — universal navigation
   Injects nav markup on every page. Single source of truth so navigating
   between packs (or any standalone page) never feels like a different site.

   Horizontal pill header (renderHeader below) — full 120px logo, no
   pack-switcher UI here (see the note by renderHeader). A persistent left
   sidebar layout was tried site-wide earlier and reverted: at real viewport
   widths it read as a tall wall of empty space, and it forced the logo down
   to 36px to fit the nav column. That sidebar implementation (and its ~140
   lines of CSS) has been removed rather than kept dormant, since a site-wide
   SEO/cleanup pass found it was genuinely unreachable — nothing sets
   window.SL_LAYOUT = 'sidebar' anywhere, so it was just dead weight on every
   page load. If a persistent-nav layout is wanted again later, it's cheap to
   rebuild against the current header/footer pattern rather than resurrect. */

/* ---------------- Analytics ----------------
   Cloudflare Web Analytics — chosen over Plausible because Plausible has no
   real free tier for a hosted custom domain ($9/mo minimum as of writing),
   which doesn't fit a free/no-signup hobby project. Cloudflare's is free
   with no pageview cap, sets no cookies (no consent banner needed), and
   works via this one script tag without moving DNS/nameservers anywhere.
   Token below is the real one from Andy's free Cloudflare account (Web
   Analytics → discodoodle.com, added via the analytics-only "Add a site"
   flow — no DNS/nameserver change). Loaded on every page since this file
   is included everywhere already. */
(function () {
  var CF_ANALYTICS_TOKEN = 'ce2fd4b858b2486e926f26f4ae0fe61e';
  if (!CF_ANALYTICS_TOKEN || CF_ANALYTICS_TOKEN.indexOf('PASTE_YOUR') === 0) return;
  var s = document.createElement('script');
  s.type = 'module';
  s.defer = true;
  s.src = 'https://static.cloudflareinsights.com/beacon.min.js';
  s.setAttribute('data-cf-beacon', JSON.stringify({ token: CF_ANALYTICS_TOKEN }));
  document.head.appendChild(s);
})();

(function () {
  function injectHeader() {
    var mount = document.getElementById('sl-header-mount');
    if (!mount) return;

    // Home always means the shell (index.html) — relative, one directory
    // up from the Gallery/Submit/Admin pages, same directory everywhere else.
    //
    // Exception: 404.html sets window.SL_ROOT_ABSOLUTE = true. It's served
    // by GitHub Pages for ANY unmatched URL, so the address bar can show a
    // path at any depth (e.g. /wall/typo, /foo/bar/baz) — a path computed
    // relative to that fake location would be wrong as often as not. Root-
    // absolute paths sidestep the guesswork entirely.
    var forceRoot = window.SL_ROOT_ABSOLUTE === true;
    var inWall = !forceRoot && window.location.pathname.indexOf('/wall/') !== -1;
    var homeHref = forceRoot ? '/' : (inWall ? '../index.html' : 'index.html');

    // The disco-ball is now the same rounded-square favicon image everywhere
    // (root-absolute path, works from any page depth) instead of a raw 🪩
    // emoji glyph — emoji rendering varies wildly by OS/browser, which is
    // why it was showing up as a flat grey circle for some visitors. It
    // sits inline right after "disco", like an extra character, instead of
    // floating absolutely-positioned above the text.
    var fullLogo =
      '<a href="' + homeHref + '" class="dd-logo" aria-label="Disco Doodle — home">' +
        '<span class="dd-logo-line dd-logo-line--disco">disco<img src="/android-chrome-192x192.png" alt="" class="dd-logo-ball" aria-hidden="true"></span>' +
        '<span class="dd-logo-line dd-logo-line--doodle">doodle</span>' +
      '</a>';

    renderHeader(mount, fullLogo);
  }

  // ---------------- Header layout (site-wide) ----------------
  // Just the logo — no pack-switcher pills here anymore. Switching packs
  // now happens via the "other packs" links each generator page renders
  // near the bottom of its content (see engine.js's otherPacksLineHtml),
  // which are real crawlable <a> links rather than JS-only buttons.
  function renderHeader(mount, fullLogo) {
    mount.innerHTML =
      '<header id="sl-header">' +
        fullLogo +
      '</header>' +
      '<div id="holiday-accent" aria-hidden="true"></div>';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }

  // Exposed so the shell can re-render the nav after packs load/switch.
  window.SL_renderHeader = injectHeader;
})();
