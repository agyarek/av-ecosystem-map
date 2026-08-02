# Reference Audit — evidence record

**2026-08-02.** Evidence for the design language, kept separate from decisions (decisions live in `DESIGN_LANGUAGE.md`). Tags: **[measured]** programmatically sampled · **[observed]** read from captures · **[estimated]** bounded, needs confirmation · **[inferred]** deduced from pattern · **[recommended]** no evidence, judgment · **[unverified]** could not be inspected.

## 1. Coverage table

| Subject | Source | Viewports | Status |
|---|---|---|---|
| autzu.com — 12 content routes | screenshot corpus (see `reference/MANIFEST.md`) | 1440/768/390 | analysed (sliced, quantized, edge-probed) |
| autzu.com — drivers route | corpus defect: all 3 captures are the designed 404 | — | **missing**; 404 itself analysed as bonus evidence |
| autzu.com — live site (fonts, states, motion, breakpoints, CSS) | WebFetch + Playwright + curl, 6 methods | — | **unreachable from sandbox** (proxy 403). All live-only items remain [unverified] — see `audit/ref-track-b.md` |
| Own site — 14 routes | Playwright vs localhost | 1440/768/390 × light/dark | analysed (84 captures + 24 state captures, sliced) |
| Own site — source | all 6 stylesheets, 12 JS modules, 9 Python tools | — | analysed with file:line citations |
| Own captures caveat | Google Fonts file CDN partially blocked in sandbox → captures render fallback faces. Sizes, roles, layout, and diff-gates remain valid; letterform judgments do not. | | |

## 2. Per-dimension evidence reports (committed under `design/audit/`)

| File | Dimensions | Highlights |
|---|---|---|
| `dim-color-surface.md` | G colour, H shape/surface | ink #0B1220 confirmed on 13 routes; hairline #E8E8E4@1px in 8/8 contexts; elevation measured zero; buttons r≈8–10 NOT pills; our 5 light-theme contrast failures measured |
| `dim-type-voice.md` | F typography, M voice | display leading ~1.0–1.08; terminal-period rule 13/13 + ~15/15 vs our 5/12; 23-literal ladder arithmetic; our provenance voice consistent across 8 pages |
| `dim-structure.md` | B IA, C composition, D grid, E spacing | container 1168/136 on 11 routes, "1280" resolved as band surface; 4px base passes, 8px fails; 9 archetypes recounted; our zero tonal pacing; 12-breakpoint census |
| `dim-components.md` | I imagery, J icons, K components, N forms | two-shape control discipline; three-tier card grammar; one-field anatomy h49–50/r≈10; our record rendered 3 ways; no 404 in repo |
| `dim-behavior.md` | L motion, O a11y, P performance | full motion catalog w/ purposes; reduced-motion holes; payload table (40–246KB gz); zero noscript site-wide; guaranteed logo-manifest 404 |
| `audit-merged.md` | A character + merge | 53 verdicts, principles draft, S2 decision register |
| `ref-palette-notes.md`, `slice-index.md`, `ref-track-b.md` | supporting | quantization, slice catalog, live-verification failure report |

## 3. Reconciliation against the guide's Part II (reference evidence base)

