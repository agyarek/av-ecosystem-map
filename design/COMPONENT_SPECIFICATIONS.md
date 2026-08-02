# Component specifications — AV Ecosystem Map

Binding companion to `design/design-tokens.json` / `design/tokens.css` and the Stage-2 decision
register (S2-1…S2-24). Every value in this document is a `var(--token)` or a constant from §0.
A component that needs any other value is misbuilt or this document is out of date — fix one of them.
Breakpoints are named (`phone` 640 / `ledger` 680 / `sheet` 760 / `nav` 860 / `grid` 960 / `wide` 1800)
and media queries must use exactly those values (tokens.css header).

Format per component: Purpose · Anatomy · Variants · States · Responsive · A11y · Tokens · Content · Don't.
States not listed are inherited from the global defaults in §0.

## 0. Global component constants

Documented non-token constants. Defined once (base.css), referenced by name below. Adding a new
constant requires a dated changelog entry in DESIGN_LANGUAGE.md.

| Constant | Value | Used by |
|---|---|---|
| hairline | 1px solid `--rule` | every separator, border, grid cell |
| thead-rule | 1px solid `--ink` | table.data header underline |
| focus-ring | 3px solid `--cyan-text`, offset 2px | all `:focus-visible` (S2-1: ≥3:1 both themes) |
| current-mark | inset underline, 2px `--yellow` | nav current page, chapters "you are here" |
| gold-outline | 1px `--ink` outline on meaning-bearing gold dots | poster spoken-with dots (S2-2) |
| tint-hover | color-mix 5% `--cyan` into surface | table rows, list rows |
| tint-selected | color-mix 8% `--cyan` into surface | selected/expanded rows, pinned states |
| tint-live | color-mix 16% `--cyan` into surface | live washes, compare output rows |
| monogram-radius | round(0.21 × tile size) | mono-tile (§14) |
| monogram-glyph | round(0.38 × tile size) | mono-tile letter size |
| thumb-ratio | 16:9, cover-crop | record thumbnails (§15) |
| dl-rail | 14ch at `--fs-micro` mono | all definition lists (§12) |
| badge-radius | `--r-chip` / 2 | credit badges, cmark squares |

Global defaults: hover transitions `--dur-hover --ease-ui`; state changes `--dur-state`; disabled =
`--muted` text + hairline border + no hover response + `cursor: default`. All motion gated by
`prefers-reduced-motion` (CSS and JS).

---

## 1. Header / nav

**Purpose.** Persistent wayfinding chrome; the only sticky surface on every page.
**Anatomy.** Sticky bar (`--z-header`, `--paper` wash + bottom hairline): wordmark with `--yellow`
dash mark · 6 chapter items, each a link + caret button opening a dropdown · site search (§2) ·
theme toggle (§23) · hamburger below `phone`. Current chapter carries the current-mark.
**Variants.** None. One header site-wide.
**States.** Nav link: default `--ink-2` mono; hover `--ink`; focus-visible focus-ring; current =
current-mark + `aria-current="page"`. Dropdown (`.np-sub`): `--paper-2`, `--r-mid`, `--shadow-float`,
`--z-drop`; opens on click or hover after `--dur-state` grace on fine pointers; Esc closes and
returns focus to the caret.
**Responsive.** ≤ `nav`: items wrap to two rows. ≤ `phone`: hamburger replaces the item row; the
open menu is a full overlay at `--z-overlay` with the same link anatomy.
**A11y.** `<nav aria-label>`; caret buttons `aria-expanded` + `aria-controls`; hamburger
`aria-expanded`; Esc always returns focus.
**Tokens.** `--fs-xs` mono uppercase `--track-caps` top level; `--fs-xs` display sentence-case
sub-links (codified two-voice nav: mono = chrome, display = titles being read); `--inset-field` row
padding; `--sp-md` gaps.
**Content.** Chapter labels ≤ 14 chars; dropdown sub-links ≤ 32 chars, one line.
**Don't.** Don't add a conversion CTA to the header — this site's chrome navigates, it never sells.

