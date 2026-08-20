/* Disco Doodle — shared generator engine.
   One component reused by every pack: mode toggle, categories panel
   (collapsed by default, per-category on/off + view/edit/add/remove/clear/
   restore), spin animation, avoid-repeats, synthesized sound, copy/share,
   last-3 history, shared Firebase counter, and the Holiday Overlay. */
(function () {
  window.SL_PACKS = window.SL_PACKS || {};
  var currentPackId = null;
  var mode = 'beginner';
  var avoidRepeats = false;
  var soundEnabled = true;
  var history = [];
  var currentCount = null;
  var currentPlainResult = '';
  // Share image is speculatively built in the background the moment a
  // result appears (see showShare) rather than on-demand when the Share
  // button is tapped. This matters specifically for iOS Safari: navigator.
  // share() only works within a short "transient activation" window right
  // after a real click, and building the image (loading fonts/the disco
  // ball PNG, encoding the canvas) takes just long enough to blow past that
  // window if done inside the click handler itself. Pre-building means the
  // blob is usually already sitting ready by the time someone taps Share.
  var pendingShareBlob = null;
  var holiday = 'none'; // 'none' | 'halloween' | 'christmas'
  var holidayBackup = {}; // packId -> { key: items[] } saved before overlay swap

  // Derived from the live page instead of hardcoded, so shared/copied links
  // are always correct — this used to be a hardcoded literal that pointed at
  // the wrong path (missing "central") and would silently break every
  // "Copy result" / share-image link. Deriving it means it also survives a
  // future domain change with zero code edits.
  var SITE_URL = window.location.origin + window.location.pathname;
  var DB_URL = 'https://daily-doodle-b7c57-default-rtdb.firebaseio.com';
  var COUNTER_PATH = '/counters/sketchIdeas.json';

  // ---------------- Content filter ----------------
  // The only free-text entry point on the whole site is "Edit Categories" —
  // anything typed in there can get randomly picked into the generated
  // sentence, which then gets drawn onto the brand-plastered share image and
  // posted wherever someone taps Share. This is a client-side word-list
  // filter: it catches casual/accidental submissions of profanity, slurs,
  // and sexual content before they ever enter the category pool. It is NOT
  // real moderation — this site has no backend, so there's no way to review
  // text server-side, and anyone determined enough to open devtools can
  // bypass client-side JS entirely. Two checks, same word list: one at entry
  // (addItem, below) so bad words never make it into a category in the first
  // place, and one right before a share image gets built/shared (saveImage)
  // as a last-resort backstop in case a flagged word ever reaches
  // currentPlainResult some other way.
  var BANNED_WORDS = [
    'fuck', 'fucker', 'fucking', 'motherfucker', 'shit', 'bullshit', 'bitch',
    'bastard', 'asshole', 'ass', 'dick', 'dickhead', 'pussy', 'cunt', 'cock',
    'whore', 'slut', 'douche', 'douchebag', 'twat', 'wank', 'wanker', 'prick',
    'piss', 'crap', 'damn', 'goddamn', 'hell',
    'nigger', 'nigga', 'chink', 'spic', 'gook', 'kike', 'wetback', 'coon',
    'faggot', 'fag', 'dyke', 'tranny', 'retard', 'retarded', 'cripple',
    'nazi', 'hitler', 'kkk', 'terrorist',
    'porn', 'porno', 'sex', 'nude', 'naked', 'penis', 'vagina', 'boob',
    'boobs', 'tit', 'tits', 'orgasm', 'masturbate', 'blowjob', 'handjob',
    'rape', 'rapist', 'molest', 'pedophile', 'pedo',
    'kill', 'kys', 'suicide', 'murder',
    'meth', 'heroin', 'cocaine', 'crack'
  ];

  var LEET_MAP = { '4': 'a', '@': 'a', '3': 'e', '1': 'i', '!': 'i', '0': 'o', '5': 's', '$': 's', '7': 't' };

  function leetNormalize(s) {
    return s.toLowerCase().replace(/[4@31!05\$7]/g, function (c) { return LEET_MAP[c] || c; });
  }

  function collapseRepeats(s) {
    // "fuuuuck" -> "fuck" so simple letter-stretching doesn't dodge the list.
    return s.replace(/(.)\1{1,}/g, '$1');
  }

  // Whole-word matching (not substring) on purpose — substring matching on
  // words like "ass" or "hell" would false-positive on totally innocent
  // words ("class", "brass", "shell", "hello"), which would be its own kind
  // of annoying bug on a site meant to be fun for kids to use.
  function containsBannedWord(text) {
    if (!text) return false;
    var norm = leetNormalize(text);
    var tokens = norm.split(/[^a-z]+/).filter(Boolean);
    for (var i = 0; i < tokens.length; i++) {
      var t = tokens[i];
      // Exact match first — matters because collapsing repeats below would
      // otherwise mangle words that are themselves legitimately double-
      // lettered (e.g. "ass" -> "as"), silently defeating the exact check.
      if (BANNED_WORDS.indexOf(t) !== -1) return true;
      // Then a collapsed-repeats fallback, to catch simple letter-stretching
      // ("fuuuuck" -> "fuck") without that trade-off.
      var collapsed = collapseRepeats(t);
      if (collapsed !== t && BANNED_WORDS.indexOf(collapsed) !== -1) return true;
    }
    return false;
  }

  // Maps each pack id to its dedicated, SEO-indexable landing page. Relative
  // (no leading slash / no domain) on purpose — works unchanged whether the
  // site lives at a custom domain root or under a GitHub Pages project
  // subpath, and survives the next rename without an edit.
  var PACK_LANDING = {
    dailydoodle: 'daily-doodle.html',
    monstermaker: 'monster-maker.html',
    themepark: 'theme-park.html'
  };
  // Exposed read-only for header.js, which needs the same map when
  // navigating back to a specific pack from a standalone page (e.g. the
  // Gallery) rather than switching packs in place.
  window.SL_PACK_LANDING = PACK_LANDING;

  // ---------------- Pack registration / lazy loading ----------------
  window.SL_registerPack = function (packDef) {
    packDef.defaultItems = {};
    Object.keys(packDef.categories).forEach(function (k) {
      packDef.defaultItems[k] = packDef.categories[k].items.slice();
    });
    window.SL_PACKS[packDef.id] = packDef;
    if (packDef.id === window.SL_pendingPackLoad) {
      window.SL_pendingPackLoad = null;
      activatePack(packDef.id);
    }
  };

  function loadPack(id) {
    if (window.SL_PACKS[id]) { activatePack(id); return; }
    var manifestEntry = (window.SL_PACK_LIST || []).find(function (p) { return p.id === id; });
    if (!manifestEntry) return;
    window.SL_pendingPackLoad = id;
    var s = document.createElement('script');
    s.src = manifestEntry.src;
    s.defer = true;
    document.body.appendChild(s);
  }

  window.SL_onPackChange = function (id) {
    resetTransientState();
    loadPack(id);
    // Keep the address bar in sync with what's on screen, so a copy-pasted
    // or bookmarked URL after switching packs via the header pills always
    // lands back on the right generator instead of defaulting to Daily
    // Doodle. Note: uses window.history explicitly — the local `history`
    // variable above (recent-results list) shadows the global of the same
    // name in this scope.
    var landing = PACK_LANDING[id];
    if (landing && window.location.pathname.split('/').pop() !== landing) {
      window.history.pushState({ pack: id }, '', landing + window.location.search.replace(/[?&]pack=[^&]*/, '').replace(/^&/, '?'));
    }
  };

  function resetTransientState() {
    history = [];
    currentPlainResult = '';
  }

  function activatePack(id) {
    currentPackId = id;
    window.SL_CURRENT_PACK = id;
    var pack = window.SL_PACKS[id];
    if (holiday !== 'none') { swapHolidayCategoryContent(pack, holiday); }
    if (pack.refreshPools) pack.refreshPools();
    applyAccent(pack.accent);
    if (window.SL_renderHeader) window.SL_renderHeader();
    renderShell(pack);
    // titleTag is the descriptive "what this actually does" copy (matches
    // each page's static <title>/og:title); falls back to the old pattern
    // only if a future pack forgets to set one.
    document.title = pack.titleTag || (pack.label + ' — Disco Doodle');
    playDiscoIntro();
  }

  function applyAccent(accent) {
    var root = document.documentElement;
    root.style.setProperty('--accent', accent.accent);
    root.style.setProperty('--accent-contrast', accent.accentContrast);
    root.style.setProperty('--accent-soft', accent.accentSoft);
  }

  // ---------------- Holiday overlay ----------------
  function holidayAccentColors() {
    if (holiday === 'none') return null;
    return window.SL_HOLIDAY_DATA[holiday].accent;
  }

  function applyHolidayVisuals() {
    var body = document.body;
    body.setAttribute('data-holiday', holiday === 'none' ? '' : holiday);
    var accentEl = document.getElementById('holiday-accent');
    if (accentEl) accentEl.textContent = holiday === 'none' ? '' : window.SL_HOLIDAY_DATA[holiday].accentEmoji;
    var pack = window.SL_PACKS[currentPackId];
    if (!pack) return;
    var hc = holidayAccentColors();
    applyAccent(hc || pack.accent);
  }

  // Which pack.categories key each holidayMap field points at, which
  // SL_HOLIDAY_DATA list feeds it, and whether the swap fully replaces the
  // category's normal items or just blends holiday items into them.
  // "prop" is a full replace (like outfit) specifically so it shows up as a
  // real, noticeable change in Beginner Mode — a partial blend would mostly
  // still show non-holiday items, which is exactly the "overlays don't
  // change beginner mode" complaint this was added to fix.
  var HOLIDAY_SWAP_FIELDS = {
    outfit: { dataKey: 'costumes', mode: 'replace' },
    snack: { dataKey: 'snacks', mode: 'concat' },
    prop: { dataKey: 'props', mode: 'replace' }
  };

  function swapHolidayCategoryContent(pack, newHoliday) {
    if (!pack || !pack.holidayMap) return;
    var backup = holidayBackup[pack.id] || (holidayBackup[pack.id] = {});

    // Revert every previously-swapped category first (if any).
    Object.keys(HOLIDAY_SWAP_FIELDS).forEach(function (field) {
      var key = pack.holidayMap[field];
      if (key && backup[key]) { pack.categories[key].items = backup[key]; delete backup[key]; }
    });

    if (newHoliday === 'none') return;
    var data = window.SL_HOLIDAY_DATA[newHoliday];
    Object.keys(HOLIDAY_SWAP_FIELDS).forEach(function (field) {
      var key = pack.holidayMap[field];
      if (!key || !pack.categories[key]) return;
      var cfg = HOLIDAY_SWAP_FIELDS[field];
      backup[key] = pack.categories[key].items;
      pack.categories[key].items = cfg.mode === 'replace'
        ? data[cfg.dataKey].slice()
        : backup[key].concat(data[cfg.dataKey]);
    });
  }

  function setHoliday(newHoliday) {
    var pack = window.SL_PACKS[currentPackId];
    swapHolidayCategoryContent(pack, newHoliday);
    holiday = newHoliday;
    if (pack.refreshPools) pack.refreshPools();
    applyHolidayVisuals();
    renderColumns(pack);
    renderResultRow(pack);
    document.getElementById('fill-blank').textContent = '';
    hideShare();
  }

  // ---------------- Cross-links to the other 2 packs ----------------
  // Daily Doodle, Monster Maker, and Theme Park Edition stay 3 separate
  // pages (each has its own URL/SEO landing page) — this is just a plain
  // link line pointing at whichever 2 aren't currently showing. Wording
  // flips depending on whether Daily Doodle (the site's default/homepage
  // pack) is the one currently active, or one of the other two.
  function otherPacksLineHtml(pack) {
    var list = window.SL_PACK_LIST || [];
    var others = list.filter(function (p) { return p.id !== pack.id; });
    if (!others.length) return '';
    var heading = pack.id === 'dailydoodle' ? 'Try out our other theme packs:' : 'Our other packs:';
    var links = others.map(function (p) {
      return '<a href="' + PACK_LANDING[p.id] + '" class="other-pack-link">' + p.label + '</a>';
    }).join(' ');
    return '<p class="other-packs-line">' + heading + ' ' + links + '</p>';
  }

  // ---------------- Shell rendering ----------------
  function renderShell(pack) {
    var app = document.getElementById('app');
    app.innerHTML =
      '<h1 class="pack-title">' + pack.label + '</h1>' +
      '<p class="subtitle">' + pack.tagline + '</p>' +
      '<div class="counter-wrap">' +
        '<div class="counter-box">' +
          '<span class="counter-label">SKETCH IDEAS<br>GENERATED</span>' +
          '<span class="counter-digits" id="hit-counter">------</span>' +
        '</div>' +
      '</div>' +
      '<div id="result-row"></div>' +
      '<p id="fill-blank"></p>' +
      '<div class="spin-wrap"><button id="spin-btn">Spin</button></div>' +
      '<div class="share-wrap" id="share-wrap">' +
        '<button id="copy-btn">Copy result</button>' +
        '<button id="save-image-btn">Share your #discodoodle</button>' +
        '<span id="copy-feedback"></span>' +
      '</div>' +
      '<details class="history-wrap" id="history-wrap">' +
        '<summary>Recent results</summary>' +
        '<ul id="history-list"></ul>' +
      '</details>' +
      '<div class="settings-row">' +
        '<div class="mode-toggle" id="mode-toggle">' +
          '<button type="button" class="mode-btn' + (mode === 'beginner' ? ' active' : '') + '" data-mode="beginner">Beginner</button>' +
          '<button type="button" class="mode-btn' + (mode === 'advanced' ? ' active' : '') + '" data-mode="advanced">Advanced</button>' +
        '</div>' +
        '<p class="cat-hint">💡 Tap <strong>Edit Categories</strong> below for maximum customization — add your own ideas, remove ones you don\'t want, and turn categories on/off.</p>' +
      '</div>' +
      '<div class="settings-row">' +
        '<button id="cat-toggle-btn" class="cat-toggle-btn" aria-expanded="false">✏️ Edit Categories</button>' +
        '<button id="holiday-toggle-btn" class="pill-btn" type="button">🎃🎄 Holiday overlay</button>' +
        '<div class="settings-row-break" aria-hidden="true"></div>' +
        '<label class="repeat-toggle"><input type="checkbox" id="avoid-repeats"' + (avoidRepeats ? ' checked' : '') + '> Avoid repeats until all shown</label>' +
        '<button id="sound-toggle" class="sound-btn' + (soundEnabled ? '' : ' muted') + '" aria-pressed="' + soundEnabled + '" aria-label="Toggle sound effects">' + (soundEnabled ? '🔊' : '🔇') + ' Sound</button>' +
      '</div>' +
      '<div id="categories-panel-wrap">' +
        '<div id="pack-extra-controls"></div>' +
        '<div id="categories-panel">' +
          '<div id="columns"></div>' +
          '<div id="holiday-toggle-row">' +
            '<button type="button" class="holiday-chip" data-holiday="none">No overlay</button>' +
            '<button type="button" class="holiday-chip" data-holiday="halloween">🎃 Halloween</button>' +
            '<button type="button" class="holiday-chip" data-holiday="christmas">🎄 Christmas</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      otherPacksLineHtml(pack);

    applyHolidayVisuals();
    wireControls(pack);
    if (pack.renderExtraControls) {
      pack.renderExtraControls(document.getElementById('pack-extra-controls'), function (bonkersOn) {
        if (bonkersOn) {
          mode = 'advanced';
          document.querySelectorAll('#mode-toggle .mode-btn').forEach(function (b) {
            b.classList.toggle('active', b.getAttribute('data-mode') === 'advanced');
          });
          Object.keys(pack.categories).forEach(function (k) { pack.categories[k].active = true; });
        }
        renderColumns(pack);
        renderResultRow(pack);
      });
    }
    renderColumns(pack);
    renderResultRow(pack);
    initCounter();
    updateHolidayChips();
  }

  function updateHolidayChips() {
    document.querySelectorAll('.holiday-chip[data-holiday]').forEach(function (btn) {
      var val = btn.getAttribute('data-holiday');
      btn.classList.toggle('on-halloween', val === 'halloween' && holiday === 'halloween');
      btn.classList.toggle('on-christmas', val === 'christmas' && holiday === 'christmas');
      btn.style.fontWeight = (val === holiday) ? '700' : '400';
    });
  }

  function wireControls(pack) {
    document.querySelectorAll('#mode-toggle .mode-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        mode = btn.getAttribute('data-mode');
        document.querySelectorAll('#mode-toggle .mode-btn').forEach(function (b) { b.classList.toggle('active', b === btn); });
        renderColumns(pack);
        renderResultRow(pack);
        document.getElementById('fill-blank').textContent = '';
        hideShare();
      });
    });
    document.getElementById('avoid-repeats').addEventListener('change', function (e) { avoidRepeats = e.target.checked; });
    document.getElementById('sound-toggle').addEventListener('click', function () {
      soundEnabled = !soundEnabled;
      var btn = document.getElementById('sound-toggle');
      btn.textContent = (soundEnabled ? '🔊' : '🔇') + ' Sound';
      btn.setAttribute('aria-pressed', String(soundEnabled));
      btn.classList.toggle('muted', !soundEnabled);
    });
    var catBtn = document.getElementById('cat-toggle-btn');
    catBtn.addEventListener('click', function () {
      var panel = document.getElementById('categories-panel');
      var open = panel.classList.toggle('open');
      catBtn.classList.toggle('open', open);
      catBtn.setAttribute('aria-expanded', String(open));
    });
    document.getElementById('holiday-toggle-btn').addEventListener('click', function () {
      window.SL_openCategoriesPanel({ scrollToHoliday: true });
    });
    document.querySelectorAll('#holiday-toggle-row .holiday-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setHoliday(btn.getAttribute('data-holiday'));
        updateHolidayChips();
      });
    });
    document.getElementById('spin-btn').addEventListener('click', function () { spin(pack); });
    document.getElementById('copy-btn').addEventListener('click', copyResult);
    document.getElementById('save-image-btn').addEventListener('click', saveImage);
  }

  window.SL_openCategoriesPanel = function (opts) {
    var panel = document.getElementById('categories-panel');
    var btn = document.getElementById('cat-toggle-btn');
    if (!panel || !btn) return;
    panel.classList.add('open');
    btn.classList.add('open');
    btn.setAttribute('aria-expanded', 'true');
    if (opts && opts.scrollToHoliday) {
      var row = document.getElementById('holiday-toggle-row');
      if (row) row.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  // ---------------- Categories (view/edit/toggle/clear/restore) ----------------
  function keysForMode(pack) {
    return mode === 'beginner' ? pack.coreKeys : Object.keys(pack.categories);
  }

  function renderColumns(pack) {
    var wrap = document.getElementById('columns');
    var displayKeys = keysForMode(pack);
    wrap.innerHTML = displayKeys.map(function (key) {
      var cat = pack.categories[key];
      if (cat.active === undefined) cat.active = true;
      var isActive = mode === 'beginner' ? true : cat.active;
      var showToggle = mode === 'advanced';
      return '' +
        '<div class="col-card cat-card ' + (isActive ? '' : 'inactive') + '" id="card-wrap-' + key + '">' +
          '<div class="col-header">' +
            '<div class="col-label"><span>' + cat.icon + '</span>' + cat.label + '</div>' +
            '<div class="col-actions">' +
              '<button id="clear-' + key + '" class="icon-btn" title="Clear all items" aria-label="Clear ' + cat.label + ' items">🗑</button>' +
              '<button id="restore-' + key + '" class="icon-btn" title="Restore suggested items" aria-label="Restore ' + cat.label + ' suggestions">↺</button>' +
              (showToggle ? (
                '<label class="toggle-switch">' +
                  '<input type="checkbox" data-key="' + key + '" ' + (cat.active ? 'checked' : '') + ' aria-label="Include ' + cat.label + '">' +
                  '<span class="track"></span><span class="thumb"></span>' +
                '</label>'
              ) : '') +
            '</div>' +
          '</div>' +
          '<div id="list-' + key + '" class="item-list"></div>' +
          '<div class="add-row">' +
            '<input type="text" id="input-' + key + '" placeholder="Add ' + cat.label.toLowerCase() + '" />' +
            '<button id="add-' + key + '">+</button>' +
          '</div>' +
        '</div>';
    }).join('');

    displayKeys.forEach(function (key) {
      renderItems(pack, key);
      document.getElementById('add-' + key).onclick = function () { addItem(pack, key); };
      document.getElementById('input-' + key).addEventListener('keydown', function (e) { if (e.key === 'Enter') addItem(pack, key); });
      document.getElementById('clear-' + key).onclick = function () { clearCategory(pack, key); };
      document.getElementById('restore-' + key).onclick = function () { restoreCategory(pack, key); };
      var toggleInput = wrap.querySelector('input[data-key="' + key + '"]');
      if (toggleInput) {
        toggleInput.addEventListener('change', function (e) {
          pack.categories[key].active = e.target.checked;
          document.getElementById('card-wrap-' + key).classList.toggle('inactive', !pack.categories[key].active);
          renderResultRow(pack);
          document.getElementById('fill-blank').textContent = '';
          hideShare();
        });
      }
    });
  }

  function renderItems(pack, key) {
    var list = document.getElementById('list-' + key);
    var cat = pack.categories[key];
    list.innerHTML = cat.items.map(function (item, i) {
      return '<div class="item-row"><span>' + item + '</span>' +
        '<button data-key="' + key + '" data-idx="' + i + '" class="rm-btn" aria-label="Remove ' + item + '">x</button></div>';
    }).join('');
    list.querySelectorAll('.rm-btn').forEach(function (btn) {
      btn.onclick = function () {
        var k = btn.getAttribute('data-key');
        var idx = parseInt(btn.getAttribute('data-idx'), 10);
        pack.categories[k].items.splice(idx, 1);
        renderItems(pack, k);
      };
    });
  }

  function addItem(pack, key) {
    var input = document.getElementById('input-' + key);
    var val = input.value.trim();
    if (!val) return;
    if (containsBannedWord(val)) {
      // Native browser validation bubble — no extra markup/CSS needed, and
      // it's a familiar pattern users already know how to dismiss.
      input.setCustomValidity("That word can't be used here — it could end up on a shared image.");
      input.reportValidity();
      input.addEventListener('input', function clearCustomValidity() {
        input.setCustomValidity('');
        input.removeEventListener('input', clearCustomValidity);
      });
      return;
    }
    pack.categories[key].items.push(val);
    input.value = '';
    renderItems(pack, key);
  }

  function clearCategory(pack, key) {
    pack.categories[key].items = [];
    pack.categories[key].remaining = null;
    renderItems(pack, key);
  }

  function restoreCategory(pack, key) {
    // Restoring while a holiday overlay owns this category restores the
    // overlay's own default list; otherwise falls back to the pack default.
    if (holiday !== 'none' && pack.holidayMap && pack.holidayMap.outfit === key) {
      pack.categories[key].items = window.SL_HOLIDAY_DATA[holiday].costumes.slice();
    } else if (holiday !== 'none' && pack.holidayMap && pack.holidayMap.snack === key) {
      var backup = (holidayBackup[pack.id] && holidayBackup[pack.id][key]) || pack.categories[key].items;
      pack.categories[key].items = backup.concat(window.SL_HOLIDAY_DATA[holiday].snacks);
    } else {
      pack.categories[key].items = pack.defaultItems[key].slice();
    }
    pack.categories[key].remaining = null;
    renderItems(pack, key);
  }

  // ---------------- Result row / spin ----------------
  function activeKeys(pack) {
    if (mode === 'beginner') return pack.coreKeys;
    return Object.keys(pack.categories).filter(function (k) { return pack.categories[k].active !== false; });
  }

  function shuffle(arr) {
    var a = arr.slice();
    for (var i = a.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var t = a[i]; a[i] = a[j]; a[j] = t;
    }
    return a;
  }

  function getFinalPick(pack, key) {
    var cat = pack.categories[key];
    if (!avoidRepeats) return cat.items[Math.floor(Math.random() * cat.items.length)];
    if (!cat.remaining || cat.remaining.length === 0) cat.remaining = shuffle(cat.items);
    return cat.remaining.pop();
  }

  function renderResultRow(pack) {
    var active = activeKeys(pack);
    var resultRow = document.getElementById('result-row');
    resultRow.innerHTML = active.map(function (k) {
      return '<div class="result-card" id="card-' + k + '"><span id="text-' + k + '">?</span></div>';
    }).join('');
  }

  function spin(pack) {
    if (pack.beforeSpin) pack.beforeSpin();
    var active = activeKeys(pack);
    var fillBlank = document.getElementById('fill-blank');
    var resultRow = document.getElementById('result-row');
    if (active.length === 0) {
      fillBlank.textContent = '';
      resultRow.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); font-size:14px;">Turn on at least one category to spin</div>';
      return;
    }
    var emptyCat = active.find(function (k) { return pack.categories[k].items.length === 0; });
    if (emptyCat) {
      fillBlank.textContent = '';
      resultRow.innerHTML = '<div style="grid-column:1/-1; text-align:center; color:var(--text-muted); font-size:14px;">Add at least one item to ' + pack.categories[emptyCat].label + '</div>';
      return;
    }
    renderResultRow(pack);
    fillBlank.textContent = '';
    incrementCounter();
    var boopInterval = setInterval(playBoop, 110);
    var finished = {};
    var completed = 0;
    active.forEach(function (k, i) {
      setTimeout(function () { tick(k, 0); }, i * 200);
      function tick(k, ticks) {
        var card = document.getElementById('card-' + k);
        var text = document.getElementById('text-' + k);
        var totalTicks = 12;
        var isFinal = ticks === totalTicks - 1;
        var cat = pack.categories[k];
        var pickVal = isFinal ? getFinalPick(pack, k) : cat.items[Math.floor(Math.random() * cat.items.length)];
        text.textContent = pickVal;
        card.style.transform = ticks % 2 === 0 ? 'rotateX(90deg)' : 'rotateX(0deg)';
        ticks++;
        if (ticks < totalTicks) {
          var progress = ticks / totalTicks;
          var delay = 70 + progress * progress * 160;
          setTimeout(function () { tick(k, ticks); }, delay);
        } else {
          card.style.transform = 'rotateX(0deg)';
          finished[k] = pickVal;
          completed++;
          if (completed === active.length) {
            fillBlank.innerHTML = pack.buildSentence(active, finished, true);
            clearInterval(boopInterval);
            playTada();
            var plainText = pack.buildSentence(active, finished, false);
            showShare(plainText);
            addToHistory(plainText);
          }
        }
      }
    });
  }

  // ---------------- Share / copy ----------------
  function showShare(text) {
    currentPlainResult = text;
    document.getElementById('share-wrap').style.display = 'flex';
    document.getElementById('copy-feedback').textContent = '';
    // Kick off the share image now, in the background, so it's already
    // built by the time someone actually taps Share — see the note by
    // pendingShareBlob above for why this timing matters.
    pendingShareBlob = null;
    var pack = window.SL_PACKS[currentPackId];
    if (pack) {
      buildShareImageBlob(pack).then(function (blob) { pendingShareBlob = blob; }).catch(function (err) {
        console.error('Background share-image build failed (will retry on click):', err);
      });
    }
  }
  function hideShare() {
    var wrap = document.getElementById('share-wrap');
    if (wrap) wrap.style.display = 'none';
    pendingShareBlob = null;
  }
  function copyResult() {
    var shareText = currentPlainResult;
    if (currentCount != null) shareText += ' (Sketch Idea #' + currentCount + ')';
    shareText += ' — via Disco Doodle: ' + SITE_URL;
    navigator.clipboard.writeText(shareText).then(function () {
      var fb = document.getElementById('copy-feedback');
      fb.textContent = 'Copied!';
      setTimeout(function () { fb.textContent = ''; }, 2000);
    }).catch(function () {
      document.getElementById('copy-feedback').textContent = 'Could not copy';
    });
  }

  function loadImage(src) {
    return new Promise(function (resolve, reject) {
      var img = new Image();
      img.onload = function () { resolve(img); };
      img.onerror = reject;
      img.src = src;
    });
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  }
  function wrapCanvasText(ctx, text, maxWidth) {
    var words = text.split(' ');
    var lines = [];
    var current = '';
    words.forEach(function (word) {
      var test = current ? current + ' ' + word : word;
      if (current && ctx.measureText(test).width > maxWidth) { lines.push(current); current = word; }
      else { current = test; }
    });
    if (current) lines.push(current);
    return lines;
  }

  // Brand palette. INK is plain black rather than the site's warm-brown
  // --text-primary (#2e2622) — reads as brown at this size/weight, which
  // isn't what "brand colors" means here.
  var SHARE_BRAND_PINK = '#F4A6C8';
  var SHARE_BRAND_MINT = '#2A9D8F';
  var SHARE_INK = '#000000';
  var SHARE_BORDER = '#e3d6c4';
  var SHARE_CARD_BG = '#ffffff';
  var SHARE_BALL_SRC = '/android-chrome-512x512.png';

  // Canvas has no -webkit-text-stroke — this reproduces the site logo's
  // outlined-letter look (see .dd-logo-line in style.css) by stroking each
  // segment before filling it, same as the CSS paint-order: stroke fill.
  function fillOutlinedText(ctx, text, x, y, fillColor, strokeWidth) {
    ctx.lineWidth = strokeWidth;
    ctx.strokeStyle = SHARE_INK;
    ctx.lineJoin = 'round';
    ctx.strokeText(text, x, y);
    ctx.fillStyle = fillColor;
    ctx.fillText(text, x, y);
  }

  async function buildShareImageBlob(pack) {
    var W = 1080;
    try {
      await Promise.all([
        document.fonts.load('400 70px Shrikhand'),
        document.fonts.load('600 40px Poppins'),
        document.fonts.load('700 26px Poppins')
      ]);
      await document.fonts.ready;
    } catch (e) { /* fallback ok — draws with a system font instead */ }

    var ballImg = null;
    try { ballImg = await loadImage(SHARE_BALL_SRC); } catch (e) { /* drawn without it below */ }

    var measure = document.createElement('canvas').getContext('2d');
    var cardWidth = 880, cardPadX = 60, cardPadY = 56, fontSize = 40;
    measure.font = '600 ' + fontSize + 'px Poppins, -apple-system, Helvetica, Arial, sans-serif';
    var sentenceText = currentPlainResult || 'Your Disco Doodle idea awaits...';
    var lines = wrapCanvasText(measure, sentenceText, cardWidth - cardPadX * 2);
    var lineHeight = Math.round(fontSize * 1.35);
    var cardHeight = cardPadY * 2 + lines.length * lineHeight;
    var cardX = W / 2 - cardWidth / 2, cardY = 260;
    var H = Math.max(640, cardY + cardHeight + 140);
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');

    var hc = holidayAccentColors();
    var accent = hc || pack.accent;
    ctx.fillStyle = accent.accentSoft; ctx.fillRect(0, 0, W, H);

    // Giant disco ball, deliberately bigger than the card so it overflows
    // past its edges — drawn before the card/wordmark (so those still sit
    // on top, fully legible) but at near-full opacity so it actually reads
    // as "a disco ball," not a faint watermark. A real PNG rather than the
    // 🪩 emoji glyph, same reasoning as the site logo fix: emoji rendering
    // is inconsistent across devices, the actual icon is consistent
    // everywhere.
    if (ballImg) {
      var ballSize = cardWidth * 1.3;
      ctx.save();
      ctx.globalAlpha = 0.92;
      ctx.drawImage(ballImg, W / 2 - ballSize / 2, cardY + cardHeight / 2 - ballSize / 2, ballSize, ballSize);
      ctx.restore();
    }

    // ---- Wordmark: "disco" (pink) "doodle" (mint) [disco-ball dot] "com"
    // (black) — lowercase and outlined, matching the real site logo
    // (.dd-logo-line: lowercase text, -webkit-text-stroke outline) instead
    // of plain title-case unoutlined text. ----
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.font = '400 70px Shrikhand, cursive';
    var wmY = 140;
    var wmStroke = 70 * 0.09;
    var segDisco = 'disco ', segDoodle = 'doodle';
    var dotSize = 44, dotGap = 8;
    var wDisco = ctx.measureText(segDisco).width;
    var wDoodle = ctx.measureText(segDoodle).width;
    var wCom = ctx.measureText('com').width;
    var totalW = wDisco + wDoodle + dotGap + dotSize + dotGap + wCom;
    var wmX = W / 2 - totalW / 2;
    fillOutlinedText(ctx, segDisco, wmX, wmY, SHARE_BRAND_PINK, wmStroke); wmX += wDisco;
    fillOutlinedText(ctx, segDoodle, wmX, wmY, SHARE_BRAND_MINT, wmStroke); wmX += wDoodle + dotGap;
    if (ballImg) ctx.drawImage(ballImg, wmX, wmY - dotSize * 0.86, dotSize, dotSize);
    wmX += dotSize + dotGap;
    fillOutlinedText(ctx, 'com', wmX, wmY, SHARE_BRAND_PINK, wmStroke);

    // ---- Prompt card ----
    ctx.save(); ctx.shadowColor = 'rgba(46,38,34,0.16)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 8;
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.fillStyle = SHARE_CARD_BG; ctx.fill(); ctx.restore();
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.strokeStyle = SHARE_BORDER; ctx.lineWidth = 1.5; ctx.stroke();

    ctx.fillStyle = SHARE_INK; ctx.textAlign = 'center';
    ctx.font = '600 ' + fontSize + 'px Poppins, -apple-system, Helvetica, Arial, sans-serif';
    var ty = cardY + cardPadY + fontSize * 0.8;
    lines.forEach(function (line) { ctx.fillText(line, W / 2, ty); ty += lineHeight; });

    // ---- Bottom-right: which pack this idea came from ----
    ctx.font = '700 26px Poppins, -apple-system, Helvetica, Arial, sans-serif';
    ctx.fillStyle = accent.accent; ctx.textAlign = 'right';
    ctx.fillText(pack.wordmark, W - 36, H - 36);

    return new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
  }

  function shareOrDownloadBlob(pack, blob, btn, fb, originalLabel) {
    if (!blob) {
      fb.textContent = 'Could not create image';
      btn.disabled = false; btn.textContent = originalLabel;
      return;
    }
    var uniqueId = Date.now() + '' + Math.floor(Math.random() * 900 + 100);
    var filename = 'discodoodle-' + pack.id + (currentCount != null ? '-' + currentCount : '') + '-' + uniqueId + '.png';
    var file;
    try { file = new File([blob], filename, { type: 'image/png' }); } catch (e) { file = null; }

    // Native share sheet when the browser can share files (iOS Safari 15+,
    // most modern mobile browsers) — this is what actually gives a one-tap
    // "Save Image" (straight to Photos, not Files) and lets someone share
    // directly to Messages/Instagram/etc. Must be called synchronously here,
    // right off the click — no await before it — or iOS silently refuses it
    // once the click's "transient activation" window has passed.
    if (file && navigator.canShare && navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Disco Doodle', text: currentPlainResult || 'My Disco Doodle idea' })
        .then(function () {
          fb.textContent = 'Shared!';
          setTimeout(function () { fb.textContent = ''; }, 2500);
        })
        .catch(function (err) {
          // AbortError = they just closed the share sheet — not a failure.
          if (!err || err.name !== 'AbortError') {
            console.error('Share failed:', err);
            fb.textContent = 'Could not share';
          }
        })
        .finally(function () { btn.disabled = false; btn.textContent = originalLabel; });
      return;
    }

    // Desktop / no file-sharing support — plain download.
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
    fb.textContent = 'Image saved!';
    setTimeout(function () { fb.textContent = ''; }, 2500);
    btn.disabled = false; btn.textContent = originalLabel;
  }

  function saveImage() {
    var pack = window.SL_PACKS[currentPackId];
    var btn = document.getElementById('save-image-btn');
    var fb = document.getElementById('copy-feedback');
    var originalLabel = btn.textContent;

    // Last-resort backstop — addItem() already keeps flagged words out of
    // the category pool, so this should never actually trigger in normal
    // use. It's here in case a flagged word ever reaches currentPlainResult
    // some other way, since this is the one place text gets baked into a
    // brand-plastered image that leaves the site.
    if (containsBannedWord(currentPlainResult)) {
      fb.textContent = "Can't share this one — spin again or tweak your categories.";
      setTimeout(function () { fb.textContent = ''; }, 3000);
      return;
    }

    btn.disabled = true;

    if (pendingShareBlob) {
      // Already built in the background (see showShare) — share/download
      // happens immediately, synchronously, preserving iOS's activation
      // window for navigator.share().
      shareOrDownloadBlob(pack, pendingShareBlob, btn, fb, originalLabel);
      return;
    }

    // Rare fallback: background build hasn't finished yet (very fast tap)
    // or failed outright. Building it now means real async delay before we
    // can act, so — deliberately — we only ever download in this path
    // rather than attempt navigator.share(), which would likely be silently
    // refused by iOS at this point anyway.
    btn.textContent = 'Preparing…';
    buildShareImageBlob(pack).then(function (blob) {
      var uniqueId = Date.now() + '' + Math.floor(Math.random() * 900 + 100);
      var filename = 'discodoodle-' + pack.id + (currentCount != null ? '-' + currentCount : '') + '-' + uniqueId + '.png';
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 4000);
      fb.textContent = 'Image saved!';
      setTimeout(function () { fb.textContent = ''; }, 2500);
    }).catch(function (e) {
      console.error('Share image failed:', e);
      fb.textContent = 'Could not create image';
    }).finally(function () { btn.disabled = false; btn.textContent = originalLabel; });
  }

  // ---------------- History ----------------
  function addToHistory(text) {
    history.unshift(text);
    history = history.slice(0, 3);
    renderHistory();
  }
  function renderHistory() {
    var wrap = document.getElementById('history-wrap');
    var list = document.getElementById('history-list');
    if (history.length === 0) { wrap.style.display = 'none'; return; }
    wrap.style.display = 'block';
    list.innerHTML = history.map(function (h) { return '<li>' + h + '</li>'; }).join('');
  }

  // ---------------- Disco Doodle intro (plays once per page load) ----------------
  // Fires the first time any pack activates on this page — i.e. once on
  // real load, never again when switching packs via the header pills, since
  // discoIntroPlayed only flips once per page (a fresh page load resets it,
  // which is exactly "once per visit" rather than "once ever" or "every
  // pack switch"). Purely decorative: wrapped in try/catch and gated on the
  // existing sound toggle so it can never break the generator itself.
  var discoIntroPlayed = false;
  var DISCO_COLORS = ['#ff2d95', '#00e5ff', '#ffe600', '#a832ff', '#ff8a00', '#39ff6a'];

  function playDiscoIntro() {
    if (discoIntroPlayed) return;
    discoIntroPlayed = true;
    try {
      var reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      var wrap = document.createElement('div');
      wrap.id = 'dd-disco-intro';
      wrap.setAttribute('aria-hidden', 'true');

      var ball = document.createElement('div');
      ball.id = 'dd-disco-ball';
      ball.textContent = '🪩';
      wrap.appendChild(ball);

      if (!reduceMotion) {
        var spotCount = 14;
        for (var i = 0; i < spotCount; i++) {
          var spot = document.createElement('div');
          spot.className = 'dd-light-spot';
          var color = DISCO_COLORS[i % DISCO_COLORS.length];
          spot.style.background = 'radial-gradient(circle, ' + color + ' 0%, transparent 70%)';
          spot.style.left = Math.round(Math.random() * 90) + 'vw';
          spot.style.top = Math.round(Math.random() * 80) + 'vh';
          spot.style.animationDelay = (Math.random() * 0.8) + 's, ' + (Math.random() * 2) + 's';
          wrap.appendChild(spot);
        }
      }

      document.body.appendChild(wrap);
      playDiscoSound();

      // Ball drops + lands around 0.7s in; whole spectacle (ball + light
      // spots) reads as "about 3 seconds" per the brief, then fades and
      // removes itself so it never lingers or gets in the way.
      setTimeout(function () { wrap.classList.add('dd-fade-out'); }, 2500);
      setTimeout(function () { if (wrap.parentNode) wrap.remove(); }, 3200);
    } catch (e) {
      console.error('Disco intro failed:', e);
    }
  }

  function playDiscoSound() {
    if (!soundEnabled) return;
    try {
      var ctx = getAudioCtx();
      var now = ctx.currentTime;

      // Low "drop" thump timed to land right as the ball hits bottom.
      var kick = ctx.createOscillator(), kickGain = ctx.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(160, now + 0.55);
      kick.frequency.exponentialRampToValueAtTime(45, now + 0.72);
      kickGain.gain.setValueAtTime(0.0001, now + 0.55);
      kickGain.gain.exponentialRampToValueAtTime(0.35, now + 0.58);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.85);
      kick.connect(kickGain).connect(ctx.destination);
      kick.start(now + 0.55); kick.stop(now + 0.9);

      // Sparkly ascending arpeggio (C5-E5-G5-B5-D6) right after the drop.
      var notes = [523.25, 659.25, 783.99, 987.77, 1174.66];
      notes.forEach(function (freq, i) {
        var start = now + 0.6 + i * 0.09;
        var osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, start);
        gain.gain.exponentialRampToValueAtTime(0.14, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.4);
        osc.connect(gain).connect(ctx.destination);
        osc.start(start); osc.stop(start + 0.45);
      });

      // Funky filtered "wah" bass stab underneath, swept via a lowpass
      // filter for the classic disco/funk wah-wah color.
      var bass = ctx.createOscillator(), bassGain = ctx.createGain(), filter = ctx.createBiquadFilter();
      bass.type = 'sawtooth';
      bass.frequency.value = 110;
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(300, now + 0.6);
      filter.frequency.exponentialRampToValueAtTime(1800, now + 0.75);
      filter.frequency.exponentialRampToValueAtTime(300, now + 1.1);
      bassGain.gain.setValueAtTime(0.0001, now + 0.6);
      bassGain.gain.exponentialRampToValueAtTime(0.18, now + 0.65);
      bassGain.gain.exponentialRampToValueAtTime(0.0001, now + 1.15);
      bass.connect(filter).connect(bassGain).connect(ctx.destination);
      bass.start(now + 0.6); bass.stop(now + 1.2);
    } catch (e) {
      console.error('Disco sound failed:', e);
    }
  }

  // ---------------- Synthesized sound (identical to original apps) ----------------
  function getAudioCtx() {
    if (!window._slAudioCtx) window._slAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    var ctx = window._slAudioCtx;
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function playBoop() {
    if (!soundEnabled) return;
    var ctx = getAudioCtx();
    var osc = ctx.createOscillator(), gain = ctx.createGain();
    osc.type = 'square'; osc.frequency.value = 520;
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.connect(gain).connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + 0.08);
  }
  function playTada() {
    if (!soundEnabled) return;
    var ctx = getAudioCtx();
    var notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach(function (freq, i) {
      var start = ctx.currentTime + i * 0.09;
      var osc = ctx.createOscillator(), gain = ctx.createGain();
      osc.type = 'triangle'; osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.18, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.35);
      osc.connect(gain).connect(ctx.destination);
      osc.start(start); osc.stop(start + 0.4);
    });
  }

  // ---------------- Shared counter (Firebase Realtime Database) ----------------
  // Reuses the existing daily-doodle-b7c57 project as the single source of
  // truth. On first ever load of the new counter path, it seeds itself from
  // the SUM of the legacy /counters/dailyDoodle and /counters/monsterMaker
  // values (read-only — the legacy paths are never written to again), so the
  // running total is preserved rather than reset to zero.
  function formatCount(n) { return String(n).padStart(6, '0'); }

  function initCounter() {
    var counterEl = document.getElementById('hit-counter');
    if (currentCount != null) { counterEl.textContent = formatCount(currentCount); return; }
    fetch(DB_URL + COUNTER_PATH).then(function (r) { return r.json(); }).then(function (value) {
      if (value != null) { currentCount = value; counterEl.textContent = formatCount(currentCount); return; }
      return Promise.all([
        fetch(DB_URL + '/counters/dailyDoodle.json').then(function (r) { return r.json(); }).catch(function () { return 0; }),
        fetch(DB_URL + '/counters/monsterMaker.json').then(function (r) { return r.json(); }).catch(function () { return 0; })
      ]).then(function (vals) {
        var seed = (vals[0] || 0) + (vals[1] || 0);
        return fetch(DB_URL + COUNTER_PATH, {
          method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(seed)
        }).then(function (r) { return r.json(); });
      }).then(function (value) { currentCount = value; counterEl.textContent = formatCount(currentCount); });
    }).catch(function (err) {
      console.error('Sketch Ideas counter fetch failed:', err);
      counterEl.textContent = '------';
    });
  }

  function incrementCounter() {
    var counterEl = document.getElementById('hit-counter');
    fetch(DB_URL + COUNTER_PATH, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ '.sv': { increment: 1 } })
    }).then(function (r) { return r.json(); })
      .then(function (value) { currentCount = value; if (counterEl) counterEl.textContent = formatCount(value); })
      .catch(function (err) { console.error('Sketch Ideas counter increment failed:', err); });
  }

  window.SL_getActiveHoliday = function () { return holiday; };

  // ---------------- Boot ----------------
  window.SL_boot = function (defaultPackId) {
    var params = new URLSearchParams(window.location.search);
    var requested = params.get('pack');
    var valid = (window.SL_PACK_LIST || []).some(function (p) { return p.id === requested; });
    loadPack(valid ? requested : defaultPackId);
  };
})();
