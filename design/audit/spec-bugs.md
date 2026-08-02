# spec-bugs.md — gaps found building spec-test.html from the design package alone

Method: a fresh implementer built an article-pattern page using ONLY
`DESIGN_LANGUAGE.md`, `design-tokens.json`, `tokens.css`,
`COMPONENT_SPECIFICATIONS.md`, `PAGE_PATTERNS.md`. Every place the five documents
forced a guess is an entry. Format: **[SB-N]** what I needed · where I looked ·
what was missing/ambiguous · what I guessed.

---

**[SB-1] Chapter names/URLs/descriptions.** Needed the 6 chapter labels for the nav
and the chapters block · DESIGN_LANGUAGE §7, COMPONENT_SPECS §1/§22, PAGE_PATTERNS
E9 · All four say the header, dropdowns, and chapters block render from "one
constant (`core.js` CHAPTERS)" — but the constant's contents are never reproduced
in the design docs, and core.js is outside the package. A doc set that claims to be
self-sufficient externalizes its own IA · Invented six titles (Overview / Map /
Companies / Economics / Regulation / Media) and six descriptions.

**[SB-2] Font loading and the wdth mechanism.** Needed Archivo, IBM Plex Mono,
Source Serif 4 actually rendering · token `type.family`, DESIGN_LANGUAGE §21
("fonts load with `display=swap` today") · No @font-face, no URLs, no self-host
paths, no subset list anywhere in the five docs — the page renders in fallback
stacks. Also "Archivo `wdth`: 118/112" names an axis value but never the CSS
mechanism (`font-stretch` vs `font-variation-settings`) · Used fallbacks +
`font-stretch: 118%/112%`, which is a no-op on system fonts.

**[SB-3] CONTRADICTION — metric numeral face.** Needed the E4 stat-band numeral
face · PAGE_PATTERNS E4: "**mono** numeral at `var(--head-metric)`" vs
COMPONENT_SPECS §13: "Numeral: **display face**, `--head-metric`, weight 600" ·
Direct conflict between the two binding docs · Followed §13 (display), since
COMPONENT_SPECS is named the per-component authority.

**[SB-4] Heading weights per rank.** Needed font-weight for H1/H2/H3 · type.weight
$doc ("400 prose / 500 quiet-medium / 600 chrome / 700 emphasis / 800 display"),
heading tokens (give size/leading/track/wdth but not weight) · "800 display" is the
only heading weight statement; section-H2, prose-H3, article-H1, utility-H1 weights
are nowhere · Guessed 800 for H1, 700 for H2/H3.

**[SB-5] Numbered-H2 number format.** Needed how "numbered H2s" render ·
PAGE_PATTERNS E2/§3.8 ("H2s are numbered"), chapters block uses mono `01`–`06` ·
No format given: `1.` vs `01` vs a mono prefix in a different face; whether the
number counts toward the sentence-form/terminal-period rule is also unstated ·
Guessed plain inline "1. " inside the display-face heading.

**[SB-6] Standfirst face and colour.** Needed the standfirst's family/colour · E1
gives size (`--fs-lg`), leading, measure, char budget — not family or colour;
DESIGN_LANGUAGE §5 implies display ("Display argues (headings, standfirsts)") ·
Family only derivable by cross-reading a principles doc; colour (--ink vs --ink-2)
never stated · Display face, `--ink-2`.

**[SB-7] Micro-spacing is largely unspecified.** Needed eyebrow→H1, H1→standfirst,
paragraph spacing, H2→prose, tint-band internal padding · DESIGN_LANGUAGE §10 gives
"eyebrow→heading stays in the 22–24px relationship the audit measured" — a range,
not a token, and 22 is not on the 2/4/6/8/12/16/24/32/48 ladder · Everything inside
an archetype (as opposed to between sections) is guesswork · `--sp-xl` eyebrow→H1,
`--sp-lg` H1→standfirst and ¶ gaps, `--rhythm-section` band padding.

**[SB-8] Field label typography.** Needed label face/size/case/tracking · §7 Field:
"Label above in `--ink-2` when the control is not self-labelling" — colour and
position only · Face, size, case, tracking, weight all missing (dt's mono-micro-caps
style is a plausible neighbour but is never linked) · Mono `--fs-micro` 600
uppercase `--track-caps` `--ink-2`.

**[SB-9] Checkboxes do not exist in the system.** Needed a checkbox for the form ·
§7 covers "all free-text, numeric, and range input"; no component anywhere covers
checkbox/radio/switch · A whole input class is missing from a spec that claims one
field skin site-wide; label placement ("above"?) is absurd for checkboxes ·
Native control + `accent-color: var(--ink)` (principle 1: ink is selection), label
beside in display face sentence case.