## 2. Site search

**Purpose.** Jump to any of the 562 organisations from anywhere.
**Anatomy.** Field (§7, small size) with mono placeholder `SEARCH 562` · results listbox
(`--paper-2`, `--r-mid`, `--shadow-float`, `--z-drop`) of max 8 options: monogram (S tile) + name +
mono layer label; exited organisations render struck through.
**States.** Option hover/active: tint-selected; focus never leaves the input (see A11y).
**Responsive.** Inside hamburger overlay below `phone`; listbox spans the overlay width.
**A11y.** Full combobox wiring per S2-19: `role="combobox"` + `aria-expanded` + `aria-controls` +
`aria-activedescendant`; options `role="option"`; Esc clears and closes; results count announced
via the existing polite live region.
**Tokens.** `--fs-xs` mono input; `--fs-sm` display option names; `--fs-nano` layer labels.
**Content.** Empty result renders "No matches in 562 organisations" — count stays literal and live.
**Don't.** Don't debounce past `--dur-state`; search is an instrument, not a form.

## 3. Skip link

**Purpose.** First tab stop; bypasses chrome.
**Anatomy.** Single `<a href="#main">`, visually hidden until focused; when focused: `--ink` fill,
`--paper` text, `--inset-control`, `--r-chip`, `--z-overlay`, top-left.
**States.** Only focus-visible (its visible state IS focus).
**A11y.** Must precede the header in DOM on every page, including 404.
**Tokens.** `--fs-xs` mono uppercase `--track-caps-dense`.
**Content.** Exactly "SKIP TO CONTENT".
**Don't.** Don't restyle per page — it is the one component with a single permitted rendering.

## 4. Footer

**Purpose.** Every page ends on a person (core principle 2: content → chapters → person).
**Anatomy.** Top hairline · author bio (serif, `--measure-compact`) · `EMAIL ME` button
(§5, default) · fine print: mono `--fs-micro` `--muted` at `--measure-wide`, includes the live
"updated" date and licence line.
**Variants.** None; identical on all routes including 404.
**States.** Links: `--cyan-text` underlined; hover `--ink`.
**Responsive.** Single column below `ledger`; bio measure unchanged.
**A11y.** `<footer>` landmark; static markup shipped in HTML, never JS-injected (S2-16).
**Tokens.** `--rhythm-tail` above; `--sp-xl` internal stacks.
**Content.** Bio ≤ 340 chars (standfirst budget); fine print states data date + licence, no legal
boilerplate.
**Don't.** Don't append link farms or a second CTA — one address, one person.

## 5. Button (`.btn` / `.btn.primary`)

**Purpose.** Commit an action. Shape encodes commit-vs-describe (S2-12): actions are rectangles.
**Anatomy.** Rect, `--r-chip`, hairline border, `--paper-2` fill, mono uppercase label, optional
leading glyph.
**Variants.** `primary`: `--ink` fill, `--paper` text (the ink does triple duty — principle 1).
Sizes: default = `--inset-control` + `--fs-xs`; large = `--sp-md --sp-xl` padding + `--fs-sm`
(hero and 404 primaries only).
**States.**

| State | Rendering |
|---|---|
| default | `--ink-2` text, hairline border (primary: ink fill) |
| hover | border `--cyan`, text `--ink`, `--dur-hover` |
| focus-visible | focus-ring |
| active | translateY(1px) |
| disabled | global disabled defaults + `aria-disabled` |

**Responsive.** Full-width only inside bottom sheets and the 404 action stack below `phone`.
**A11y.** Real `<button>`/`<a>`; icon-only buttons require `aria-label`.
**Tokens.** `--track-caps-dense`, `--lh-solid`, `--dur-hover`.
**Content.** Verb-led, 3–18 chars, uppercase (PLAY, CSV, CLEAR ALL FILTERS).
**Don't.** Don't render an action as a pill — pills describe, rectangles commit (S2-12).

