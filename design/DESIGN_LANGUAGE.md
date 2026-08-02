# AV Ecosystem Map — Design Language

**Version 1.0 · 2026-08-02.** The standing reference for every interface decision in this repository. Companion files: `design-tokens.json` (values — the single source of truth), `tokens.css` (generated), `COMPONENT_SPECIFICATIONS.md` (per-component anatomy), `PAGE_PATTERNS.md` (per-page composition), `DESIGN_QA_CHECKLIST.md` (binary review checks), `REFERENCE_AUDIT.md` (evidence, kept separate from decisions).

## 1. Purpose and scope

This document governs the visual and interaction language of the AV Ecosystem Map — a hand-built static publication of 38 pages documenting 562 organisations across 11 industry layers. It applies to every HTML page, stylesheet, script-rendered surface, and export artifact in this repo. It exists because a 2026-08 audit found a strong identity carried by weak discipline: ~60 distinct colors where ~24 were tokenized, 23 raw font sizes, ~30 gap values, 17 ad-hoc shadows, 13 durations, and 12 breakpoints. The identity stays; the arithmetic is now law.

## 2. Methodology

A reference benchmark (autzu.com) was audited from a 39-screenshot corpus (13 routes × 1440/768/390), pixel-measured (color quantization, edge probes, row profiles, corner-inset radius measurement), alongside the same measurements of this site's 108 own captures (14 routes × 3 viewports × 2 themes + 24 state captures) and its source. Live verification of the reference was impossible from the build sandbox; everything unverifiable is tagged in `REFERENCE_AUDIT.md`. Per the audit's IP rule, the reference contributed **relationships and disciplines only — no value in our tokens is theirs.**

## 3. Evidence reviewed

Full corpus + own-capture matrix + all six stylesheets + 12 JS modules + 9 Python tools. 53 per-axis verdicts (KEEP / ADOPT-PRINCIPLE / HYBRID), each citing a measurement or a consistency violation — never taste. See `REFERENCE_AUDIT.md` for the coverage table, Part-II reconciliation, and per-dimension reports.

## 4. Executive summary

The site is a **field atlas**: paper ground, ink instruments, monospace annotation, road-marking yellow and lidar cyan as functional marks, an 11-hue taxonomy for the industry's layers, and provenance as a first-class UI family. The audit's one-line conclusion: **keep the identity, adopt the arithmetic.** What changes is consolidation — one ladder per property, one anatomy per record, one style per role — plus five measured light-theme contrast repairs, a designed 404, a no-JS story, and tonal pacing for very long pages.

## 5. Design character

*A field atlas of a live industry — paper and ink instruments, annotated in monospace, honest about what it knows, disciplined enough that 562 organisations read as calm.* Axes: technical over consumer; editorial over corporate; evidence-first over persuasive; personal (first-person voice, every page ends on a person) over institutional; live (two themes, stateful instruments) over static.

## 6. Core principles

1. **One ink, inverted whole.** One ink pair (`--ink`) is text, primary action fill, and selection. No second dark. The dark theme is a complete token inversion — never partial.
2. **Paper ground, earned sheets.** `--paper` is the ground; `--paper-2` is earned only by sheet-like content (table, card, input) — never by a section. Pages longer than ~2× viewport earn tonal pacing breaks in `--med-bg`. Every page closes content → chapters → person.
3. **Accent is a mark, never a fill.** Yellow = waymark, cyan = live/selected, alert = severity — a fixed mark inventory (wordmark dash, current underline, eyebrow tick, gold dot, note spine) at smallest-legible size, always with an adjacent word. Layer hues carry taxonomy only. Every meaning-bearing mark clears contrast in **both** themes.
4. **Hairlines carry structure; floating earns shadow.** Separation is 1px `--rule` and tone. In-flow content is flat. Exactly two shadow tokens exist (`--shadow-float`, `--shadow-raised`), reserved for chrome that floats. Cards are for objects; shared hairlines are for data; rows are for lists.
5. **Three voices, one register each.** Display argues (headings, standfirsts). Mono operates (chrome, labels, numbers, tags). Serif reads (prose, record summaries). Mono never carries multi-sentence human prose. Sentence-form headings end with a period; labels never do.
6. **Provenance is the aesthetic.** Every metric carries a source line; blanks say why they are blank; gold = first-hand, cyan = disclosed, alert = estimated, italic = honestly absent. No surface may invent another honesty style.
7. **One ladder per property.** Type: 8 steps + 6 heading tokens. Space: 4px base, 9 steps + 4 fluid rhythm tokens. Radius: 4 tiers. Motion: 4 durations + 2 easings. Breakpoints: 6 named values shared by CSS and JS. A value off its ladder is a bug, not a variant.
8. **Same record, same anatomy; never blank, never silent.** One anatomy per data record across surfaces. Monogram-first loading. Empty, error, loading, 404, and no-JS states are designed, in-voice, and announced.

