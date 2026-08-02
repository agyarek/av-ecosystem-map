# R4 — Components & Imagery audit (dimensions I, J, K, N)

Scope: I imagery/art direction, J icons/diagrams/data displays, K component system, N forms/conversion.
Sources: 14 reference desktop slices read + pixel-measured; 16 own slices (both themes + 5 state captures) read; own source cited file:line. Track B failed — everything CSS-derived about the reference (exact radii tokens, hover/focus, validation states) stays [estimated]/[unverified] per ref-track-b.md.
Paths: reference slices `$SCRATCH/reference/slices/`, own slices `$SCRATCH/own/slices/`, measurement crops `$SCRATCH/crops/`.

---

## 1. REFERENCE FINDINGS

### K1. Header / nav anatomy [observed, all 13 routes]
Sticky light bar: wordmark left; 5 chevron-dropdown items (Hubs/Platform/Partnerships/Company/Drivers); right-side pair = outlined secondary "Uber EV" + solid dark primary "Request Briefing" (contact_desktop/s00 y20–62). Active route gets a thin underline under the nav label (slice-index cross-route section). The persistent conversion CTA lives in the chrome on every page — nav is also a conversion surface.

### K2. Button system — Part II CORRECTED [measured]
Part II claimed "buttons are full pills." **False for action buttons in this corpus.** Measured:
- Nav primary "Request Briefing": h=45px (rows 18–62), corner inset 5px at dy=1 → **radius ≈10px rounded rect**, not pill (contact_desktop/s00 @x1140–1304; crop crops/ref-navbtns.png).
- Contact submit "Send Message": h=45 (y844–888), radius ≈10, full-width of form card [measured].
- About hero primary: h=45 (about_desktop/s00 y663–707); 404 buttons same height/radius (drivers_desktop/s00 y492–536, crop crops/ref-404-full.png).
- One in-card small variant: "Dispatch Vehicle" h=33 (platform_desktop/s01 y420–452) [measured].
- Variants: primary = ink fill/white label; secondary = white fill + 1px hairline + ink label; on dark bands the pair inverts (solid white + outlined-on-dark: investors_desktop/s02 y470–519, press s01) [observed]. Horizontal padding ≈24px; label ~15px medium, Title Case; hero pair gap 23px [measured, about s00].
- **Pills DO exist, but only as chips/tags**: careers filter chips h=34, fully rounded (inset series 14,11,9,7… ≈ r17 = h/2; careers_desktop/s01 y318–351) [measured]; partner-name chips h=27 outlined pills (partnerships_desktop/s01 @537–599) [measured]; "Official Uber partner" footer pill; map legend chip; "Passed" status chips (platform s01).
- **The relationship to extract: two shapes with fixed roles — one rounded-rect action shape (one height, one radius, ink/outline/inverted variants) and one full-pill shape reserved for non-action metadata (filters, tags, status). Shape alone tells you whether a thing commits an action or describes one.**

### K3. Card policy — two grammars + a borderless third [observed; confirms slice-index]
(a) **Gapped bordered rounded cards** (r≈10–12 measured on blog card corner, blog_desktop/s01 y460–476 inset series 5,3,2,1,0) for standalone objects: feature/photo cards (autzu s01), blog cards, value cards (about s01), form card + info card (contact s00), embedded-UI cards (platform s01), partner-category cards (partnerships s01), investor chart card (investors s00).
(b) **Shared-hairline grid cells** — no gaps, no per-cell rounding — for data records: home feature grid 2x3 (borders only at y160/343/525 @x140, autzu s01 [measured]), 3x3 location grid (autzu s03), fact sheet (press s00), investor-profile 3x2 (investors s02), certifications 3x2 (platform s02), metric tiles (autzu s00).
(c) **Borderless icon strips between hairlines** for feature lists: hubs s00 5-col, careers s00 4-col, platform s00 4-col.
**When they do NOT card: repeated data records and list-like features. Cards are for things you could pick up (a post, a form, a mockup); grids are for facts; rows are for lists.** Timeline/job/coverage tables are hairline rows with a mono lead column (about s01, careers s01, press s01) — never cards.