## 6. Chip (`.chip`)

**Purpose.** Tag or filter — describes, never commits. The only pill-shaped control.
**Anatomy.** Pill (`--r-pill`), `--inset-chip`, hairline border, mono uppercase label, optional
leading dot at `--sp-sm` diameter coloured `oklch(var(--layer-l) var(--layer-c) var(--h-*))`.
**Variants.** Layer chip (dot + name) · filter chip (toggle) · count/status badge (`--fs-nano`,
non-interactive) · partner chip (§15).
**States.** default hairline; hover border `--cyan`; focus-visible focus-ring; selected
(`aria-pressed="true"` / `.on`) = `--ink` fill + `--paper` text; disabled per global.
**Responsive.** Wrap freely; never truncate a chip label.
**A11y.** Filter chips are `<button aria-pressed>`; layer dots always have the layer name adjacent
(hue is never the sole carrier — principle 3).
**Tokens.** `--fs-micro`, `--track-caps-dense`, `--dur-hover`.
**Content.** ≤ 22 chars; dot + word, never dot alone.
**Don't.** Don't square a chip into a button via overrides (the old `.rail-export` bug) — if it
commits, it is a `.btn`.

## 7. Field

**Purpose.** All free-text, numeric, and range input. One skin site-wide (S2-12).
**Anatomy.** Rect, `--r-chip`, hairline border, `--paper-2` fill, mono text, mono
placeholder in `--muted`. Label above in `--ink-2` when the control is not self-labelling.
**Variants.** Default size `--inset-field` (search, ledger query) · small `--inset-field-sm`
(ranges, calculator inputs; calculator numerals right-aligned) · **native `<select>` = THE
documented exception**: display face at `--fs-sm`/600, sentence case (compare pickers; pragmatic OS
rendering outweighs the mono voice — S2-24; no second exception may cite this one).
**States.** default hairline; hover border `--ink-2`; focus = border `--cyan` + focus-ring;
disabled per global; invalid = border `--alert` + adjacent mono message (never colour alone).
**Responsive.** Fields never shrink below their inset; stack below `sheet`.
**A11y.** Programmatic label always (visible or `aria-label`); placeholders are examples, never
labels.
**Tokens.** `--fs-xs` input text (`--fs-sm` for the select exception), `--dur-hover`.
**Content.** Placeholder ≤ 24 chars. Honesty line slot (§16) sits directly under any field that
feeds a model.
**Don't.** Don't invent a pill-shaped input — the rail-text pill is dead (S2-12).

## 8. Eyebrow / overline

**Purpose.** Section wayfinding label above a heading.
**Anatomy.** Eyebrow: `--yellow` square tick glyph + mono uppercase label in `--muted`.
**Variants.** Exactly two. Eyebrow: `--fs-xs`, `--track-caps-loose`, tick. Quiet overline:
`--fs-micro`, `--track-caps`, no tick (rails, card headers, footer). Colour modifier: `.alert`
recolours the label `--alert`, tick unchanged rules — used only above hard-part callouts.
**States.** Static text; no interactive states.
**Responsive.** Must hold one line at 390px viewport — enforced by the content limit.
**A11y.** Decorative tick is `aria-hidden`.
**Tokens.** weight 600, `--lh-solid`.
**Content.** ≤ 28 chars (S2-18), structural noun labels, never sentences, never a period.
**Don't.** Don't mint a third size/tracking combination — five variants was the drift this spec
kills.

## 9. Container grammar: card · shared-hairline grid · hairline rows

**Purpose.** Border count is the busyness dial on a paper ground. Three tiers, fixed roles
(principle 4, S2-14).

| Tier | Rendering | Use when |
|---|---|---|
| Card | `--paper-2`, hairline border, `--r-card`, `--inset-card`; panels use `--inset-panel` | The unit is an object you could pick up: record detail, form, chart panel, callout |
| Shared-hairline grid | No gaps, no radius, no fill; cells split by hairlines only | The unit is a fact among peers: fact-grid, coverage grid, chapters block, metric bands |
| Hairline rows | Full-width rows split by hairlines, mono lead column | The unit is a list entry: incident timeline, watch-list, media list |

