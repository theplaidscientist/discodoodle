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

  var DISNEY_CHARACTERS = ["Mickey Mouse", "Minnie Mouse", "Donald Duck", "Goofy", "Pluto", "Daisy Duck", "Chip & Dale", "Stitch", "Winnie the Pooh", "Tigger"];
  var UNIVERSAL_CHARACTERS = ["Cat in the Hat", "E.T.", "Jaws", "King Kong", "T-Rex (Jurassic Park)", "Spider-Man", "Harry Potter", "Minions", "Shrek", "Optimus Prime"];

  var DISNEY_SNACKS = ["Popcorn", "Churro", "Turkey Leg", "Mickey Pretzel", "Mickey Ice Cream Bar", "Mickey Ice Cream Sandwich", "Dole Whip", "The Grey Stuff", "Mickey Beignet", "Citrus Swirl"];
  var UNIVERSAL_SNACKS = ["Butterbeer", "The \"Big Pink\" Lard Lad Donut", "Green Eggs and Ham", "Pumpkin Juice", "Chocolate Frog", "Moose Juice & Goose Juice", "Krusty Burger", "Fire-Breathing Dragon's Egg", "Butterbeer Fudge", "Cinnamon Toast Crunch French Toast"];

  // Attractions + meet-and-greets, combined into one Attraction/Location pool per park.
  var PARK_LOCATIONS = {
    'Magic Kingdom': [
      "TRON Lightcycle / Run", "Seven Dwarfs Mine Train", "Space Mountain", "Big Thunder Mountain Railroad",
      "The Haunted Mansion", "Pirates of the Caribbean", "Tiana's Bayou Adventure", "Peter Pan's Flight",
      "Meet-and-Greet: Mickey Mouse", "Meet-and-Greet: Cinderella", "Meet-and-Greet: Tiana", "Meet-and-Greet: Rapunzel", "Meet-and-Greet: Ariel"
    ],
    'EPCOT': [
      "Guardians of the Galaxy: Cosmic Rewind", "Remy's Ratatouille Adventure", "Frozen Ever After",
      "Soarin' Around the World", "Test Track", "Spaceship Earth",
      "Meet-and-Greet: Figment", "Meet-and-Greet: Joy", "Meet-and-Greet: Anna & Elsa", "Meet-and-Greet: Donald Duck", "Meet-and-Greet: Mickey Mouse"
    ],
    'Hollywood Studios': [
      "Star Wars: Rise of the Resistance", "Slinky Dog Dash", "The Twilight Zone Tower of Terror",
      "Mickey & Minnie's Runaway Railway", "Millennium Falcon: Smugglers Run", "Rock 'n' Roller Coaster Starring The Muppets", "Toy Story Mania!",
      "Meet-and-Greet: Darth Vader / Kylo Ren", "Meet-and-Greet: Chewbacca", "Meet-and-Greet: Woody & Jessie", "Meet-and-Greet: Edna Mode", "Meet-and-Greet: Sorcerer Mickey & Red Carpet Minnie"
    ],
    'Animal Kingdom': [
      "Avatar Flight of Passage", "Expedition Everest – Legend of the Forbidden Mountain", "Kilimanjaro Safaris",
      "Na'vi River Journey", "Festival of the Lion King",
      "Meet-and-Greet: Mickey & Minnie Mouse in Safari Gear", "Meet-and-Greet: Moana", "Meet-and-Greet: Kevin", "Meet-and-Greet: Donald Duck", "Meet-and-Greet: Timon & Rafiki"
    ],
    'Universal Studios Florida': [
      "Harry Potter and the Escape from Gringotts", "Revenge of the Mummy", "E.T. Adventure", "MEN IN BLACK Alien Attack",
      "TRANSFORMERS: The Ride-3D", "Despicable Me Minion Mayhem", "The Bourne Stuntacular",
      "Meet-and-Greet: Optimus Prime / Bumblebee / Megatron", "Meet-and-Greet: SpongeBob SquarePants & Patrick Star", "Meet-and-Greet: Illumination's Minions", "Meet-and-Greet: The Simpsons Family", "Meet-and-Greet: Doc Brown"
    ],
    'Islands of Adventure': [
      "Hagrid's Magical Creatures Motorbike Adventure", "Jurassic World VelociCoaster", "Harry Potter and the Forbidden Journey",
      "The Incredible Hulk Coaster", "The Amazing Adventures of Spider-Man", "Jurassic Park River Adventure", "Dudley Do-Right's Ripsaw Falls",
      "Meet-and-Greet: Spider-Man & Marvel Super Heroes", "Meet-and-Greet: Blue the Raptor", "Meet-and-Greet: Captain America", "Meet-and-Greet: The Grinch & Cat in the Hat", "Meet-and-Greet: Betty Boop / Popeye"
    ],
    'Epic Universe': [
      "Harry Potter and the Battle at the Ministry", "Stardust Racers", "Monsters Unchained: The Frankenstein Experiment",
      "Mario Kart: Bowser's Challenge", "Mine-Cart Madness with Donkey Kong", "Dragon Racer's Rally",
      "Meet-and-Greet: Mario & Luigi", "Meet-and-Greet: Princess Peach", "Meet-and-Greet: Toad", "Meet-and-Greet: Frankenstein's Monster & The Bride", "Meet-and-Greet: Hiccup & Toothless"
    ]
  };

  var ACTIONS = ["Eating", "Posing With", "Riding", "Sharing", "Spilling", "Chasing", "Photographing", "Waiting In Line For", "Hugging", "Dancing Near"];
  var OUTFITS = ["Mickey Ears", "Matching Family Shirts", "Poncho (Just In Case)", "Fanny Pack", "Sun Hat", "Cooling Towel", "Autograph Book & Lanyard", "Light-Up Spinner Toy", "Sunglasses", "Glow Necklace"];
  var MOODS = ["Excited", "Sweaty", "Overjoyed", "Exhausted", "Starstruck", "Hangry", "Determined", "Giddy", "Overstimulated", "Blissed Out"];

  var ALL_PARKS = DISNEY_PARKS.concat(UNIVERSAL_PARKS);

  var categories = {
    character: { label: "Character", icon: "🎭", items: [] },
    action: { label: "Action", icon: "🏃", items: ACTIONS.slice() },
    snack: { label: "Snack", icon: "🍿", items: [] },
    outfit: { label: "Outfit", icon: "🎽", items: OUTFITS.slice() },
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
    var verbPhrase = active.indexOf('action') !== -1 ? 'is ' + result.action.toLowerCase() : 'is enjoying';
    var snackPhrase = active.indexOf('snack') !== -1 ? ('a ' + wrap(result.snack)) : 'a snack';
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
  var preBonkersParks = null;

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

  function anyToggled() { return ALL_PARKS.some(function (p) { return toggledParks[p]; }); }

  // Recompute character/snack/attraction pools right before each spin so the
  // shared engine's normal "pick a random item from categories[key].items"
  // logic keeps working unmodified for every other pack.
  function refreshPools() {
    if (!anyToggled()) {
      categories.character.items = [];
      categories.snack.items = [];
      categories.attraction.items = [];
      return;
    }
    if (bonkers) {
      // Full chaos: every toggled park's content, no universe separation.
      categories.character.items = DISNEY_CHARACTERS.concat(UNIVERSAL_CHARACTERS);
      categories.snack.items = DISNEY_SNACKS.concat(UNIVERSAL_SNACKS);
      var allLocs = [];
      ALL_PARKS.forEach(function (p) { if (toggledParks[p]) allLocs = allLocs.concat(PARK_LOCATIONS[p] || []); });
      categories.attraction.items = allLocs;
      return;
    }
    var universe = pickUniverse();
    if (!universe) { categories.character.items = []; categories.snack.items = []; categories.attraction.items = []; return; }
    categories.character.items = universe === 'disney' ? DISNEY_CHARACTERS.slice() : UNIVERSAL_CHARACTERS.slice();
    categories.snack.items = universe === 'disney' ? DISNEY_SNACKS.slice() : UNIVERSAL_SNACKS.slice();
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
    holidayMap: { outfit: 'outfit', snack: 'snack' },
    // Pools are recomputed only when park toggles / Bonkers change (see
    // renderExtraControls below), not on every spin — so any custom items a
    // user adds to Character/Snack/Attraction persist between spins, same
    // editing pattern as every other pack.
    renderExtraControls: renderExtraControls,
    isBonkers: function () { return bonkers; }
  });
})();
