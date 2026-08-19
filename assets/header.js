/* Disco Doodle — universal navigation
   Injects nav markup on every page. Single source of truth so navigating
   between packs (or any standalone page) never feels like a different site.

   The sidebar is the site's nav everywhere now — logo + pack list on the
   left on desktop, collapsing to a hamburger-triggered slide-out drawer
   with a backdrop below 900px. Every page (generator packs, Gallery,
   Submit, Admin) renders it, so navigation is never hidden behind a page
   you happen to be on. The old horizontal pill header (renderHeader below)
   is kept as a fallback and no longer used by any shipped page, in case a
   future standalone page ever wants the lighter-weight layout instead. */

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

    var packs = window.SL_PACK_LIST || [
      { id: 'dailydoodle', label: 'Daily Doodle' }
    ];
    // null (not packs[0].id) when we're not actually looking at a pack —
    // e.g. fresh page load before a generator page finishes booting, or
    // any time we're on the Gallery/Submit/Admin — so nothing gets
    // incorrectly highlighted as "current" until it truly is.
    var current = window.SL_CURRENT_PACK || null;
    var sidebarMode = window.SL_LAYOUT === 'sidebar';

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

    var fullLogo =
      '<a href="' + homeHref + '" class="dd-logo" aria-label="Disco Doodle — home">' +
        '<span class="dd-logo-ball" aria-hidden="true">🪩</span>' +
        '<span class="dd-logo-line dd-logo-line--disco">disco</span>' +
        '<span class="dd-logo-line dd-logo-line--doodle">doodle</span>' +
      '</a>';

    if (sidebarMode) {
      renderSidebar(mount, packs, current, homeHref, fullLogo, inWall, forceRoot);
    } else {
      renderHeader(mount, packs, current, fullLogo);
    }
  }

  // ---------------- Sidebar layout (site-wide) ----------------
  function renderSidebar(mount, packs, current, homeHref, fullLogo, inWall, forceRoot) {
    document.body.classList.add('dd-has-sidebar');

    var navLinks = packs.map(function (p) {
      var isCurrent = p.id === current;
      return '<button type="button" class="dd-pack-link' + (isCurrent ? ' active' : '') + '" ' +
        'data-pack="' + p.id + '"' + (isCurrent ? ' aria-current="page"' : '') + '>' + p.label + '</button>';
    }).join('');

    // Gallery/Submit links live one level down from the shell but are
    // already-correct relative paths when we're inside /wall/ ourselves.
    // forceRoot (404.html) always uses absolute paths — see homeHref note above.
    var galleryHref = forceRoot ? '/wall/index.html' : (inWall ? 'index.html' : 'wall/index.html');
    var submitHref = forceRoot ? '/wall/submit.html' : (inWall ? 'submit.html' : 'wall/submit.html');
    var onGallery = window.SL_PAGE === 'gallery';
    var onSubmit = window.SL_PAGE === 'submit';

    mount.innerHTML =
      '<div class="dd-mobile-bar">' +
        '<button type="button" id="dd-menu-toggle" class="dd-menu-toggle" aria-label="Open pack menu" aria-expanded="false">' +
          '<span aria-hidden="true">☰</span>' +
        '</button>' +
        '<a href="' + homeHref + '" class="dd-logo-compact" aria-label="Disco Doodle — home">' +
          '<span class="dd-logo-compact-disco">disco</span> <span class="dd-logo-compact-doodle">doodle</span>' +
        '</a>' +
      '</div>' +
      '<div id="dd-sidebar-backdrop" class="dd-sidebar-backdrop"></div>' +
      '<aside id="dd-sidebar" class="dd-sidebar">' +
        fullLogo +
        '<nav class="dd-pack-nav" aria-label="Choose a pack">' + navLinks + '</nav>' +
        '<div class="dd-sidebar-footer">' +
          '<a href="' + galleryHref + '"' + (onGallery ? ' class="active" aria-current="page"' : '') + '>🖼️ Gallery</a>' +
          '<a href="' + submitHref + '"' + (onSubmit ? ' class="active" aria-current="page"' : '') + '>🎨 Share Your Art</a>' +
        '</div>' +
      '</aside>' +
      '<div id="holiday-accent" aria-hidden="true"></div>';

    var sidebar = document.getElementById('dd-sidebar');
    var backdrop = document.getElementById('dd-sidebar-backdrop');
    var toggle = document.getElementById('dd-menu-toggle');

    function openSidebar() {
      sidebar.classList.add('open');
      backdrop.classList.add('open');
      toggle.setAttribute('aria-expanded', 'true');
    }
    function closeSidebar() {
      sidebar.classList.remove('open');
      backdrop.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    }
    toggle.addEventListener('click', function () {
      if (sidebar.classList.contains('open')) closeSidebar(); else openSidebar();
    });
    backdrop.addEventListener('click', closeSidebar);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeSidebar(); });

    document.querySelectorAll('.dd-pack-link').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-pack');
        if (id === current) { closeSidebar(); return; }
        if (typeof window.SL_onPackChange === 'function') {
          // We're on the shell itself — switch packs in place.
          window.SL_onPackChange(id);
        } else if (forceRoot) {
          // 404.html: engine.js isn't loaded here (nothing to boot), so
          // SL_PACK_LANDING doesn't exist — use the same map, absolute.
          var rootLanding = { dailydoodle: 'daily-doodle.html', monstermaker: 'monster-maker.html', themepark: 'theme-park.html' };
          window.location.href = '/' + (rootLanding[id] || '');
        } else {
          // Standalone page (Gallery/Submit/Admin) — jump to that pack's
          // dedicated landing page. Relative + prefixed with "../" on
          // purpose: no hardcoded domain, so this keeps working through a
          // domain change or a GitHub Pages subpath without an edit here.
          var landing = (window.SL_PACK_LANDING && window.SL_PACK_LANDING[id]) || ('?pack=' + id);
          window.location.href = '../' + landing;
        }
        closeSidebar();
      });
    });
  }

  // ---------------- Header layout (Gallery / Submit / Admin) ----------------
  function renderHeader(mount, packs, current, fullLogo) {
    var otherPacks = packs.filter(function (p) { return p.id !== current; });
    var pills = otherPacks.map(function (p) {
      return '<button type="button" class="pack-pill" data-pack="' + p.id + '" ' +
        'aria-label="Switch to ' + p.label + '">' + p.label + '</button>';
    }).join('');

    mount.innerHTML =
      '<header id="sl-header">' +
        fullLogo +
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

  // Exposed so the shell can re-render the nav after packs load/switch.
  window.SL_renderHeader = injectHeader;
})();
