# Disco Doodle — Color & Font Rescheme

This package restyles the whole site (generator pages, Gallery, Submit, and Admin) to match the Disco Doodle brand style guide: the peach/pink/mint palette and the Shrikhand + Poppins font pairing.

This is cumulative — it includes everything from the previous domain-setup package too, so you can apply it directly without applying that one first. It also supersedes the first version of this color package — the pink was wrong in that one (see note below), this version fixes it.

## How to apply it

Same drag-and-drop flow as last time: unzip this package, drag everything into your local `discodoodle` repo folder in File Explorer (overwrite when asked), then in GitHub Desktop review the changes, commit, and push.

## A correction: the pink hex code in your style guide was wrong

Your style guide image labeled "Gentle Pink (Bubblegum Pink)" with the hex `#E76F51` — but that hex is actually a coral/orange-red, not pink at all. I used that literal hex in the first version of this package, which is why the colors looked off. I went back and sampled the actual pixel color from the pink swatch and the logo/UI mockup in your image directly, and it's a true pastel pink — around `#F4A6C8`. The peach (`#F4A261`) and mint (`#2A9D8F`) hex codes were both accurate to their swatches, so those didn't change. This version uses the corrected pink everywhere the palette shows up: the logo, Daily Doodle's pack accent, and buttons/pills that inherit the default accent.

## What changed

**Logo.** The header brand mark is the stacked "disco / doodle" wordmark in Shrikhand, left-justified, with a dark outline and the pink/mint two-tone coloring from the style guide, plus the disco ball accent. It scales up to the full 120px from the guide on a normal desktop window, and scales smoothly down on narrower screens so it never breaks the layout on mobile. It's also a link back to the homepage now, since it's the biggest thing in the header. It appears identically on every page — generator packs, Gallery, Submit, and Admin.

**Fonts.** Shrikhand is used only for that logo wordmark. Poppins replaces both of the old fonts (Russo One and Open Sans) everywhere else — body text, page headings, and all the pill/capsule buttons (pack switcher, Spin button, mode toggles, category chips, submit button, etc.).

**Color palette.** The three corrected brand colors:

- Peach Highlight `#F4A261`
- Gentle Pink `#F4A6C8`
- Mint Green `#2A9D8F`

The site already had an "each pack gets its own accent color" system built in, so I kept that structure and mapped one brand color to each pack — the three packs stay visually distinct while all three stay strictly on your palette:

- Daily Doodle → Pink
- Monster Maker → Mint
- Theme Park Edition → Peach

The overall page background, cards, and text colors shifted from the old cool gray palette to a warm cream/charcoal palette that sits comfortably with all three brand colors.

**Gallery page.** Its moody dark theme is untouched in spirit (still dark, still the wood-look picture frames), but its accent color moved from the old gold to your brand Peach, and it now uses Poppins/Shrikhand like everywhere else.

One small honesty note: the pastel pink and peach are both fairly light, so as plain text/outline color on a white pill (like the pack-switcher buttons) they read a little soft rather than high-contrast. It's legible and matches your actual brand swatch faithfully, but if you'd rather have punchier, higher-contrast pill text, I can add a slightly deepened shade of the same pink/peach hue used just for text while keeping the true pastel for the bigger fills (logo, buttons) — just say the word.

## What I deliberately left alone (and why)

- **The shareable result-card image** (the PNG people get when they hit "Save Image" or share a result) uses its own background color and its own font (Anton) baked into a canvas drawing, separate from the website's CSS. Left untouched for now — happy to redesign that to match as its own follow-up.
- **The Gallery's picture-frame gradient** (the warm wood-tone border around each piece of art) is a deliberate "physical frame" effect, not a brand color — left as-is rather than forcing it into pink/mint.
- **The disco-ball intro animation's confetti colors** are intentionally a full rainbow, like a real disco light show — left alone rather than restricting to 3 colors.
- **Seasonal holiday chip colors** (Halloween orange, Christmas red/green) are functional/seasonal, not brand colors, so untouched.

## What's still queued up separately

The bigger structural changes — the left-sidebar pack menu with mobile hamburger collapse, killing the Gallery's auto-scroll, and making the gallery images bigger (especially on mobile) — are still their own separate piece of work. Say the word whenever you're ready for that one.