| Part II claim | Finding | Status |
|---|---|---|
| Page surface #F8F8F6 dominant | **#FFFFFF dominant on all 13 routes (53–87%)**; warm tint #F6F6F4 is a band surface; cool #E8ECF1 family is the map-card surface | **corrected** [measured] — site newer than Part II |
| Ink/inverse #0B1220 triple duty | confirmed exactly: headlines, button fill, CTA bar, footer | confirmed [measured] |
| Muted text #6E7480–#8A8F99 | **#5A6473** (solid-glyph clusters, 5.99:1); 4th gray #737C8A = 4.22:1 (AA fail — reject) | corrected [measured] |
| Hairlines ~#E2E6EA | **#E8E8E4 at 1px in every light context**; #282E3B on dark | corrected [measured] |
| Dark raised ~#131B30 | **#121927** + 1px #323743 border | corrected [measured] |
| Accent: none; trace green ~#409860 | no brand accent confirmed (≤0.03% saturated); but a **status vocabulary exists**: #1F7A4D live, #2769B8 launching, amber, on-dark #56C574 | refined [measured] |
| Container 1168 @1440; platform 1280 ambiguous | 1168/136 on 11 routes; **1280 is the tint-band surface width, not a text container** | resolved [measured] |
| Mobile heights 1.7–1.9× | 1.55–2.20, median 1.72 | corrected [measured] |
| Buttons are full pills | **r≈8–10 rounded rects at h44–45; pills only for chips/tags h27–34** | **corrected** [measured] |
| Cards/images radius 16–24 | ≈10–14 everywhere measured | corrected [measured] |
| Inputs 52–56px tall | 49–50px, r≈8–10 | corrected [measured] |
| Two-tone heading device "a signature" | **does not exist in this corpus** — all headings single-tone ink | **superseded** [measured] |
| Eyebrow marker dot/square | **no marker** — plain gray uppercase, tracking ~+15–20% (not +8–12%) | corrected [observed/measured] |
| Display 64–80px, leading 1.05–1.15 | 56–76px, leading **~1.0–1.08**; mobile 34–36px keeping ~2.1× body | corrected [measured] |
| Metric numerals 48–72px | ~40px in the home band | corrected [measured] |
| 8 archetypes incl. accordion + logo partner strip | **9 archetypes**; accordion absent (host route missing), partner strip is text chips, never logos | recounted [observed] |
| "Every long page ≥1 dark band" | **false**: guaranteed dark = footer only; pacing is tint bands; darkness accumulates at page end | corrected [measured] |
| No foregrounded people in photography | people appear where the subject **is** people (careers, blog); infrastructure stays unpopulated | refined [observed] |
| Single sans everywhere | single sans for page text **plus an instrument mono** inside diagram surfaces and honesty captions | refined [observed] |
| Hero copy quoted in Part II | site copy has changed; corpus outranks guide text | superseded [observed] |
| noscript-stub homepage | reconfirmed as the REJECT pattern | confirmed [prior evidence] |

## 4. Stage-2 decision register (S2-1 … S2-24)

The numbered value/behavior changes the audit authorizes, each implemented as its own commit with before/after captures. Full list with rationale: `audit/audit-merged.md` §"Stage-2 decision register". Summary: S2-1 light functional cyan #007A8A · S2-2 gold-dot ink outline · S2-3 med-sub #63665C · S2-4 type-ladder merges · S2-5 heading-rank fix (/map H1) · S2-6 mobile display floor 32px · S2-7 tracking/leading consolidation · S2-8 spacing scale · S2-9 breakpoints 12→6 · S2-10 shadow tokens · S2-11 chart palette from wheel · S2-12 two-shape controls · S2-13 one record anatomy · S2-14 data grids de-carded · S2-15 designed 404 · S2-16 no-JS story · S2-17 tint-band pacing · S2-18 terminal-period edits · S2-19 a11y wirings · S2-20 perf trims · S2-21 article TOC placement · S2-22 IA hygiene · S2-23 mobile ledger height (deferred follow-up) · S2-24 voice-role fixes.

## 5. Confidence and limitations

- **Measured with high confidence:** both palettes, contrast ratios, container/margin/gutter geometry, radii (±2px), archetype censuses, drift inventories (file:line), payload bytes.
- **Estimated (error bars stated in reports):** reference type sizes (cap-height derivation ±8%), spacing gaps (±2–4px).
- **Unverified and honestly so:** reference font identity, hover/focus/motion, exact breakpoints, live CSS values, the real drivers route (13-item list in `audit/ref-track-b.md`). None of these were guessed; Part II values were inherited only where the corpus could not overrule them, and are tagged.
- **[recommended] items:** status-color derivations, chart L/C values, the 404 design, tint-band pacing placement — derived from primitives, no reference equivalent.
- **Sandbox caveats:** own captures show fallback fonts and monogram tiles (CDNs blocked); both sides of every before/after comparison share the caveat, so diff gates remain valid.

## 6. Spec bugs from the verification loop

Logged during Phase 5 (throwaway page built from the documentation alone); each patched in the docs, never in the page. Full log with the tester's guesses: `audit/spec-bugs.md` (32 entries: SB-1…26 + VISUAL-1…6). Disposition — patched-in-\<file\> (the doc now states the fact or ruling) · dissolved-by-S2-commit (the failure is a shipped token value already scheduled to flip) · documented-as-fallback (the observed rendering is the sanctioned degradation, now stated as such):

