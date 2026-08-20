/* Disco Doodle — Daily Doodle pack
   Preserves every original category/item from theplaidscientist.github.io/dailydoodle/
   exactly (order-preserved), "supersized" to up to 10 items per category as requested.
   New items appended after the originals are marked below. */
(function () {
  var categories = {
    animal: {
      label: "Animal", icon: "🐾",
      items: ["Octopus", "Raccoon", "Owl", "Fox", "Turtle", "Penguin", /* new: */ "Sloth", "Hedgehog", "Dolphin", "Chameleon"]
    },
    job: {
      label: "Occupation", icon: "💼",
      items: ["Detective", "Chef", "Astronaut", "Librarian", "Pirate", "DJ", "Wizard", "Scientist", "Barista", "Ninja"]
    },
    prop: {
      label: "Prop", icon: "🎁",
      items: ["Umbrella", "Teacup", "Boombox", "Skateboard", "Lantern", "Camera", "Balloon", "Trophy", "Kite", "Magnifying Glass"]
    },
    vehicle: {
      label: "Vehicle", icon: "🚗",
      items: ["Spaceship", "Car", "Zeppelin", "Scooter", "Bike", "Boat", "Train", "Motorcycle", "Hoverboard", "Sled"]
    },
    style: {
      label: "Style", icon: "🎨",
      items: ["Anime", "Disney-style", "Looney Tunes", "Chibi", "Comic Book", "Retro 90s Cartoon", "Watercolor Storybook", "Pixel Art", "Pop Art", "Cyberpunk"]
    },
    medium: {
      label: "Medium", icon: "✏️",
      items: ["Pencil", "Digital", "Ink", "Color", "Sketch", "Watercolor", "Charcoal", "Acrylic", "Marker", "Crayon"]
    },
    outfit: {
      label: "Outfit", icon: "👕",
      items: ["Hoodie", "Sweater", "T-Shirt", "Superhero Spandex", "Pajamas", "Tuxedo", "Raincoat", "Wizard Robe", "Scuba Suit", "Ski Gear"]
    },
    mood: {
      label: "Mood", icon: "😊",
      items: ["Happy", "Sad", "Angry", "Sleepy", "Surprised", "Nervous", "Excited", "Confused", "Proud", "Curious"]
    },
    setting: {
      label: "Setting", icon: "🏞️",
      items: ["Woods", "Space", "Inside", "Beach", "Castle", "City Street", "Jungle", "Underwater", "Mountaintop", "Carnival"]
    }
  };

  function buildSentence(active, result, htmlMode) {
    if (active.length === 0) return '';
    var wrap = function (s) { return htmlMode ? '<strong>' + s + '</strong>' : s; };
    var lead = [];
    if (active.indexOf('medium') !== -1) lead.push(wrap(result.medium));
    if (active.indexOf('style') !== -1) lead.push(wrap(result.style) + '-style');
    var leadStr = lead.length ? lead.join(' ') + ' drawing of ' : '';
    var subject = [];
    if (active.indexOf('job') !== -1) subject.push(wrap(result.job));
    if (active.indexOf('animal') !== -1) subject.push(wrap(result.animal));
    var subjectStr = subject.length ? subject.join(' ') : 'doodle';
    var extras = [];
    if (active.indexOf('outfit') !== -1) extras.push('wearing a ' + wrap(result.outfit));
    if (active.indexOf('prop') !== -1) extras.push('with a ' + wrap(result.prop));
    if (active.indexOf('vehicle') !== -1) extras.push('riding a ' + wrap(result.vehicle));
    if (active.indexOf('mood') !== -1) extras.push('looking ' + wrap(result.mood));
    if (active.indexOf('setting') !== -1) extras.push('in the ' + wrap(result.setting));
    var sentence = 'Your daily doodle idea is a ' + leadStr + subjectStr;
    if (extras.length) sentence += ' ' + extras.join(', ');
    sentence += '.';
    return sentence;
  }

  window.SL_registerPack({
    id: 'dailydoodle',
    label: 'Daily Doodle',
    tagline: 'Ideas for your Noodle!',
    // Used for the browser tab title / share-sheet preview instead of the
    // old "Daily Doodle — Disco Doodle" (two "Doodle"s back to back read as
    // redundant) — says what the tool actually does instead.
    titleTag: 'Daily Doodle — free drawing prompt generator',
    instruction: 'Add your own items, then hit spin.',
    accent: { accent: '#F4A6C8', accentContrast: '#2E2622', accentSoft: '#FBE0EA' },
    categories: categories,
    coreKeys: ['animal', 'job', 'prop'],
    buildSentence: buildSentence,
    wordmark: 'DAILY DOODLE',
    holidayMap: { outfit: 'outfit', snack: null, prop: 'prop' }
  });
})();
