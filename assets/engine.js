/* Sketch Lab Central — shared generator engine.
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
  var holiday = 'none'; // 'none' | 'halloween' | 'christmas'
  var holidayBackup = {}; // packId -> { key: items[] } saved before overlay swap

  var SITE_URL = 'https://theplaidscientist.github.io/sketchlab/';
  var DB_URL = 'https://daily-doodle-b7c57-default-rtdb.firebaseio.com';
  var COUNTER_PATH = '/counters/sketchIdeas.json';

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

  function swapHolidayCategoryContent(pack, newHoliday) {
    if (!pack || !pack.holidayMap) return;
    var backup = holidayBackup[pack.id] || (holidayBackup[pack.id] = {});
    var outfitKey = pack.holidayMap.outfit;
    var snackKey = pack.holidayMap.snack;

    // Revert previous overlay first (if any)
    if (outfitKey && backup[outfitKey]) { pack.categories[outfitKey].items = backup[outfitKey]; delete backup[outfitKey]; }
    if (snackKey && backup[snackKey]) { pack.categories[snackKey].items = backup[snackKey]; delete backup[snackKey]; }

    if (newHoliday === 'none') return;
    var data = window.SL_HOLIDAY_DATA[newHoliday];
    if (outfitKey && pack.categories[outfitKey]) {
      backup[outfitKey] = pack.categories[outfitKey].items;
      pack.categories[outfitKey].items = data.costumes.slice();
    }
    if (snackKey && pack.categories[snackKey]) {
      backup[snackKey] = pack.categories[snackKey].items;
      pack.categories[snackKey].items = backup[snackKey].concat(data.snacks);
    }
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
        '<button id="save-image-btn">📱 Share to social media</button>' +
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
        '<p class="cat-hint">💡 Advanced also unlocks full editing — tap <strong>Edit Categories</strong> below to add, remove, or customize any list.</p>' +
      '</div>' +
      '<div class="settings-row">' +
        '<label class="repeat-toggle"><input type="checkbox" id="avoid-repeats"' + (avoidRepeats ? ' checked' : '') + '> Avoid repeats until all shown</label>' +
        '<button id="sound-toggle" class="sound-btn' + (soundEnabled ? '' : ' muted') + '" aria-pressed="' + soundEnabled + '" aria-label="Toggle sound effects">' + (soundEnabled ? '🔊' : '🔇') + ' Sound</button>' +
        '<button id="cat-toggle-btn" class="cat-toggle-btn" aria-expanded="false">✏️ Edit Categories</button>' +
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
      '</div>';

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
  }
  function hideShare() {
    var wrap = document.getElementById('share-wrap');
    if (wrap) wrap.style.display = 'none';
  }
  function copyResult() {
    var shareText = currentPlainResult;
    if (currentCount != null) shareText += ' (Sketch Idea #' + currentCount + ')';
    shareText += ' — via Sketch Lab Central: ' + SITE_URL;
    navigator.clipboard.writeText(shareText).then(function () {
      var fb = document.getElementById('copy-feedback');
      fb.textContent = 'Copied!';
      setTimeout(function () { fb.textContent = ''; }, 2000);
    }).catch(function () {
      document.getElementById('copy-feedback').textContent = 'Could not copy';
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

  async function buildShareImageBlob(pack) {
    var W = 1080;
    try { await document.fonts.load('400 84px Anton'); await document.fonts.ready; } catch (e) { /* fallback ok */ }
    var measure = document.createElement('canvas').getContext('2d');
    var cardWidth = 880, cardPadX = 60, cardPadY = 56, fontSize = 40;
    measure.font = '600 ' + fontSize + 'px -apple-system, Helvetica, Arial, sans-serif';
    var sentenceText = currentPlainResult || 'Your Sketch Lab idea awaits...';
    var lines = wrapCanvasText(measure, sentenceText, cardWidth - cardPadX * 2);
    var lineHeight = Math.round(fontSize * 1.35);
    var cardHeight = cardPadY * 2 + lines.length * lineHeight;
    var cardX = W / 2 - cardWidth / 2, cardY = 300;
    var H = Math.max(680, cardY + cardHeight + 160);
    var canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    var ctx = canvas.getContext('2d');

    var hc = holidayAccentColors();
    var bg = hc ? hc.accentSoft : pack.bgColor;
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.save(); ctx.globalAlpha = 0.10; ctx.font = '220px sans-serif'; ctx.textAlign = 'left';
    ctx.fillText(hc ? window.SL_HOLIDAY_DATA[holiday].accentEmoji : '✏️', -30, 260);
    ctx.textAlign = 'right'; ctx.font = '200px sans-serif';
    ctx.fillText('🎨', W + 30, H - 20); ctx.restore();

    ctx.textAlign = 'center'; ctx.fillStyle = 'rgba(20,20,20,0.85)';
    ctx.font = '400 76px Anton, sans-serif';
    ctx.fillText(pack.wordmark, W / 2, 150);

    var badgeText = currentCount != null ? 'SKETCH IDEA #' + currentCount : '✨ FRESH IDEA';
    ctx.font = '600 30px -apple-system, Helvetica, Arial, sans-serif';
    var badgePadX = 28, badgeH = 56;
    var badgeW = ctx.measureText(badgeText).width + badgePadX * 2;
    var badgeX = W / 2 - badgeW / 2, badgeY = 190;
    drawRoundedRect(ctx, badgeX, badgeY, badgeW, badgeH, badgeH / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.95)'; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.stroke();
    ctx.fillStyle = '#2c2c2a'; ctx.textBaseline = 'middle';
    ctx.fillText(badgeText, W / 2, badgeY + badgeH / 2 + 2); ctx.textBaseline = 'alphabetic';

    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.14)'; ctx.shadowBlur = 26; ctx.shadowOffsetY = 8;
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.restore();
    drawRoundedRect(ctx, cardX, cardY, cardWidth, cardHeight, 20);
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1; ctx.stroke();

    ctx.fillStyle = '#2c2c2a'; ctx.textAlign = 'center';
    ctx.font = '600 ' + fontSize + 'px -apple-system, Helvetica, Arial, sans-serif';
    var ty = cardY + cardPadY + fontSize * 0.8;
    lines.forEach(function (line) { ctx.fillText(line, W / 2, ty); ty += lineHeight; });

    ctx.font = '400 24px -apple-system, Helvetica, Arial, sans-serif';
    ctx.fillStyle = 'rgba(20,20,20,0.5)'; ctx.textAlign = 'right';
    ctx.fillText('Sketch Lab Central — ' + SITE_URL.replace('https://', ''), W - 36, H - 36);

    return new Promise(function (resolve) { canvas.toBlob(resolve, 'image/png'); });
  }

  function saveImage() {
    var pack = window.SL_PACKS[currentPackId];
    var btn = document.getElementById('save-image-btn');
    var fb = document.getElementById('copy-feedback');
    btn.disabled = true;
    var originalLabel = btn.textContent;
    btn.textContent = 'Preparing…';
    buildShareImageBlob(pack).then(function (blob) {
      if (!blob) throw new Error('no blob');
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      var uniqueId = Date.now() + '' + Math.floor(Math.random() * 900 + 100);
      a.download = 'sketchlab-' + pack.id + (currentCount != null ? '-' + currentCount : '') + '-' + uniqueId + '.png';
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
    loadPack(defaultPackId);
  };
})();
