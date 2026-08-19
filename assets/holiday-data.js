/* Disco Doodle — Holiday Overlay data (opt-in only, never auto-enabled).
   Same editing pattern as every other category: toggle, view/edit list,
   remove items, add custom ones, Clear/Restore. */
window.SL_HOLIDAY_DATA = {
  halloween: {
    label: 'Halloween',
    accent: { accent: '#ff8c1a', accentContrast: '#1a0e00', accentSoft: '#ffe1bd' },
    costumes: ["Pumpkin Costume", "Silly Witch Hat & Cape", "Friendly Vampire Cape", "Skeleton Pajamas", "Candy Corn Costume", "Goofy Mummy Wrap", "Black Cat Ears & Tail", "Scarecrow Outfit", "Ghost Bedsheet Costume", "Cute Frankenstein-Style Costume"],
    snacks: ["Pumpkin Spice Churro", "Pumpkin Spice Mickey Pretzel", "Candy Corn", "Halloween Cupcake", "Jack Skellington Cookie", "Caramel Apple", "Halloween Popcorn Bucket", "Pumpkin Spice Latte", "Mummy Dog", "Witch's Brew Slushie"],
    // Held/near-you items — this is what actually shows up in Beginner
    // Mode (via each pack's Prop-equivalent category), since Beginner
    // skips the Categories panel entirely.
    props: ["Candy", "Pumpkin", "Halloween Mask", "Cauldron", "Silly Ghost", "Candy Corn", "Spider Web", "Bat", "Skull", "Broomstick"],
    accentEmoji: '👻'
  },
  christmas: {
    label: 'Christmas',
    accent: { accent: '#b5153b', accentContrast: '#ffffff', accentSoft: '#ffd7de' },
    costumes: ["Santa Suit", "Reindeer Antlers & Nose", "Elf Outfit", "Snowman Costume", "Nutcracker Uniform", "Gingerbread Costume", "Ugly Christmas Sweater", "Mrs. Claus Dress", "Snow Gear (Coat & Mittens)", "Holiday Pajamas"],
    snacks: ["Christmas Tree Cupcake", "Gingerbread Cookie", "Hot Cocoa", "Peppermint Mickey Pretzel", "Candy Cane", "Mickey's Very Merry Cookie", "Holiday Cookie Trio", "Yule Log", "Christmas Popcorn Bucket", "Sugarplum Treat"],
    props: ["Christmas Present", "Sugar Cookie", "Ornament", "Snowflake", "Christmas Tree", "Candy Cane", "Stocking", "Santa Hat", "Wreath", "Gingerbread Man"],
    accentEmoji: '🎄'
  }
};
