# R3 — Structure: IA & navigation (B), Page composition & rhythm (C), Grid & alignment (D), Spacing (E)

Method: content-edge probes (column ink-density over y-bands, `tools/edges.py`) and row-profile probes (`tools/rows.py`) on full captures; crops read at 2x; source citations from /home/user/av-ecosystem-map. Anti-aliasing gives ±1–2px error on any single edge; ±2–4px on gaps between text runs (both endpoints fuzzy). All reference coordinates are on 1440-wide desktop captures unless stated. Track B failed: no live CSS — every reference number here is a screenshot measurement, never a stylesheet value.

---

## 1. REFERENCE FINDINGS

### D. Grid & alignment

**Standard container: 1168px content at 1440, margins 136px — CONFIRMED and extended to effectively all routes.** [measured]
Content-edge probes (thresh<245 catches 1px light borders):
- home feature grid y1500–1600: borders x136→1303, width 1168 (autzu.com_desktop.png)
- home map card y2500–2600: x136→1303; location grid y3200–3300: x136→1303; dark closing CTA bar y3730–3780: x136→1303
- blog featured card y500–520: left 136, right border 1302–1303
- hubs y1100–1200: 136→1303; about y1150–1250: 136→1303; investors y2200–2300: 136→1303; press y800–900: 136→1303; contact y400–500: 136→1303; partnerships y200–400: 136→1303; careers CTA banner y960–1000: 136→1303
Left text edge = 137 (first AA-dark pixel) on every text probe (blog/about/investors/privacy/terms). Part II's 1168 [measured] stands, now on 11 routes, not 2.

**The "platform 1280px" exception RESOLVED: it is the wide tint-band, not a second text container.** [measured]
Platform's light-gray band runs y998–1641 and x80–1359 = 1280px wide with 80px margins (non-white column probe at y1190–1210, platform_desktop.png). Text and cards INSIDE the band still align to the 1168 container (eyebrow/heading/cards probe y1100–1200 starts x138). So the system is: one text container (1168/136) + one wide surface-band width (1280/80) used for tinted rhythm panels. Part II's "resolve which is token vs exception" → 1168 is the token; 1280 is a band-surface width only, never a text width.

**Grid geometry.** [measured]
- Column pitch in every 3-col grid = container/3 = 389.3px exactly (home feature grid borders at 136/525/914/1303; blog cards 136–510/533–906/929–1303; about values 136–514/531–908/925–1303).
- 4-col metric band pitch = container/4 = 292px (home tiles borders 136/428/719/1011/1303).
- Two grid grammars, confirming slice-index: (a) **shared-hairline grids, gutter 0** — home 2x3 feature grid and 4-tile metric band show SINGLE border columns at 525/914 (no border pairs), i.e. adjacent cells share the 1px line; same for 3x3 location grid, press fact sheet, investors 3x2, platform certifications. (b) **gapped bordered cards** — border pairs measured: home photo cards 508|533 and 906|931 → gutter 24±1; blog post grid edge-to-edge 22–23; about/platform value+ops cards 513.5|531.5 → gutter 18±2; partnerships cards ~900|917 → ~17. Observed gutters cluster at **~17–18 and ~23–25**: at most two gutter values, both small (≈1.5–2% of container) — dense, near-touching cards. [measured ±2]
- Card inner padding ≈ **28–29px** desktop (border 136 → text 165 on home/about/platform cards) and ≈29 at mobile (home mobile card border 20 → text 49). One card-padding value across contexts. [measured ±2]

**Legal reading column.** [measured] privacy y900–2000: body column x457→1171 = 715px; terms y4100–5000: x457→1174 = 718px. Left "CONTENTS" TOC rail x137→~290 (privacy) / →358 (terms), gutter ~100px to the body column. The reading column is ~61% of container, right edge NOT at container edge (1171 vs 1303) — a deliberate measure cap. At the observed ~16–18px body this is roughly 75–85ch [estimated — font metrics unverified, Track B]. Confirms Part II "narrow reading column" with numbers.

**Margins by viewport.** [measured] Desktop 136 (all routes); tablet 24 (blog_tablet card borders x24→743); mobile 20 (blog/about/terms/home mobile probes all left=20). Ratio 136:24:20.

### E. Spacing

**Vertical rhythm values (desktop, ±2–4px).** [measured] Row-profiles at container x-range:
- **Eyebrow → heading: 25–30px.** about OUR MISSION 30 (y821→852); about OUR STORY 25; investors MILESTONES 25; investors INVESTOR PROFILE 25; press IN THE PRESS 27; platform band eyebrow 25. Tightest, most consistent gap in the system.
- **Heading → section content: 65–90px** (investors 83, about story 89, press 65, platform band 70). About mission heading→cards 116 (heading is centered display, larger role).
- **Content end → next section eyebrow: 129–181px** (about 147, investors 181, press 129, investors CTA 148). Section spacing ≈ 130–180.
- **Tint-band internal top padding: 83** (platform band top y998 → eyebrow y1081).
- **Row-list pitches:** timeline rows 82–84 (about y1551/1633/1715/1798/1880; investors 1471/1555/1639/1723); careers jobs table 68–69 (runs y1491→1560→1628…, text h17 + 51 gap → ~26px padding above/below text); press coverage rows ~102.
- Hero block ≈ 808–820px to first section on home/about (slice-index y-refs).

