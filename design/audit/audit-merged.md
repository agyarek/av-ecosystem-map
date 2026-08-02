# Audit merge — decision record (Phase 3 close)

Inputs: dim-color-surface.md (R1), dim-type-voice.md (R2), dim-structure.md (R3), dim-components.md (R4), dim-behavior.md (R5), slice-index.md, ref-palette-notes.md, ref-track-b.md, part2-baseline.md. 53 axis verdicts, zero conflicts requiring arbitration; overlapping drift items dedupe in the refactor mapping table.

## Dimension A — Design character (main-session synthesis)

**The reference** (measured): a near-two-tone marketing site whose coherence comes from arithmetic — one ink doing triple duty, one hairline value at one width, one text container on 11 of 13 routes, ~9 archetypes reused verbatim, a 4px spacing base with ~11 role values, 100%-consistent heading punctuation. Character axes: industrial-consumer hybrid leaning technical; premium through restraint not ornament; static; serious. Its discipline is its identity. Its weaknesses (measured): sub-AA fourth gray and status text, 95-99ch legal columns, a noscript-stub homepage.

**Our site**: a *working atlas*, not a brochure — a publication whose pages are instruments (poster, ledger, calculator, heatmap) stitched by editorial prose. Character axes: technical, editorial, evidence-first, personal (first-person voice, ends-on-a-person), live (562 stateful records, two themes). Its identity assets are real and measured: the ink pair, paper ground, layer-hue taxonomy, mono instrument voice, trust-UI grammar, purposeful motion, strong a11y baseline. Its failure is *discipline*: ~60 colors/23 font sizes/30 gaps/17 shadows/13 durations/12 breakpoints where the reference proves ~10/7/12/0/-/3 suffice.

**Character statement**: *A field atlas of a live industry — paper and ink instruments, annotated in monospace, honest about what it knows, disciplined enough that 562 organisations read as calm.* The audit's one-line conclusion: **keep the identity, adopt the arithmetic.**

## Core principles (draft for gate — each cited)

