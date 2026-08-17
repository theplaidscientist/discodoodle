/* Sketch Lab Central — universal header
   Injects identical header markup on every page. Single source of truth so
   navigating between packs (or any standalone page, e.g. an Inspiration
   Gallery) never feels like a different site. */
(function () {
  function injectHeader() {
    var mount = document.getElementById('sl-header-mount');
    if (!mount) return;

    var packs = window.SL_PACK_LIST || [
      { id: 'dailydoodle', label: 'Daily Doodle' }
    ];
    var current = window.SL_CURRENT_PACK || packs[0].id;

    var options = packs.map(function (p) {
      var selected = p.id === current ? ' selected' : '';
      return '<option value="' + p.id + '"' + selected + '>' + p.label + '</option>';
    }).join('');

    mount.innerHTML =
      '<header id="sl-header">' +
        '<div class="sl-brand"><span class="sl-dot" aria-hidden="true"></span>Sketch Lab Central</div>' +
        '<div id="pack-select-wrap">' +
          '<select id="pack-select" aria-label="Choose a generator pack">' + options + '</select>' +
        '</div>' +
      '</header>' +
      '<div id="holiday-accent" aria-hidden="true"></div>';

    var select = document.getElementById('pack-select');
    if (select && typeof window.SL_onPackChange === 'function') {
      select.addEventListener('change', function (e) {
        window.SL_onPackChange(e.target.value);
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', injectHeader);
  } else {
    injectHeader();
  }

  // Exposed so the shell can re-render the select after packs load lazily.
  window.SL_renderHeader = injectHeader;
})();