**Base unit test: 4px passes, 8px fails.** [measured ±2] Observed set {20, 24, 25→24?, 28, 68.5, 84, 100, 116, 136, 148, 180}: mod-4 residuals ≤2 everywhere; mod-8 fails outright on 20, 28, 84, 116, 148 (residual 4). Within measurement error the system is consistent with a **4px base**; it is NOT an 8px grid. (68.5 jobs pitch is content-height-driven, not a token.)

**Distinct spacing values countable in captures: ~11–12 roles.** [measured] mobile margin 20 / tablet margin 24 / gutter-small ~18 / gutter-large ~24 / card padding 28 / eyebrow gap 25–30 / row padding ~26 / heading gap 65–90 / band padding ~83 / row pitch driver ~51 / section gap 130–180 / desktop margin 136. A tight, role-based set — no consecutive-integer sprawl.

**Mobile compression.** [measured] Page heights mobile/desktop: 1.55 (careers) – 2.20 (platform), median 1.72 across 12 routes (about 1.57, home 1.70, terms 1.72, blog 1.99, contact 1.97). **CORRECTS Part II's "1.7–1.9"** to 1.55–2.20; conclusion unchanged — content preserved, not hidden. Buttons go full width at 390 (home mobile "Request Briefing" spans ~350px of the 350 content width) [observed, autzu.com_mobile y~960–1000].

### C. Page composition & rhythm

**Archetype recount for THIS corpus — 9, not 8.** [observed, slice-index cross-checked against captures]
1. **Hero** — three sub-variants: split (text left / visual right: about, careers, contact, hubs, investors, partnerships, platform, press), full-bleed photo with overlaid text + metric band (home), text-only legal/centered (privacy, terms, blog, 404).
2. **Gapped bordered card grid** (features, values, posts, UI-mockup cards).
3. **Borderless icon strip** between hairlines (hubs 5-col, careers 4-col, platform 4-col) — distinct from (2): no borders, no fills.
4. **Metric band** (shared-hairline tiles home; borderless inline platform; fact-sheet grid press; mini metric rows inside cards platform s02).
5. **Split heading+support section** (heading left / gray para right: home "Built for autonomy", investors THESIS, platform SECURITY, partnerships STACK).
6. **Shared-hairline data grid** (locations 3x3, investor profile 3x2, certifications 3x2, fact sheet 3x2).
7. **Hairline row list** with mono lead column (timelines, jobs table, coverage list).
8. **Legal long-form** (LEGAL eyebrow hero, left CONTENTS TOC rail, numbered H2 article column, callout boxes).
9. **Closing sequence**: dark rounded CTA bar (4 routes) → identical dark footer (all 13).
**Dropped from Part II's list: accordion rows (NEVER seen — confirmed absent on all 13 routes; likely host was the missing /drivers page, [unverified per Track B]) and partner strip as logos (NEVER seen — partner names are always text chips or the footer "Official Uber partner" pill; no logo images anywhere).** Reuse is extreme: GLOBAL PRESENCE map+grid verbatim on home and hubs; the 3 photo cards verbatim on home and hubs; blueprint hero image shared about/press. ~9 archetypes cover 13 routes — the reuse IS the coherence.

**Light-to-dark pacing — Part II claim CORRECTED.** [measured/observed] "Every long page inserts at least one dark band" is FALSE for this corpus. Mid-page full dark bands: none. Dark ink #0B1220 appears only as (a) the footer (all 13 routes — the one guaranteed dark band), (b) dark closing CTA bars immediately above the footer (home, investors, partnerships, press — 4/13), (c) dark imagery/panels inside heroes (partnerships network diagram, platform dashboard, about/press blueprint images). The actual pacing device is **tint bands on white**: warm #F6F6F4 band on platform (y998–1641), press fact-sheet band, careers light CTA banner (container-width card, x136–1303), cool #E8ECF1 map-section family on home/hubs (per ref-palette-notes, surface is #FFFFFF not #F8F8F6). Pattern: **white body → 0–2 tint bands → dark tail (CTA bar optional, footer always)**. Darkness accumulates only at the page end.

**Sequencing per route** [observed]: hero → (metric band on home/platform) → alternating card-grid / split / data-grid sections → optional tint band → optional dark CTA bar → dark footer. No route breaks the hero-first, dark-tail-last frame; careers uniquely moves its CTA banner mid-page in light gray.