**Variants.** `card.ruled` may carry a top rule in an accent as a register mark. Tint-band
(`--med-bg`) sections pace long pages (S2-17) and contain any tier.
**States.** Cards are static; interactive rows take tint-hover / tint-selected.
**Responsive.** Grids collapse column count at `grid` and `ledger`; cards never become rows —
demote to rows in markup if density demands it.
**A11y.** Grids are semantic lists or `<dl>`s, never layout tables.
**Tokens.** `--sp-lg` card gaps; grid cell padding `--sp-lg`.
**Content.** A card holds one object. A grid cell holds ≤ 3 text elements.
**Don't.** Don't card pure data — if every cell has the same shape, it is a grid, not eight cards.

## 10. Callout family (`.note` / `.hard-part` / `.watch-list`)

**Purpose.** Interrupt reading with a register-marked aside. Left-edge colour states the register.
**Anatomy.** Hairline box, radius 0 `--r-card` `--r-card` 0, coloured left edge at `--sp-2xs`
width — one width for the whole family (the old 6px hard-part edge folds in). Optional mono label
line, then body.
**Body voice decision (stated):** all callout bodies are serif — a callout is prose that argues,
not chrome. `.note` body `--fs-base`; `.hard-part` body `--fs-mdplus` (its token-documented role);
both `--lh-body`.
**Variants.** `.note` edge `--yellow` (provenance/method) · `.note.live` edge `--cyan` ·
`.note.alert` edge `--alert` · `.hard-part` = alert edge + mono `--fs-micro` uppercase label ·
`.watch-list` = hairline rows with `--cyan` ◍ marker + mono caption line.
**States.** Static.
**Responsive.** Bound to `--measure`; never full-bleed.
**A11y.** Register is carried by the label word, not the edge colour alone.
**Tokens.** `--inset-card` padding, `--sp-lg` stack margin.
**Content.** ≤ 2 paragraphs; a longer aside is a section.
**Don't.** Don't use a callout for emphasis of ordinary prose — the edge colours are registers,
not highlighters.

## 11. Table language (`table.data`)

**Purpose.** The canonical instrument for records; real tables, not decorated mockups.
**Anatomy.** `--paper-2` sheet · headers mono `--fs-micro` uppercase `--muted` with thead-rule
below · rows split by hairlines · numeric cells mono, right-aligned · `.table-scroll` wrapper
(`overflow-x`) around any table wider than its column.
**Variants (ledger extensions).** Sticky header offset by measured chrome (`--th-top`, set at
runtime) · sticky first column with inset hairline · right-edge fade signalling more-to-scroll ·
sort buttons in headers (`aria-sort`, active in `--cyan-text`) · compact density toggle ·
`table.cmp` compare: sentence headers may wrap, output rows tint-live, `.blank` honest blanks
(§16) · row-header column fixed at one width site-wide: `--measure-compact`/4 ≈ 15ch display face.
**States.** Row hover tint-hover; expanded/selected row tint-selected + `aria-expanded`.
**Responsive.** ≤ `ledger`: rows convert to cards (record anatomy §15, monogram + dl); the
conversion is markup-driven, not CSS-hidden columns.
**A11y.** `scope` on all headers; `aria-sort` on sortable; expandable rows pair `aria-expanded`
with `aria-controls` (S2-19).
**Tokens.** cell padding `--sp-sm --sp-md`; `--fs-sm` body cells; `--lh-dense`.
**Content.** Every numeric column states units in its header; every table sits above its source
line (§16).
**Don't.** Don't centre-align numerals — comparison is the point of a column.

## 12. Definition list (sub-spec: ONE dl anatomy)

