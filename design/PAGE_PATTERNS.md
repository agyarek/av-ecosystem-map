# Page patterns — archetypes and per-page templates

Status: **binding**. Derived from the Phase 3 audit decision record (archetype axis:
HYBRID — keep the data instruments, adopt the reuse discipline). Composition rule:

- Every section on every page must be one of the **named archetypes** below
  (E1–E9, P1, D1–D7) or a documented composition of them.
- **Unnamed one-off layouts are prohibited.** A genuinely new archetype requires an
  entry in this file plus a dated decision-record entry before it ships.
- All values in this document are token references (`design/tokens.css`). A literal
  px/hex value in a pattern spec is a bug in the spec.
- Breakpoints are referred to by name: phone (640), ledger (680), sheet (760),
  nav (860), grid (960), wide (1800). CSS and JS (`AV.bp`) share these values.

---

## 1. Archetype catalog

### 1.1 Editorial archetypes (E1–E9)

**E1 — Page-head hero.**
Anatomy, in order: eyebrow → H1 → standfirst.
- Eyebrow: mono, `var(--fs-xs)`, `var(--track-caps-loose)`, uppercase, muted, with
  the yellow square tick. ≤28 characters; must render on one line at phone width.
- H1 rank rule (binding, per S2-5): narrative pages use `var(--head-display)`;
  instrument pages (/map, /companies) use `var(--head-utility)`; operator/record
  pages use `var(--head-article)`. No page may set its H1 with the section-H2
  formula. Same-rank pages take the same register.
- Standfirst: `var(--fs-lg)`, `var(--lh-body)` or looser, max-width `var(--measure)`,
  180–340 characters, terminal-punctuated, first person allowed.
- Rhythm: `var(--rhythm-head-top)` above, `var(--rhythm-head-bottom)` below.
- Sanctioned variant: **split-head** (H1 left, intro paragraph right) — allowed only
  on single-instrument pages (currently /map).

**E2 — Serif article prose.**
Long-form reading. `var(--font-serif)` at `var(--fs-lg)` / `var(--lh-prose)`, column
capped at `var(--measure)` (68ch) — every reading column, no escapes to container
width. H2s are numbered and set with `var(--head-section)`. Callouts (`.note`, yellow
or cyan left rule) belong to this archetype and share its measure. Embedded serif
(quotes, QA answers) uses the one sanctioned smaller serif step, nothing else.

**E3 — Hairline dl rows.**
Definition-list rows: mono label left, value right, rows separated by 1px
`var(--rule)`. Provenance marks (D/R/E/C) and "Caveat" rows live in the value cell.
Used for spec rails, fact sheets, operator vitals. Rows, never cards.

**E4 — Stat / metric band.**
A row of large numerals: mono numeral at `var(--head-metric)`, label beneath, and a
**source line per stat** (no unsourced metric ships). Stats separated by shared
hairlines or `var(--sp-3xl)`-class gaps from the spacing scale — one treatment per
band.

**E5 — Stat-card row.**
Gapped bordered metric cards: 1px `var(--rule)` border, `var(--r-card)`,
`var(--inset-card)`. Each card = numeral + claim + source line. Cards are objects;
use E4 when the numbers are one dataset, E5 when each number is its own argument.

**E6 — Bordered card grid.**
Grid of object cards (operators, media tiles, ranked routes): `var(--rule)` border,
`var(--r-card)`, `var(--inset-card)`, gaps from the `--sp-*` scale. Hover lift is
translate-only at `var(--dur-hover)` and must be covered by the shared
reduced-motion rule. Card anatomy for company records follows the single anatomy in
COMPONENT_SPECIFICATIONS (S2-13).

**E7 — Shared-hairline data grid.**
Pure-data cells sharing single 1px `var(--rule)` lines, gutter zero — no borders
doubled, no card fills. This is the mandated grammar for fact-grids and cv-grids
(S2-14) and for the chapters block. Rule of thumb: if every cell is a datum of the
same kind, hairlines; if each cell is an object with its own identity, E6.

**E8 — Chapter bands.** *(home only)*
Full-bleed hairline rows with hover/focus-within reveal (band button + art). Motion
per the catalogued band transitions with explicit reduced-motion opt-out. Not
reusable elsewhere without a decision-record entry.