### B. IA & navigation

- **Header** (identical all 13 routes) [observed]: wordmark + **5 dropdown groups** (Hubs, Platform, Partnerships, Company, Drivers) + 2 pills: outlined "Uber EV" + solid "Request Briefing". **CTA persistence: "Request Briefing" is in the sticky nav on every route** and recurs as hero primary on home/hubs/platform; other routes swap the hero primary contextually (View open roles, Request Investor Deck, Download Press Kit, Become a Partner) while nav CTA stays fixed.
- **Depth: exactly 2.** Footer sitemap (all routes + designed 404): HUBS{Overview, Locations, Capabilities}, PLATFORM{Software, Integrations, Security}, PARTNERSHIPS{Overview, OEMs & AV, Rideshare}, COMPANY{About, Careers, Blog, Investors, Press Kit}, DRIVERS{Uber EV program, Uber EV FAQ, Driver guides, Apply to drive, Driver support} — 5 columns, 3–5 links each, ~17 leaf pages. Active route gets a thin underline in nav; contact underlines both Company and Drivers (shared child) [observed].
- **Wayfinding devices: two.** Sticky nav (global) + footer sitemap (global); legal pages add the CONTENTS TOC rail (local). No breadcrumbs anywhere. The 404 is a designed page that re-presents the full sitemap [observed, drivers_*.png].
- **Mobile nav:** hamburger per Part II [observed in Part II; NOT verifiable in this corpus — the sticky nav renders at arbitrary offsets in captures and is absent from the top of every mobile capture checked (autzu.com, about, terms). Keep Part II's tag; breakpoint values remain Track B / unverified].

---

## 2. OWN-SITE FINDINGS

### D. Grid & alignment

- **Container: `--col: 1240px` max-width with `padding-inline: clamp(16px,4vw,32px)`** (base.css:31, base.css:137) → measured content **x132→1303/1308 = ~1176px, margins 132** at 1440 (economics y3000–3400: 132→1303; regulation 132→1295; home/method/waymo/safety left=132). Note the token is outer width; real text width is 1240−64=1176. **Relationship nearly identical to the reference (1176/132 vs 1168/136)** — coincidental but convenient. [measured]
- **Margins by viewport:** desktop 32 (+centering = 132 at 1440); tablet 4vw ≈ 31 at 768 [inferred from CSS; text probe hit an indented list at x43]; mobile 16 (method_mobile left=16). Ratio 132:31:16 vs reference 136:24:20 — our tablet margin is wider, mobile narrower. [measured/inferred]
- **Reading measure: `--measure: 68ch`** (base.css:32) renders **634–643px** (method 132→765, waymo 643, safety 640 — serif 19px). Tokenized, honored on prose, bio, standfirst (base.css:116,120,292, footer 219). **But applied inconsistently:** economics has paragraphs spanning the full 1176 container (economics_desktop s03 top: funding-notes text runs x132→~1305) while adjacent prose sits at 68ch; footer .fine uses a one-off 82ch (base.css:210); home band-desc uses 60ch (home.css:243). Three measures + unconstrained passages. [measured + file:line]
- **Article layout wastes the right half of desktop.** Overview/waymo/safety: prose column x132–765; x765–1308 is empty (overview_desktop s00; waymo_desktop s00) except the floating "ON THIS PAGE" pill parked bottom-LEFT overlapping the column it indexes (overview s00, y~865 — pill sits on top of body text). Regulation instead indents prose to x380–940 beside a left tab rail (regulation s01) — a second, different article geometry. The reference's legal template solves the same problem with a reserved left TOC rail + centered-ish 715px column; ours leaves a ~540px dead field. [observed]
- **Overflow defects:** economics desktop capture is **1489px wide for a 1440 viewport** (and tablet 1388 for 768) — the document overflows horizontally (compare table `min-width` family, article.css:317 `.cmp-wrap`, table.compare cells article.css:438) instead of scrolling inside a container. Companies ledger clips columns at the container edge with floating "TOP OF PAGE/BOTTOM OF PAGE" pills overlapping the table's last column (companies_desktop s01, x~1140–1300). [measured/observed]

### E. Spacing

- **No spacing scale exists.** gap: 30 distinct values — 8(x19), 6(x17), 12(x12), 7(x8), 14(x8), 10(x8), 5(x5), 4, 2, 16, 9, 3, plus 18/20/22/24/28/36/40/44 singletons and 11 two-axis pairs (grep across assets/css). **Every integer 2–10 is in active use** — the definition of no scale. margin-top: 14(x12), 16(x11), 10(x10), 8(x9), 6(x9), 20(x8), 18(x8), 12(x6), 24(x4), 7, 3, 4, 2, 48... Padding: ~40 distinct combos (10px 12px x6, 2px 6px x4, 9px 12px x3, 9px 14px, 8px 11px, 7px 13px, 5px 11px 5px 6px…). [measured, source]
- **Rhythm is viewport-relative where the reference is fixed:** `section+section` margin-top clamp(48px,8vh,96px) (base.css:139); .page-head clamp(40px,7vh,88px)/clamp(24px,4vh,48px) (base.css:138); but THREE near-duplicate head clamps exist — .article-head clamp(40,7vh,**80**)/clamp(**20,3vh,36**) (article.css:5) and #loop clamp(40,7vh,80) (home.css:3); plus chapters-wrap clamp(48,8vh,96)+clamp(32,5vh,56) (base.css:420) and footer clamp(64px,10vh,128px) (base.css:207). Alongside the clamps, hard literals do the same job elsewhere: home.css:177 `margin-top:56px; padding:56px 0 64px`, home.css:222 `.bands-wrap padding:56px 0 0`, base.css:208 footer `48px 0 64px`, base.css:393–394 mobile section 40px / footer 28px 36px. Two rhythm systems coexist. [source]
- **Measured own rhythm (desktop captures):** eyebrow→h1 22–24 (home 22, overview 24); h1→standfirst 20–21; standfirst→first h2 ~105; h2→body 29–36; paragraph gap ~29; line gap 13; dl-row rhythm on waymo ~37 gaps; chapters band pitch ~240. Our eyebrow→display gap (22–24) is functionally the same relationship as the reference's 25–30. [measured ±3, rows.py]
- **Card/grid gaps in the wild:** .md-grid 12 (media.css:5), .pa-row 8 (ledger.css:322), stat-row clamp(20px,4vw,48px) (base.css:284), chapters .ch padding 18px 18px 22px (base.css:428), loop-stage padding 40px 50px (home.css:153). Five different systems where the reference shows two gutter values.

### C. Page composition

- **Distinct section archetypes: ~18–20** (screenshots + own-ui-inventory): (1) page-head hero (eyebrow+display+standfirst, left-aligned, right half empty); (2) map split-head variant (headline left, right-aligned intro para top-right — map s00 only); (3) home loop stage (animated road + 4 stage cards); (4) tilted minimap hero card; (5) home chapter bands (full-bleed hairline rows w/ hover reveal); (6) chapters block (6-col shared-hairline numbered grid — appended to every chapter page); (7) serif article prose w/ numbered h2; (8) .note callouts (yellow/cyan left rule); (9) stat-row metric band; (10) stat-card row (waymo s00 bottom: 3 gapped bordered metric cards); (11) hairline dl rows (label left/value right — waymo s00); (12) data table (ledger 23-col / rank / compare); (13) 3-col media card grid; (14) poster viewport card + toolbars; (15) heatmap matrix (partnerships); (16) rank bars; (17) region tab rail + prose (regulation); (18) incident timeline rows; (19) calculator panel; (20) footer bio. Roughly double the reference's 9, and many are single-route. BUT: several form a real family already — dl rows, stat cards, chapters grid, media cards all reuse .card/.eyebrow/hairline grammar — and the data surfaces (poster, calculator, heatmap, ledger) serve content the reference simply doesn't have. [observed]
- **Tonal pacing: none.** Home chapter "bands" are NOT tinted — sampled #FAFAF7 across y2100–2550 at both x60 and x700 (home_desktop_light), identical to page ground; hairlines alone divide sections; footer is the same paper with a hairline (base.css:206–208; home s04). Tint tokens exist (--med-bg #F4F2E9, base.css:22) but no page-level band uses them. Partnerships runs 21,108px of uniform paper with zero tonal breaks. Dark exists only as the global theme toggle, never as pacing. [measured]
- **Page-length extremes:** partnerships desktop 21,108px (3.5x the reference's longest, terms 6093); economics 8,983. [measured]

### B. IA & navigation

- **Structure: 6 chapters, 11 nav pages + home.** CHAPTERS const (core.js:284–298): Overview{overview, beyond-roads, owning-one}, Map{map}, Directory{companies, passenger-autonomy, partnerships}, Economics{economics, #unit-economics, #comparing}, Regulatory{regulation, safety}, Media{media}. **Header nav, dropdowns, and the end-of-page chapters block all render from this one constant** (headerHTML core.js:330–346; chaptersHTML core.js:487–505) — structurally impossible for them to disagree. Genuine strength. [source]
- **Consistency failures at the edges:** README route table says passenger-autonomy "+ 10 pages" (README.md:18) but /companies/ contains **12** operator dirs (avride…zoox). **sitemap.xml is stale**: lists the OLD /operators/* URLs (now `<meta refresh>` redirect stubs, operators/index.html:8) including **/operators/zoox/ which has no directory at all**, and omits /overview/, /media/, /companies/passenger-autonomy/ and all 12 real operator pages. /method/ is in the sitemap but reachable in the UI only through a prose link inside the footer bio ("here's my process", core.js:371) — never in nav, chapters, or a footer link block. [source]
- **Wayfinding devices: FOUR-plus, partially competing.** (1) primary nav w/ per-chapter dropdowns (hover-open + caret buttons); (2) chapters block appended after content on chapter pages; (3) floating .secnav "On this page" pill/panel — fixed bottom-left, auto-open ≥1800, bottom strip ≤720 (base.css:463–497); (4) operator pages use the eyebrow as an up-link breadcrumb ("PASSENGER AUTONOMY" underlined, waymo s00); (5) ledger adds floating TOP/BOTTOM OF PAGE pills. No breadcrumbs elsewhere; three different "where am I" answers (aria-current in nav, is-here in chapters, yellow underline) are at least all driven by the same `page` id. [source + observed]
- **CTA policy:** no nav CTA. The recurring conversion is personal: footer bio + "EMAIL ME" btn on every page (core.js:377), one CORRECTION mailto shared by map card and ledger (core.js:304–305), per-section "RECOMMEND A PUBLICATION/PODCAST" buttons on media. Ends-on-a-person is an explicit, consistent policy (core.js:359 comment). [source]
- **Mobile nav:** ≤860 nav wraps to visible rows (base.css:303–309 — "no blind horizontal swipe"); ≤640 hamburger + fold-out showing ALL pages at once (base.css:325–333). Two-stage collapse vs the reference's single hamburger.
- **Breakpoints: 12 distinct width thresholds + orientation guard:** 480, 560, 620, 640, 680/681, 700, 720, 759(JS), 760, 859(JS+map.css), 860, 960, 980, 1800, (landscape ∧ ≤560h). Near-duplicate pairs 759/760 and 859/860 split between JS and CSS; 960 (base.css:438 chapters 2x3) vs 980 (ledger.css:335 pa-row, home.css) do similar "tablet" work at different values; **480 (base.css:360–362) touches only .doors, a component with no HTML anywhere — a dead breakpoint on a dead component**. [source]
- **Mobile content preservation:** m/d height ratios 1.15 (map — poster scales rather than reflows) to 1.86 (media), median ~1.5 — below the reference's 1.72 median partly because the poster/loop compress visually instead of stacking. **Outlier: companies mobile = 65,002px (24.8x desktop)** — the ≤680 table→cards conversion emits 562 card frames; captured slices show screenfuls of empty hairline rows (companies_mobile s10) [measured; emptiness may be partly lazy-render capture artifact, but the 65k document height is real].

---

## 3. PER-AXIS VERDICTS

| # | Axis | Verdict | Rationale (measurement-based) |
|---|------|---------|------------------------------|
| 1 | **Container & grid** | **KEEP** | Ours measures 1176/132 at 1440 vs their 1168/136 — the same relationship, already tokenized (`--col`, base.css:31) and honored on every probed page (132→1303/1308 on 6+ routes). Codify: document that `--col` is outer width (content = col−2·pad), and adopt their *principle* of one sanctioned wide-band width for full-bleed surfaces (our poster card already wants it) instead of ad-hoc overflow. Divergence map: "container: ref 1168px content/136 margins + 1280 band width; we keep 1240 outer/1176 content and add one named wide-band width, because the relationship already matches and only the band tier is missing." |
| 2 | **Reading measure** | **KEEP** | `--measure: 68ch` renders 634–643px — tighter than the reference's 715–718px legal column (~75–85ch at their body size, i.e. arguably over the classical limit). Ours is the better-disciplined value AND is a token. The fix is enforcement, not the value: economics paragraphs escape to full 1176px width (economics s03), and 82ch/60ch one-offs exist (base.css:210, home.css:243). Divergence map: "measure: ref reads at ~715px, we keep 68ch (~640px) everywhere prose renders, because 68ch is inside the 60–75ch canon and theirs is not." |
| 3 | **Spacing scale & base unit** | **ADOPT-PRINCIPLE** | Reference: ~11–12 role-based values, consistent with a 4px base (mod-4 residual ≤2 on all measured gaps; 8px fails on 20/28/84/116/148). Ours: ~30 gap values with every integer 2–10 in use (gap:7 x8, gap:9 x2, gap:5 x5 — grep) — no arithmetic at all. Principle to adopt: a small role-named scale on a 4px base (~9 steps: 2/4/6/8/12/16/24/32/48 + section token), each observed literal mapped to its nearest step; NOT their specific values. Consecutive-integer neighbors (5,6,7 → 6; 9,10 → 8 or 12 by role) consolidate with ≤2px visual change. |
| 4 | **Vertical rhythm (fixed vs fluid)** | **HYBRID** | Keep OUR clamp()-vh fluid rhythm as the mechanism — it is deliberate (landscape ≤560h compression, base.css:384) and our micro-rhythm (eyebrow→h1 22–24px) already matches the reference relationship (25–30). Adopt THEIR discipline of one rhythm system: we currently run three near-duplicate head clamps (base.css:138 vs article.css:5 vs home.css:3) plus hard literals (56/48/64/28/40 at home.css:177,222; base.css:208,393–394) doing the same job. Consolidate to tokens: --rhythm-section, --rhythm-head, --rhythm-tail; keep clamp() inside the token. Divergence map: "rhythm: ref fixed px section spacing (~130–180), we keep fluid clamp(48,8vh,96) but reduce to one tokenized system, because short-viewport behavior is a real requirement our content has and theirs doesn't." |
| 5 | **Section archetype grammar** | **HYBRID** | Ref: 9 archetypes cover 13 routes with verbatim reuse (map+grid on 2 routes, photo cards on 2). Ours: ~18–20 layouts, many single-route. KEEP the data surfaces (poster, ledger, calculator, heatmap, timeline — content the reference cannot express) as first-class archetypes; ADOPT the reuse principle for editorial sections: our dl-row, stat-card row, hairline row list, card grid, prose+callout already form a 7–8 archetype editorial family — name them, and require new sections to compose from the named set. Divergence map: "grammar: ref reuses 9 archetypes verbatim; we codify ~8 editorial + ~5 data archetypes and prohibit unnamed one-offs, because our content genuinely spans more types but our editorial layer over-invents." |
| 6 | **Tonal band pacing** | **ADOPT-PRINCIPLE** | Ref (corrected): white body → 0–2 tint bands (warm #F6F6F4 / cool #E8ECF1 families) → dark tail; the only guaranteed dark is the footer; darkness accumulates at page end. Ours: sampled #FAFAF7 uniformly across the home chapter bands (x60/x700, y2100–2550) — zero tonal pacing on any page, including 21,108px partnerships; --med-bg (#F4F2E9, base.css:22) exists unused at page level. Principle to adopt: long pages earn tonal rhythm breaks from OUR palette (--med-bg tint band; optionally a consistent page-tail treatment), placed by role (pacing, closing) not decoration. Not their colors, not their dark-navy tail. |
| 7 | **IA depth & naming** | **KEEP** | Ours: 6 chapters x ≤3 children, depth 2, numbered reading order — same depth discipline as their 5x(3–5), and our nav/dropdowns/chapters block are single-sourced from one constant (core.js:284–298), which the reference cannot demonstrate (no source access). Consistency violations are peripheral, all fixable as drift: stale sitemap.xml (dead /operators/zoox/, missing /overview/ /media/ + 13 real pages), README "+10 pages" vs 12 dirs, /method/ orphaned in a prose sentence. Divergence map: "IA: ref groups by audience (Hubs/Platform/…/Drivers), we keep chapters-in-reading-order, because the site is a publication with a narrative spine, not a product brochure." |
| 8 | **Wayfinding (secnav/chapters/breadcrumb)** | **HYBRID** | KEEP the chapters block (numbered 6-col shared-hairline grid at page end — matches "reader finishing a chapter" and reuses the data-grid grammar) and the eyebrow-as-up-link on operator pages. ADOPT the reference principle that a page-level TOC occupies **reserved layout space** (their legal CONTENTS rail sits in the grid, x137–358, never over text): our floating .secnav pill overlaps the very column it indexes (overview_desktop s00, pill over body text at y~865; base.css:464 comment admits it parks "bottom-left at every width") while the desktop right half (x765–1308) sits empty on every article page. Move the article TOC into that dead field ≥ some width; keep the bottom-sheet behavior ≤720. Also fold the ledger's TOP/BOTTOM pills (overlapping table columns, companies s01) into the same system. |
| 9 | **Breakpoint system** | **ADOPT-PRINCIPLE** | Ref corpus shows 3 canonical widths (values unverified — Track B). Ours: 12 thresholds with near-duplicate pairs at 759/760 and 859/860 split across JS/CSS, a 960-vs-980 pair doing the same "tablet" work, and a dead 480 rule targeting the HTML-less .doors. Principle: a small named set (major layout breaks ~4: wide/desktop/tablet-nav/phone + per-component container queries or explicitly documented component breaks), with JS reading the same constants (e.g. matchMedia on named values) so 759/760 class mismatches cannot exist. Behavior-load: 640 (hamburger), 680 (ledger cards/rail), 720 (secnav strip), 760 (card→sheet), 860 (nav wrap, map fullscreen), 960/980 (grid steps), 1800 (secnav auto-open) — consolidate to ~6. |
| 10 | **CTA policy** | **KEEP** | Ref: one persistent nav CTA ("Request Briefing" on all 13 routes) + dark closing CTA bars on 4 conversion routes. Ours: deliberately personal — footer bio + EMAIL ME everywhere (core.js:359 "Every page ends on a person"), one shared CORRECTION mailto (core.js:304), contextual recommend-buttons on media. This is consistent (verified same footer via core.js single source) and fits a publication; a nav-level CTA would fight the search box for chrome space. Codify the closing sequence (content → chapters block → bio footer) as OUR closing archetype, mirroring the *role* of their CTA→footer tail without the conversion furniture. |
| 11 | **Mobile content preservation** | **HYBRID** | Shared value: ref preserves content (1.55–2.20, median 1.72); ours mostly does too (media 1.86, articles 1.3–1.8). KEEP our stacking behavior for articles/cards. Two of our surfaces violate the principle in opposite directions: map compresses to 1.15 by scaling the poster (content technically present but illegibly small until tap-to-fullscreen at ≤859 — defensible, documented), and companies explodes to 65,002px of largely empty frames (24.8x — neither readable nor scannable). Adopt: mobile pages must stay within a sane multiple of desktop (their observed ceiling ≈2.2x) via virtualization/pagination of the 562-row conversion. |

---

## 4. DRIFT LIST

Stage 1 = consolidate at identical (or perceptually identical, ≤2px) value — no design decision needed. Stage 2 = value/behavior change, needs a decision.

**Spacing / rhythm**
1. Three page-head rhythm clamps: base.css:138 `.page-head clamp(40,7vh,88)/clamp(24,4vh,48)` vs article.css:5 `.article-head clamp(40,7vh,80)/clamp(20,3vh,36)` vs home.css:3 `#loop clamp(40,7vh,80)` — near-duplicates. → **stage1**: one `--rhythm-head` token (pick the base.css values; deltas ≤12px at max viewport).
2. chapters-wrap padding-bottom clamp(32px,5vh,56px) (base.css:420) — fourth one-off clamp. → **stage1** fold into rhythm tokens.
3. Hard rhythm literals bypassing the clamp system: home.css:177 `margin-top:56px; padding:56px 0 64px`; home.css:222 `.bands-wrap padding:56px 0 0`; base.css:208 footer `padding:48px 0 64px`. → **stage1** tokenize (nearest rhythm step).
4. Mobile compression literals: base.css:393 `section+section margin-top:40px`, base.css:394 footer `48px / 28px 0 36px` — untokenized parallel rhythm. → **stage1** express as the mobile value of the same tokens.
5. gap sprawl: every integer 2–10 in use (gap:7 x8 e.g. header bars; gap:9 x2; gap:5 x5; gap:3, gap:2 — grep assets/css). → **stage2**: cluster to a ~9-step scale (5,6,7→6; 9,10→8 or 12 by role); each merge is ≤2px but the scale itself is a decision.
6. margin-top sprawl mirroring #5 (14 x12, 16 x11, 18 x8, 20 x8, 22, 24 co-existing). → **stage2** same scale decision.
7. padding combos ~40 distinct (10px 12px x6 vs 9px 12px x3 vs 8px 12px, 8px 11px, 7px 13px, 5px 11px 5px 6px — grep). → **stage2**: define 3–4 inset tokens (chip/control/card/panel) and map.
8. stat-row gap `clamp(20px,4vw,48px)` (base.css:284) — only vw-based gap in the system. → **stage1** move into the gap scale (fixed or tokenized fluid, matching siblings).
9. loop-stage `padding:40px 50px` (home.css:153) — the only 50 anywhere. → **stage1** snap to 48.

**Grid / container / measure**
10. Measure escapes: economics intro/funding-notes paragraphs render full-container ~1176px wide (economics_desktop s03) while `--measure:68ch` governs adjacent prose. → **stage1**: apply .prose/--measure to those blocks (value already exists).
11. footer .fine `max-width:82ch` (base.css:210) and .band-desc `60ch` (home.css:243) vs `--measure:68ch`. → **stage2**: either sanction a 3-tier measure (compact/standard/wide) or collapse to one; decision.
12. Economics horizontal overflow: document 1489px at 1440 viewport, 1388 at 768 (capture dims) — compare-table min-widths (article.css:317 .cmp-wrap, article.css:438 table.compare) overflow the page instead of an internal scroll container. → **stage2** (needs a scroll-wrapper design consistent with ledger's .table-scroll).
13. Ledger clipped at container edge + floating TOP/BOTTOM pills overlapping last column (companies_desktop s01). → **stage2** (same scroll/affordance decision as #12).
14. `.container` max-width includes padding (content 1176 ≠ --col 1240) — undocumented; any dev matching "1240" to a design spec will be 64px off. → **stage1** document (or switch to `box-sizing`-style content width) with no visual change.

**Breakpoints**
15. 759 (JS: poster.js chooseMode, card→bottom-sheet) vs 760 (CSS: article.css:222,246; map.css) — same intent, off-by-one across languages. → **stage1** single named constant.
16. 859 (map.css:  tap-to-fullscreen + JS) vs 860 (base.css:303, home.css, article.css:317) — same. → **stage1**.
17. 960 (base.css:438 .ch-list 2x3) vs 980 (ledger.css:335 .pa-row 3-col; home.css 681–980 band) — two "tablet" thresholds 20px apart. → **stage2**: pick one tablet break (which value is a decision affecting two grids).
18. Dead breakpoint + dead component: base.css:360–362 `@media (max-width:480px){.doors{…}}` and all .door/.doors rules — no .doors in any HTML (own-source-inventory). → **stage1** delete.
19. 620 (ledger.css:336 pa-row 2-col) vs 640 (global hamburger/font step) — 20px apart; likely mergeable. → **stage2** (verify pa-row at 640 first).
20. 12 thresholds overall (480/560/620/640/680/700/720/760/860/960/980/1800) with no named tokens; JS duplicates values as literals (poster.js, core.js). → **stage2** define the named set (~6) per axis-9 verdict.

**IA / navigation**
21. sitemap.xml: lists redirect stubs /operators/* as canonical incl. **/operators/zoox/ which does not exist as a directory**; omits /overview/, /media/, /companies/passenger-autonomy/, and all 12 /companies/&lt;operator&gt;/ pages (sitemap.xml vs filesystem). → **stage1** regenerate from the real route set.
22. README.md:18 "passenger-autonomy + 10 pages" vs 12 operator directories in /companies/. → **stage1** correct count.
23. /method/ reachable only via a prose link in the footer bio (core.js:371); absent from nav, chapters, and sitemap-visible UI. → **stage2**: decide whether method joins a chapter (e.g. under Overview) or gets a standing footer link block.
24. /operators/ contains only 9 of the 12 slugs as stub dirs (no zoox, avride, swm) while sitemap advertises /operators/zoox/ → 404 risk for indexed URLs. → **stage1** add missing stubs or fix sitemap (same action as #21).
25. loop-variants.html at repo root — scratch page with 11 inline styles + 2 inline &lt;style&gt; blocks (own-source-inventory), unlinked from IA. → **stage1** remove or move out of publish root.
26. Wayfinding overlap: .secnav fixed bottom-left overlaps article text (overview_desktop s00 y~865; base.css:463–467) while desktop right field x765–1308 is empty on article pages. → **stage2** (axis-8 hybrid: reserve layout space for the TOC at wide widths).

**Composition**
27. companies mobile: 65,002px document; captured slices largely empty hairline frames (companies_mobile s10; ledger.css ≤680 table→cards). → **stage2** virtualize/paginate the mobile conversion.
28. partnerships desktop: 21,108px uniform-paper page, zero tonal or archetype rhythm breaks (partnerships_desktop dims + slices). → **stage2** apply axis-6 tint-band pacing.
29. Section archetypes ~18–20 with single-use layouts (map split-head, regulation tab-rail indent x380 vs article x132) — two different article geometries. → **stage2** name the archetype set; converge regulation onto the standard article grid or sanction the rail as the article-TOC pattern (ties to #26).

Tally: **stage1 = 14** (items 1,2,3,4,8,9,10,14,15,16,18,21,22 — with 24 folded into 21 — plus 25), **stage2 = 12** (5,6,7,11,12,13,17,19,20,23,26,27/28/29 counted as 3 → strictly 14 listed; conservative distinct-decision count 12).

---

### Part II checklist (my dimensions) — confirm/correct summary
| Part II claim | Status |
|---|---|
| Container 1168 @1440 / 136 margins (home+blog) | **CONFIRMED** [measured], extended to 11 routes |
| Platform 1280 content / 80 margins — token or exception? | **RESOLVED**: 1280 is the wide tint-band surface (x80–1359); text container stays 1168 |
| Mobile margins ~20–24 @390 | **CONFIRMED at 20** [measured, 4 routes] |
| Mobile heights 1.7–1.9x desktop | **CORRECTED to 1.55–2.20, median 1.72**; conclusion (content preserved) stands |
| 8 archetypes incl. accordion + partner strip | **RECOUNTED to 9**; accordion ABSENT (confirmed, host route missing), partner-strip-as-logos ABSENT (text chips only) |
| Every long page ≥1 dark band | **CORRECTED**: guaranteed dark = footer only; mid-page dark = 4 closing CTA bars; pacing = tint bands |
| Blog featured+3col grid; contact split; legal narrow column | **CONFIRMED**; legal column measured 715–718px at x457 |
| @390 hamburger, single col, full-width buttons, metric→2col | Single col + full-width buttons **CONFIRMED**; hamburger **unverifiable in corpus** (sticky-nav capture artifact) — keep Part II tag; breakpoint values remain [unverified — Track B failed] |