**Purpose.** Label–value pairs inside records, cards, and details. One spec replaces four.
**Anatomy.** Two-column grid: label rail fixed at dl-rail (14ch) · `dt` mono `--fs-micro`
uppercase `--track-caps` `--muted` · `dd` display `--fs-sm` `--ink` · row gap `--sp-xs` · group
separators are hairlines, applied to group headings only (never per-row).
**Variants.** None. The same dl renders in company card, ledger detail, world cards, meet lists.
**States.** Static; values may contain trust marks (§16) and links (`--cyan-text`).
**Responsive.** Below `phone` the rail may stack above the value; rail width token unchanged.
**A11y.** Real `<dl><dt><dd>` markup.
**Tokens.** `--lh-dense` values.
**Content.** Labels ≤ 14 chars (must fit the rail); a value that needs a paragraph belongs in the
summary, not the dl.
**Don't.** Don't let a surface pick its own rail width — max-content rails were the drift.

## 13. Metric block

**Purpose.** A number with its provenance; a number without a source line is marketing.
**Anatomy.** Numeral: display face, `--head-metric`, weight 600, `--lh-solid` · label: mono
`--fs-xs` uppercase `--track-caps` `--muted` · source line: mono `--fs-micro` `--muted`, the
trust-UI slot (§16) — always present, "—" is not a source.
**Variants.** Stat row (flex band of blocks, gap `--sp-3xl` fluid) · fact grid (shared-hairline
cells per §9).
**States.** Static.
**Responsive.** Blocks wrap; numeral token is already fluid.
**A11y.** Numeral + label read as one phrase (single element or `aria-labelledby`).
**Tokens.** One numeral token only — the old 24px/26px fork is dead (S2-13 register, drift 17).
**Content.** Numeral ≤ 8 chars incl. unit; label ≤ 24 chars; source ≤ 60 chars with a date.
**Don't.** Don't ship a metric whose source line you couldn't defend in the method chapter.

## 14. Mono-tile monogram

**Purpose.** Layer-hued identity fallback; nothing ever renders blank (principle 8).
**Anatomy.** Square tile, fill `oklch(var(--tile-l) var(--tile-c) var(--h-*))`, radius =
monogram-radius, 1–2 letter glyph in `--tile-ink` at monogram-glyph size, weight 700. Real logo
fades in above at `--dur-state` when it loads.
**Size ladder (documented, closed):**

| Step | Size | Radius (0.21×) | Used by |
|---|---|---|---|
| S | 26 | 5 | search options, partner chips |
| M | 34 | 7 | ledger card rows |
| L | 44 | 9 | record header (card + detail), map tiles |
| XL | 52 | 11 | media tiles |
| Hero | 74 | 16 | article headers |

(48 is deprecated → L.)
**States.** Static; the logo crossfade is the only transition.
**Responsive.** Steps never scale fluidly — pick a step.
**A11y.** Decorative: `alt=""`/`aria-hidden`, name always adjacent (tile contrast is
logo-fallback-grade only).
**Tokens.** `--tile-l/--tile-c` flip per theme; hue from `--h-*`.
**Content.** Glyph = 1–2 uppercase initials.
**Don't.** Don't use tile hues as text colour — hue-as-text fails AA in light (R1 §2c).

## 15. Unified record anatomy (map tile → company card → ledger detail)

**Purpose.** One organisation, one anatomy, three densities (S2-13). A reader who uses two
surfaces must not learn two vocabularies. The calls below are the spec:

| Part | Spec | Call rationale |
|---|---|---|
| Monogram | L tile (§14) | one identity size at record rank |
| Title | display `--fs-mdplus` / 800 / `--track-sub` | midpoint of the 17/20 fork, on the ladder |
| Layer line | mono `--fs-micro`: square layer dot + layer name · HQ | taxonomy is mono chrome |
| Trust marks | gold SPOKEN WITH DIRECTLY when first-hand (§16) | provenance at the top, not the footnote |
| Summary | serif `--fs-base` `--lh-body` | serif = reading voice (principle 5); the summary is read, not operated |
| Thumbnail | width 100%, thumb-ratio 16:9 cover, `--r-mid`, credit badge | one spec ends the h170/r8 vs h210/r14 fork |
| Facts | dl per §12 (14ch rail) | one rail everywhere |
| Partners | chips (§6) with mono kind prefix, in BOTH surfaces | chips scan and wrap; the text-list variant is dead |
| Actions | `.btn` row: site link, map/ledger cross-link | rectangles commit |

