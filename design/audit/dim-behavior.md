# R5 — Behavior & Quality: Interaction/Motion (L), Accessibility (O), Performance (P)

Tags: [measured] tool-sampled or byte-counted | [observed] read from capture/source | [estimated] | [inferred].
Paths: reference slices `$SCRATCH/reference/slices/`, own slices `$SCRATCH/own/slices/`, repo `/home/user/av-ecosystem-map` (cited as file:line).

---

## 1. REFERENCE FINDINGS

### 1.1 Motion & states — mostly UNVERIFIED, recorded honestly
Track B failed (all six access methods; see ref-track-b.md). Therefore ALL of the following stay **[unverified]** and are NOT usable as evidence: transition durations, easings, prefers-reduced-motion handling, :hover/:focus-visible styles, breakpoint values, font identity, meta theme-color. No agent may cite a reference motion value. What static captures cannot show, we do not claim.

### 1.2 What the static corpus DOES show (L/O-relevant)
- **Nav affordances** [observed, all 13 routes, e.g. contact_desktop/s00]: sticky top nav; 5 items each with a visible chevron caret = dropdown affordance declared before interaction; active route marked by a thin underline (position + underline = non-color state mark). Right side: outlined pill + solid dark pill — two-level CTA hierarchy readable without hover.
- **Link styling** [observed]: nav links have no underline (state underline is reserved for "current"); in-content actions are arrow-links ("Read more →", "Request a briefing →", "Request security pack →" — blog s00/s01, autzu.com s03, platform s02): the arrow glyph is the affordance. Legal pages carry inline mailto links in body text (privacy s02/s03, terms s02). Hover treatment [unverified].
- **Form affordances** [observed, contact_desktop/s00, the only form in corpus]: labels ABOVE fields (never placeholder-only); placeholders are worked examples ("Jane Doe", "jane@company.com"); the optional field is marked "(optional)" instead of starring required ones; inputs tall (~44–52px [estimated]) with 1px hairline + rounded corners; one full-width dark primary submit; lock-icon reassurance microcopy under the button ("We respect your privacy…"); non-form alternatives (email/HQ card) offered beside it. Principle: a form states its cost and its escape hatches up front.
- **Status vocabulary** [observed, autzu.com s02–s03, hubs s01–s02, platform s00–s01]: colored dots are ALWAYS paired with a text label ("Operational", "Launching", "Coming Soon", legend chip "Live / Launching / Coming soon", green chips say "Passed"/"Stable"). Never color-only. This is a confirmable a11y principle from statics.
- **Scroll-depth cost** [measured, corpus dimensions]: desktop heights 1147 (404) / 1494 (contact) / 2338–2962 (press, about, careers, partnerships) / 3160–3510 (investors, blog, platform, hubs) / 4318 (home) / 4043–6093 (legal). Mobile 1.7–1.9× desktop with content preserved. A marketing homepage at 4318px is restrained; only legal runs long.
- **Image weight proxy** [estimated from slices]: photography (CGI renders) is a primary payload: home = full-bleed hero + 3 photo cards + map card (~30–35% of page area photographic); contact hero photo ≈ 652×375px of a 1440×1494 page ≈ 11%; hubs/about/careers/press heroes ~15–25%; legal 0%. Assets are /img/*.webp [from Part II corpus note]. The reference pays a recurring image tax on nearly every route.
- **JS-dependency (REJECT pattern)** [observed, part2-baseline:50]: the reference homepage serves a **noscript stub** to non-JS fetches — a page whose content requires JS to exist at all. The guide marks this REJECT; we treat "content exists only after script" as the anti-pattern to avoid, and the corpus gives no evidence the reference offers any non-JS fallback.

### 1.3 Part II items in my dimensions — confirm/correct
- "Contrast: ink on surface ≈17:1" — reference ink #0B1220 on #FFFFFF (ref-palette-notes correction: surface is #FFFFFF) = 18.4:1 [measured, computed]; our equivalent ink/paper = 17.8:1 light, 16.3:1 dark [measured, computed from base.css:6-23]. CONFIRMED both systems hold maximal text contrast.
- "verify muted ≥4.5:1 at body size" — reference muted exact value [unverified]; ours verified below (§2.3).
- "Inputs … tall 52–56px" — corpus supports "tall" but my slice read suggests ~44–52px [estimated, contact s00]; keep as estimate, do not quote a number.
- Accordion rows (archetype 7) — confirmed ABSENT from corpus (drivers is a 404); no motion/disclosure pattern evidence exists for it. [observed, slice-index]
- Eyebrows have NO marker dot in the reference corpus (slice-index correction) — relevant to O because OUR eyebrow carries a yellow ■ tick (index.html:57): that is our own device, not an adoption.

---

## 2. OWN-SITE FINDINGS

### 2.1 L — complete motion catalog (from source)

| # | Motion | Trigger | Duration/easing | Purpose | Reduced-motion fallback |
|---|--------|---------|-----------------|---------|--------------------------|
| 1 | Loop dwell + draining ring | autoplay, 11s per station | DWELL_MS 11000 (loop.js:41); ring = stroke-dashoffset drain (loop.js:169-174), opacity 200ms (home.css:110) | progress (time left before car moves) | frame loop never starts; all 4 cards set active, car parked, paused (loop.js:361-372) — but see gap G1 |
| 2 | Loop travel | autoplay/step | LEG_MS 3600, easeInOutQuad (loop.js:42,148) | continuity/space (ride order) | not started (same gate) |
| 3 | Three-point turn | stepping against heading | TURN_MS 1700, 3 eased legs (loop.js:43,266-291) | cause (reverse is a manoeuvre, not a mode) | startTurn short-circuits: heading flips instantly (loop.js:263) |
| 4 | Station active lift | car arrives | border+box-shadow 160ms (home.css:60,66-68) | state (which card is live) | global kill → instant |
| 5 | Hero-tilt | hover on minimap | transform 400ms ease, 38°→30° (home.css:191-197) | decoration/invitation | transition:none (home.css:213-215); static tilt kept |
| 6 | Band hover | hover/focus-within on chapter band | bg 200ms; .band-btn opacity/translate 200ms; .band-art opacity/scale 320ms (home.css:227,246-265) | hierarchy (call out the door) | explicit opt-out: transitions none, btn always visible, art static at .3 (home.css:266-273) — exemplary |
| 7 | Map flyTo | select/deep-link/Home | D=480ms, easeInOutQuad (poster.js:396-397) | space (where the camera went) | jump cut (poster.js:395) |
| 8 | Tile hover/kbd/sel lean | hover/.kbd-focus/.sel | opacity 160ms, transform 180ms, scale 1.02/1.03 (map.css:66,90-91) | state | transition+transform none (map.css:328-333) |
| 9 | District light-up | hover layer | d-glow/wash opacity 200ms; district scale 1.01/.994 over 220ms (map.css:113-122) | hierarchy (layer as one piece) | same block, none |
| 10 | Logo fade-in over monogram | img load | opacity 220ms (base.css:412; map.css:323) | continuity (never a blank square) | global kill → instant (acceptable) |
| 11 | Carets (4 variants) | open/close | 160ms (ledger.css:40; base.css:545), 180ms (base.css:479), 140ms (map.css:341,284) | state | global kill |
| 12 | Hover lifts | .door/.op-card/.md-tile hover | translateY(-2px), 120ms (base.css:263-265; article.css:110-112; media.css:13-15) | affordance | ONLY .md-tile neutralized (media.css:16); .door/.op-card keep instant jumps — inconsistency D4 |
| 13 | Hover borders/colors | .btn/.chip/nav/a/theme-toggle etc. | 120ms (dominant; base.css:169,199,230,241,319; +9 more) | affordance | global kill |
| 14 | :active press | .btn, .scroll-nav button | translateY(1px) (base.css:233; ledger.css:279) | cause | instant (fine) |
| 15 | Ledger buried-column fade | pane scrolled to x-end | opacity 200ms (ledger.css:95) | space (more table rightward) | global kill |
| 16 | Sheet/filters toggle | chapters visible | opacity/visibility 160ms (ledger.css:305) | decluttering | global kill |
| 17 | Smooth scrolls | jump buttons, row open, anchors | CSS scroll-behavior:smooth (base.css:67); JS behavior:'smooth' (ledger.js:582,583,589) | space | CSS side flipped to auto (base.css:365); **JS side NOT gated — gap G2** |
| 18 | Nav dropdown hover-grace | pointer leaves | 220ms timeout (core.js:418) | forgiveness | n/a (not motion) |
| 19 | Debounces | search 80ms (core.js:646), filter 120/140/200ms (poster.js:772; ledger.js:493,498), resize 150ms (funding.js:522), settle 260ms (ledger.js:567) | — | responsiveness | n/a |

**Duration census** [measured]: CSS 120(×~15)/140/160/180/200/220/320/400ms + JS 480ms + loop 1700/3600/11000ms. Easing: CSS `ease` everywhere it's named; the SAME easeInOutQuad is hand-copied in loop.js:148 and poster.js:397. Zero duration/easing custom properties exist.
**Proposed tokens** (from observed clusters, values ours): `--dur-hover:120ms` (all affordance color/border), `--dur-state:200ms` (absorb 160/180/200/220 — fades, carets, lifts-into-state), `--dur-slow:320ms` (band art, only if kept distinct), `--dur-move:450ms` (absorb hero-tilt 400 + flyTo 480 — the "camera/large object" tier), `--ease-ui:ease`, `--ease-move:cubic-bezier(easeInOutQuad equivalent)` + one shared JS `AV.ease`. Loop constants (11000/3600/1700) stay named JS constants but documented as the "narrative" tier.
**Motion purpose audit**: every catalogued motion maps to state/space/cause/hierarchy/progress/continuity except #5 hero-tilt hover (decoration — defensible as a single invitation) and #6 band-art zoom (borderline decoration, but doubles as hierarchy). Nothing moves on a timer except the loop, which has a visible pause control (WCAG 2.2.2 satisfied [observed home_desktop_light/s00 + loop.js:326-338]).

### 2.2 O — verification of "strong baseline" claims
- **Focus ring** [measured]: `:focus-visible { outline:3px solid var(--cyan) }` (base.css:88). State capture state-focus-nav_desktop_light/s00 shows the ring on the OVERVIEW nav link; sampled ring pixel `#00A4B7` ≈ token #00A5B8. Computed contrast: **2.84:1 on light paper #FAFAF7, 2.97:1 on white** — **FAILS WCAG 1.4.11 (≥3:1)** in the light theme, marginally. Dark theme #22C4D6 on #14150F = **8.69:1 — strong** [measured]. Also [observed in the crop]: on the current-page nav item the ring visually collides with the yellow current-page underline (inset 0 -2px 0 var(--yellow), base.css:172) and is partially occluded by adjacent elements — it reads as broken corner brackets, not a ring.
- **Skip links / landmarks / aria-live** [observed source]: skip link every page (index.html:38, map/index.html:24); `#filter-state`, `#lg-state`, `#ch-state` aria-live=polite (map/index.html:79, companies/index.html:121); Esc-returns-focus in nav (core.js), map keyboard model (arrows/Enter/+−/Home/F/Esc, poster.js bindKeys) — confirmed present.
- **Known gaps, audited** (severity / WCAG / disposition):
  1. `role="application"` on #poster-viewport (map/index.html:83) — suppresses SR browse mode over 562 tiles; tiles reachable only via custom arrows; no alternative reading order. **High / 1.3.1, 2.1.1-adjacent / follow-up (stage2)** — needs a designed alternative (visually-hidden per-district list, or point at /companies/ as the equivalent, stated in the label).
  2. Regulation tabs: proper tablist/tab/tabpanel + aria-selected (regulation/index.html:68-90) but click-only JS (regulation.js — 17 lines, no keydown), no roving tabindex, no aria-controls. Buttons are Tab-reachable so 2.1.1 passes; APG deviation. **Medium-low / 4.1.2 quality / cheap fix (stage1)**.
  3. `.ftip` tooltips: content lives only in `data-tip` (funding-compare.js:390-392); CSS reveals on hover/:focus-visible (article.css:174-184) and the span has tabindex=0, but no aria-describedby → SR users never get the formula. `.omark` has aria-label="Hidden inputs differ" but not the actual diff. **Medium / 4.1.2 + 1.4.13 (no Esc-dismiss) / cheap fix (stage1)**.
  4. Search: input lacks combobox wiring — no role=combobox/aria-expanded/aria-activedescendant; #search-results is role=listbox (core.js:350) with role=option buttons (core.js:626) and working ArrowUp/Down/Enter/Esc (core.js:650-657), but the active option is invisible to AT. **Medium / 4.1.2 / cheap fix (stage1)**.
  5. `#lg-empty` (companies/index.html:129, ledger.js:187) not a live region — filter-to-zero silent; partially mitigated because `#lg-state` (aria-live) announces counts. **Low / 4.1.3 / cheap (stage1: announce emptiness through lg-state)**.
  6. Ledger rows: `aria-expanded` on tr + full-row aria-label (ledger.js:180,348) without aria-controls to the detail row; row aria-label also overrides cell-by-cell reading in some SRs. **Low-medium / 4.1.2 / cheap (stage1)**.
  7. Logos `alt=""` + mono-tile aria-hidden (ledger.js:60,282; poster.js:201; media.js:20) — **defensible, keep**: name is adjacent text everywhere.
  8. Home minimap link aria-hidden + tabindex=-1 — defensible (duplicate CTA exists). Keep.
- **New issues found in screenshots/source**:
  - **Gold dot** (.gold-dot, --yellow #F2B705 on light paper) = **1.74:1** [measured, computed] — the "spoken with directly" marker is nearly invisible to low-vision users in light theme (dark theme 11.9:1 — fine). On the ledger and card it's paired with the text tag "SPOKEN WITH DIRECTLY" [observed state-map-selected_desktop_light/s00 y≈462] so meaning survives; on poster tiles the dot is the only in-place mark (legend decodes it). **1.4.11 fail (light) / stage2** (outline the dot with ink, or darken light-theme gold for marks).
  - **--med-sub #6E7268 on --med-bg #F4F2E9 = 4.39:1** [measured, computed] — medallion sub-caption text under AA 4.5. **stage2 nudge**.
  - **Tile monogram**: --tile-ink #FFFFFF on light-theme tile fill oklch(.66 .06 H) ≈ 3.0–3.2:1 across hues [measured, computed] — decorative (aria-hidden, name adjacent) so no SC applies, but visually faint in light theme; dark theme 6.8–7.1:1. Note only.
  - **Muted text passes**: #6E7268 on #FAFAF7 = 4.70:1, on white 4.92:1; dark 5.55:1 [measured, computed] — AA holds even at the 9–10.5px mono sizes (SC 1.4.3 has no size floor below which it tightens). But 9/9.5/10px mono under load (ledger.css:297 9px badge; article.css:332 9.5px; home.css:81 10px chips; map.css:341 9px caret) is a readability, not conformance, concern — see D-list.
  - **Touch targets** [measured, map_mobile_light/s00 pixel-scan]: rail chips = 27–28px outer height (LAYERS 371→398; Spoken-with 406→433; FULL SCREEN 475→503). Passes WCAG 2.5.8 AA (≥24px) but under the 44px comfortable floor; theme-toggle/nav-toggle 34px (base.css:197,316); loop controls 40px (home.css:125) — three different target sizes for chrome controls.
  - **Selection/partner rings on the map** use the same light cyan: 2.84:1 on paper in light theme [measured] — same 1.4.11 exposure as the focus ring; tethers at 2.2px stroke, opacity .85 (map.css:126-129).
  - **State communication is NOT color-only anywhere audited**: exited = strikethrough (`<s>` in chips/search hits); spoken = dot + text tag (ledger) + legend (map); selected tab = card containment + icon (observed state-regulation-tab2_desktop_light/s01); sort = ▲ glyph + aria-sort; active nav = yellow underline + aria-current. Matches the reference's dot+label principle (§1.2).
  - Charts: role=img + per-bar tabindex/labels (per own-ui inventory, funding.js) — keep; ch-tip/ch-pin tooltips are not live regions (funding.js:454-460) — focus tooltip content silent for SR. Low / stage1-adjacent.

### 2.3 P — what we ship (all [measured] via stat/gzip; fonts via curl)

**Per-route first-load, gzipped (HTML+CSS+JS+eager JSON, excluding fonts):**
| Route | HTML | CSS | JS | eager JSON | total gz | notes |
|---|---|---|---|---|---|---|
| / (home) | 8.7K | 12.1K (base+home) | 18.4K (core+loop) | 0.9K (derived-counts) | **~40KB** | 86KB raw HTML is inline SVG art — gzips 10:1 |
| /map/ | 2.7K | 13.6K | 30.5K (core+poster) | 76.8K (poster-layout 36.8 + search-index 28.6 + partner-index 11.4) | **~124KB** | av-companies (145.4K gz / 756K raw) lazy-fetched on first selection (poster.js:617) — good; poster-layout preloaded (map/index.html:21) |
| /companies/ | 3.4K | 13.1K | 25.1K (core+ledger) | 185.4K (av-companies 145.4 + partner-index 11.4 + search-index 28.6) | **~227KB** | 964KB raw JSON parsed up front (ledger.js:653); av-companies preloaded (companies/index.html:21) |
| /economics/ | 5.7K | 13.9K | 31.9K (core+export-png+funding+funding-compare) | 195.2K (av-companies 145.4 eager for compare picker, funding-compare.js:483 + events 6.3 + financials 2.0 + defaults 1.5 + search-index 28.6 + partner-index 11.4) | **~246KB** | heaviest route; 756KB raw fetched for a picker most visitors never open |

- **Fonts** [measured via Google CSS + woff2 downloads]: 3 families, latin subsets: Archivo variable (wdth 100–125 × wght 400–900) = **90.1KB**; IBM Plex Mono 400/500/600 = **45.2KB**; Source Serif 4 variable = **122.4KB**. Worst-case ~258KB; prose-free pages (~map) fetch ~135KB. Loading: render-blocking css2 stylesheet (index.html:18) + preconnects (16-17), `display=swap` → **FOUT + metric-shift CLS risk** on every cold load; no self-hosting, no woff2 preload, no size-adjust fallback metrics. Archivo is requested with the full wdth 100..125 axis but source uses only wdth 112–118 (base.css:31-34 + 6 declarations) — paying for unused axis range.
- **Guaranteed 404**: poster.js:987 fetches `data/logo-manifest.json`, which **does not exist in the repo** [measured: ls] — every /map/ load takes a caught-but-real 404 round trip (try/catch, poster.js:986-991).
- **No-JS story** [measured: `grep noscript` → **zero matches site-wide**]: article pages are full static prose (good — the reference's noscript-stub is the REJECT pattern and our long-form beats it). But: /map/ = empty `<svg id="poster">` + dead filter chips (map/index.html:86); /companies/ = empty thead/tbody (companies/index.html:126-128); footers are EMPTY elements filled by core.js (index.html:823, map/index.html:114) — no JS ⇒ no footer, no attribution, no fine print, and **no message anywhere explaining why**.
- **Loading state** [measured, captures]: baseline map_desktop_light/s00 AND map_mobile_light/s00 both show the poster viewport as a **blank paper rectangle** (interior sampled #FAFAF7) — the capture caught the pre-boot window. There is no skeleton, spinner, aria-busy, or "drawing 562 tiles…" line; the loading state and the failed state are indistinguishable. The frame itself reserves space (aspect-ratio 1.4, map.css:42) so **no CLS** — it's a perceived-performance and resilience gap, not a layout one.
- **CLS risks**: fonts (swap, above) are the main one; logo fade-ins are opacity-only over fixed-size mono-tiles (base.css:403-413) — **zero CLS by construction, keep**; hero-tilt/band art are transform/opacity only — compositor-friendly.
- **Good perf discipline worth codifying** [observed source]: content-visibility:auto ledger rows (per ledger.js:552 comment), passive scroll listeners (ledger.js:549-550), rAF-throttled scroll, IntersectionObserver for secnav/chapters, requestIdleCallback logo backfill (poster.js:195), search index lazy-loaded on focus (core.js:594-596), `contain:layout paint` on the viewport (map.css:47), decoding=async on injected logos, data-URI favicon, no framework (0KB runtime tax).
- **Scroll-depth vs reference**: our desktop heights [measured from slice offsets] run 2128 (/map/) to 8983 (/economics/) and ≥10280 (truncated captures: /partnerships/, passenger-autonomy, companies-mobile) vs the reference's 1147–6093. Our mobile/desktop ratio 1.2–1.6× vs their 1.7–1.9× (our text column compresses less). Long pages are mitigated by secnav ("On this page") + chapters block; the reference has no page deeper than its legal text.

---

## 3. PER-AXIS VERDICTS

**A1. Motion budget & tokens — KEEP.** Every motion in the catalog (§2.1) maps to a stated purpose; nothing accelerates on hover (loop.js:8-10 doctrine); the only autoplay has a visible pause + progress ring. But 8 CSS duration literals + 3 JS ones with zero tokens, and 4 caret rotations at 3 different durations (140/160/180ms — map.css:341 vs ledger.css:40 vs base.css:479) is a consistency violation, not a scale. Codify the 4-tier scale in §2.1.
→ *Divergence: motion — ref motion unverifiable; we keep our purpose-tagged catalog and tokenize 13 literals into 4 duration + 2 easing tokens, because same-role transitions currently differ by up to 40ms for no reason.*

**A2. Reduced-motion completeness — KEEP (codify + close 3 measured holes).** Global kill (base.css:364-371) + JS gates (loop.js:263,361; poster.js:395) + three explicit transform opt-outs (home.css:213,266; map.css:328; media.css:16) is genuinely rare rigor. Holes: (1) ledger.js:582-590 `behavior:'smooth'` is NOT covered by the CSS kill (explicit option beats scroll-behavior) and not reducedMotion()-gated; (2) under RM the loop's frame loop never starts, so Play/arrows become inert — and step() leaves ZERO cards active (goTo sets atStation=false; paintActive then deactivates all; nothing ever re-activates) [inferred from loop.js:244-258,342-350,361-375]; (3) .door/.op-card hover lifts keep instant jumps while identical .md-tile is neutralized (media.css:16 vs base.css:265).
→ *Divergence: reduced-motion — ref handling unverified; we keep kill+gate architecture and close the JS smooth-scroll and loop-control holes, because a preference honored 95% reads as broken the other 5%.*

**A3. Keyboard completeness — KEEP (two cheap wirings).** Map keyboard model (arrows with 2.5× orthogonal cost, Enter/+−/Home/F/Esc), Esc-returns-focus discipline, ledger row Enter-toggle, per-bar chart focus. Violations: regulation tabs have zero keydown handling (regulation.js — click only) and search arrows work but are invisible to AT (§2.2.4).
→ *Divergence: keyboard — ref unverifiable; we keep the map's cost-based arrow model and add APG arrow keys to tabs, because a role=tablist that ignores arrow keys contradicts the contract its role declares.*

**A4. Screen-reader completeness — KEEP baseline, fix the five wirings.** Live regions, aria-pressed/expanded/current/sort, composed tile labels are real. The five gaps (ftip, combobox, lg-empty, aria-controls, ch-tip) are all stage1-cheap except role=application (stage2, needs a designed alternative reading order).
→ *Divergence: SR — ref unverifiable; we keep live-region architecture and give the poster a browse-mode alternative, because role=application currently makes 562 tiles unreachable to a browse-mode user while /companies/ already contains the same data.*

**A5. Visual a11y (contrast/size/targets) — HYBRID.** Keep: our token pairs where measured strong (ink 17.8/16.3:1, muted 4.7–5.6:1, ink-2 10.4:1, all AA+ [measured]); dark theme passes everything measured. Adopt-principle (from the reference's observable discipline of pairing every status mark with sufficient ground contrast and a label): **every meaning-bearing mark must clear its threshold in BOTH themes** — our light theme fails on exactly the three cyan/yellow functional marks: focus ring 2.84:1 (<3:1, SC 1.4.11), gold dot 1.74:1 (<3:1), med-sub 4.39:1 (<4.5 AA). Targets: 27px chips pass 2.5.8 but chrome controls span 27/34/40px — pick one floor.
→ *Divergence: visual a11y — ref keeps status dots labeled and grounds high-contrast; we keep the two-accent palette but re-derive light-theme cyan/yellow *functional* variants, because three measured light-theme failures (2.84, 1.74, 4.39) sit against a dark theme that passes everything.*

**A6. State communication — KEEP.** Audited surfaces encode state redundantly (strikethrough, text tags, containment, glyphs, aria mirrors — §2.2); this matches the reference's dot+label rule (§1.2) independently. Only fix is the light-theme visibility of the marks themselves (A5).
→ *Divergence: state — ref pairs every dot with a word; we already do (exited=strike, spoken=dot+tag, sel=ring+scale+dim) and will keep color as the third redundancy, never the first.*

**A7. JS-dependency & no-JS story — HYBRID.** Keep our half: long-form pages are fully static (the reference's noscript-stub homepage is the corpus's one REJECT pattern, and we beat it). Adopt the missing half as principle: **a surface that needs script must say so and leave a trail** — today /map/ and /companies/ render silent empty shells, footers don't exist without JS (§2.3), and zero `<noscript>` elements exist site-wide [measured].
→ *Divergence: JS-dependency — ref homepage is a noscript stub (REJECT); we keep static-first prose and add static footers + noscript notices + a boot status line on data surfaces, because today our blank poster frame is indistinguishable from a crash.*

**A8. Payload budget — KEEP (two stage2 trims).** 40KB gz home with zero photography vs a reference paying 15–35% of page area in webp renders every route — our text/SVG-first identity is a structural perf win; codify "no raster art, data pays its way". Trims: /economics/ eagerly fetches 756KB-raw av-companies for an unopened picker (funding-compare.js:483); the ledger parses 964KB raw JSON at boot (defensible for its job, but a slim boot index + on-demand detail is the same pattern poster.js:617 already proves); kill the guaranteed logo-manifest 404.
→ *Divergence: payload — ref ships photography on every route; we ship data and inline SVG (~40–246KB gz), and we'll move the 756KB dataset behind first interaction on /economics/, because the poster already demonstrates the lazy pattern on /map/.*

**A9. Font loading strategy — HYBRID.** Keep the three-family identity (display/serif/mono is load-bearing voice, 72 mono use-sites). Adopt the loading discipline our own perf posture implies: self-host subsets, preload the two above-the-fold woff2s, add size-adjusted fallback metrics, trim Archivo's unused wdth range (requested 100–125, used 112–118) — currently a render-blocking third-party CSS + 135–258KB swap-FOUT on cold loads [measured].
→ *Divergence: fonts — ref family unverifiable (Track B); we keep 3 families but self-host with metric fallbacks, because display=swap on 258KB of CDN fonts is our largest unmanaged CLS source.*

**A10. Loading & perceived state — KEEP (one cheap fix).** Monogram-first logos (nothing ever blank, opacity-only fades, fixed boxes = 0 CLS) is a signature pattern — codify it. Fix: the poster's pre-boot blank frame (captured twice, §2.3) should put "Drawing 562 tiles…" into the already-existing #filter-state live region.
→ *Divergence: loading — ref unverifiable; we keep monogram-first and extend the same never-blank rule to the poster viewport itself, because our own captures caught the blank window.*

---

## 4. DRIFT LIST

**Stage 1 — consolidate at identical value / pure wiring (15):**
| # | Item | Where | Disposition |
|---|------|-------|-------------|
| D1 | 13 duration literals, no tokens; carets at 140/160/180ms for one role | map.css:341,284; ledger.css:40; base.css:479,545 vs base.css:169 etc. | tokenize per §2.1 scale; carets → --dur-state |
| D2 | easeInOutQuad duplicated verbatim in 2 files | loop.js:148; poster.js:397 | hoist to AV.ease (core.js) |
| D3 | 220ms logo-fade declared twice | base.css:412; map.css:323 | one rule / one token |
| D4 | hover-lift RM opt-out on .md-tile only; .door/.op-card identical lifts unguarded | media.css:16 vs base.css:263-265; article.css:110-112 | one shared RM rule for all translateY lifts |
| D5 | JS smooth scrolls ungated by reduced motion | ledger.js:582,583,589 | `behavior: AV.reducedMotion()?'auto':'smooth'` |
| D6 | search lacks combobox wiring (activedescendant/expanded) | core.js:350,591-660 | add roles/ids; arrows already work |
| D7 | regulation tabs: no arrow keys/roving tabindex/aria-controls | regulation.js; regulation/index.html:68-90 | APG tablist keydown (~15 lines) |
| D8 | .ftip data-tip never announced; no Esc dismiss | funding-compare.js:390-392; article.css:172-185 | aria-describedby + Esc handler |
| D9 | #lg-empty not live | ledger.js:187; companies/index.html:129 | announce via existing #lg-state |
| D10 | row aria-expanded without aria-controls; row aria-label overrides cells | ledger.js:180,340-348 | add aria-controls="d-slug"; move label to first cell |
| D11 | data/logo-manifest.json fetched but absent → 404 every /map/ load | poster.js:987; ls data/ | ship `{}` or gate behind manifest flag |
| D12 | zero noscript site-wide; footers empty without JS | grep=0; index.html:823; map/index.html:114 | static footer markup + `<noscript>` notice on data surfaces |
| D13 | no boot status for poster (blank frame captured) | poster.js:978-1022; map_desktop_light/s00 | write "Drawing 562 tiles…" to #filter-state before boot, clear after |
| D14 | behavior breakpoints off-by-one pairs: 860 CSS vs 859 JS, 760 vs 759, 680/681 | base.css:303; map.css:59; poster.js:972; home.css:146,168 | single source (CSS custom media or shared JS consts) |
| D15 | large-move durations 400 vs 480ms same role | home.css:195; poster.js:396 | one --dur-move value |
| D16 | ch-tip/ch-pin tooltips silent to AT | funding.js:454-460 | role=status on pin (borderline stage1) |

**Stage 2 — value changes, need decision (9):**
| # | Item | Where | Disposition |
|---|------|-------|-------------|
| D17 | focus ring 2.84:1 light theme (<3:1, SC 1.4.11); collides with yellow underline on current nav | base.css:88,172; state-focus-nav captures | darken light --cyan for functional marks, or 2-tone ring (cyan + 1px ink), or outline-color:var(--ink) on light |
| D18 | gold dot 1.74:1 light (<3:1) | base.css:254-255 (--yellow #F2B705 on #FAFAF7) | ink outline on the dot or darker light-theme gold; same fix serves map tiles |
| D19 | --med-sub 4.39:1 on --med-bg light (<4.5 AA) | base.css:18 | darken to ≈#63665C |
| D20 | role=application without alternative reading order | map/index.html:83 | design browse alternative (hidden district list or explicit pointer to /companies/) |
| D21 | fonts: CDN render-blocking + swap-FOUT, 90–258KB, unused wdth 100–111/119–125 | index.html:16-18 (all pages) | self-host subset woff2 + preload + size-adjust fallbacks |
| D22 | /economics/ eager 756KB av-companies for compare picker | funding-compare.js:483 | fetch on first picker open (pattern exists at poster.js:617) |
| D23 | 9/9.5/10px mono type under load | ledger.css:297; article.css:332; home.css:81; map.css:341 | decide a 10px floor (--fs-nano) or promote to --fs-micro 11 |
| D24 | chrome target sizes 27/34/40px inconsistent (all pass 24px) | base.css:197,240,316; home.css:125; measured map_mobile s00 | pick one floor (e.g. 34px) for touch layouts |
| D25 | selection/partner cyan rings share D17's light-theme 2.84:1 | map.css:74-85,126-129 | same functional-cyan fix as D17 |

(Also noted, no action: tile-ink 3.1:1 light monograms are aria-hidden decorative; ledger boot-parse of 964KB raw is the page's actual job — revisit only if a slim index lands.)