1. **One ink, inverted whole.** One ink pair (#12130F/#F2F2EC) is text, primary action, and selection; no second dark; the dark theme is a complete token inversion, never a partial one. [R1 G1, H4]
2. **Paper ground, earned sheets.** Warm paper is the ground; white is earned only by sheet-like content (table, card, input). Long pages earn tonal pacing from our own tint (--med-bg band), and every page keeps the closing sequence content → chapters → person. [R1 G2; R3 ax6, ax10]
3. **Accent is a mark, never a fill.** Yellow=waymark, cyan=live/selected, alert=severity — a fixed mark inventory at smallest-legible size with an adjacent word; layer hues carry taxonomy only; every meaning-bearing mark clears contrast in BOTH themes. [R1 G3/G4; R5 A5/A6]
4. **Hairlines carry structure; floating earns shadow.** Separation is 1px --rule and tone. In-flow content is flat. Exactly two shadow tokens exist, reserved for chrome that truly floats (popover, sheet, floating card). Cards are for objects; shared hairlines are for data; rows are for lists. [R1 H1/H2; R4 ax2]
5. **Three voices, one register each.** Display argues, mono operates, serif reads. Mono never carries human prose; sentence-form headings end with a period, labels never do; eyebrows are one style, ≤28 chars, with the yellow tick. [R2 F1/F5/M1]
6. **Provenance is the aesthetic.** Every number carries a source line; blanks say why; gold=first-hand, cyan=disclosed, alert=estimated, italic=honestly absent. The trust-UI family is first-class and no surface may invent another honesty style. [R2 M2; R4 ax6]
7. **One ladder per property.** Type 9 steps, space on a 4px base (~9 steps + fluid rhythm tokens), radius 4 tiers, duration 4 tiers + 2 easings, ~6 named breakpoints shared by CSS and JS. A value off its ladder is a bug, not a variant. [R2 F2; R3 ax3/ax9; R5 A1]
8. **Same record, same anatomy; never blank, never silent.** One anatomy per record across surfaces; monogram-first loading; empty, error, loading, 404 and no-JS states are designed, in-voice, and announced. [R4 ax12/ax10; R5 A7/A10]

## Verdict roll-up (53 axes)

KEEP (22): G1 ink, G2 surface, G4 taxonomy, G5 gray ramp, H3 radius, H4 dark theme, F1 families, F6 case/tracking, F7 measure, M2 provenance voice, M3 copy budgets, container/grid, reading measure, IA depth, CTA policy, table language, callout family, trust UI, imagery direction, data-display language, motion budget, reduced-motion, keyboard, SR baseline, state communication, payload, loading. (KEEP always includes "codify + purge drift".)
ADOPT-PRINCIPLE (9): F2 size scale, F4 mobile slope, M1 terminal period, spacing scale, tonal pacing, breakpoints, card policy, icon policy, one-record-one-anatomy.
HYBRID (14): G3 accent, H1 hairlines, H2 shadows, F3 headings, F5 eyebrow, vertical rhythm, archetypes, wayfinding, mobile preservation, buttons, forms, empty/error, metrics, JS-dependency, visual a11y, fonts.

## Stage-2 decision register (numbered; each becomes a commit)

S2-1 Light functional cyan: text-cyan ≥4.5:1 (≈ #007A8A-class) for links/labels; ring/stroke cyan ≥3:1 for focus ring + selection rings. Dark unchanged. [R1#11-12, R5 D17/D25]
S2-2 Gold mark visibility: 1px ink outline on meaning-bearing gold dots (poster); keep --yellow elsewhere. [R1#13, R5 D18]
S2-3 --med-sub → ≈#63665C (light) to clear 4.5:1. [R1#10, R5 D19]
S2-4 Merge --fs-base 15.5 / --fs-md 16 → one body token; near-value literal merges (12.5/13→one, 14/14.5→14, 16.5/17→17, 9..10.5→two micro steps, 20/22/24→numeric tokens). [R2#10-11]
S2-5 Heading system: 3 fluid levels (display-H1 76 / utility-H1 44 / section-H2 38) + article-H1 32; /map's H1 moves to utility-H1; band-title aligns to section-H2 formula. [R2#18-19, R4#18]
S2-6 Mobile display floor 26 → 32px (≈1.9× body); re-check wraps at 390. [R2#20]
S2-7 Tracking 13→6 tokens; line-height 13→7; wdth 118/116/112→118/112. [R2#13-16]
S2-8 Spacing scale: 4px base — 2/4/6/8/12/16/24/32/48 + fluid rhythm tokens (head/section/tail); gap/margin/padding literals map to nearest step (≤2px shifts); 3-4 inset tokens. [R3#5-7]
S2-9 Breakpoints → named set: 640/680/760/860/960/1800 shared CSS+JS (kills 759/859/980/620 splits, deletes dead 480). [R3#15-20, R5 D14]
S2-10 Shadow tokens: --shadow-float (0 14px 40px ink.16), --shadow-sheet (0 6px 20px ink.22); yellow insets reclassified as current-marks; hero illustration shadows documented as art. [R1#6]
S2-11 Chart series palette derived from the layer wheel (6 hues at chart L/C, AA-checked, both themes); replaces CHART_LIGHT/DARK everywhere incl. exports/tools. [R1#15, R4#21]
S2-12 Control family: two shapes with fixed roles — rect(--r-chip)=action, pill=tag/filter; scroll-nav/loop-play pills → rect or documented exceptions; one field skin, two sizes. [R4#1-5]
S2-13 One record, one anatomy: company card + ledger detail unify (title 18/800, serif summary?, one thumbnail spec h190/r-card?, one dl rail spec, partners one presentation). Decisions taken in COMPONENT_SPECIFICATIONS. [R4#22, #7, #14-15]
S2-14 Pure-data grids (fact-grid, cv-grid) → shared-hairline grammar. [R4#26]
S2-15 Designed 404.html in atlas voice (eyebrow 404 · NOT ON THE MAP, display headline w/ period, 3 ranked routes, footer). [R4#23]
S2-16 No-JS story: static footer markup, <noscript> notices on data surfaces, poster boot status via #filter-state. [R5 D12-13]
S2-17 Tint-band pacing on long pages (--med-bg band component; partnerships + economics get rhythm breaks). [R3#28]
S2-18 Terminal-period rule applied to 12 H1s (content edit); eyebrow ≤28 chars (rewrite home's 42-char). [R2#22-23]
S2-19 A11y wirings: tabs arrow keys, combobox wiring, ftip aria-describedby+Esc, lg-empty announce, aria-controls, ch-pin role=status, smooth-scroll RM gates, hover-lift RM coverage. (Bundle: one a11y commit.) [R5 D4-D10, D16]
S2-20 Perf: economics lazy compare fetch; ship data/logo-manifest.json {}; duration/easing tokens incl. one --dur-move. (Font self-hosting → follow-up, too invasive this session.) [R5 D22, D11, D15]
S2-21 Wayfinding: article TOC into reserved right field ≥1100px (secnav becomes in-grid rail on articles; keeps pill/sheet below); regulation article geometry converges. [R3#26/#29]
S2-22 IA hygiene: regenerate sitemap.xml from real routes; README count fix; method joins Overview chapter nav; operators stubs reconciled. [R3#21-24]
S2-23 Mobile companies: cap document height (paginate/virtualize the ≤680 card conversion). DEFERRED to follow-up (JS architecture change) — documented, not silently dropped.
S2-24 media.css .md-who mono→display face (role boundary); compare-select display-face exception documented as THE stated exception. [R2#24, R4#25]

Out-of-scope follow-ups (documented in DESIGN_LANGUAGE): role=application browse alternative (R5 D20), font self-hosting (R5 D21), companies mobile virtualization (S2-23), loop-variants.html left as scratch.

## Notes for token authorship
- Aliases keep every legacy var name alive during Stage 1 (--yellow, --cyan, --alert, --fs-*, --r-*) → zero-diff.
- New semantic names: color.{surface,ink,accent,status,layer}, type.{scale,track,leading,family}, space.{step,inset,rhythm}, radius.{control,mid,card,pill}, shadow.{float,sheet}, motion.{hover,state,slow,move + ease}, breakpoint.{phone,ledger,sheet,nav,grid,wide}, z.{base,sticky,float,sheet,modal}.
- The 11 layer hues + L/C pairs are first-class tokens (they already behave like ones).
- Light-theme functional variants: cyan-text, cyan-ring, gold-mark-outline; dark theme unchanged.