**Variants.** Map tile (poster): monogram + wrapped name ≤ 2 lines + mono sub-desc + partnership
pips + gold dot (with gold-outline) + strike when exited — the tile is the record's index entry,
same parts, no summary. Company card = floating card (`--z-card`, `--shadow-float`, `--r-card`)
beside the tile. Ledger detail = the same anatomy inline in an expanded row.
**States.** Card open/close at `--dur-state`; selected tile dims the rest to 50% opacity.
**Responsive.** ≤ `sheet`: company card becomes a bottom sheet (`--shadow-raised`, `--scrim`
backdrop). ≤ `ledger`: ledger rows already card-converted (§11).
**A11y.** Tiles `role="button"` with composed labels; card close on Esc, focus returned; sheet
traps focus while open.
**Tokens.** `--inset-card` body padding; `--sp-md` part gaps.
**Content.** Summary ≤ 340 chars; ≤ 8 partner chips shown, then a "+N" count chip.
**Don't.** Don't let a new surface render this record with different part order, faces, or
partner presentation — that is the S2-13 regression.

## 16. Trust-UI family

**Purpose.** Provenance is the aesthetic (principle 6). Mark + adjacent word + colour = epistemic
status; no surface may invent a fifth honesty style.

| Signal | Mark | Colour | Meaning |
|---|---|---|---|
| First-hand | gold dot + "SPOKEN WITH DIRECTLY" | `--yellow` (+ gold-outline where unlabelled) | I spoke to them |
| Disclosed | `.cmark` D | `--cyan-text` | stated by company or filing |
| Reported | `.cmark` R | `--muted` | carried by a major outlet |
| Estimated | `.cmark` E | `--alert` | derived or modelled by me |
| Carried | `.cmark` C | `--muted` | carried from the site dataset |
| Honest blank | italic `.blank` | `--muted` | honestly absent, with the reason |