**[SB-10] Range slider has no anatomy.** Needed track/thumb styling · §7 lists
"ranges" under the small field variant, but a slider has no border/inset/fill
anatomy that maps to the field skin; nothing on track colour, thumb shape, or
whether the field border wraps it · Native + `accent-color: var(--ink)`, bare
(no field box), mono right-aligned `<output>` per the calculator note.

**[SB-11] Textarea unmentioned.** Needed a multi-line field · §7 ("all free-text")
· Never named; min-height, resize behaviour, and whether mono voice applies to
multi-line user text (which will become "multi-sentence human prose" in mono —
brushing against principle 5) are unaddressed · Field skin, `rows="4"`,
`resize: vertical`, mono.

**[SB-12] `.cmark` "square" has no dimensions.** Needed the D/R/E/C badge geometry
· §16: "`<abbr>` square, `--fs-nano` mono 600, hairline border, badge-radius" · No
side length, no padding, no vertical alignment; "square" is unachievable without a
dimension. Also the spec's tooltip/`aria-describedby` mirroring needs JS the docs
assume but don't include · Padded `--sp-3xs --sp-2xs` (approximately square),
native `title` only.

**[SB-13] Honest-blank face.** Needed the `.blank` family · §16 trust table:
"italic `.blank`, `--muted`, honestly absent, with the reason" · Italic in which
family? Serif italic, display italic, and mono italic all exist; a table cell
context suggests the cell's face but table text cells are themselves unspecified
(SB-15) · Display italic muted.

**[SB-14] `table.data` sheet chrome.** Needed the table's outer box · §11:
"`--paper-2` sheet", `.table-scroll` wrapper · Does the sheet get a hairline
border? A radius (tables aren't cards, so `--r-card` seems wrong, but nothing says
0)? Is `.table-scroll` the sheet or a transparent scroller? Header letter-spacing
also unstated (guessed `--track-caps`) · Hairline border, radius 0, wrapper = sheet.

**[SB-15] Non-numeric body cell face.** Needed the face for plain text cells ·
§11 gives headers (mono), numerals (mono right-aligned), row-header column
("15ch display face" — ledger variant) · Ordinary text cells' family never stated
· Display face at `--fs-sm`; row headers display 600.

**[SB-16] Chapters-block cell typography and current-mark rendering.** Needed
title size/weight and how "current-mark" attaches · §22: "mono number + display
title + `--fs-sm` description" — title has no size/weight; §0 defines current-mark
as "inset underline, 2px `--yellow`" without saying on which element or via which
CSS (border? box-shadow? text-decoration?) · Title `--fs-mdplus`/700; inset
box-shadow underline on the title span. Cell hover behaviour (tint-hover or
nothing) also guessed.

**[SB-17] The person the site ends on is undocumented.** Needed author name, bio,
email address, licence line, portrait treatment · §4 Footer + E9 · E9 requires
"portrait/monogram, first-person bio, EMAIL ME button, correction mailto" but §4's
anatomy omits the portrait and the correction mailto (minor internal mismatch);
no document gives the author's name, the mailto addresses, the licence text, or
which monogram step/hue a *person* (not a layer org) takes — the mono-tile spec
only colours tiles by industry-layer hue · Invented placeholders; L tile (44px)
with ink fill/paper glyph.

**[SB-18] Wordmark and header detail.** Needed wordmark face/size and the yellow
"dash mark" geometry; header row padding; what "paper wash" means · §1 Header ·
Wordmark typography absent; dash mark size/position absent; "wash" ambiguous
(solid vs translucent); row padding token absent ("`--inset-field` row padding"
reads as dropdown-row padding); search/dropdowns/hamburger need JS + CHAPTERS so a
doc-only build can't produce the real header · Display 800 `--fs-sm` uppercase
wordmark, 12×2px dash via `--sp-md`/`--sp-3xs`, solid `--paper`, `--sp-md` padding,
static nav subset.

**[SB-19] Eyebrow tick geometry.** Needed the yellow square tick's size and
alignment · §8, E1 · The chip dot gets a diameter (`--sp-sm`); the eyebrow tick
gets nothing — no size, no gap to the label · `--sp-sm` square, `--sp-sm` gap.

**[SB-20] tint-* color-mix underspecified.** Needed hover tint for table rows and
chapter cells · §0: "color-mix 5% `--cyan` into surface" · Colour space
(`in srgb`? `in oklch`?) unstated — they yield visibly different tints; "surface"
must be resolved per context (paper vs paper-2) by the reader · `in srgb`, mixed
into the actual local surface.