| ID | Disposition |
|---|---|
| SB-1 | patched-in-PAGE_PATTERNS.md (appendix A, CHAPTERS mirror) |
| SB-2 | patched-in-DESIGN_LANGUAGE.md (§11 font `<link>`s + `font-variation-settings` mechanism) |
| SB-3 | patched-in-COMPONENT_SPECIFICATIONS.md (§13 — numerals are mono; E4 was right) |
| SB-4 | patched-in-DESIGN_LANGUAGE.md (§11 — all display heading ranks are 800) |
| SB-5 | patched-in-PAGE_PATTERNS.md (E2 — counter-generated `01`-style mono number, outside the terminal-period rule) |
| SB-6 | patched-in-PAGE_PATTERNS.md (E1 — standfirst is display face, `--ink-2`) |
| SB-7 | patched-in-DESIGN_LANGUAGE.md (§10 — intra-archetype spacing as built) |
| SB-8 | patched-in-COMPONENT_SPECIFICATIONS.md (§7 — quiet-overline label voice) |
| SB-9 | patched-in-COMPONENT_SPECIFICATIONS.md (§7 — native checkbox/radio, `accent-color: var(--cyan)`, label beside) |
| SB-10 | patched-in-COMPONENT_SPECIFICATIONS.md (§7 — native range, cyan accent, mono `<output>`) |
| SB-11 | patched-in-COMPONENT_SPECIFICATIONS.md (§7 — textarea variant + inputs-are-data voice note) |
| SB-12 | patched-in-COMPONENT_SPECIFICATIONS.md (§16 — cmark geometry constants; native `title` static fallback) |
| SB-13 | patched-in-COMPONENT_SPECIFICATIONS.md (§16 — `.blank` inherits the cell's face) |
| SB-14 | patched-in-COMPONENT_SPECIFICATIONS.md (§11 — no sheet chrome; transparent scroller; header tracking) |
| SB-15 | patched-in-COMPONENT_SPECIFICATIONS.md (§11 — text cells display face, row headers display 700) |
| SB-16 | patched-in-COMPONENT_SPECIFICATIONS.md (§22 — chapters-cell typography, current-mark rendering, hover) |
| SB-17 | patched-in-COMPONENT_SPECIFICATIONS.md §4 + PAGE_PATTERNS.md E9 (no portrait; names, mailtos, fine-print facts) |
| SB-18 | patched-in-COMPONENT_SPECIFICATIONS.md (§1 — wordmark, dash geometry, translucent wash, bar padding) |
| SB-19 | patched-in-COMPONENT_SPECIFICATIONS.md (§8 — tick is the ■ glyph at eyebrow size + word space) |
| SB-20 | patched-in-COMPONENT_SPECIFICATIONS.md (§0 — `in oklab`, mixed into the local surface) |
| SB-21 | patched-in-DESIGN_LANGUAGE.md (§22 known-pending sentence); the values themselves dissolve with the S2-3/S2-4/S2-6 commits |
| SB-22 | patched-in-COMPONENT_SPECIFICATIONS.md (§18 — no sheet of its own; default `.btn`) |
| SB-23 | patched-in-COMPONENT_SPECIFICATIONS.md (§10 — `--paper-2` fill; family label style) |
| SB-24 | patched-in-COMPONENT_SPECIFICATIONS.md (§22 — rail ≥ grid + geometry; auto-open stays ≥ wide) + PAGE_PATTERNS.md §2 |
| SB-25 | patched-in-COMPONENT_SPECIFICATIONS.md (§3 — off-top absolute positioning, no reflow on focus) |
| SB-26 | patched-in-COMPONENT_SPECIFICATIONS.md (§5 primary-hover row + §6 chip fill) |
| VISUAL-1 | patched-in-COMPONENT_SPECIFICATIONS.md §11 + PAGE_PATTERNS.md §3.8 (article-table measure + ch column widths) |
| VISUAL-2 | dissolved-by-S2-commit (S2-6 raises the `--head-display` floor to 32px; pending flip flagged in DESIGN_LANGUAGE §22) |
| VISUAL-3 | documented-as-fallback (COMPONENT_SPECIFICATIONS §11 — static tables scroll + fade; card conversion is ledger-JS) |
| VISUAL-4 | documented-as-fallback (COMPONENT_SPECIFICATIONS §1 — wordmark + wrapped inline nav is the designed no-JS header) |
| VISUAL-5 | patched-in-COMPONENT_SPECIFICATIONS.md (§11/§16 — `.blank` stays right-aligned in numeric columns) |
| VISUAL-6 | patched-in-PAGE_PATTERNS.md P1 + COMPONENT_SPECIFICATIONS.md §9 (tint bands never host sheets/cards/forms) |