**Anatomy.** `.cmark` = `<abbr>` square, `--fs-nano` mono 600, hairline border, badge-radius,
first-person `title` text mirrored via tooltip (§20). Credit badge: mono `--fs-nano` on `--scrim`
over every borrowed image, badge-radius. Honesty caption slot: mono `--fs-micro` `--muted` line
directly under every instrument and model output ("Exports label themselves as modelled, not
reported").
**States.** cmarks show their definition on hover/focus per §20.
**A11y.** Colour is never the sole carrier — the letter, word, or italic carries the meaning;
`abbr` titles are exposed via `aria-describedby`.
**Tokens.** as listed; light-theme cyan is always `--cyan-text` (S2-1).
**Content.** Every number gets a mark or a source line; every blank gets a reason.
**Don't.** Don't add a confidence style outside this table — extend the table first, in writing.

## 17. Chart / instrument conventions

**Purpose.** Charts are live instruments in the site's own colour language, not imagery.
**Anatomy.** Panel = card (§9) · series colours = `oklch(var(--chart-l) var(--chart-c) var(--chN))`
in order `--ch1…--ch6` (S2-11); a series that IS an industry layer uses that layer's `--h-*` hue at
chart L/C · axes and annotations mono `--fs-nano`/`--fs-micro` `--muted` · honesty caption slot
below (§16).
**Variants.** Tooltip: follows pointer/focus, `--ink` surface + `--paper` text, `--r-chip`,
`--fs-micro` mono, `--shadow-float`, `--z-pop`. Pinned popup: same skin + close ×, `role="status"`,
dismiss on Esc/outside/scroll. Fallback: `<details>` containing the same data as `table.data` —
mandatory for every chart (also the no-JS rendering).
**States.** Hover mark highlight at `--dur-hover`; pinned = tint-selected ring; theme change
re-renders from computed styles.
**Responsive.** Controls stack ≤ `sheet`; charts never scale text below `--fs-nano`.
**A11y.** `role="img"` + composed label on the chart; per-mark `tabindex` and labels; focus shows
the tooltip; series never distinguished by colour alone (labels or pattern adjacency).
**Tokens.** Exports pin the light palette, generated from design-tokens.json — never re-hardcoded.
**Content.** ≤ 6 series per chart; more means a different chart or a table.
**Don't.** Don't introduce a hex anywhere in chart code — series colours derive from the wheel or
they don't ship.

## 18. Empty / error / loading states

**Purpose.** Never blank, never silent (principle 8); dead ends are designed and in-voice.
**Anatomy & variants.**
- Diagnostic empty (`.lg-empty`): centred, `--sp-3xl --sp-lg` padding; text names the single
  blocking filter when one filter excludes everything ("Nothing matches. The **X** filter is doing
  the excluding.") + `CLEAR ALL FILTERS` button. The container is a polite live region (S2-19).
- Generic empty: names the corpus ("No matches in 562 organisations").
- Loading: monogram-first (§14) — records render tiles immediately; instrument captions use the
  present-progressive family ("Counting…", "Building the density grid…"); poster boot progress is
  written to the `#filter-state` status line (S2-16).
- Error: `.note.alert` voice, first person, states what failed and what still works; chart failures
  leave the fallback table (§17) visible.
- No-JS: `<noscript>` notice on every data surface in `.note` styling, naming what needs JS and
  linking the static data files; footer and chapter markup are static regardless (S2-16).
**A11y.** All state changes announced via the existing `aria-live` regions; empties keep focus
where the user left it.
**Tokens.** Body `--fs-base`; caption mono `--fs-micro`.
**Content.** Empty-state body ≤ 120 chars + one action.
**Don't.** Don't ship a spinner with no words — every wait states what is being built.

## 19. Designed 404

**Purpose.** The one surface where the language previously vanished (S2-15). Atlas voice.
**Anatomy.** Standard header (§1) · centred block at `--measure`: eyebrow
`404 · NOT ON THE MAP` (§8) · display headline, sentence-form with terminal period, `--head-display`
("This tile isn't on the map.") · serif support paragraph · action stack: 1 `.btn.primary` large
(THE MAP) + 2 `.btn` secondary (home, companies) · standard footer (§4).
**States.** Buttons per §5.
**Responsive.** Action stack goes full-width column below `phone`.
**A11y.** Skip link + landmarks as on every page; `<title>` states 404 first.
**Tokens.** `--rhythm-head-top` above the block; `--sp-md` action gap.
**Content.** Headline ≤ 60 chars incl. period; support ≤ 160 chars; exactly 3 actions, ranked.
**Don't.** Don't serve the platform default — a bare 404 is an unstyled page in a styled atlas.

## 20. Tooltip (`.ftip`)

**Purpose.** Inline definition for formula terms and provenance marks.
**Anatomy.** Trigger: dotted underline, `cursor: help` · tip: `--ink` surface, `--paper` text,
`--r-chip`, mono `--fs-micro`, `--z-pop`, positioned above the trigger.
**States.** Shown on hover and `:focus-visible`; hidden on Esc (S2-19); `--dur-hover` fade.
**Responsive.** Tips clamp to viewport edges; on coarse pointers the first tap shows, second
activates.
**A11y.** Tip text lives in a visually-hidden element referenced by `aria-describedby` — the
`data-tip` attribute alone is not exposed (S2-19); trigger is focusable.
**Tokens.** `--inset-chip` padding.
**Content.** ≤ 90 chars; longer explanations link to the method chapter.
**Don't.** Don't put interactive content in a tooltip — it dismisses on Esc and cannot trap focus.

## 21. Tabs (region tabs)

**Purpose.** Switch between parallel regional panels.
**Anatomy.** `role="tablist"` of rect tabs (`--r-chip`, `--inset-control`, mono `--fs-xs`
uppercase) + `role="tabpanel"` per tab. Region silhouette icons are a documented illustration set
(filled, not stroke — S2 register item 24 call: keep, classified as pictures).
**States.** Selected: `--ink` fill + `--paper` text + `aria-selected="true"`; hover border
`--cyan`; focus-visible focus-ring.
**Responsive.** Tablist wraps ≤ `sheet`; never horizontal-scrolls.
**A11y.** Full APG contract (S2-19): roving `tabindex` (selected tab 0, rest −1); ←/→ move,
Home/End jump; automatic activation (selection follows focus); panels labelled by their tab,
`tabindex="0"`.
**Tokens.** `--track-caps-dense`, `--sp-xs` gaps.
**Content.** Tab labels ≤ 16 chars.
**Don't.** Don't use tabs for content users compare side-by-side — that is a table's job.

## 22. Secnav / article TOC · scroll-nav · chapters block

**Secnav ("On this page").** Purpose: within-page wayfinding. ≥ `wide`: an in-grid right rail on
articles with **reserved space** — the reading column never reflows when it opens (S2-21); opens by
default. Below `wide`: floating pill-button bottom-left (`--z-pop`, `--shadow-float`) opening a
link list (`--paper-2`, `--r-mid`); ≤ `sheet`: bottom strip. Links mono `--fs-xs`; current section
`aria-current="true"` in `--cyan-text`. Button carries `aria-expanded`; hidden in print.
**Scroll-nav.** Purpose: page-length pager on the ledger. Two stacked rect buttons (§5 anatomy —
rect, not pill, per S2-12), fixed bottom-right, icon + `aria-label`; hover per §5; hidden in print;
inset tightens to `--sp-sm` ≤ `ledger`.
**Chapters block.** Purpose: the atlas's spine, appended before the footer on chapter pages.
Shared-hairline grid (§9) of 6 cells: mono number `01`–`06` (`--fs-micro` `--muted`) + display
title + `--fs-sm` `--muted` description. Current chapter: current-mark + `aria-current="page"`.
3×2 ≥ `grid`, 2×3 below, single column ≤ `ledger`.
**Don't.** Don't let the TOC push content — reserved space or floating, never reflow.

## 23. Theme toggle

**Purpose.** User-controlled full inversion (principle 1 — the dark theme is complete, never
partial).
**Anatomy.** Header icon button; sets `data-theme` on `:root`; persists in localStorage; initial
value honours `prefers-color-scheme`.
**States.** Per §5 button states; pressed state reflects the active theme.
**A11y.** `aria-pressed` + label naming the action ("Switch to dark theme"); charts and canvases
re-render on toggle.
**Tokens.** Everything it flips is a token; a component that survives the flip unchanged is using
a literal — file it as a bug.
**Content.** Icon + accessible name; no text label.
**Don't.** Don't theme a subset — exports pin light by design (documented); everything else
inverts whole.

---

## Component addition rule

New components do not arrive by inspiration. The path is:

1. **Flag the conflict.** Show that no existing component or documented variant covers the need —
   name the closest one and state, in one sentence, where it fails.
2. **Smallest coherent extension.** Prefer, in order: a content change · a documented variant of an
   existing component · a new component built entirely from §0 constants and existing tokens. A new
   token requires a dated changelog entry in DESIGN_LANGUAGE.md first.
3. **Single-page variants need written justification** in this file before they ship. A variant
   that exists on one page without an entry here is drift by definition and gets folded back to the
   base component in the next cleanup pass.

The audit's arithmetic is the test: if adding your component changes the count of inks, hairline
values, control shapes, field skins, eyebrow styles, record anatomies, or honesty styles, it is not
an addition — it is a fork, and forks get rejected.