### K4. Metric blocks [observed]
Four treatments, one voice: (1) metric tile band (4 shared-hairline light tiles, numeral over small muted label, autzu s00 y808–915); (2) inline borderless icon+numeral+label row (platform s00 y550–660); (3) in-card mini metric rows: numeral + mono uppercase label above a hairline inside security cards (platform s02: "<1 min MEDIAN INCIDENT RESPONSE"); (4) fact-sheet grid: mono eyebrow above large value (press s00). Numerals are always the display sans (never mono), labels always small muted uppercase.

### K5. Location cards + world map [observed, autzu s02–s03 = hubs s01–s02 verbatim]
Map = large light rounded card (cool-tint family per ref-palette-notes), gray continents, mono airport-code labels, status dots (green live / blue launching / gray coming soon), dashed route arc, pill legend chip bottom-left. Location grid = 3x3 shared-hairline cells: mono airport-code eyebrow + status dot chip top-right, city name in display sans, "24/7 Ops" meta bottom-right. **The map (picture) and the grid (data) are separate, adjacent components — the map is never asked to be a table.**

### K6. Blog article cards [observed, blog s00–s02]
Featured: wide bordered split card (photo left ~55%, meta/title/excerpt right). Grid card anatomy: inset rounded photo top → mono uppercase meta row "CATEGORY · DATE · N MIN READ" → ink title → 3-line muted excerpt (ellipsized) → "Read more →" arrow link. 10 posts; card radius same ~10–12 family.

### N1. Contact form — Part II CORRECTED on dimensions [measured, contact s00]
Only form in corpus. Bordered rounded form card (corner r≈12, card border y391). Anatomy per field: ink label above (15px), input below; **input height 49px** (borders 440/489, 526/575, 612/661 — three fields identical), **radius ≈8–10** (inset 5→0 over ~9 rows), 1px hairline border, muted placeholder ("Jane Doe"). Part II's "52–56px tall, radius 10–12" → corrected to 49–50px / ~10px. Optional field marked inline "(optional)". Textarea 125px (y698–823). Full-width primary submit h45. Below: lock icon + reassurance microcopy "We respect your privacy…". Right column: rounded photo + bordered info card with 38px dark icon squares + mono eyebrows (EMAIL, HEADQUARTERS) [measured icon 38x38].
Careers search input: h=50, r≈10–12, mono-ish placeholder (careers s01 y236–285) [measured] — same field anatomy reused outside forms. Validation/focus states [unverified — Track B].
**Principles: one field anatomy everywhere; labels above, never floating; placeholders are examples, not labels; optionality marked, not implied; the form ends with reassurance, not legal boilerplate; adjacent escape hatch (direct email) always offered.**