**E9 — Closing sequence.** *(mandated page tail)*
Every page ends: **content → chapters block → bio footer.**
- Chapters block: numbered chapter grid in E7 grammar, `is-here` marking the current
  chapter, rendered from the single CHAPTERS constant.
- Bio footer: portrait/monogram, first-person bio, EMAIL ME button, correction
  mailto, fine print at `var(--measure-wide)`. Ends on a person — this is the site's
  CTA policy; no nav-level CTA exists.
- The footer must exist as static markup without JS (S2-16).
- One sanctioned variation: the 404 page (see §3.10) replaces the chapters block
  with its ranked-routes section, which serves the same function.

**P1 — Tint-band pacing rule.** *(applies across archetypes)*
Any page whose desktop height exceeds ~2 viewport heights must insert at least one
full-bleed `var(--med-bg)` band as a rhythm break (S2-17). Bands are placed by role
(pacing a long argument, framing an instrument) — never decoration. Content inside a
band stays on the `var(--col)` container. Partnerships and economics are mandated
carriers. Dark is never used as mid-page pacing; the theme is global.

### 1.2 Data / instrument archetypes (D1–D7)

**D1 — Atlas.**
Poster viewport card + layer rail + selection card. Requirements: boot status line
written to the `#filter-state` live region before first paint ("Drawing 562
tiles…") — the viewport never renders as a blank rectangle; `<noscript>` notice;
legend decoding every mark; correction mailto on the selection card; keyboard model
(arrows / Enter / +− / Home / F / Esc). Card becomes bottom-sheet below sheet width;
tap-to-fullscreen at ≤ nav width.

**D2 — Ledger.**
Filter rail/toolbar + table + states. Requirements: count live region (`#lg-state`);
empty state that **names the blocking filter** plus CLEAR ALL FILTERS; table scrolls
inside its own container (buried-column fade at the scroll edge), never overflowing
the document; row expansion uses `aria-expanded` + `aria-controls`; detail anatomy
identical to the company card (S2-13); `<noscript>` notice; card conversion below
ledger width (see §5 exception).

**D3 — Calculator.**
Input panel + derived outputs + mandatory honesty callout in the modelling-tool
register ("starting points to argue with — change them"). Every derived number
carries its formula tooltip (`aria-describedby`, Esc-dismiss) and provenance mark.

**D4 — Heatmap / matrix.**
Density or relationship matrix with mono axis labels, legend with worded thresholds,
and a stated honest limit adjacent to the instrument. Loads with a
present-progressive status line, never blank.

**D5 — Timeline rows.**
Hairline row list with mono lead column (date/id) — incidents, recalls, milestones.
Severity uses `var(--alert)` as a mark with an adjacent word, never a row fill.

**D6 — Media grid.**
Card grid (E6 geometry) of publications/podcasts/people. Human descriptions are set
in the display face, never mono (S2-24); mono carries only meta (dates, counts,
tags). Recommend-a-* button per section.

**D7 — Coverage snapshot.**
Counts of the corpus plus an honesty statement about what is missing ("gaps in
coverage, not evidence of absence"). Composes E4 numerals with a caveat line; used
on /map, /media, /method.

---

## 2. Shared frame and wayfinding

Every page: skip link → header (nav + search + theme toggle, rendered from the
CHAPTERS constant) → `main` on the `var(--col)` container with `var(--col-pad)` →
E9 closing sequence. Sections separated by `var(--rhythm-section)`; page tail by
`var(--rhythm-tail)`. No second rhythm system: hard-px section margins are drift.

Wayfinding devices (the complete set — do not add a fifth):
1. **Header nav** with per-chapter dropdowns; `aria-current` + yellow underline.
2. **Chapters block** (E9) at every page end.
3. **On-this-page TOC (secnav)** on article-class pages only. At ≥ grid width it
   renders as an **in-grid rail in the reserved right field** beside the prose
   column (S2-21) — reserved space, never floating over the text it indexes. Below
   that it is the pill; below sheet width, the bottom strip/sheet. All thresholds
   must be named breakpoints. Ledger jump controls fold into this same system.
4. **Eyebrow up-link** on operator pages (eyebrow doubles as breadcrumb to the
   parent listing).

---

## 3. Page templates

Each template lists: sequence (text wireframe), H1 register, composing archetypes,
pacing, wayfinding, and the conditions under which the sequence may change.

### 3.1 Home (/)

```
1. E1 hero (display H1) + loop stage        — eyebrow, H1, standfirst, animated loop
2. Minimap card                              — tilted poster preview linking to /map
3. E4 stat band                              — corpus counts, source-lined
4. E8 chapter bands                          — one band per chapter, hover reveal
5. E9 closing sequence
```
- H1: `var(--head-display)`.
- The **loop stage** is home's one sanctioned bespoke instrument (motion-catalogued:
  dwell ring, travel, three-point turn; visible pause control; reduced-motion path
  must leave a card active). It is documented here, not reusable.
- Pacing: E8 hairline bands carry the rhythm; a P1 tint band is optional.
- Wayfinding: no secnav; the chapter bands + chapters block do the work.
- May change: stat-band figures and band art rotate with data; sequence order may not.

### 3.2 Atlas (/map)

```
1. E1 hero, split-head variant (utility H1)
2. D1 atlas instrument (rail + poster viewport + selection card + legend)
3. D7 coverage snapshot line (what the poster does not show)
4. E9 closing sequence
```
- H1: `var(--head-utility)` (S2-5 — never the section formula).
- Pacing: none; the instrument is the body. Wayfinding: the layer rail is local nav.
- May change: card→bottom-sheet below sheet width; tap-to-fullscreen ≤ nav width;
  selection deep-links reorder nothing.

### 3.3 Directory (/companies)

```
1. E1 hero (utility H1)
2. D2 ledger (toolbar → count line → table → expandable detail rows)
3. E9 closing sequence
```
- H1: `var(--head-utility)` — same rank and size as /map's.
- States are part of the template: loading (count line "Counting…"), empty (names
  the blocking filter), no-JS (`<noscript>` + static footer).
- May change: column set via COLUMNS control; ≤ ledger width the table becomes
  cards (documented height exception, §5); nothing else.

### 3.4 Economics (/economics)

```
1. E1 hero (display H1)
2. E2 prose framing (measure enforced — no full-width paragraphs)
3. D3 calculator + honesty callout
4. Funding charts + E4/E5 stat evidence, every figure source-lined
5. Compare tables inside their own scroll containers (document never overflows)
6. P1 tint band (mandated) framing at least one instrument section
7. E9 closing sequence
```
- H1: `var(--head-display)`.
- Compare-picker data is fetched on first open, never eagerly (S2-20).
- Wayfinding: secnav rail in the reserved right field ≥ grid width.
- May change: chart sections may reorder as the argument evolves; the calculator is
  always preceded by prose framing and its callout.

### 3.5 Partnerships (/partnerships)

```
1. E1 hero (display H1)
2. E2 prose framing + stated honest limit
3. D4 heatmap/matrix
4. E7 shared-hairline pair/fact grids
5. P1 tint bands (mandated — this is the longest page in the corpus)
6. E9 closing sequence
```
- H1: `var(--head-display)`. Wayfinding: secnav rail ≥ grid width.
- May change: matrix dimensions with data; every grid stays E7 (no card conversion).

### 3.6 Regulation (/regulation)

```
1. E1 hero (display H1)
2. Region tab rail (APG tablist: arrow keys, roving tabindex, aria-controls)
3. E2 prose per region + E3 dl rows, on the standard article grid
4. P1 tint band if the page exceeds ~2 viewports
5. E9 closing sequence
```
- H1: `var(--head-display)`.
- Geometry converges on the standard article grid (S2-21): prose at `var(--measure)`
  on the container, TOC/tab rail in reserved grid space — not a second indent system.
- May change: region count; tab panels always same anatomy.

### 3.7 Operator deep-dive (/companies/<operator>)

```
1. E1 hero (article H1; eyebrow = up-link "PASSENGER AUTONOMY")
2. E3 hairline dl rows (vitals rail: layer, HQ, fleet, status — provenance-marked)
3. E2 serif summary
4. E5 stat-card row (each card source-lined)
5. Partners section — one presentation, per S2-13
6. D5 timeline rows (incidents/milestones) where the record exists
7. E9 closing sequence
```
- H1: `var(--head-article)` — the quieter record register.
- Anatomy is the single company-record anatomy (S2-13); the ledger detail row and
  this page must never disagree.
- May change: sections with honestly absent data show the italic absent note
  ("blank is honest") or are omitted with the omission stated — never silently.

### 3.8 Article (/overview, /method, /safety, /beyond-roads, /owning-one)

```
1. E1 hero (display H1)
2. E2 serif prose with numbered H2s and callouts
3. Evidence interleaves: E3 dl rows / E4 stat bands / E5 stat cards, as the
   argument requires — always inside the named set
4. Page-specific instrument: /safety → D5 incident timeline;
   /owning-one → E7 fact grid; /method → D7 coverage snapshot
5. P1 tint band when the page exceeds ~2 viewports
6. E9 closing sequence
```
- H1: `var(--head-display)`; H2s numbered, `var(--head-section)`.
- Wayfinding: secnav TOC as in-grid rail in the reserved right field ≥ grid width;
  pill between; bottom sheet below sheet width. The rail occupies the field the old
  layout left dead — it never overlays the prose column.
- May change: evidence order; the numbered-H2 spine and closing sequence may not.

### 3.9 Media (/media)

```
1. E1 hero (display H1)
2. D7 coverage snapshot (what the list covers, what it does not)
3. D6 media grid per section (publications / podcasts / people), each with its
   recommend button
4. E9 closing sequence
```
- H1: `var(--head-display)`. Human descriptions in display face (S2-24).
- May change: section count with the corpus; grid grammar fixed.

### 3.10 404 (/404.html — new, S2-15)

```
1. E1 hero: eyebrow "404 · NOT ON THE MAP" — display H1, sentence-form,
   terminal period — short standfirst
2. Three ranked routes (E6 cards or E3 rows — one grammar, chosen once)
3. E9 closing, sanctioned variation: ranked routes replace the chapters block;
   bio footer intact
```
- In the atlas voice: the error is a coverage statement, not an apology. The page
  works with zero JS.

---

## 4. Voice budgets as layout constraints

These are layout inputs, not editorial suggestions — a string over budget breaks a
measured wrap.

| Element    | Budget | Rule |
|------------|--------|------|
| H1         | ≤60 chars | Sentence-form takes a terminal period; noun-label stays bare; questions keep "?". `<br>` marks clause boundaries only; re-check wraps at phone width. |
| Eyebrow    | ≤28 chars | One line at phone width, always. One eyebrow style + one overline style — no third. |
| Standfirst | 180–340 chars | 2–4 sentences, terminal-punctuated, inside `var(--measure)`. |
| Section H2 | sentence-form takes period | Labels bare; numbered on articles. |
| Button     | ≤18 chars | Mono, uppercase, verb-led instrument register (PLAY, CSV, CLEAR ALL FILTERS). |
| Metric     | numeral + label + source line | No source line, no metric. |

---

## 5. Mobile preservation

- **Content is preserved, never hidden.** Stacking, not deletion; buttons may go
  full-width; the hierarchy slope holds (display H1 stays ≥ ~2× body at phone
  width — the raised `var(--head-display)` floor, S2-6).
- **Height budget: mobile page height ≤ ~2.2× desktop height** (the reference's
  measured ceiling). A page over budget is a layout bug.
- **Documented exceptions (the only two):**
  1. **Atlas poster** — compresses (~1.15×) by scaling instead of reflowing.
     Mitigations: tap-to-fullscreen at ≤ nav width, legend intact, and /companies
     stated as the reading-order alternative for the same data.
  2. **Ledger card conversion** — 562 records ≤ ledger width currently explodes the
     document. Mitigation: pagination/virtualization of the conversion (S2-23,
     deferred follow-up — documented, not silently dropped). Until it lands, the
     ledger is the one page exempt from the 2.2× budget; its count line and jump
     controls must keep the page navigable.
- Every other template must pass the budget at phone width in both themes.