## 7. Information architecture

Six numbered chapters (reading order, not audience segments), depth ≤ 2, ≤ 3 children each. Nav, dropdowns, and the end-of-page chapters block render from **one constant** (`core.js` CHAPTERS) — they cannot disagree; keep it that way. `/method/` joins the Overview chapter. `sitemap.xml` is generated from the real route set, never hand-listed. No nav-level CTA: the conversion surface is the person (bio footer + EMAIL ME), by design.

## 8. Page composition

The archetype catalog (full templates in `PAGE_PATTERNS.md`): **editorial** — page-head hero, serif article prose, hairline dl rows, metric band, stat-card row, bordered card grid, shared-hairline data grid, chapter bands, closing sequence; **instrument** — atlas, ledger, calculator, heatmap/matrix, timeline. New sections compose from the named set; an unnamed one-off is a flagged conflict, not a variant. Long pages (> ~2× viewport) insert `--med-bg` tint bands as rhythm breaks. H1 rank rule: narrative pages use `--head-display`; instrument pages (/map, /companies) use `--head-utility`; operator deep-dives use `--head-article`. A page's H1 is never styled as an H2.

## 9. Grid and layout

Container: `--col` 1240px outer, `--col-pad` clamp(16px, 4vw, 32px) → ~1176px content at 1440 (verify by measurement, not the token name). Reading columns always take a measure token: `--measure` 68ch standard, `--measure-compact` 60ch, `--measure-wide` 82ch (footer fine print only). Prose outside a measure token is a bug — the audit caught economics paragraphs at full container width. Wide tables scroll inside their own container (`.table-scroll`); a page must never scroll horizontally (economics measured 1489px wide at a 1440 viewport — repaired under this rule).

## 10. Spacing

4px base. Steps: 2/4/6/8/12/16/24/32/48 (`--sp-3xs`…`--sp-3xl`); insets: chip 4×11, control 9×14, field 8×12 (sm 5×8), card 18, panel 24. Vertical rhythm is fluid and singular: `--rhythm-head-top/bottom`, `--rhythm-section`, `--rhythm-tail` (clamp with vh guard — deliberate short-viewport handling; keep). Reduced: observed ~30 gap values, specified 9 steps + 6 insets; anything off-scale requires written justification. Eyebrow→heading stays in the 22–24px relationship the audit measured. Intra-archetype spacing, as built in `base.css` (the binding values): eyebrow→H1 = the H1's 10px top margin (the 22–24px optical relationship includes the eyebrow's own line box); H1→standfirst = `--sp-lg`; `.prose` paragraph gap (`p + p`) = `--sp-lg`; `.prose` h3 margins = 40px above / 12px below.

## 11. Typography