### K7. Footer [observed, identical all 13 routes; autzu s03–s04, investors s02]
Dark band (ink #0B1220 per ref-palette): white logo, 4-line mission blurb, "Official Uber partner" pill w/ green dot, 2 circular outlined social icons, 6 uppercase link columns, hairline, © line + Privacy/Terms. The footer is the only guaranteed dark band — every page gets a dark tail.

### K8. Closing CTA bar + dark raised cards [observed]
Full-width dark rounded bar: bold white lead + gray sub left, actions right (autzu s03 "Ready to put autonomy to work?…" + arrow link; investors s02 two buttons; press s01, partnerships s02 one white button). Careers runs the same composition in light gray mid-page (careers s00 y900–1058) — the component has a light variant. Dark raised card surface ≈ #121927 [measured by R1, small shares]. Absent on 8 of 13 routes — **the closing CTA is earned by conversion pages, not universal.**

### K9. 404 as a designed component [observed, drivers_desktop/s00; crop crops/ref-404-full.png]
Centered block: mono letterspaced eyebrow "404 · PAGE NOT FOUND" → 2-line display headline with terminal period, in-voice ("Looks like this hub isn't on the map yet.") → muted explainer para → 3 actions: 1 primary + 2 secondary (home / main product route / contact) → standard footer. **The error page keeps the full design language, brand voice, and offers ranked routes out.**

### I1. Imagery — Part II partially CORRECTED [observed]
- Subject: monochrome CGI renders — white sculptural hub architecture, white robot arms, black EVs, SF skyline (autzu s00), calibration bays (hubs s00), aerial dusk hub (contact s00), blueprint collages on dark (about s00 = press s00, reused verbatim).
- **People: NOT absent.** Part II said "no foregrounded people"; careers hero foregrounds a team around a model (careers s00), blog cards show staff/customers mid-ground (blog s01 rows 1–2). Correct rule: people appear only where the subject IS people (careers, ops stories), always inside the same monochrome world; infrastructure pages stay unpopulated.
- Grading: near-monochrome (photography neutrals #1C1E1F/#C6C7CB are image content, ref-palette-notes) — imagery is color-managed into the palette.
- Containers: photos always in rounded containers, radius ≈10–14 (hubs hero corner inset 5→0, hubs s00 y100–121 [measured]) — **the same radius family as cards/buttons, NOT the 16–24 Part II estimated. One radius family across UI and imagery is part of the coherence.**
- Photo-vs-diagram policy: photography = physical world; software/abstract = dark navy panels hosting product mockups and diagrams (partnerships s00 network diagram, platform s00 dashboard, investors s00 chart card). Diagrams are *rendered as imagery* — static, monochrome + status colors, mono axis labels, with an honesty caption ("Dashboard data shown is for illustrative purposes only", platform s00).

### J1. Icons [observed]
Census: nav chevrons; feature icon chips = 40px (home s01 [measured 40x40]) / 44px (hubs s00 [measured 44x44]) outlined rounded squares containing thin-stroke geometric glyphs (plug, frame, sensor-wave, spinner, cube, truck); bare stroke icons ~18px in inline metric rows (platform s00) and ~22px atop ops cards (platform s01); 38px dark filled squares with white glyph paired with a mono eyebrow (contact info card, platform s01 security cards [measured 38x38]); circular outlined social icons (footer); arrow glyphs on text links ("Read more →", "Request a briefing →"); status dots; lock glyph in form microcopy.
Rules extracted: **single thin stroke weight throughout [estimated ~1.5px]; no color in icons — ink/muted only; an icon never carries meaning without an adjacent label (confirmed everywhere — even social circles are recognizable marks, and the lock sits inside a sentence); the container encodes the role** (outlined chip = feature, filled dark square = labeled category, circle = external identity, bare = inline metric).

### J2. Data displays [observed]
Only three chart-like objects on the whole site, all static imagery (investors growth curve card w/ mono labels; platform dashboard mockup incl. the corpus's only data table "Recent Activity"; partnerships network diagram on dark). Status-dot vocabulary is the one live data language: green=operational/live/passed, blue=launching, gray=coming soon, red=critical (platform s00 "1 critical") — used identically in map legend, location chips, footer pill, dashboard chips. **Marketing site: diagrams are art; the product would own the instruments. Trace green/blue/red are status-only colors, never decoration.**

### Part II items in my dimensions — verdict table
| Part II claim | Verdict |
|---|---|
| Buttons full pills | **CORRECTED**: r≈10 rects h44–45; pills = chips/tags only |
| Cards/images radius 16–24 | **CORRECTED**: ≈10–14 everywhere measured |
| Inputs 52–56px tall, labels above, reassurance | **CORRECTED height** 49–50px; labels/reassurance confirmed |
| Photography aerial/dusk, no people, rounded | **REFINED**: CGI renders, people where subject is people; rounded confirmed |
| Partner strip w/ logos | **CORRECTED** (slice-index): text chips only, never logo images |
| Accordion rows (drivers) | UNVERIFIED — drivers is a 404; no accordions anywhere in corpus |
| Metric bands 3–4 oversized stats | Confirmed + 2 more variants (in-card minis, fact-sheet grid) |
| Dark raised cards ~#131B30 | Refined to ≈#121927 (R1 measurement) |
| Elevation flat/no shadows | Confirmed in my crops — separation by hairline + tone only |

---

## 2. OWN-SITE FINDINGS

### K'1. Control ecology — one voice, five shapes [observed + source]
Voice is impressively consistent: **every control speaks mono, uppercase, letterspaced** (.btn base.css:224–231; .chip base.css:236–243; nav base.css:165–170; rail labels map.css:18–22; export chips map/index.html:71–77; sort headers base.css:274–279). But shape/size drifts:
- `.btn`: r-chip(8), padding 9x14, 12px → h≈38 [measured GO TO THE MAP variant .hero-btn h=52, home s01 y761–812; .hero-btn is a one-off 15px/14x26 size at home.css:186].
- `.chip`: r-pill, 4x11, 11.5px → h≈26 [measured LAYERS h≈26, map s00].
- `.rail-export .chip` squared to r-chip via override (map.css:31) — **exports are chips dressed as buttons** [observed map s00 y282–308].
- `.scroll-nav button`: full pill + ink fill + shadow (ledger.css:270–277) — a pill primary that contradicts .btn.primary's r-chip.
- `.map-key > summary`: a .btn look-alike with its own padding 7x13 (map.css:275–281).
- `.loop-controls button` 40px pills, `#loop-play` ink pill (home.css:116–135).
- `.region-tab`: r-card(14) tab (article.css:205–219).
Cross-check vs reference relationship (two shapes, roles fixed): we have pill-actions (scroll-nav, loop-play) AND rect-tags (export chips) — role/shape mapping inverted in places.

### K'2. Mono-tile monogram system [observed home/map/companies/media; base.css:399–413]
Layer-hued tile + 1–2 letter monogram; real logo fades in over it (opacity 220ms) — **nothing ever renders blank; the fallback is designed, not an error**. In this sandbox CDNs are blocked so slices show pure monograms everywhere — and the pages still look finished (companies s00, media s00). Sizes/radii hand-picked per surface: 48/r10 base.css:404–405, 44/r10 ledger.css:145, 44/r9 map.css:146, 34/r9 ledger.css:332, 26/r7 ledger.css:255 + map.css:200, 52/r13 media.css:17, 74/r16 article.css:93 — ratio ~0.2×size but never stated as a rule.

### K'3. Map tile + company card + ledger detail — one record, three renderings [observed state-map-selected, state-ledger-detail]
Map tile: monogram + wrapped name + mono sub-desc + partnership pips + gold dot + strike-through when exited (map s00/selected). Company card (#company-card, map.css:134–206): 44/r9 logo, h2 17px, mono layer line w/ square dot, gold SPOKEN WITH DIRECTLY, globe link, **sans** summary (.cc-sub), LEADERSHIP on a fixed 96px mono label rail (--cc-label), Wikipedia shot h170 r-chip + credit badge, facts dl on same rail, partner **logo chips** (pill, 26px logos), actions. Ledger detail (.detail-inner, ledger.css:140–188): 44/r10 logo, h3 **20px**, **serif** summary (.about, ledger.css:171), shot h**210** r-**card**, dl labels **max-content** (no fixed rail), partner **text list** w/ mono kind prefixes (no chips), d-block h4 labels get a bottom hairline the card's labels don't. Same record, two anatomies — every difference is unforced.

### K'4. Callout family [observed economics s03–s04; base.css:288–295, article.css:54–63]
`.note` (+.alert/.live): 1px border + 4px colored left border, r 0/14/14/0, sans 14px. `.hard-part`: 6px alert left border, mono label, serif 17px body. `.watch-list`: hairline rows w/ cyan ◍ marker (article.css:65–74). Coherent family (left-edge color = register) with two unforced diffs: 4px vs 6px edge, sans-14 vs serif-17 body.

### K'5. Table language — one strong language, three accents [source + companies/economics slices]
Core `table.data` (base.css:273–282): mono 11px uppercase muted headers, **ink rule under thead, hairline under rows** (mirrors reference's grid discipline independently), cyan 5% hover tint, .table-scroll wrapper. Ledger extends: sticky headers under measured chrome (--th-top, ledger.css:109–116), sticky company column w/ inset hairline (ledger.css:100–105), right-edge more-to-scroll fade (ledger.css:90–97), sort buttons w/ cyan active, compact mode, ≤680 rows→cards (ledger.css:193–221). `table.cmp` compare: sentence headers allowed to wrap (article.css:359–381), tinted output rows, `.blank` italic honest blanks. `table.spec`/`table.compare` switch row headers to display face at 170px/190px widths (article.css:97–102, 432–437). Def-list family (cc-facts, detail dl, world-card dl, meet-list, incident-row) = the same mono-label/value grammar at 4 slightly different specs.

### N'1. Form controls [observed map s00, companies s00, state-economics-calc s04–s05]
No conversion form (nothing to convert — deliberate). Control census: site search (r-chip, mono 12.5, base.css:175–180); ledger query .lg-q (r-chip, 8x12, ledger.css:18–23); map filter .rail-text (**r-pill**, 5x12, map.css:24–29); range inputs .rng (64px, 5x8, ledger.css:24–29); calculator input.eco-in (right-aligned mono, 5x8, article.css:394–400); native selects in compare pickers (**font-display 13.5/600** — the only non-mono control, article.css:343–349) + circular × remove buttons; checkbox pickers w/ cyan accent-color (ledger.css:49–59, map.css:348–360); PINNED pills (article.css:331–335). Focus = border-color:cyan consistently; global 3px cyan :focus-visible (base.css:88). **Five input skins where the reference uses one field anatomy.** Reassurance-copy equivalent exists and is stronger: honesty lines beside controls ("Exports label themselves as modelled, not reported", state-economics-calc s05; ledger honesty line companies s00).

### K'6. Trust UI — unique to us, no reference counterpart [observed + source]
Family: gold-dot spoken-with marks (.spoken-bar/.spoken-tag, base.css:506–516 — deliberately demoted from pill to mark+word so a label stops looking like a button); provenance marks .cmark D/R/E/C (14px bordered squares, cyan=disclosed, alert=estimated/unverified, article.css:383–391); .omark formula marks + .ftip CSS tooltips (article.css:172–192); honest blanks (.blank italic, article.css:379; "Blank is honest." economics s08; "parent-funded ≠ 0"); Wikipedia credit badges on every borrowed image (.cc-credit/.d-credit, map.css:167–171); dated coverage snapshots (.cv-summary, article.css:446); coverage-gap prose ("gaps in coverage, not evidence of absence", map s00); diagnostic filter announcements (#filter-state aria-live). The reference's nearest analogues: the italic partnerships disclaimer, the dashboard "illustrative purposes only" caption, and the certification-disclosure callout (platform s02) — a thin, marketing-grade honesty layer. **Ours is a load-bearing system and should be codified as a first-class component family: mark + word, color = epistemic status (gold=first-hand, cyan=disclosed/live, alert=estimated/contested, italic=absent-honestly).**

### J'1. Our diagrams — instruments, not imagery [observed]
Census: animated loop hero (home s00, reduced-motion fallback = all cards active, car parked); 3D-tilt minimap (real frozen geometry, home s01); 562-tile poster w/ camera, filters, selection curves (map slices); funding stacked bars + events bars w/ tooltip/pin (economics s01); 11x11 heatmap (teal-tint cells w/ counts) + rank bars (cyan proportional underlines) (partnerships s01); region-tab Q&A; incident timeline rows; calculator; coverage grids; chapter-band decorative SVG art; skeleton-style chapter thumbnails (home s02). All are live DOM/SVG instruments with keyboard access and honest captions — the reference has near-zero diagrams and renders them as static art. **Mandatory divergence, correctly taken.** One system break: chart series palettes are foreign hex sets (CHART_LIGHT/CHART_DARK core.js:259–260) unrelated to the layer hue wheel — visible in economics s01 (blue/orange/teal bars on a paper page).

### I'1. Our imagery policy — no photography at all [observed all own slices]
Universe: monogram tiles + remote logos; Wikipedia thumbnails as *evidence images* (cover-cropped to fixed heights 170/210, credit-badged); generated cartography (poster, minimap); decorative SVG band art at .45 opacity (home.css:253–265); the illustrated robotaxi token (only object illustration, home.css:28–41 w/ hardcoded #171813 tyres). Dark theme has a full parallel palette. **This is the right divergence** (a solo research atlas cannot art-direct a CGI photography program, and borrowed photography would break the evidence-first stance) — but it is nowhere written down as policy, and Wikipedia thumbs have two crop/radius specs (K'3).

### K'7. Empty/error/loading states [source + observed]
`.lg-empty` (ledger.css:187–188) — **diagnostic empty state: names the single blocking filter when one filter is doing the excluding, and offers CLEAR ALL FILTERS** (ledger.js:187–197). Chart fallback `<details>` table (.ch-fallback, article.css:306–309). Loading = monogram-first logo strategy (never blank). Map filter results announced via aria-live #filter-state. **Gaps:** no 404 page exists in the repo (repo root has no 404.html — GitHub Pages would serve the unstyled default); #lg-empty is not a live region (own-ui-inventory gap); no equivalent designed dead-end for /map with zero matches beyond announcement text.

---

## 3. PER-AXIS VERDICTS

**Axis 1 — Button/chip/control family.** Verdict: **HYBRID** (keep the mono-uppercase control voice; adopt the reference's two-shape discipline). Rationale: reference maintains exactly two control shapes with fixed roles across 13 routes (r≈10 rect = action at h44/33; pill = tag/filter at h34/27 [measured]); we run ≥5 shapes with role inversions — pill primaries (ledger.css:270) beside rect tags (map.css:31) beside r-card tabs (article.css:209) — a measurable consistency violation, not taste. Divergence map: "controls: ref uses Title-Case sans on two shapes; we keep mono-uppercase voice but reduce to two shapes (rect=action, pill=tag), because shape must encode commit-vs-describe."

**Axis 2 — Card policy (when-not-to-card).** Verdict: **ADOPT-PRINCIPLE**. Rationale: reference has an explicit three-tier grammar (gapped cards for objects / shared-hairline grids for records / borderless rows for lists — K3 measured borders at y160/343/525 with zero gap); we card nearly every grouping (fact, cv-op, pg, world-card, md-tile, op-card, pa-card — 7 bordered card species in article.css alone) and our only shared-hairline grid is the chapters block (base.css:422–447). Guide Part V names "cards for everything" a failure mode. Divergence: "carding: ref cards objects and hairline-grids data; we will move pure-data groupings (fact-grid, cv-grid) to shared-hairline grids, because border count is the main busyness dial on a paper ground."

**Axis 3 — Table language.** Verdict: **KEEP** (codify). Rationale: one core language (mono caps headers, ink thead rule, hairline rows, cyan hover — base.css:273–282) independently converges with the reference's hairline-row discipline, and our extensions (sticky measured headers ledger.css:113, mobile card transform ledger.css:193–221, right-edge fade) exceed anything in the corpus, which contains exactly one table and it's a mockup. Violations to fold in: row-header widths 170 vs 190 (article.css:100, 434) and four def-list micro-specs. Divergence: "tables: ref decorates one fake table; we operate real 23-col instruments — codify ours as the canonical language with a def-list sub-spec."

**Axis 4 — Form/input language.** Verdict: **HYBRID** (keep control breadth + honesty lines; adopt one-field-anatomy). Rationale: reference proves one input skin serves both a contact form and a jobs search (h49–50/r10 both, measured N1); we ship five skins (r-pill rail-text map.css:27 vs r-chip lg-q ledger.css:20; paddings 5x8/7x12/8x12) with no functional driver. Their reassurance-microcopy slot maps to our honesty lines — keep ours, standardize its position. Divergence: "fields: ref = one anatomy w/ privacy reassurance; we = one anatomy (mono, r-chip, two sizes) w/ epistemic honesty lines, because our forms input assumptions, not leads."

**Axis 5 — Callout/note family.** Verdict: **KEEP** (consolidate two literals). Rationale: left-edge-color-as-register is coherent and ours (reference has one gray callout box + one left-border variant, platform s02/terms s00 — less system than ours); but 4px vs 6px edge (base.css:289 vs article.css:55) and sans-14 vs serif-17 bodies are drift within one family, indefensible as variants. Divergence: "callouts: ref uses tone-tint boxes; we use color-coded left edges (yellow=provenance, alert=hard part, cyan=live), because the color must state the register."

**Axis 6 — Trust-UI family.** Verdict: **KEEP** (unique; codify as first-class). Rationale: no reference counterpart exists beyond three one-off honesty gestures (K'6); ours is systematic and already color-role-stable (gold=first-hand base.css:511–513; cyan=disclosed article.css:390; alert=estimated article.css:391; italic=honest blank article.css:379). Consistency check passes across map card, ledger, compare tables. Divergence: "trust marks: ref asserts credibility via metrics; we prove it via per-datum provenance marks — codify mark+word+color grammar so no future surface invents a fourth honesty style."

**Axis 7 — Icon policy.** Verdict: **ADOPT-PRINCIPLE** (one stroke weight; container-encodes-role), keep always-labeled. Rationale: reference holds one thin stroke and three container roles (J1); we use five stroke widths (1.4/1.5/1.7/1.9/2.4 — core.js:132,307,354; index.html:138) plus filled silhouettes (region tabs) plus text glyphs (▸ ▾ ◍ ×) — three icon languages on one site. Both sites already never let an icon stand unlabeled (confirmed; keep). Divergence: "icons: ref = thin stroke in role-coded containers; we standardize on one stroke weight + keep filled silhouettes only for the region-tab illustration set, because silhouettes there are pictures, not icons."

**Axis 8 — Imagery direction.** Verdict: **KEEP** (mandatory divergence; write the policy). Rationale: guide Phase 3 makes imagery a mandatory divergence entry; ref = art-directed monochrome CGI in rounded containers (I1), impossible and undesirable for an evidence atlas; ours = logos + generated cartography + credit-badged encyclopedia thumbnails (I'1) and it already reads finished with zero photos (all own slices). Violation to fix while codifying: one borrowed-image spec (h170/r8 vs h210/r14, map.css:163–166 vs ledger.css:155–158). Adopt one reference relationship: images share the UI radius family. Divergence: "imagery: ref renders a fictional world in monochrome CGI; we render the real industry as cartography + cited thumbnails, because our imagery must be evidence, not atmosphere."

**Axis 9 — Data-display language.** Verdict: **KEEP** (instruments) with one **stage-2 correction**. Rationale: our interactive, keyboard-accessible, honestly-captioned instruments (J'1) exceed the reference's diagram-as-imagery approach on every count that matters for this project; but the chart series palette (core.js:259–260, re-hardcoded export-png.js:26–27, poster.js:210–214) is provably outside the token system — six hexes appearing nowhere else — a consistency violation identical in kind to the one the reference never commits (their status colors recur exactly, J2). Divergence: "dataviz: ref paints diagrams as art; we build instruments; series colors will derive from the layer hue wheel so charts speak the site's own color language."

**Axis 10 — Empty/error/loading states.** Verdict: **HYBRID** (keep diagnostic empties + monogram loading; adopt the designed-404 principle). Rationale: our empty state out-designs theirs — it diagnoses the blocking filter and offers the fix (ledger.js:189–194) where their 404 offers generic routes; but we have **no 404 page at all** (no 404.html in repo root) while the reference ships a fully in-voice one (K9) — a hole, not a choice. Divergence: "dead ends: ref designs the 404, we design the zero-result; we will add a 404 in atlas voice ('this tile isn't on the map') with eyebrow + 3 ranked routes, because an unstyled platform default is the only surface where the design language currently vanishes."

**Axis 11 — Metric blocks.** Verdict: **HYBRID** (keep mono numerals + source lines; adopt one-voice-per-context rule). Rationale: reference runs four metric treatments in one typographic voice (K4); we run two (.stat-row clamp 26–40 base.css:284–286; .fact 24px + .src article.css:36–42) that agree on structure but were never reconciled (24 vs 26 floor, lbl 12.5 both — near-dup). Our source-line third row is trust-UI and stays. Divergence: "metrics: ref = sans numeral over muted label; we = mono numeral + label + source line, because a number without provenance is marketing."

**Axis 12 — One record, one anatomy.** Verdict: **ADOPT-PRINCIPLE**. Rationale: the reference reuses whole sections verbatim across routes (map+grid identical home/hubs; K5) — reuse *is* their coherence; we render the identical company record three ways with unforced deltas (title 20 vs 17, serif vs sans summary, chips vs text partners, 96px rail vs max-content, image 210/r14 vs 170/r8 — K'3). Divergence: "record views: ref repeats sections verbatim; our company card and ledger detail become one anatomy at two widths, because a reader who uses both surfaces is currently taught two vocabularies for one fact."

---

## 4. DRIFT LIST

Stage 1 = consolidate at an identical value (no visual decision beyond picking the survivor). Stage 2 = value/behavior change, needs a decision.

### Stage 1 (consolidate)
1. `.rail-export .chip` squared via override — map.css:31 + map/index.html:71–77. Chips acting as buttons → make them `.btn`.
2. `.map-key > summary` bespoke .btn clone (padding 7x13 vs 9x14, mono 12) — map.css:275–281 → `.btn`.
3. `.scroll-nav button` pill-radius primary — ledger.css:270–277 vs `.btn.primary` r-chip base.css:234 → one action radius.
4. `.hero-btn` one-off size (15px/14x26) — home.css:186 → named `.btn` size token (btn-lg), reused by loop-play if kept.
5. Input skins: `.rail-text` r-pill map.css:24–29 vs `.lg-q` r-chip ledger.css:18–23 vs `#site-search input` base.css:175–179 → one field skin, two sizes (md 8x12, sm 5x8 for `.rng` ledger.css:24–29 / `.eco-in` article.css:394–400).
6. Mono-tile radii: 44/r10 ledger.css:145 vs 44/r9 map.css:146; scale 26/7, 34/9, 44/9-10, 48/10, 52/13, 74/16 (ledger.css:255,332; base.css:404; media.css:17; article.css:93) → codify radius = round(0.21×size) or a 3-step token.
7. Wikipedia shot spec: h170/r-chip map.css:163–166 vs h210/r-card ledger.css:155–158 → one thumbnail component (goes with Axis 12).
8. Tooltip skins: 7px radius literal home.css:94 vs r-chip .ftip article.css:181 and .ch-tip article.css:291–296 → r-chip everywhere.
9. Credit badge radius 4px literals map.css:170, ledger.css:297 → token (align with layer-dot r3 or r-chip/2 — pick one).
10. Callout left edge 4px base.css:289 vs 6px article.css:55 → one width.
11. Popover radius 10px literals #search-results base.css:184, .picker .pop ledger.css:51, .map-rail .pop map.css:350 (vs r-card 14) → one popover token (10 also = mono-tile radius; a real --r-mid token would absorb both).
12. Count badges: .lg-adv .pk-n (h17/r9/10.5px) ledger.css:43–47 vs .map-rail .pk-n (r-pill/10px) map.css:343–347 → one badge.
13. Icon strokes 1.4/1.5/1.7/1.8/1.9/2.4 — core.js:132,134,307,308,327,354,355; index.html:138,146; companies/index.html:133 → one weight (carets may keep a heavier weight as a second, named step).
14. Def-list label rails: --cc-label 96px map.css:144 vs max-content ledger.css:172–175 vs world-card article.css:253–255 vs meet-list article.css:45–52 → one dl spec.
15. Row-header widths 170px article.css:100 vs 190px article.css:432–437 → one.
16. `.rail-label` duplicated identically map.css:18–22 / ledger.css:13–16 (+ .ch-col .lbl article.css:269–272, .cmp-slots .lbl article.css:339–342 at 10/10.5/11px) → one label class.
17. Metric blocks: .fact .num 24px article.css:40 vs .stat .num floor 26px base.css:285 → one numeral scale, shared .lbl/.src.
18. Near-dup heading clamps .ledger-title ledger.css:4–7 / .chart-title map.css:7–10 vs .section-head base.css:110–113 (maxes 44/38/38, wdth 116/116/112) → one h2 token (overlaps R2; listed because they head components).
19. Hue table duplicated in JS core.js:46–53 vs base.css:16–21 (consumed poster.js, ledger.js) → single source (generate or read from CSS).
20. `.door/.doors` component defined but unused (base.css:257–270; no HTML) → delete or adopt for chapter tiles.

### Stage 2 (value change, needs decision)
21. Chart palettes foreign to system — core.js:259–260 CHART_LIGHT/CHART_DARK; re-hardcoded export-png.js:26–27, poster.js:210–214, tools/render-poster.py:24–27, tools/build-social-cards.py:69–78 → derive 6 series colors from the layer hue wheel (decision: distinguishability vs system purity; dataviz-accessibility check needed).
22. Company-record unification (Axis 12): title 17 vs 20 (map.css:149 / ledger.css:170), summary sans vs serif (map.css:154 / ledger.css:171), partners chips vs list (map.css:189–201 / ledger.css:181–182) → one anatomy; decide serif-or-sans and chips-or-list once.
23. No 404 page (repo root listing — no 404.html) → design one per Axis 10 (new component, in-voice, eyebrow + ranked routes).
24. Region-tab filled silhouettes (article.css:213, regulation slices) vs stroke icon language → decide: reclassify as illustrations (keep, document) or redraw as stroke.
25. Compare-picker selects in font-display (article.css:343–349) — the only non-mono control → decide whether native-select pragmatism (own-ui-inventory calls it deliberate) justifies the voice break; if kept, document as the stated exception.
26. Carding of pure-data grids (Axis 2): .fact-grid article.css:32–43, .cv-grid article.css:448–455 → shared-hairline grid variant (visual change).
27. Loop-station asymmetric radius 44/16 home.css:62–65 (+ mobile flatten :159) → keep as signature but promote 44 to a named token so it can't drift.
28. `.hard-part` serif body vs `.note` sans (article.css:63 / base.css:291) → decide one body voice for callouts (interacts with #10).

Counts: stage1 = 20, stage2 = 8.
