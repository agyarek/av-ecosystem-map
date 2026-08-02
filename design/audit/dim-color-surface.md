# Dimensions G (Colour) + H (Shape, borders, surfaces) — R1 Color & Surface agent

Corpus: reference desktop slices at `$SCRATCH/reference/slices/`, own slices at `$SCRATCH/own/slices/`, source at `/home/user/av-ecosystem-map` (read-only).
Tags: [measured] = pixel-sampled/programmatic; [observed] = read from capture; [estimated] = bounded, AA caveat; [inferred] = deduced. Track B failed — everything here is Track A (screenshots) + own source. All Track B unverified items (live CSS tokens, exact live values, radii-in-CSS) REMAIN unverified; every reference number below is a screenshot measurement, not a stylesheet fact.
IP note: reference values are studied for RELATIONSHIPS (ratios, roles, disciplines) only; nothing is adopted verbatim.

---

## 1. REFERENCE FINDINGS

### 1a. Colour — the measured palette

**Surfaces**
- Page surface `#FFFFFF` [measured] — flat samples autzu.com_desktop/s00 (720,30) and (700,975), grid cells s03 (300,180), careers s00 (700,620), press s00 column scan y600–1070, terms s00 (700,300). Part II's `#F8F8F6` is CORRECTED (agrees with ref-palette-notes: white dominates 53–87% on all 13 routes).
- Warm tint `#F6F6F4` [measured] — the ONE grouping tint: metric-tile fills (autzu.com/s00 4 samples at y820–863), careers CTA banner (s00 (700,940),(300,1040)), platform band (s01 (80,300)), terms callout (s00 (300,570)), investors chart card (s00 (1000,300),(1250,450)). Its darker sibling `#E8E8E4` is the border/hairline (below), not a second tint.
- Cool tint family `#DDE2E9 → #E7EBF0` (gradient) + continents `#A8B0BC`/`#C0C7D1` [measured, autzu.com/s02 map card: (720,481) #E1E6EC edge, fill rows #DDE2E9, ocean (1000,950)/(300,900) #E7EBF0] — appears ONLY inside the world-map/geo card (home + hubs). Rule: warm tint = content grouping; cool family = cartographic/data surface, not a general band colour. Press "fact sheet" section is plain white with hairlines [measured, column scan], correcting the slice-index note that called it a light-gray band.
- Dark surface `#0B1220` [measured] — ONE value for closing-CTA bar (s03 (700,697),(400,680)), footer (s03 (700,900),(1200,1050), s04), partnerships hero dark panel ((1000,300),(1250,500)), platform dashboard sidebar ((700,300)). CTA bar and footer are exactly equal. CONFIRMS Part II.
- Dark raised `#121927` + 1px lighter border `#323743` [measured, footer "Official Uber partner" pill, autzu.com/s03 (157,1043) fill, x=80 border scan]. Part II's ~#131B30 estimate corrected to #121927 (matches quantize). Dark-context hairline `#282E3B` 1px [measured, autzu.com/s04 x700 column scan, y161].

**Ink & text ramp on light** (glyph-core cluster analysis, solid-pixel counts cited)
- Ink `#0B1220` [measured] — headline glyph cores 13,257–16,779 solid px (autzu.com/s00 headline region; contact/s00 headline 13,257). Same value fills the primary button ((1222,437)) — text, action and surface are one colour. CONFIRMS the "triple duty" finding.
- Secondary ink `#2A3140` [measured, small cluster] — form labels (contact/s00 "Full name" 42 solid px) and hero support darkest on home. A step between ink and muted.
- Muted body `#5A6473` [measured] — solid clusters 490 px (home s00 right para), 506 px (home s02 para), 655 px (contact s00 support para). Part II's #6E7480–#8A8F99 estimate corrected DARKER.
- Tertiary gray `#737C8A` [measured, small clusters] — input placeholders (contact/s00, 61 solid px), mono eyebrows ("EMAIL" 8 px darkest; slice-index's ~#939AA5 is the AA halo of this). Bound: true value in #737C8A–#939AA5, best estimate #737C8A.
- On dark: primary text `#E6E9F0–#FFFFFF` [estimated; CTA lead solid cluster #E6E9F0 369 px vs link #FFFFFF 47 px]; muted-on-dark `#9DA5B6` [measured, footer blurb 278 solid px].

**Hairlines/borders — a single value, single width**
`#E8E8E4` at 1px in EVERY light context [measured in 8 places]: metric-tile divider (s00 (428,863)), rule under metric band (y942), tile bottom border (y917), location-grid outer + inner rules (s03 y75/y238/x525), careers section rules (y634, y874), contact form-card border (x136), input borders (y440), info-card divider (y599). Part II's "#E2E6EA cool gray" estimate corrected: the hairline is the warm tint's darker sibling, and it is ONE value. No 2px border was found anywhere. Cool grays (#D3D5D9 etc. from quantize) are map-card cartography, not UI hairlines.

**Accent & status**
- Brand accent: NONE — CONFIRMED. Saturated pixels: autzu.com 0.0198%, platform 0.0331%, investors 0.0004%, blog 0.3028% (photography sky/olive only) [measured, half-res full-page scans].
- But a functional STATUS vocabulary exists at dot/label scale [measured, autzu.com/s02+s03]: green `#1F7A4D` (Live/Operational — dot AND text), blue `#2769B8` (Launching — dot AND text), neutral gray `#8A93A1` (Coming soon), on-dark green `#56C574` (footer pill dot) / `#20C058–#50D080` (dashboard chips), on-dark amber `≈#F0A830` (dashboard "1 critical") [measured, platform/s00 saturating scan]. No red anywhere. This refines Part II's "trace green ~#409860".

**WCAG contrast (computed from measured values)**
| pairing | ratio | verdict |
|---|---|---|
| #0B1220 on #FFFFFF | 18.72 | AAA |
| #0B1220 on #F6F6F4 | 17.30 | AAA |
| #2A3140 on #FFFFFF | 13.03 | AAA |
| #5A6473 on #FFFFFF | 5.99 | AA pass |
| #5A6473 on #F6F6F4 | 5.54 | AA pass |
| #737C8A on #FFFFFF (eyebrow/placeholder) | **4.22** | **FAIL AA normal text** |
| #939AA5 on #FFFFFF | 2.84 | decorative only |
| #1F7A4D on #FFFFFF (status text) | 5.32 | AA pass |
| #2769B8 on #FFFFFF (status text) | 5.53 | AA pass |
| #8A93A1 on #FFFFFF ("Coming Soon" text) | **3.10** | **FAIL AA at 12px** |
| #FFFFFF on #0B1220 | 18.72 | AAA |
| #9DA5B6 on #0B1220 | 7.57 | AA pass |
| #F0A830 on #0B1220 | 9.23 | pass |
→ Patterns to REJECT (a11y outranks similarity): the reference's 4th gray as content text, and gray status labels at small sizes.

### 1b. Shape, borders, surfaces

**Buttons are NOT full pills — Part II CORRECTED.** Row-by-row edge profiles:
- Primary "Request Briefing" (autzu.com/s00): h=45px (y415–459), left edge flat from y423 to y452 → corner radius ≈ **8px ±1** [measured]. A pill would arc for 22 rows; it arcs for 8.
- Careers hero + banner primaries: same h≈45, arc depth ≈ 8 [measured].
- "Send Message" (contact/s00): h=44, arc ≈ 7–8 [measured].
- Secondary "Uber EV": h≈44, arc ≈ 5–8 [measured, fuzzier AA on 1px border].
- TRUE pills exist only at badge scale: footer partner pill h≈35, border arc spans ~16 rows = half the height [measured, autzu.com/s03 x70–110 scan]; legend chip/filter pills [observed].

**Radius tiers** [measured, inset-profile method, ±2px error]
| element | radius |
|---|---|
| buttons (44–45px tall) | ≈8 |
| text inputs (h≈50 incl. borders — Part II's 52–56 trimmed) | ≈8 |
| photo containers (contact hero photo) | ≈10 |
| cards: metric tile, contact form card | ≈12–13 |
| section containers: map card ≈14, dark CTA bar ≈14, careers banner ≈15 | ≈14–16 |
| badges/chips | pill |
Part II's "cards and images ~16–24" narrowed: cards sit at 12–13, only full-width section containers reach 14–16, photos ~10.

**Flat, shadow-free discipline — CONFIRMED at pixel level.** White→#0B1220 in exactly 1px at the CTA bar top edge (autzu.com/s03, y661→662); tile fill→border→white in adjacent rows (s00 y916–918); no gradient falloff around any card, tile, banner or bar sampled. Separation is achieved by (a) 1px #E8E8E4 hairlines, (b) the warm tint, (c) the dark band. Elevation = zero, everywhere [measured].

**Two card grammars** [observed, slice-index confirmed]: gapped 1px-bordered rounded cards (features/posts/forms) vs. shared-hairline grid cells with NO rounding and NO gaps (location grid, fact sheet, certifications). The grid-cell grammar means hairlines can carry data-density without card chrome.

**Inputs**: white field, 1px #E8E8E4 border, r≈8, h≈50, label above in #2A3140, placeholder #737C8A [measured, contact/s00].

---

## 2. OWN-SITE FINDINGS

### 2a. Surfaces in practice
- `--paper #FAFAF7` IS the real page ground [measured, ⅓-res quantize of full captures]: home 60.6%, companies 72.8%, economics 71.0%, map 85.0%, overview 75.5%, regulation 75.2%, method 76.3%. `--paper-2 #FFFFFF` is the raised-card/table surface (0.7–12.6%). Exception: partnerships_desktop_light is 50.7% #FFFFFF vs 35.7% paper — its giant matrix/heatmap tables flood the page with the raised surface [measured].
- Dark theme is an exact structural inversion: home dark = #14150F 60.2% + #1C1E17 12.1%, map dark #14150F 85.1% — same percentages as light [measured]. The 17-token dark block (base.css:47–62) overrides every colour token including tile/med/road; nothing falls through.
- Our polarity is the reverse of the reference: they use white ground + tint band; we use tint ground + white raised. Both are one-neutral-tint systems.

### 2b. Accent census (blob-count at token tolerance ±36–40, subpixel-AA fringes excluded — first naive scan was poisoned by LCD fringing, verified at (292,334) home/s00: #CA8A4E/#8ECBEA 1px glyph fringes)
**Yellow per desktop viewport [measured]:** every page s00 = 3 marks — wordmark dash 22×6 @(132,24) + nav current-page underline 82–105×5 @(y38) + eyebrow tick 5×5; home s00 adds a gold legend dot (6×5) = 4; map s00 adds the Spoken-with gold dot (8×8) = 4. Mid-page slices: 0–2 (one tick per section head; .note border-left 4×135–198 on economics s03/s04, overview s02, partnerships s19; chapters-block "you are here" underline ~100×2 near footer). Mobile: 1–2. Dark theme: same counts.
→ The stated rule (base.css:1–3: "road-marking yellow used once per viewport") is literally FALSE — the header alone always carries two yellow marks. The honored rule is: **yellow appears only as small fixed-inventory marks (dash, underline, tick, dot, note-spine), never as a fill; largest instance ≈500px².**
**Cyan [measured]:** live/interactive channel — loop-card live borders (home s00), partner curves + selected-tile border (state-map-selected), co-links (underlined text, dozens per chapter page; partnerships s03 has ~109 link blobs in one viewport — walls of cyan text), row hover/expanded tints, focus ring, KEY/chart UI. 
**Alert [measured]:** semantic data ink — incident outcome lead-ins ("Programme-ending.", 8 per viewport on regulation s02), provenance marks, negative table cells. Never decorative.

### 2c. Contrast audit (computed; rendered values confirmed by sampling)
| pairing (light) | ratio | verdict |
|---|---|---|
| --ink #12130F / --paper #FAFAF7 | 17.84 | AAA |
| --ink-2 #3B3E36 / paper | 10.41 | AAA |
| --muted #6E7268 / paper | 4.70 | AA pass (thin margin) |
| --muted / paper-2 | 4.92 | AA pass |
| --med-sub #6E7268 / --med-bg #F4F2E9 | **4.39** | **FAIL AA** (base.css:22) |
| --cyan #00A5B8 as text / paper | **2.84** | **FAIL AA** (co-links base.css:523–526, matrix links, chart labels) |
| --cyan focus ring / paper | **2.84** | **FAIL WCAG 1.4.11 non-text 3:1** (base.css:88) |
| --alert #C4453B / paper | 4.71 | AA pass |
| --yellow #F2B705 dot / paper | **1.74** | **FAIL 3:1 non-text** where meaning-bearing (poster spokenTo dot, poster.js:286, has no adjacent text) |
| --tile-ink #FFFFFF / oklch(.66 .06 H) all 11 hues | **3.02–3.21** | fails AA as text; acceptable ONLY as decorative logo-fallback monogram (name is adjacent) |
| layer hue oklch(.62 .075 H) as "N orgs" text / paper | 3.37–3.63 | below AA for small mono text |
| --rule / paper | 1.28 | hairline (fine, non-content) |

| pairing (dark) | ratio | verdict |
|---|---|---|
| #F2F2EC / #14150F | 16.34 | AAA |
| #C4C7BB / #14150F | 10.69 | AAA |
| #8B8F82 / #14150F | 5.55 | AA pass |
| #8B8F82 / #1C1E17 | 5.09 | AA pass |
| #FFC931 / #14150F | 11.93 | pass |
| #22C4D6 / #14150F | 8.69 | AA pass (links fine in dark) |
| #E0655B / #14150F | 5.40 | AA pass |
| #9DA095 / #24261D (med) | 5.76 | AA pass |
| #E9EAE2 / oklch(.42 .055 H) tiles | 6.77–7.22 | AA pass |
→ **The dark theme passes everything; the light theme is where every failure lives** (cyan text, cyan focus ring, med-sub, gold dot, tile monograms). "Spoken with directly" gold-tag: the TEXT is --ink-2 (base.css:506–515) at 10.41:1 — passes; only the 7px gold dot is low-contrast, mitigated by the adjacent words except on the poster.

### 2d. Elevation in practice (17 declared shadows, source-inventory base.css/home/ledger/map)
Observed in situ:
- **Communicating (earn their keep):** company card floating over the poster — measured falloff ≈30px, #E4E4E0→#F5F5F1 over paper (state-map-selected/s00 x588–620 scan) [measured]; dropdown menus (base.css:471), search results (base.css:185), ledger bottom-sheet + backdrop (ledger.css:225/235/274), map fullscreen chrome (map.css:140), secnav (base.css:560). All are true overlays that detach from the page plane.
- **Not elevation at all:** the 3 `inset 0 -2px 0 var(--yellow)` current-page underlines (base.css:172,451,540) are marks implemented as shadows.
- **Decorative:** home hero tilted minimap `24px 40px 80px rgba(18,19,15,.22)` (home.css:194) — renders a physical "poster object" (observed home_desktop_light/s01); illustration, not UI elevation. Loop-card/car shadows (home.css:95,121) same category.
- Two shadows at 0 10px 30px differ only in alpha .12/.16/.25 across three files; 0 6px 18–20px appears at .18/.22/.28 — near-duplicates, no semantic difference [measured in source].
- Reference comparison: they run ZERO; our static page composition (cards, tables, bands, notes) is ALSO shadow-free — borders + paper/paper-2 contrast do the work. The flat discipline already holds for in-flow content; shadows cluster exclusively on floating chrome (plus the two hero illustrations).

### 2e. Radii in practice
Rendered UI matches the 3 live tokens: KEY button arc ≈6–8 (--r-chip 8) [measured, map/s00 corner profile], poster frame arc ≈12–14 (--r-card 14) [measured], chips/filters/partner pills = --r-pill [observed]. Source census (own-source-inventory): 41 token uses vs 13 raw values — 10px twice (base.css:184 search results, base.css:405 mono-tile) sitting unexplained between chip(8) and card(14); 9px×3, 7px×3, 3px×6, 4px×3, 2px×2, 13/14/16px strays; asymmetric loop-card `44px 16px 16px 16px` (home.css) as a deliberate road-corner illustration; `--r-medallion 20` is declared and NEVER used. Our tier structure (8 controls / 14 cards / pill badges) is structurally identical to the reference's measured tiers (8 / 12–16 / pill) — convergent, not copied.

### 2f. Layer hues in situ
11-hue wheel at fixed L/C consumed via oklch() in 8+ places (base.css:16–21, core.js:46–53 duplicate table, poster.js, map.css, inline HTML styles). On the light poster, tiles are legible as HUE AREAS and the districts read clearly at overview zoom (observed state-map-selected light/dark); adjacent hues (e.g. demand 20 vs vehicle 40; regulators 290 vs fleet 320) are distinguishable in the district-block context but would not survive as isolated dot-only coding — labels always accompany them [observed, home chips + map districts]. Selection dims non-selected tiles to ~50% over paper (measured: fleet tile #A387A9 → #CFC0D2). Dark theme flips to L .42 tiles + L .74 dots — measured AA-passing. The taxonomy is the site's genuine extension of the language into data-viz territory; the reference has nothing comparable.

---

## 3. PER-AXIS VERDICTS

**Axis G1 — Ink discipline (one ink, triple duty).** VERDICT: **KEEP.**
Rationale: ours already implements the reference's strongest measured principle — one ink value is simultaneously text, primary-button fill, selected-chip fill and skip-link surface (base.css:224–246, 90–92), exactly as #0B1220 serves headline/button/footer/band in the reference [measured both sides]. Our dark theme inverts it losslessly (#F2F2EC), which the reference never has to do. Codify: "ink is the only permitted fill for primary action and selection; no second dark."
Divergence-map: *ink: ref runs one navy #0B1220 as text+action+surface on light only; we run one green-black ink pair (#12130F/#F2F2EC) doing the same duty in two themes, because we carry a real dark mode.*

**Axis G2 — Surface strategy (tint bands vs paper/paper-2).** VERDICT: **KEEP.**
Rationale: measured dominance shows a coherent inverted-polarity system: ref = white ground (53–87%) + one warm tint #F6F6F4 for grouping; ours = warm paper ground (60–85%) + white for raised content. Both are exactly-one-neutral-tint systems; changing polarity would erase our "field atlas paper" identity for no measured gain. One consistency wobble to codify, not fix by value: partnerships light is 50.7% paper-2 because full-bleed tables flood the page — state the rule "paper-2 is earned by content that is a sheet (table, card, input), never by sections."
Divergence-map: *surface: ref tints the exception on a white ground; we whiten the exception on a tinted ground, because our raised sheets (562-row tables, cards) are the content itself.*

**Axis G3 — Accent policy (their zero vs our yellow+cyan+alert).** VERDICT: **HYBRID** (their restraint discipline + our functional trio).
Rationale: the reference's "no accent" is real (≤0.033% saturated UI pixels [measured]) but it still ships a measured STATUS vocabulary (green #1F7A4D, blue #2769B8, amber, gray) — colour appears exactly where it encodes state. Ours does the same with three accents, and the yellow census proves the restraint mostly holds (3–4 small marks per viewport, largest ≈500px²). Adopt their principle "accent = smallest mark that still reads; text label always adjacent"; keep our trio because a data publication needs live/selected (cyan), wayfinding (yellow) and severity (alert) channels the reference never faces. The stated "once per viewport" rule must be rewritten to the true rule (fixed mark inventory), and light-theme cyan needs a value fix (G3/stage2, see drift).
Divergence-map: *accent: ref encodes state only (green/blue dots) on a two-tone ground; we run three semantic channels (cyan=live, yellow=waymark, alert=severity) at mark scale, because our pages assert hundreds of stateful data points.*

**Axis G4 — Layer-hue taxonomy (11 hues).** VERDICT: **KEEP** (with a legibility codicil).
Rationale: one hue wheel at fixed L/C consumed everywhere by formula is more systematic than anything in the reference corpus (which has no categorical colour at all); dark-theme flip (.66/.06→.42/.055 tiles) passes AA 6.77–7.22 [measured]. Codicil from measurement: light-tile monograms are 3.0–3.2:1 — legal only because they are logo fallbacks with the name adjacent; hue-coloured TEXT (the "N orgs" mono labels, 3.37–3.63) must either grow, darken, or carry an adjacent neutral label. Never let a hue be the sole carrier of layer identity (labels already accompany chips — keep it that way).
Divergence-map: *taxonomy: ref has no categorical system; we run an 11-hue oklch wheel with theme-flipped L/C, because 562 organisations need a stable per-layer identity in chart, chip, and map.*

**Axis G5 — Text-gray ramp.** VERDICT: **KEEP** (and reject the reference's bottom step).
Rationale: our 3-step ramp (ink 17.8 / ink-2 10.4 / muted 4.70) passes AA at every step in both themes [measured]; the reference's 4-step ramp bottoms out at #737C8A = 4.22:1 (eyebrows, placeholders) and #8A93A1 = 3.10:1 (status text) — measured AA failures we must NOT import. Our eyebrows use --muted at 4.70 — the same visual role done accessibly.
Divergence-map: *grays: ref buys elegance with a sub-AA fourth gray; we stop at three AA-passing steps, because accessibility outranks visual similarity (guide rule 6).*

**Axis H1 — Hairline/border system.** VERDICT: **KEEP** token, **ADOPT-PRINCIPLE** "one hairline, one width, per context".
Rationale: the reference is astonishingly disciplined — #E8E8E4 at 1px in all 8 sampled light contexts, #282E3B on dark, nothing at 2px [measured]. We already own --rule/#DEDFD8 (1px) + semantic thick borders (4px note spine, 6px card.ruled top — these are marks, keep), but 16 distinct rgba() tints, 12 inline #FFFFFF, and literal #12130F/#fff bypass the token (own-source-inventory; drift list) — that's the consistency violation the principle fixes. Also adopt their second grammar: shared-hairline grid cells (no gaps, no rounding) for dense data — we currently only have bordered cards + tables.
Divergence-map: *hairlines: ref = one value/1px everywhere incl. a dark-context sibling; we keep --rule + dark --rule and purge every literal, because a single separator value is what makes density read as calm.*

**Axis H2 — Shadow/elevation policy.** VERDICT: **HYBRID** (their flat-by-default; our earned elevation for true overlays).
Rationale: reference = measured zero (1px white→#0B1220 transitions, no falloff anywhere); our in-flow content is ALSO already flat — all 17 shadows cluster on floating chrome (dropdowns, company card, bottom sheet, fullscreen chrome, secnav) plus 2 hero illustrations and 3 yellow inset-underline marks. So the honest rule is: **static composition is flat (hairline + tonal separation only); shadows exist solely for elements that float above the page plane; illustration shadows are art, not tokens.** Consolidate 17 declarations → 2–3 tokens (float ≈ 0 14px 40px .16 — already used identically in 3 files; sheet ≈ 0 6px 20px heavier; ring = focus). The near-duplicate alphas (.12/.14/.16/.25 on the same geometry) are measured drift with no semantic meaning.
Divergence-map: *elevation: ref is flat absolutely (no overlays exist there); we are flat in-flow and reserve 2 tokenized shadows for true floating chrome, because a pan/zoom poster and bottom sheets genuinely occlude the page.*

**Axis H3 — Radius system.** VERDICT: **KEEP.**
Rationale: measured convergence — our tokens (chip 8 / card 14 / pill badges) match the reference's measured tiers (buttons+inputs ≈8 / cards 12–13, sections 14–16 / pill badges) almost exactly, including the correction that neither system uses pill BUTTONS (ref buttons r≈8 on 45px — Part II corrected). Rendered UI honors the tokens [measured, KEY≈8, poster frame≈14]. Work needed is drift, not redesign: 13 raw values (two 10px strays, 9/7/13/16px) fold into the tiers; --r-medallion 20 is dead — delete or assign; the asymmetric loop-card 44/16 is a documented illustration exception.
Divergence-map: *radii: ref runs 8/12–16/pill-badges; we run tokenized 8/14/pill with one documented illustration exception, because a 3-value radius scale is the largest set anyone can keep consistent.*

**Axis H4 — Dark-theme strategy (their dark SECTIONS vs our dark THEME).** VERDICT: **KEEP.**
Rationale: these are different devices — ref's #0B1220 bands are light-page pacing (every page a dark tail); ours is a user-controlled full inversion. Measured verdict on OUR consistency: the inversion is complete (17-token override, no fall-throughs; surface share identical 60/12 vs 60/12 [measured]; med/tile/road all flipped) and the dark theme is our BEST theme by contrast (every pairing passes, 5.09–16.34, while light holds all five failures). Two inversion breaches are real and go to drift: (a) chart palettes CHART_LIGHT/CHART_DARK (core.js:259–260) are hand-picked sets unrelated to the token system; (b) exports/social cards pin the light palette (poster.js:210–214, export-png.js:26–27, tools/*.py) — intentional for artifacts, but the palette is quadruplicated rather than sourced once. Optional enrichment worth stating as a non-goal or future device: we have no equivalent of their dark rhythm band; our chapters/footer stay paper — that is a deliberate difference, not an omission.
Divergence-map: *dark: ref inserts dark bands as rhythm inside one light theme; we invert the entire system per user preference, because a reading/data tool is used long enough for ambient choice to matter.*

**Axis H5 — Card grammar (bordered cards vs shared-hairline cells).** VERDICT: **ADOPT-PRINCIPLE.**
Rationale: the reference cleanly splits two grammars [observed/measured]: gapped rounded 1px-bordered cards for editorial units vs. square shared-hairline grid cells for dense data (location grid, fact sheet, certifications). We have the first grammar (.card) and tables, but our dense grids (coverage snapshots, stat rows, chapter grid) improvise their separators per page. Adopting the abstract rule — "editorial unit ⇒ bordered rounded card; data matrix ⇒ shared hairlines, no rounding, no gaps" — names a distinction we already half-follow and stops per-page reinvention. No reference value is copied; the device is generic.
Divergence-map: *card grammar: ref switches from cards to shared-hairline cells when content becomes data; we codify the same switch for stat grids and snapshots, because card chrome at data density is noise.*

---

## 4. DRIFT LIST (own implementation, dimensions G+H)

### Stage 1 — consolidate at identical value (no visual change)
1. **Hue table duplicated JS/CSS** — base.css:16–21 vs core.js:46–53. One source (JS reads computed style, or a generated constants file). [G4]
2. **Literal #12130F instead of var(--ink)** — home.css:135, ledger.css:45, ledger.css:278, map.css:345. Breaks dark theme wherever it touches themed context. [G1]
3. **#fff / #FFFFFF literals** — ledger.css:297, map.css:170, base.css:374, base.css:406, base.css:411, home.css:29, home.css:36; +12 inline #FFFFFF in HTML (index.html:103,112–115; companies/*, economics/*). Map to --paper-2 or --tile-ink by role. [G2]
4. **Palette quadruplication for exports** — poster.js:210–214, export-png.js:26–27, tools/render-poster.py:24–27, tools/build-minimap.py:24–56, tools/build-social-cards.py:69–78. Keep the pinned-light-export decision; source the values once. Bug found: build-social-cards.py:69–78 uses muted #8B8F82 (the DARK muted) in a light-palette context — contradiction. [H4]
5. **Cyan tint ladder: 9 ad-hoc color-mix percentages** — 5% (base.css:281, ledger.css:105), 7% (ledger.css:138), 8% (article.css:283), 9% (base.css:193), 14% (article.css:468), 16% (article.css:280), 20% (home.css:68), 45% (base.css:525), 55% (article.css:417). Collapse to ~3 named steps (hover-tint, selected-tint, underline). Rendered proof of near-dupes: ledger row-highlight #E8F4F2 vs detail-bg #EDF5F3 [measured]. [G3]
6. **Shadow near-duplicates → 2–3 tokens** — identical 0 14px 40px rgba(18,19,15,.16) in base.css:185, ledger.css:52, map.css:351 (tokenize as-is); 0 10px 30px at .12/.16/.25 (base.css:471, home.css:121, ledger.css:225); 0 6px 18–20px at .18/.22/.28 (home.css:95, map.css:264, ledger.css:274 — the .28 is the only pure-black rgba(0,0,0,·), normalize base); 8 alpha steps on rgba(18,19,15,·) → fixed scale. Reclassify the 3 yellow inset underlines (base.css:172,451,540) as a .current-mark utility, not shadows. [H2]
7. **Radius strays → tiers** — 10px at base.css:184 and base.css:405 (pick --r-chip or --r-card); 9px×3, 7px×3, 13/16px strays (per-file, see own-source-inventory §Radii) → nearest token; 3px/4px micro-radii (wordmark dash base.css:161, focus ring base.css:88) are fine as component constants; delete unused --r-medallion (base.css:25) or apply it to the medallion; document loop-card 44px 16px (home.css) as illustration exception. [H3]
8. **Orphan illustration hexes labeled** — home.css:28–40 (#171813 car body, #2E3028 lidar puck): add "illustration constants, theme-independent" comment so they stop reading as drift. [H2]
9. **16 distinct rgba() tints** (scrims, fades: base.css:145, base.css:468, ledger.css:94, article.css:150–151 etc.) → named scrim/fade tokens on --paper/--ink. [H1]

### Stage 2 — value changes, need decision
10. **--med-sub on --med-bg = 4.39:1, fails AA (light)** — base.css:22 (#6E7268 on #F4F2E9). Darken med-sub toward --ink-2 or lighten med-bg. Dark passes (5.76). [G5]
11. **Light cyan as text = 2.84–2.97:1, fails AA** — .co-link (base.css:523–526), matrix/partnership links (article.css), chart hue labels. Hundreds of failing links on partnerships/companies light [measured, s03 ≈109 links/viewport]. Needs a darker light-theme text-cyan (≥4.5:1, ≈#00707F-class) while stroke/curve cyan may stay bright. Dark theme passes (8.69) — no change. [G3]
12. **Light cyan focus ring = 2.84:1, fails 1.4.11 (3:1)** — base.css:88 :focus-visible 3px var(--cyan). Ring colour must clear 3:1 vs paper in light. [G3]
13. **Gold dot 1.74:1 in light where it is the sole carrier** — poster spokenTo circle (poster.js:286) has no adjacent text; spoken-tag/bar dots (base.css:511–514) are mitigated by adjacent --ink-2 words. Add a 1px ink outline to the dot, or darken light gold for indicator use. [G3]
14. **Hue-coloured small text below AA** — district "N orgs" mono labels at oklch(.62 .075 H) = 3.37–3.63 vs paper (poster.js:251–254); tile monograms 3.0–3.2 acceptable only as decorative logo-fallback (document that status explicitly). Decide: darken layer-l for TEXT usage in light, or pair each with a neutral label. [G4]
15. **Chart palettes unrelated to system** — core.js:259–260 CHART_LIGHT/CHART_DARK (6 hand-picked hex each). Either derive from the 11-hue wheel (preferred: series identity could reuse layer hues) or bless them as a named categorical set with contrast rules; today they contradict the two-accent story and the token system. [H4]
16. **Rewrite the stated yellow rule** — base.css:1–3 comment "yellow used once per viewport" is measured-false (3–4 marks incl. permanent header dash + underline). Restate as the fixed mark inventory (dash, current-underline, tick, gold-dot, note-spine) with "never a fill" — this is the actual, defensible discipline. [G3]

### Reference patterns to reject (for the record, G/H scope)
- 4th-gray content text at 4.22:1 and gray status labels at 3.10:1 (a11y).
- Meaning carried by dot colour alone at 12px without shape/label redundancy (their map legend mitigates with labels; keep ours labeled too).
