/* Disco Doodle — Monster Maker pack
   Preserves every original category/item from theplaidscientist.github.io/monstermaker/
   exactly (order-preserved), "supersized" to up to 10 items per category. Eyestalks
   stays Yes/No since it's a binary trait, not a pick-list. */
(function () {
  var categories = {
    eyeballs: {
      label: "Eyeballs", icon: "👀",
      items: ["No Eyes", "One Eye", "Two Eyes", "Three Eyes", "Five Eyes", "A Dozen Eyes", "Seven Eyes", "One Big Eye in the Middle", "Eyes All Over", "Glowing Eyes"]
    },
    horns: {
      label: "Horns", icon: "😈",
      items: ["No Horns", "One Horn", "Two Horns", "Three Horns", "Four Horns", "A Crown of Horns", "Spiral Horns", "Tiny Nub Horns", "Antler-Like Horns", "Horns That Light Up"]
    },
    skinTexture: {
      label: "Skin Texture", icon: "🖐️",
      items: ["Hairy", "Slimy", "Scaly", "Bumpy", "Fuzzy", "Leathery", "Rubbery", "Crystalline", "Furry", "Rocky"]
    },
    armStyle: {
      label: "Arm Style", icon: "💪",
      items: ["Tentacles", "Hands", "Hooves", "Claws", "Wings", "Fins", "Pincers", "Noodle Arms", "Robotic Arms", "Paws"]
    },
    eyestalks: {
      label: "Eyestalks", icon: "🐌",
      items: ["Yes", "No"]
    },
    pattern: {
      label: "Pattern", icon: "🎨",
      items: ["Stripes", "Spots", "Plaid", "Polka Dots", "Camouflage", "Swirls", "Zigzags", "Galaxy Print", "Checkerboard", "Rainbow"]
    },
    vibe: {
      label: "Vibe", icon: "🎭",
      items: ["Silly", "Scary", "Sleepy", "Grumpy", "Curious", "Mischievous", "Majestic", "Shy", "Hyper", "Chill"]
    },
    // A "what's it holding" category, added specifically so the Holiday
    // Overlay has something to swap in Beginner Mode — Halloween/Christmas
    // items (candy corn, ornaments, etc.) take over this list entirely
    // when an overlay is active, same as Daily Doodle's Prop category.
    prop: {
      label: "Holding", icon: "🎁",
      items: ["Slime Ball", "Squishy Toy", "Bug Snack", "Rubber Duck", "Mystery Potion", "Old Sock", "Shiny Rock", "Broken Umbrella", "Half-Eaten Sandwich", "Glowing Orb"]
    }
  };

  function buildSentence(active, result, htmlMode) {
    if (active.length === 0) return '';
    var wrap = function (s) { return htmlMode ? '<strong>' + s + '</strong>' : s; };

    var headBits = [];
    if (active.indexOf('eyeballs') !== -1) headBits.push(wrap(result.eyeballs));
    if (active.indexOf('horns') !== -1) headBits.push(wrap(result.horns));

    var bodyBits = [];
    if (active.indexOf('skinTexture') !== -1) bodyBits.push(wrap(result.skinTexture) + ' skin');
    if (active.indexOf('pattern') !== -1) bodyBits.push('a ' + wrap(result.pattern) + ' pattern');
    if (active.indexOf('armStyle') !== -1) bodyBits.push(wrap(result.armStyle) + ' for arms');
    if (active.indexOf('eyestalks') !== -1 && result.eyestalks === 'Yes') bodyBits.push('wiggly eyestalks');
    if (active.indexOf('prop') !== -1) bodyBits.push('holding a ' + wrap(result.prop));

    var tailBits = [];
    if (active.indexOf('vibe') !== -1) tailBits.push('totally ' + wrap(result.vibe));

    var sentence = 'Your monster';
    if (headBits.length) sentence += ' has ' + headBits.join(' and ');
    if (bodyBits.length) {
      sentence += headBits.length ? ', with ' : ' has ';
      sentence += bodyBits.join(', ');
    }
    if (tailBits.length) {
      sentence += (headBits.length || bodyBits.length) ? ', and is feeling ' : ' is feeling ';
      sentence += tailBits.join(' and ');
    }
    sentence += '.';
    return sentence;
  }

  window.SL_registerPack({
    id: 'monstermaker',
    label: 'Monster Maker',
    tagline: 'Ideas for your Monster!',
    instruction: 'Add your own items, then hit spin.',
    accent: { accent: '#2A9D8F', accentContrast: '#ffffff', accentSoft: '#DDF2EE' },
    categories: categories,
    coreKeys: ['eyeballs', 'horns', 'skinTexture', 'prop'],
    buildSentence: buildSentence,
    wordmark: 'MONSTER MAKER',
    bgColor: '#6f7a3f',
    watermark: 'Disco Doodle — Monster Maker',
    resultLabel: 'Sketch Idea',
    holidayMap: { outfit: null, snack: null, prop: 'prop' }
  });
})();