Three families with fixed roles (§6.5). Scale: 10/11/12/13.5/15.5/17.5/19/24 (`--fs-nano`…`--fs-xl`); `--fs-md` is deprecated into `--fs-base`. Headings: six fluid tokens (`--head-display/utility/section/article/prose3/metric`) — **no new clamp() formulas, ever**; the audit found six near-duplicates and consolidated them. Tracking: six tokens (−0.03/−0.02/−0.01/.06/.10/.14em). Line heights: eight tokens (1/1.06/1.1/1.2/1.35/1.45/1.5/1.62). Weights 400/500/600/700/800. Every display heading rank — H1 in all three registers, section and article H2s, prose H3 — is weight 800; 700 is emphasis and titles-in-rows (chapter-block titles, record names), 600 chrome. Archivo `wdth`: 118 display headings, 112 everything else — applied via `font-variation-settings: 'wdth' 118|112`, **never** `font-stretch` (which does not reliably reach the variable axis). Font loading, current mechanism: every page `<head>` carries exactly

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@100..125,400..900&family=Source+Serif+4:opsz,wght@8..60,400..700&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
```

with self-hosted subsets the tracked follow-up (§21) — a doc-only build without these `<link>`s renders fallback stacks and is wrong. Monogram glyph sizes are component ratios (≈0.4× tile), not scale steps. Mobile: display keeps ≈2× body dominance at 390 (floor raise to 32px, decision S2-6). Body copy sits in a 60–75ch measure. `<br>` in headings marks clause boundaries only, never mimics layout.

## 12. Colour

Two neutrals + one tint per theme; a 3-step AA-passing text ramp (17.8/10.4/4.7 light; 16.3/10.7/5.6 dark) — nothing grayer than `--muted` may carry meaning (the reference's sub-AA fourth gray is a documented reject). Three semantic accents at mark scale; `--cyan-text` (#007A8A light) is the cyan for text, focus rings, and selection rings in the light theme — bright `--cyan` remains for washes and tints. Gold dots that carry meaning alone get a 1px ink outline. The 11-hue OKLCH layer wheel at theme-flipped L/C is the categorical system; hue is never the sole carrier (a label always accompanies). Chart series derive from the wheel (`--chart-l/c` + `--ch1..6`) — the legacy foreign chart palette is abolished everywhere including exports and Python tools. Approved/prohibited pairings and the full assertion list live in `design-tokens.json` and are machine-checked on every token build.

## 13. Shapes and surfaces

Radius tiers: 8 controls+fields / 10 popovers+tiles+thumbnails / 14 cards+panels / pill for tags only. **Pill buttons are prohibited for actions** — shape encodes commit-vs-describe (audit measured the reference the same way: r≈8–10 action rects, pills only at badge scale). Elevation: in-flow content flat; `--shadow-float` for dropdowns/floating card/secnav/fullscreen chrome; `--shadow-raised` for sheets and hover lifts. Illustration shadows (hero minimap, loop car) are art constants, documented, never tokens. The three yellow inset underlines are current-page marks, not shadows.

## 14. Imagery

No photography. Our imagery is **evidence**: logos over layer-hued monogram tiles (nothing ever blank), generated cartography (poster, minimap), and Wikipedia thumbnails cover-cropped to one spec with a visible credit badge. Decorative SVG band art ≤ .45 opacity. The illustrated robotaxi is the one object illustration; its two hexes are named illustration constants. Alt text: logos `alt=""` with the name adjacent (deliberate); evidence images describe content.

## 15. Icons and diagrams

One stroke weight for stroke icons; filled silhouettes only in the region-tab illustration set (documented). An icon never carries meaning without an adjacent label. Diagrams are live instruments, not pictures: keyboard-accessible, honestly captioned, series-colored from the wheel, each with a text/table fallback.

## 16. Component system

Specified per component in `COMPONENT_SPECIFICATIONS.md`. Non-negotiables: two control shapes (rect = action, pill = tag); one field skin at two sizes (the native compare-`select` is the single documented voice exception); one dl anatomy; one thumbnail spec; **one company-record anatomy** across map card and ledger detail; the trust-UI family (marks D/R/E/C, gold dot + words, honest blanks, credit badges, honesty caption slot) is first-class; diagnostic empty states name the blocking filter; a designed in-voice 404.

## 17. Interaction and motion

Four durations (120/200/320/450ms) + two easings; JS mirrors via `AV` constants — the same value, verified by the sync check. The loop's narrative timings (11000/3600/1700ms) are named JS constants, documented as the narrative tier. Every motion maps to state/space/cause/hierarchy/progress/continuity; the only autoplay (the loop) has a visible pause + progress ring. `prefers-reduced-motion` coverage is total: the CSS kill, JS gates, **and** JS smooth-scrolls and all hover lifts (the audit found three holes; closed). Prohibited: motion that delays content, replays, hijacks scroll, shifts layout, or ignores reduced-motion.

## 18. Content design

First-person, dated, falsifiable. Sentence-form headings take a terminal period; labels never do (audit: we were 5/12 vs 7/12 — the rule now decides). Budgets (layout constraints): H1 ≤ 60 chars; eyebrow ≤ 28, one line at 390; standfirst 180–340 chars; buttons ≤ 18 chars of mono tool-verbs. Caveats sit adjacent to the number they qualify. Empty states name the culprit and offer the fix. Loading copy is present-progressive ("Drawing 562 tiles…").

## 19. Responsive behaviour

Six named breakpoints — **640 / 680 / 760 / 860 / 960 / 1800** — the only values media queries may use; JS reads the same constants. Content is preserved in stacking; a mobile page stays ≤ ~2.2× its desktop height (documented exceptions: the poster scales-then-fullscreens; the ledger's 562-row card conversion is a tracked follow-up). Touch targets ≥ 24px; chrome controls converge on one floor (34px).

## 20. Accessibility

WCAG 2.2 AA. The strong baseline (skip links, landmarks, live regions, aria state mirrors, Esc-returns-focus, per-bar chart focus, cost-based arrow navigation on the poster) is a codified requirement, not an accident. Every meaning-bearing mark ≥ 3:1 in both themes; every text pairing ≥ 4.5:1. State is encoded redundantly (color is the third channel, never the first). Tabs implement the APG keyboard contract. Tooltips are announced (`aria-describedby`) and Esc-dismissable. Reference patterns rejected: JS-only content (their noscript-stub homepage), sub-AA gray text, color-only status. Tracked follow-up: a browse-mode alternative for the poster's `role="application"`.

## 21. Performance

Structural win to preserve: no raster art; text + SVG + data (home ≈ 40KB gz). Rules: data pays its way (no eager fetch for an unopened surface — economics' 756KB picker fetch is repaired under this rule); every data fetch that can 404 ships its file or is gated; fonts load with `display=swap` today, self-hosted subsets are the tracked follow-up; logo loading is monogram-first with opacity-only fades (zero CLS by construction — keep); `content-visibility`, passive listeners, rAF throttling, and idle backfill are the house style. Budgets: route first-load ≤ 250KB gz excluding fonts; no new render-blocking third-party requests.

## 22. Implementation guidance

Edit `design-tokens.json` → run `tools/build-tokens.py --inject` (verifies contrast, regenerates `design/tokens.css` and the marked block in `base.css`). Run `tools/check-palette-sync.py` before commit (verifies JS/Python palette copies and breakpoint constants against the JSON). Never hand-edit generated blocks. New values enter the JSON with a dated changelog entry below — never inline in a stylesheet. Three token values are known-pending Stage-2 fixes (S2-3 med-sub, S2-4 fs-md, S2-6 display floor) — see REFERENCE_AUDIT §4; consumers should expect those flips.

## 23. Anti-patterns (the audit's actual trip hazards)

Raw hex/px/shadow literals outside the token block · a new clamp() formula · a pill action button · an unlabeled meaning-bearing mark · light-theme-only contrast checks · cards around pure data · a second style for an existing role (eyebrow, field, dl, thumbnail, empty state) · prose without a measure token · a media query at an unnamed width · JS breakpoint ≠ CSS breakpoint · motion without a reduced-motion path · a surface that renders blank while loading · a page that needs JS but never says so · a metric without a source line · an undated fact.

## 24. QA checklist

`DESIGN_QA_CHECKLIST.md` — binary items, run per implementation and per review. The checklist grows a new item whenever review catches a failure mode it missed.

## 25. Inspired by principle, distinct in execution (divergence map)

| Axis | Reference (measured) | Ours | Why |
|---|---|---|---|
| Ink | one navy #0B1220, light only | one green-black pair #12130F/#F2F2EC | we carry a real dark mode |
| Typeface | one grotesque (identity unverified) | Archivo / IBM Plex Mono / Source Serif 4, fixed roles | a data publication's chrome is an instrument |
| Imagery | monochrome CGI photography | cartography + logos + cited thumbnails | our imagery must be evidence, not atmosphere |
| Surface | white ground, tint exception | paper ground, white exception | the raised sheets are the content |
| Accent | none (status dots only) | 3 semantic channels at mark scale | hundreds of stateful data points need channels |
| Taxonomy | none | 11-hue OKLCH wheel, theme-flipped | 562 orgs need stable layer identity |
| Dark | dark bands as pacing | user-controlled full inversion | a tool used long enough for ambient choice |
| Grays | 4 steps, bottom two sub-AA | 3 steps, all AA | accessibility outranks similarity |
| Container | 1168/136 + 1280 band | 1240 outer (~1176/132) | relationship already matched; keep ours |
| Rhythm | fixed px | fluid clamp + vh guard, tokenized | short-viewport behavior is a real requirement |
| Voice | marketing declaratives | first-person, dated, falsifiable | the thesis is auditability |
| CTA | persistent nav pill | ends-on-a-person | publication, not brochure |
| Spacing/scale arithmetic, hairline discipline, two-shape controls, card grammar, terminal-period rule, designed 404 | adopted as principles | with our values | discipline transfers; values do not |

## 26. Governance and change control

1. New patterns arrive by **flagged conflict**: smallest coherent extension proposed; on approval both the relevant file and the changelog update. 2. Tokens are added or deprecated **with a date and reason**, never silently redefined. 3. The **divergence register** (§25 + S2 register in `REFERENCE_AUDIT.md`) records every knowing departure. 4. The QA checklist grows with every caught miss. **Changelog:**
- 2026-08-02 v1.0 — initial language from audit; tokens introduced; S2-1…S2-24 decision register opened (see `REFERENCE_AUDIT.md`).
- 2026-08-02 v1.1 — register applied: S2-1/2/3 contrast repairs, S2-4 fs-md merge, S2-5 heading rank, S2-6 display floor 32px, S2-7/8/10 scale merges (208 literals), S2-9 breakpoints 12→6 (+1 complements sanctioned), S2-15 designed 404, S2-16 boot status + noscript notices, S2-18 period rule + eyebrow budget enforced in content, S2-19 a11y wirings (8), S2-20 manifest 404 killed, S2-22 sitemap generated + `/method/` chapter move pending nav edit, S2-24 voice-role fixes; economics horizontal overflow repaired; conformance 228→0 with named `tokens-exempt` exceptions; `--head-utility` floor corrected 22→20 (gate catch); monogram sizes reclassified as component ratios (gate catch).
- 2026-08-02 — **S2-11 resolved against re-derivation**: the chart palette is deuteranopia-validated (in-source rationale) and is blessed as `--chart-1..6` tokens with JS-sync checking; divergence register: separability outranks system purity.
- **Open follow-ups** (documented, not silently dropped): S2-12 two-shape control convergence, S2-13 full record-anatomy unification (titles done; thumbnail/summary/partners pending), S2-14 data-grid de-carding, S2-17 tint-band pacing on the two longest pages, S2-21 article TOC into the reserved right field, S2-16 static footers without JS, S2-23 mobile ledger virtualization, poster `role="application"` browse alternative, font self-hosting, `/method/` into the Overview chapter nav, `--fs-md` alias removal after migration.

## 27. The Design Language Contract

Before creating or modifying any interface in this repo, a coding assistant must: read this document; check `design-tokens.json` before introducing any value; check `COMPONENT_SPECIFICATIONS.md` before creating any component; compose pages from `PAGE_PATTERNS.md` archetypes; preserve the type, grid, spacing, and interaction rules above; test at 390/768/1440 in both themes; test keyboard and screen-reader paths; run `DESIGN_QA_CHECKLIST.md`; run `tools/build-tokens.py` and `tools/check-palette-sync.py`; explain any proposed exception as a flagged conflict with the smallest coherent extension; and update the documentation when a new pattern is approved. Prohibited outright: arbitrary colors or spacing, one-off typography, unapproved shadows, new button styles, duplicative components, unnecessary animation, page-specific hacks, fixed heights that break on real content, and hard-coded responsive exceptions.