**[SB-21] tokens.css ships values its own docs call broken.** Needed trustworthy
tokens · design-tokens.json pending notes vs tokens.css values · Three documented
failures are live in the generated file a fresh implementer must consume:
`--med-sub` light = #6E7268 (4.39:1 on `--med-bg`, fails AA — S2-3 says darken);
`--fs-md` = 16px still present though "deprecated into --fs-base"; `--head-display`
floor = 26px though S2-6 says raise to 32px for mobile dominance. Any sub-caption
placed on a tint band per spec ships a documented AA failure; the H1 floor failure
is visible in my mobile screenshots (see VISUAL-2) · Used the tokens as shipped.

**[SB-22] Empty-state surface and button rank.** Needed what `.lg-empty` sits on ·
§18 gives text, padding, live-region — not background, border, or width; whether
CLEAR ALL FILTERS is `.btn` or `.btn.primary` is unstated · Hairline-bordered
`--paper-2` sheet at `--measure`, default `.btn`.

**[SB-23] Callout fill and `.note` label style.** Needed the `.note` background
and label typography · §10 says "hairline box" (no fill); §9's card tier includes
"callout" (`--paper-2` fill) — the two sections disagree by omission · Which wins
is a coin flip; `.note`'s optional "mono label line" has no size/tracking (only
`.hard-part`'s label is specified) · `--paper-2` fill; label styled like
`.hard-part`'s (mono micro caps muted).

**[SB-24] CONTRADICTION — secnav threshold; rail geometry absent.** The article
template mandates a TOC rail · PAGE_PATTERNS §2/§3.8: in-grid rail "≥ **grid**
(960)" vs COMPONENT_SPECS §22: "≥ **wide** (1800): an in-grid right rail …
below `wide`: floating pill" — two binding docs put the same breakpoint change at
different named values · Also the "reserved right field" has no width, no grid
template, no gap anywhere · Omitted secnav from this build (logged, not silently
dropped).

**[SB-25] Skip-link hiding technique.** Needed "visually hidden until focused" ·
§3 · No mechanism given (clip pattern? off-screen? sr-only class?) — and the
choice affects whether the layout jumps on focus · `translateY(-200%)` +
`transform: none` on focus (raw value, logged here).

**[SB-26] Chip fill and primary-button hover.** Needed chip background and
`.btn.primary` hover state · §6 anatomy names pill/inset/border/label but no fill
(button anatomy explicitly says `--paper-2`, chip says nothing); §5's hover row
("border `--cyan`, text `--ink`") is wrong for primary, whose text must stay
`--paper` on the ink fill · Transparent chips; primary hover = cyan border, fill
and text unchanged.

---

## Visual defects observed in the four screenshots
(desktop 1440 / mobile 390 × light / dark, fullPage)

**[VISUAL-1] The 5-column table strands its numeric columns at 1440.** The docs
give tables no measure: prose is locked to 68ch, but `table.data` on an article
page defaults to the ~1176px container, so a huge dead field opens between the
row-header column and the right-aligned DEPOTS/DWELL/FIT-OUT columns (visible in
both desktop themes). Column-width or table-measure guidance for article-page
tables is missing entirely.

**[VISUAL-2] Mobile H1 dominance visibly fails.** At 390 the H1 renders at the
26px clamp floor — about 1.7× body against the mandated ~2× slope (PAGE_PATTERNS
§5, S2-6). The section H2s at their 20px floor crowd it. The package knows
(S2-6 "pending") but tokens.css ships the unfixed floor, so every doc-only build
reproduces the failure. Visible in both mobile screenshots.

**[VISUAL-3] At 390 the table stays in scroll mode and clips the FIT-OUT column
mid-word.** §11 mandates "rows convert to cards" ≤ ledger (680) via markup-driven
conversion — but the package gives a static implementer no mechanism (no dual
markup pattern, no JS, no example), so scroll is the only honest fallback. The
mandated right-edge fade for buried columns is also spec'd only as a ledger
variant with no geometry.

**[VISUAL-4] Header consumes three stacked chrome rows at 390.** Below phone the
spec replaces the nav row with a hamburger + full overlay, but the overlay anatomy
is one sentence and requires JS + the CHAPTERS constant, so the doc-only build
wraps six nav items into two extra rows under the wordmark. Visible at the top of
both mobile screenshots.

**[VISUAL-5] The honest blank breaks the numeric column edge.** "not disclosed"
(italic, per §16) sits left-aligned inside a right-aligned numeric column, so the
column's hard right edge visibly collapses on that row in all four screenshots.
Alignment of `.blank` inside numeric columns is unspecified.

**[VISUAL-6] Dark theme inverts the sheet-on-tint hierarchy.** In dark, the form
card sheet (`--paper-2` #1C1E17) is *darker* than the tint band it sits on
(`--med-bg` #24261D), so the "raised sheet" reads as a recessed hole (visible in
the dark desktop screenshot). The light theme layers correctly (white card on
warm tint). No doc addresses sheet-over-tint ordering in dark.
