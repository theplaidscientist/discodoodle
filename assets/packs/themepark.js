/* Sketch Lab Central — Theme Park Edition pack (new)
   Template: [Character] [Action]-ing a [Snack] at/on [Attraction]
   Beginner (default): Character, Snack, Attraction/Location
   Advanced adds: Action, Outfit, Mood
   Bonkers: all 6 on, every park toggled, Disney/Universal mix freely (no
   universe separation at all). Outside Bonkers, a single "universe" (Disney
   or Universal) is chosen per spin, weighted by how many parks from each
   brand are toggled on, so results stay thematically coherent by default. */
(function () {

  var DISNEY_PARKS = ['Magic Kingdom', 'EPCOT', 'Hollywood Studios', 'Animal Kingdom'];
  var UNIVERSAL_PARKS = ['Universal Studios Florida', 'Islands of Adventure', 'Epic Universe'];

  // "General" roster — classic/flagship characters treated as roaming every
  // park of their brand (this is how they actually work in real life: Mickey
  // shows up at Magic Kingdom AND EPCOT AND Hollywood Studios, etc.).
  var DISNEY_CHARACTERS = ["Mickey Mouse", "Minnie Mouse", "Donald Duck", "Goofy", "Pluto", "Daisy Duck", "Chip & Dale", "Stitch", "Winnie the Pooh", "Tigger"];
  var UNIVERSAL_CHARACTERS = ["Cat in the Hat", "E.T.", "Jaws", "King Kong", "T-Rex (Jurassic Park)", "Spider-Man", "Harry Potter", "Minions", "Shrek", "Optimus Prime"];

  // Park-specific characters — only show up when that exact park is toggled
  // (this is where the former "Meet-and-Greet:" entries live now). Deduped
  // against the general roster above (e.g. Mickey Mouse isn't repeated here).
  var PARK_CHARACTERS = {
    'Magic Kingdom': ["Cinderella", "Tiana", "Rapunzel", "Ariel"],
    'EPCOT': ["Figment", "Joy", "Anna & Elsa"],
    'Hollywood Studios': ["Darth Vader / Kylo Ren", "Chewbacca", "Woody & Jessie", "Edna Mode", "Sorcerer Mickey & Red Carpet Minnie"],
    'Animal Kingdom': ["Mickey & Minnie Mouse in Safari Gear", "Moana", "Kevin", "Timon & Rafiki"],
    'Universal Studios Florida': ["SpongeBob SquarePants & Patrick Star", "The Simpsons Family", "Doc Brown", "Bumblebee & Megatron"],
    'Islands of Adventure': ["Marvel Super Heroes", "Blue the Raptor", "Captain America", "The Grinch", "Betty Boop / Popeye"],
    'Epic Universe': ["Mario & Luigi", "Princess Peach", "Toad", "Frankenstein's Monster & The Bride", "Hiccup & Toothless"]
  };

  // Snacks stay brand-wide (every Disney park shares the same snack pool,
  // every Universal park shares the same snack pool) — not park-specific.
  var DISNEY_SNACKS = ["Popcorn", "Churro", "Turkey Leg", "Mickey Pretzel", "Mickey Ice Cream Bar", "Mickey Ice Cream Sandwich", "Dole Whip", "The Grey Stuff", "Mickey Beignet", "Citrus Swirl"];
  var UNIVERSAL_SNACKS = ["Butterbeer", "The \"Big Pink\" Lard Lad Donut", "Green Eggs and Ham", "Pumpkin Juice", "Chocolate Frog", "Moose Juice & Goose Juice", "Krusty Burger", "Fire-Breathing Dragon's Egg", "Butterbeer Fudge", "Cinnamon Toast Crunch French Toast"];

  // Attraction/Location pool per park — rides only now (meet-and-greets
  // moved into PARK_CHARACTERS above).
  var PARK_LOCATIONS = {
    'Magic Kingdom': [
      "TRON Lightcycle / Run", "Seven Dwarfs Mine Train", "Space Mountain", "Big Thunder Mountain Railroad",
      "The Haunted Mansion", "Pirates of the Caribbean", "Tiana's Bayou Adventure", "Peter Pan's Flight"
    ],
    'EPCOT': [
      "Guardians of the Galaxy: Cosmic Rewind", "Remy's Ratatouille Adventure", "Frozen Ever After",
      "Soarin' Around the World", "Test Track", "Spaceship Earth"
    ],
    'Hollywood Studios': [
      "Star Wars: Rise of the Resistance", "Slinky Dog Dash", "The Twilight Zone Tower of Terror",
      "Mickey & Minnie's Runaway Railway", "Millennium Falcon: Smugglers Run", "Rock 'n' Roller Coaster Starring The Muppets", "Toy Story Mania!"
    ],
    'Animal Kingdom': [
      "Avatar Flight of Passage", "Expedition Everest – Legend of the Forbidden Mountain", "Kilimanjaro Safaris",
      "Na'vi River Journey", "Festival of the Lion King"
    ],
    'Universal Studios Florida': [
      "Harry Potter and the Escape from Gringotts", "Revenge of the Mummy", "E.T. Adventure", "MEN IN BLACK Alien Attack",
      "TRANSFORMERS: The Ride-3D", "Despicable Me Minion Mayhem", "The Bourne Stuntacular"
    ],
    'Islands of Adventure': [
      "Hagrid's Magical Creatures Motorbike Adventure", "Jurassic World VelociCoaster", "Harry Potter and the Forbidden Journey",
      "The Incredible Hulk Coaster", "The Amazing Adventures of Spider-Man", "Jurassic Park River Adventure", "Dudley Do-Right's Ripsaw Falls"
    ],
    'Epic Universe': [
      "Harry Potter and the Battle at the Ministry", "Stardust Racers", "Monsters Unchained: The Frankenstein Experiment",
      "Mario Kart: Bowser's Challenge", "Mine-Cart Madness with Donkey Kong", "Dragon Racer's Rally"
    ]
  };

  var ACTIONS = ["Eating", "Posing With", "Sharing", "Spilling", "Chasing", "Photographing", "Waiting In Line For", "Hugging", "Guarding", "Savoring"];
  // Used instead of ACTIONS whenever a holiday overlay is on — the normal
  // verbs are food-specific ("Eating", "Savoring", "Spilling"), which reads
  // fine for a snack but not for a Skull or an Ornament. These work for
  // any object, holiday or not.
  var HOLIDAY_ACTIONS = ["Holding", "Showing Off", "Admiring", "Carrying", "Posing With", "Guarding"];
  // Outfit is mostly generic (works at any park), except Mickey Ears —
  // that's Disney-branded and should only appear when a Disney park (or
  // Bonkers Mode) is active, same treatment as Character/Snack/Attraction.
  var GENERAL_OUTFITS = ["Matching Family Shirts", "Poncho (Just In Case)", "Fanny Pack", "Sun Hat", "Cooling Towel", "Autograph Book & Lanyard", "Light-Up Spinner Toy", "Sunglasses", "Glow Necklace"];
  var DISNEY_OUTFITS = ["Mickey Ears"];
  var MOODS = ["Excited", "Sweaty", "Overjoyed", "Exhausted", "Starstruck", "Determined", "Giddy"];

  function uniq(arr) {
    var seen = {}, out = [];
    arr.forEach(function (x) { if (!seen[x]) { seen[x] = true; out.push(x); } });
    return out;
  }

  var ALL_PARKS = DISNEY_PARKS.concat(UNIVERSAL_PARKS);

  var categories = {
    character: { label: "Character", icon: "🎭", items: [] },
    action: { label: "Action", icon: "🏃", items: ACTIONS.slice() },
    snack: { label: "Snack", icon: "🍿", items: [] },
    outfit: { label: "Outfit", icon: "🎽", items: [] },
    mood: { label: "Mood", icon: "😆", items: MOODS.slice() },
    attraction: { label: "Attraction/Location", icon: "🎢", items: [] }
  };

  function buildSentence(active, result, htmlMode) {
    if (active.length === 0) return '';
    var wrap = function (s) { return htmlMode ? '<strong>' + s + '</strong>' : s; };
    var character = active.indexOf('character') !== -1 ? wrap(result.character) : 'Someone';
    var pieces = [character];
    if (active.indexOf('outfit') !== -1) pieces.push('dressed in ' + wrap(result.outfit));
    if (active.indexOf('mood') !== -1) pieces.push('feeling ' + wrap(result.mood));
    var lead = pieces.join(', ');
    var holidayOn = window.SL_getActiveHoliday && window.SL_getActiveHoliday() !== 'none' && window.SL_getActiveHoliday();
    // Beginner Mode never has "action" active, so this default is what
    // actually shows up there — "enjoying" reads fine for a snack, but not
    // for an Ornament or a Skull, so it switches to "holding" whenever a
    // holiday overlay has taken over the Snack slot.
    var verbPhrase = active.indexOf('action') !== -1 ? 'is ' + result.action.toLowerCase() : (holidayOn ? 'is holding' : 'is enjoying');
    var snackPhrase = active.indexOf('snack') !== -1 ? ('a ' + wrap(result.snack)) : (holidayOn ? 'a treat' : 'a snack');
    var locPhrase = active.indexOf('attraction') !== -1 ? ('at ' + wrap(result.attraction)) : '';
    var sentence = lead + ' ' + verbPhrase + ' ' + snackPhrase;
    if (locPhrase) sentence += ' ' + locPhrase;
    sentence += '.';
    return sentence;
  }

  // ---- Park toggle + Bonkers state, owned by this pack ----
  var toggledParks = {}; // parkName -> bool
  ALL_PARKS.forEach(function (p) { toggledParks[p] = (p === 'Magic Kingdom'); }); // sensible default: one park on
  var bonkers = false;
  var preBonkersParks = null; // snapshot of toggledParks taken when Bonkers turns on, restored when it turns off

  function brandOf(park) { return DISNEY_PARKS.indexOf(park) !== -1 ? 'disney' : 'universal'; }
  function toggledOfBrand(brand) { return ALL_PARKS.filter(function (p) { return toggledParks[p] && brandOf(p) === brand; }); }

  function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

  function pickUniverse() {
    var disneyOn = toggledOfBrand('disney').length;
    var universalOn = toggledOfBrand('universal').length;
    if (disneyOn === 0 && universalOn === 0) return null;
    if (disneyOn === 0) return 'universal';
    if (universalOn === 0) return 'disney';
    return Math.random() < disneyOn / (disneyOn + universalOn) ? 'disney' : 'universal';
  }

  function locationsForUniverse(universe) {
    var parks = universe === 'disney' ? toggledOfBrand('disney') : toggledOfBrand('universal');
    var out = [];
    parks.forEach(function (p) { out = out.concat(PARK_LOCATIONS[p] || []); });
    return out;
  }

  // General roster (always available once any park of that brand is on) +
  // park-specific extras for exactly the toggled parks of that brand.
  function charactersForUniverse(universe) {
    var general = universe === 'disney' ? DISNEY_CHARACTERS : UNIVERSAL_CHARACTERS;
    var parks = universe === 'disney' ? toggledOfBrand('disney') : toggledOfBrand('universal');
    var extra = [];
    parks.forEach(function (p) { extra = extra.concat(PARK_CHARACTERS[p] || []); });
    return uniq(general.concat(extra));
  }

  function anyToggled() { return ALL_PARKS.some(function (p) { return toggledParks[p]; }); }

  // Current holiday overlay's prop items (null if no overlay active, meaning
  // "use the normal Snack pool"). Since Snack is one of the three Beginner
  // Mode core categories, swapping it entirely — not just blending a few
  // holiday items in — is what actually makes the overlay show up in
  // Beginner Mode, not just Advanced. Read fresh every time so the Snack
  // pool always reflects the live overlay state, even after a park toggle
  // rebuilds the pool from scratch.
  function activeHolidayProps() {
    var h = window.SL_getActiveHoliday && window.SL_getActiveHoliday();
    if (h && h !== 'none' && window.SL_HOLIDAY_DATA && window.SL_HOLIDAY_DATA[h]) {
      return window.SL_HOLIDAY_DATA[h].props.slice();
    }
    return null;
  }

  // Holiday costumes take over Outfit entirely when the overlay is on
  // (returns null when no overlay is active, meaning "use the normal pool").
  function activeHolidayCostumes() {
    var h = window.SL_getActiveHoliday && window.SL_getActiveHoliday();
    if (h && h !== 'none' && window.SL_HOLIDAY_DATA && window.SL_HOLIDAY_DATA[h]) {
      return window.SL_HOLIDAY_DATA[h].costumes.slice();
    }
    return null;
  }

  // Recompute character/snack/attraction/outfit pools right before each spin
  // so the shared engine's normal "pick a random item from
  // categories[key].items" logic keeps working unmodified for every other
  // pack. Outfit is computed here (not via the generic engine-level holiday
  // swap) because its base content — Mickey Ears or not — already depends
  // on which parks are toggled, same as Snack.
  function refreshPools() {
    var holidayProps = activeHolidayProps();
    var holidayCostumes = activeHolidayCostumes();
    if (holidayCostumes) {
      categories.outfit.items = holidayCostumes;
    } else {
      var disneyActive = bonkers || toggledOfBrand('disney').length > 0;
      categories.outfit.items = GENERAL_OUTFITS.concat(disneyActive ? DISNEY_OUTFITS : []);
    }
    // The Snack slot becomes a general holiday prop when an overlay is on,
    // so relabel it (and swap Action to holding-appropriate verbs) so the
    // rest of the UI/sentence doesn't keep calling an Ornament a "snack".
    categories.snack.label = holidayProps ? 'Holiday Prop' : 'Snack';
    categories.snack.icon = holidayProps ? '🎁' : '🍿';
    categories.action.items = holidayProps ? HOLIDAY_ACTIONS.slice() : ACTIONS.slice();
    if (!anyToggled()) {
      categories.character.items = [];
      categories.snack.items = holidayProps || [];
      categories.attraction.items = [];
      return;
    }
    if (bonkers) {
      // Full chaos: every toggled park's content, no universe separation.
      var allChars = DISNEY_CHARACTERS.concat(UNIVERSAL_CHARACTERS);
      ALL_PARKS.forEach(function (p) { if (toggledParks[p]) allChars = allChars.concat(PARK_CHARACTERS[p] || []); });
      categories.character.items = uniq(allChars);
      categories.snack.items = holidayProps || DISNEY_SNACKS.concat(UNIVERSAL_SNACKS);
      var allLocs = [];
      ALL_PARKS.forEach(function (p) { if (toggledParks[p]) allLocs = allLocs.concat(PARK_LOCATIONS[p] || []); });
      categories.attraction.items = allLocs;
      return;
    }
    var universe = pickUniverse();
    if (!universe) { categories.character.items = []; categories.snack.items = holidayProps || []; categories.attraction.items = []; return; }
    categories.character.items = charactersForUniverse(universe);
    categories.snack.items = holidayProps || (universe === 'disney' ? DISNEY_SNACKS.slice() : UNIVERSAL_SNACKS.slice());
    categories.attraction.items = locationsForUniverse(universe);
  }
  refreshPools();

  function renderExtraControls(container, rerenderColumns) {
    var html = '<div class="park-toggles">';
    html += '<div class="park-group"><p class="park-group-label">Disney Parks</p><div class="park-chip-row">';
    DISNEY_PARKS.forEach(function (p) {
      html += '<button type="button" class="park-chip' + (toggledParks[p] ? ' on' : '') + '" data-park="' + p + '">' + p + '</button>';
    });
    html += '</div></div>';
    html += '<div class="park-group"><p class="park-group-label">Universal Parks</p><div class="park-chip-row">';
    UNIVERSAL_PARKS.forEach(function (p) {
      html += '<button type="button" class="park-chip' + (toggledParks[p] ? ' on' : '') + '" data-park="' + p + '">' + p + '</button>';
    });
    html += '</div></div></div>';
    html += '<div class="bonkers-row"><button type="button" id="bonkers-btn" class="bonkers-btn' + (bonkers ? ' on' : '') + '">🎡 Bonkers Mode' + (bonkers ? ' — ON' : '') + '</button></div>';
    container.innerHTML = html;
    container.querySelectorAll('.park-chip').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.getAttribute('data-park');
        toggledParks[p] = !toggledParks[p];
        refreshPools();
        renderExtraControls(container, rerenderColumns);
        if (rerenderColumns) rerenderColumns(bonkers);
      });
    });
    var bonkersBtn = container.querySelector('#bonkers-btn');
    if (bonkersBtn) {
      bonkersBtn.addEventListener('click', function () {
        bonkers = !bonkers;
        if (bonkers) {
          preBonkersParks = {};
          ALL_PARKS.forEach(function (p) { preBonkersParks[p] = toggledParks[p]; });
          ALL_PARKS.forEach(function (p) { toggledParks[p] = true; });
        } else if (preBonkersParks) {
          ALL_PARKS.forEach(function (p) { toggledParks[p] = preBonkersParks[p]; });
          preBonkersParks = null;
        }
        refreshPools();
        renderExtraControls(container, rerenderColumns);
        if (rerenderColumns) rerenderColumns(bonkers);
      });
    }
  }

  window.SL_registerPack({
    id: 'themepark',
    label: 'Theme Park Edition',
    tagline: 'Disney & Universal drawing prompts!',
    instruction: 'Toggle your parks below, then hit spin.',
    accent: { accent: '#8a1fbf', accentContrast: '#ffffff', accentSoft: '#f1defc' },
    categories: categories,
    coreKeys: ['character', 'snack', 'attraction'],
    advancedForcesKeys: ['action', 'outfit', 'mood'], // bonkers turns all 6 on
    buildSentence: buildSentence,
    wordmark: 'THEME PARK EDITION',
    bgColor: '#3a1a4d',
    watermark: 'Sketch Lab Central — Theme Park Edition',
    resultLabel: 'Sketch Idea',
    // Snack and Outfit are both handled entirely by refreshPools() (base
    // pool + park-dependent extras + current holiday content, if any)
    // rather than the generic engine-level swap, since their base content
    // already changes with park toggles.
    holidayMap: { outfit: null, snack: null },
    // Pools are recomputed only when park toggles / Bonkers change (see
    // renderExtraControls below) or the Holiday Overlay changes, not on
    // every spin — so any custom items a user adds to Character/Attraction
    // persist between spins, same editing pattern as every other pack.
    renderExtraControls: renderExtraControls,
    refreshPools: refreshPools,
    isBonkers: function () { return bonkers; }
  });
})();
