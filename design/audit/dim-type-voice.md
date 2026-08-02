# R2 — Typography (F) & Content design / Voice (M)

Sources: reference slices at `scratchpad/reference/slices/`, own slices at `scratchpad/own/slices/`, repo `/home/user/av-ecosystem-map` (read-only). Measurement tool: `tools/textmetrics.py` (row-profile of dark pixels: band top/bottom = letter extents; top-to-top of successive line bands = baseline-to-baseline). All own-site *sizes* cross-checked against CSS; all reference sizes derived from cap-height ÷ 0.70–0.73 (grotesque cap ratio), so carry ±8% error bars. Family identity of the reference is UNVERIFIED (Track B failed); nothing below names it.

**Own-screenshot caveat**: the sandbox blocks the Google Fonts CDN, so our own captures render *fallback* faces (generic sans/serif/mono), not Archivo / Source Serif 4 / IBM Plex Mono. Role assignment (which text is mono vs serif vs sans), CSS-driven sizes, line-heights and layout are still valid evidence; letterform quality and exact line-wrap points are not.

---

## 1. REFERENCE FINDINGS

### 1.1 Type sizes — desktop (1440)

| Style | Evidence | Cap / b2b measured | Estimated size / leading |
|---|---|---|---|
| Display H1, large (about, careers, investors, 404) | about_desktop/s00: "mobility." asc+desc band 426..499 = 74px, b2b 79px (line tops 347→426); careers s00 b2b 80; investors s00 b2b 77 | cap ≈ 54–55 (derived) | **72–76px, leading 1.03–1.08** [measured bands, estimated size] |
| Display H1, compact (contact) | contact_desktop/s00: "L" cap band 109..154 = **46px**, b2b 64–66 | cap 46 | **60–66px, leading ~1.0–1.1** [measured] |
| Display H1, home (over photo) | autzu.com_desktop/s00: "T" cap 122..162 = **41px**, line tops 120/180/239 → b2b 59–60 | cap 41 | **56–60px, leading 1.04** [measured] |
| Section H2 | autzu.com_desktop/s02: "S" cap 307..344 = **38px**; s01 "Built for autonomy./Designed for scale." b2b **55px** | cap 38 | **52–55px, leading ~1.04–1.08** [measured] |
| Legal page H1 | privacy_desktop/s00: "Privacy policy." cap+desc band 247..289 = 43 | cap ≈ 30–32 | **42–46px** [estimated] |
| Legal H2 (numbered) | privacy_desktop/s01 crop y≈468 "3. How we use your information" | — | **~26–28px semibold** [observed] |
| Blog/featured card title | blog s00 "What is an autonomous vehicle hub?" | — | **~28–30px semibold** [observed] |
| Feature-card title | autzu.com_desktop/s01: band 247..260 (cap+g desc = 14) | cap ≈ 13 | **~18px semibold** [measured] |
| Legal H3 | privacy s01 "Device & usage data" | — | ~17–18px semibold [observed] |
| Body (hero support, legal body) | about s00 body: "AUTZU" cap band 531..542 = **12px**, b2b **26px** (26/25/26 across 4 lines); contact s00 body identical (b2b 25–26); privacy s01 same rhythm | cap 12 | **16–17px, line-height 26px ⇒ ratio ~1.55–1.6** [measured] |
| Card body / blog meta | autzu.com s01 card body b2b **21px** | — | **~14–15px, lh ~1.45** [measured] |
| Metric numerals (home band) | autzu.com s00: "1.5B+" digit band 836..864 = **29px** | digits ≈ cap | **~40px semibold** [measured] — Part II's "48–72px" estimate is HIGH for this corpus |
| Metric labels (home band) | same crop, band 881..889 = 9 | — | **~12–13px, mixed case** [measured] |
| Eyebrow | autzu.com s02 "GLOBAL PRESENCE": cap band 273..279 = 7 (thresh 200, AA-cut ⇒ lower bound) | cap 7–9 | **10–12px uppercase** [measured band, estimated size] |
| Buttons/pills | about s00: dark pill full height **≈45px**; label ~15–16px medium | — | [measured pill, observed label] — Part II's 52–56px input height not re-verified; pills here are ~44–46px |

### 1.2 Type sizes — mobile (390)

- Display H1: about_mobile/s00 "B" cap band 92..116 = **25px**, b2b **35–36px** ⇒ **~34–36px, leading ~1.0–1.05** [measured]. Confirms the low end of Part II's "36–44" estimate.
- Body does NOT shrink: about_mobile body b2b **25–26px**, cap ~12 ⇒ still **16–17px** [measured].
- Mobile display : body ratio ≈ **35:16.5 ≈ 2.1×** — the hierarchy slope is preserved at 390. Desktop→mobile display ratio ≈ 0.46× (76→35).

### 1.3 Leading, tracking, case

- **Leading**: display and H2 leading measured **1.0–1.08** everywhere sampled (contact 64–66/~63, about 79/~75, careers 80/~75, home 59–60/~57, H2 55/~53, mobile 35/~35). *Tighter* than Part II's 1.05–1.15 claim — correct to **~1.05 ± 0.05**. Body 26/16.5 ≈ **1.55–1.6** [measured], confirming Part II.
- **Tracking**: display slightly negative-to-neutral [observed, crops at 2–4x; not precisely measurable]; body neutral; eyebrows strongly positive — "GLOBAL PRESENCE" = 122px ink width for 15 chars at ~11px ⇒ advance ≈ 0.74em ⇒ **tracking roughly +15–20%** [measured, ±5%]. Part II's "+8–12%" is LOW for this corpus.
- **Case**: headings 100% sentence case (no Title Case heading anywhere in 13 routes) [observed]. Eyebrows 100% uppercase. **Buttons split by component**: pill buttons take Title Case ("Request Briefing", "Send Message", "Download Press Kit", "Become a Partner", "Explore Platform" — 9/13 pills), text arrow-links take sentence case ("Request a briefing →", "Read more →", "Back to home", "Contact us", "View open roles →") [observed, tally across 8 routes].

### 1.4 Terminal-period convention — settled (tally across all 13 heroes + all section headings)

- **Heroes: 13/13 end in a period** (home, about, blog, careers, contact, hubs, investors, partnerships, platform, press, privacy "Privacy policy.", terms "Terms & conditions.", 404 "Looks like this hub isn't on the map yet.") [observed; verified in crops on home, about, contact, hubs, 404, privacy].
- **Sentence-form section headings: ~15/15 with period** ("Built for autonomy. Designed for scale.", "Scalable operations, international presence.", "Why we exist, why now.", "Seven years of compounding.", "Trust by engineering, not by promise.", "Autzu at a glance.", "Recent coverage.", "10 roles open across the team.", etc.) [observed].
- **Label-form headings: 0 periods** — CTA-bar mini-heads "Investor Relations", "Press inquiries" (verified in investors s02 / press s01 crops), legal numbered H2s ("3. How we use your information"), H3s ("Device & usage data"), card titles ("High-Speed Charging"), blog card titles (questions keep "?") [observed].
- **Rule extracted: if a heading parses as a sentence or is styled as a statement, it terminates with a period; pure noun labels never do. Applied with 100% consistency.**
- **Two-tone headings: CONFIRMED ABSENT.** Pixel-sampled "Scalable operations, international presence." (autzu.com s02) and "Built for autonomy. Designed for scale." (s00–s01): single-tone ink throughout, per slice-index. Part II's "two-tone signature" does not exist in this corpus. Eyebrows carry **no marker dot** (verified crop autzu.com s02 at 3x).

### 1.5 Heading hierarchy depth

Visibly distinct text levels on marketing pages: **display H1 (56–76) → section H2 (~53) → card/featured title (18–30) → body (16–17) → meta/caption (13–15) → eyebrow (~11)**. Legal pages insert two more (legal H1 44, legal H2 27, H3 17). Net: **4 heading levels + eyebrow ever visible on one page; ~6 across the site** [observed]. Display size varies by template (76/64/57) — either three tokens or a length-adaptive clamp; unresolvable without CSS [estimated].

### 1.6 Measure (chars/line)

- Hero/support paragraphs: columns 346–500px at 16–17px ⇒ **40–53 chars/line** (contact body ink width 346px, about 353px) [measured].
- Legal body: privacy s01 body ink width **~719px** at 16px ⇒ **95–99 chars/line** (counted: "Device identifiers, IP address, operating system, app version, log files, and approximate location" = 99 chars) [measured]. The reference's legal pages EXCEED the 60–75 guideline in the guide — do not copy this.
- Blog excerpts ~55 chars/line [observed].

### 1.7 Secondary "instrument mono" voice [observed — new finding, not in Part II]

A monospace-flavoured face appears ONLY inside diagram/product surfaces: investors chart annotations ("GROWTH TRAJECTORY · 2017 — 2031E", "YOU ARE HERE" — 4x crop shows uniform advance and slashed/dotted zero), platform dashboard map labels (SF/LA/AUS chips, "500 mi"), and the honesty caption **"Dashboard data shown is for illustrative purposes only."** (platform s00 y≈700). Page-chrome eyebrows and blog meta rows are the same sans tracked out (4x crop of "INFRASTRUCTURE · MAY 8, 2026 · 6 MIN READ": proportional widths). **Principle: mono = instrument annotation + honesty captions, confined to data surfaces; never page chrome.**

### 1.8 Voice (M) — transcriptions with counts

**Headlines (13 heroes, chars incl. period):** "The operating layer for autonomous mobility." 45 · "Building the foundation for autonomous mobility." 49 · "Build the future with us." 25 · "Let's build the future together." 32 · "Hubs built for autonomy." 24 · "Own the backbone of autonomy." 29 · "The connective tissue of the autonomy stack." 45 · "One platform. Every layer." 26 · "Media resources for Autzu." 26 · "Privacy policy." 15 · "Terms & conditions." 19 · "Looks like this hub isn't on the map yet." 41 · blog "…autonomous infrastructure." (partial). **Range 15–49, median ~28. Register: declaratives + soft imperatives ("Own…", "Build…"); zero questions in H1s** (questions appear once in a CTA-bar head: "Ready to put autonomy to work? Let's talk.").

**Eyebrows (18 distinct):** 5–32 chars, median ~13 (THESIS 6 → BUILT FOR OPERATIONAL EXCELLENCE 32). Always structural noun labels; never sentences.

**Support paragraphs:** 84–156 chars, 1–2 sentences (home 120, about 152, contact 143, 404 84, blog excerpt 156). Metric-forward persuasion is delegated to metric bands (1.5B+ / 50M+ / 127K+ / 99.3%) and security-card mini-metrics (<1 min / 99.97% / SOC 2), not prose.

**CTAs:** pills 7–21 chars, 1–3 words, verb-led Title Case; arrow-links sentence case.

**Microcopy:** form reassurance "We respect your privacy. Your information will only be used to respond to your inquiry." (89 chars, lock icon); placeholder "A few sentences on what you're working on..." (conversational); 404 support "The page you're looking for doesn't exist or has moved. Try one of the links below." (84); honesty disclaimers exist but are scattered: italic partnerships note ("Company names shown here are illustrative prospects… confirmed under NDA"), mono dashboard caption, "Last updated: January 2026" on legal, "AUDIT IN PROGRESS" metric labels [observed]. 404 headline stays on-brand metaphor ("this hub isn't on the map yet").

**Part II corrections in F/M scope:** two-tone heading — does not exist (superseded); eyebrow marker dot — does not exist; display leading 1.05–1.15 → measure ~1.0–1.08; eyebrow tracking +8–12% → ~+15–20%; metric numerals 48–72 → ~40 in the home band; metric labels "uppercase" → mixed case in the home band, uppercase only in technical card contexts; "single sans everywhere" → single sans for page text, plus an instrument-mono in diagram surfaces.

---

## 2. OWN-SITE FINDINGS

### 2.1 Three-family system in practice

Declared roles (base.css:27–29): `--font-display` Archivo (variable wdth), `--font-serif` Source Serif 4, `--font-mono` IBM Plex Mono. Source inventory counts 72 mono / 9 display / 5 serif *declarations* — but the body default is the display face at 15.5px (base.css:74–77), so **by rendered area Archivo carries most UI text; the 72 mono declarations are many small components**. From 15 slices read (home L/D, home mobile, economics s00+s04, companies, map, waymo, regulation dark, media, method s01, partnerships s01, overview mobile dark, state-ledger-detail, state-economics-calc, home dark s02):

- **Mono carries**: nav labels, search ("SEARCH 562"), eyebrows/kickers, chips, buttons (COLUMNS / CSV / MORE FILTERS / FULL SCREEN / PNG 1x…), table headers (COMPANY / LAYER / HQ…), numerals and counts ("53 orgs", "~500,000"), axis labels (20B/15B), calculator metric labels ("VEHICLE CAPEX, $"), section numbers (01/02), tags (SPOKEN WITH DIRECTLY), footer meta [observed, home/companies/economics/waymo slices].
- **Display carries**: H1/H2/H3, card titles, standfirsts, UI body text, spec-table content [observed].
- **Serif carries**: long-form article prose, ledger "about" text, QA answers [observed, method s01, regulation dark, waymo detail].
- **Hierarchy legibility**: reads clearly in both themes — heavy sans heads, mono small-caps labels, serif reading text are unambiguous at a glance [observed]. **Mono-dominance is zoned**: instrument pages (companies, economics calculator, map rail) are texturally mono-dominant; narrative pages (home, articles, overview) are sans+serif-dominant. This zoning matches the reference's own instrument-mono principle (§1.7).
- **One role violation**: media cards set human descriptions in mono ("Daniel Abreu Marques, strategy and market intelligence in autonomous trucking" — media_desktop_light s00; media.css:33 `.md-who` mono) — prose content in the data voice [observed].

### 2.2 Measured sizes from own screenshots (cross-checked against CSS)

- Home H1: "A" cap 56px, b2b 80px ⇒ 76px × 1.06 exactly per base.css:106 clamp max [measured, home_desktop_light s00].
- Mobile H1: b2b 27–28px ⇒ 26px floor × 1.06 [measured, home_mobile_light s00]. **Mobile display : standfirst ratio = 26:17 ≈ 1.53×** (standfirst measured b2b 26 = 17×1.55, per --fs-lg:17 override at ≤640, base.css:328) — vs reference 2.1×. Our mobile hierarchy slope is visibly flatter; the 4-line wrapped title reads more like bold body than display [measured + observed].
- Eyebrow: cap ~11px at 12px mono ✓; standfirst 19px × 1.55 = b2b 29–30 ✓ [measured].
- Page-title scale varies by template: 76 (page-title) / 44 (ledger-title, /companies) / 38 (chart-title, /map) / 32 (article-head, operator pages) — /map and /companies are same-rank pages with different H1 sizes [observed + ledger.css:5, map.css:8].

### 2.3 The 23 raw font-size literals + 6 tokens — cluster arithmetic

Literals: 9, 9.5, 10, 10.5, 11, 11.5, 12, 12.5, 13, 13.5, 14, 14.5, 15, 15.5, 16, 16.5, 17, 18, 19, 20, 22, 24, 30. Tokens: micro 11 / xs 12 / sm 13.5 / base 15.5 / md 16 / lg 19 (base.css:39–44).

- **No modular ratio fits**: successive steps run 0.5–1px (9→16.5 is a quasi-continuous ramp); 1.125^n from 9 gives 9/10.1/11.4/12.8/14.4/16.2/18.2 — misses 11, 12, 13.5, 15.5. This is an arithmetic ramp, not a scale. The comment at base.css:34 admits the retrofit.
- **Candidate 9-step ladder that absorbs everything** (46 declarations already sit exactly on token values — see drift): **10 (absorbs 9/9.5/10/10.5 glyph-and-tag sizes) · 11 (micro) · 12 (xs; absorbs 11.5, 12.5) · 13.5 (sm; absorbs 13, 14, 14.5) · 15.5 (base; absorbs 15) · 16 (md; absorbs 16.5) — OR merge base+md, see drift · 17.5 (new step; absorbs 17, 18) · 19 (lg; absorbs 20) · 24 (numeric display; absorbs 22)**.
- **What resists**: monogram-tile letter sizes (30/19/17/16/13/10 at article.css:93,114, media.css:17, ledger.css:145,255, map.css:146,200) are box-proportional, not text — should become a per-component ratio of tile size, not scale steps; caret/dir glyphs at 9–10px are icon-like; `.cc-close` 20px is a glyph button.
- **Serif reading sizes are their own drift**: 19 (.prose) / 17 (hard-part) / 16.5 (qa dd) / 15.5 (.about) — four sizes for one role; two steps (19 primary, 16 embedded) would cover it [article.css:63,239, ledger.css:171, base.css:119].

### 2.4 The 13 letter-spacings

Positive (caps-tracking) tiers: **.14em** (eyebrow base.css:99, alert kicker article.css:61) · **.12em** ×5 (overlines: article.css:83,236, base.css:217,477, home.css:233) · **.1em** ×8 (mono labels: nav base.css:167, ledger.css:15,162,275, map.css:20, home.css:132, article.css:254, base.css:508) · **.08em** ×8 (.btn base.css:227, article.css:132,440, ledger.css:177, map.css:278, media.css:23,29) · **.06em** ×8 (dense mono: article.css:270,322,340,467, ledger.css:296, map.css:169,179,203) · stragglers **.05** (article.css:333), **.04** ×2 (article.css:208, home.css:93), **.02** (ledger.css:316). Negative ramp: **-0.03** (76px H1) · **-0.02** ×3 (38/44 heads) · **-0.015** ×2 (32px article-head, 38px band-title) · **-0.01** ×3 (15–22px bolds). Plus 0 ×5 (deliberate resets).
**Candidate token set (6)**: track-tight-display -0.03 · track-tight-heading -0.02 (absorbs -0.015) · track-tight-subhead -0.01 · track-caps-loose .14 (absorbs .12?) · track-caps .10 · track-caps-dense .06 (absorbs .08? — .08 is the most-shared value with .06 and .1; a 3-tier caps set .06/.10/.14 absorbing .04/.05→.06, .08→.06 or .10, .12→.14 needs one visual decision).

### 2.5 The 13 line-heights

1 ×3 (tiles/buttons) · 1.06 (H1) · 1.1 (H2) · 1.2 (card h2 map.css:149) · 1.3 (pa-tag) · 1.35 ×3 (secnav, cmp subs) · 1.4 (ledger.css:135) · 1.45 ×6 (card descs) · 1.5 ×14 (body default) · 1.55 ×4 (standfirst, about) · 1.6 ×3 (serif embedded) · 1.62 (prose) · 1.8 (d-people ledger.css:165) · **one `line-height: 13px`** (article.css:385, cmark box). **Candidate 7**: 1 / 1.06 / 1.1 / 1.2 / 1.35 (absorbs 1.3, 1.4) / 1.45 / 1.5 (absorbs 1.55?) / 1.62 (absorbs 1.6) — the 1.5-vs-1.55 and 1.45 merges are the only visible decisions; 1.8 should become padding.

### 2.6 The 6 near-duplicate clamp() formulas

| Class | Formula | lh | tracking | wdth | file:line |
|---|---|---|---|---|---|
| h1.page-title | clamp(26px, min(5.5vw, 9vh), 76px) | 1.06 | -0.03 | 118 | base.css:106 |
| .ledger-title | clamp(20px, min(3.4vw, 5.2vh), 44px) | — | -0.02 | 116 | ledger.css:5 |
| .chart-title | clamp(20px, min(3vw, 4.6vh), 38px) | — | -0.02 | 116 | map.css:8 |
| h2.section-head | clamp(20px, min(3vw, 4.6vh), 38px) | 1.1 | -0.02 | 112 | base.css:111 |
| .band-title | clamp(20px, min(3.6vw, 5.5vh), 38px) | — | -0.015 | — | home.css:236 |
| .article-head h1 | clamp(18.5px, min(2.6vw, 4vh), 32px) | — | -0.015 | 112 | article.css:15 |

(.prose h3 clamp(18,…,22) base.css:124 and .stat .num clamp(26,…,40) base.css:285 are distinct roles.) chart-title duplicates section-head's formula exactly while serving as a *page H1*; ledger-title and band-title are one-off mutations. **Consolidation: three named fluid levels — display-H1 (76), utility-H1 (44 or 38, one value), section-H2 (38) — article-head stays as a fourth (article-H1 32) if operator pages should keep a quieter register; the vh-guard middle term (`min(Xvw, Yvh)`) is a genuinely good discipline the reference cannot be shown to have, keep it.**

### 2.7 Eyebrow / kicker grammar

Ours: `.eyebrow` = mono 12px / 600 / +.14em / uppercase / muted, **preceded by a yellow square tick** (base.css:97–101; `.tick` colored --yellow). Variants in the wild: article kicker 11/.12em (article.css:82), rail/ledger overlines 10.5/.1em (ledger.css:14, map.css:19), home loop labels 11/.1em (home.css:132), footer overline 12/.12em (base.css:216), alert kicker 11/.14em alert-colored (article.css:61) — **5+ near-duplicate eyebrow-family styles**. Reference: one eyebrow style, plain, no marker. Our yellow tick is our "one yellow per viewport" signature and doubles as the road-marking motif — an identity asset, not drift; the five size/tracking variants ARE drift.

### 2.8 Voice (M) — own transcriptions

**Page H1s (12, chars):** "A driverless ride is a loop, and the loop is an industry." 58 · "$41.8B went in. Will any of it pay?" 35 · "Who actually works with whom" 28 · "Who is allowed to drive, and who decides" 40 · "562 organisations. One poster." 30 · "Every organisation, every field." 32 · "The industry, in plain terms" 28 · "How this is built, and what it is missing" 41 · "Who to read, listen to, and meet" 32 · "The incident and recall record" 30 · "Consumer self-driving went backwards while robotaxis scaled" 59 · "Autonomy shipped years ago, in other operating domains." 55. **Range 28–59, median ~33.** Register: declaratives + one question + metric-led openers; zero marketing imperatives. **Terminal punctuation: 5/12 punctuated, 7/12 bare — including full sentences left bare ("Consumer self-driving went backwards while robotaxis scaled"). Inconsistent where the reference is 100% consistent.** 9/12 titles use hard `<br>` breaks (deliberate rhetorical breaks, but unregulated).
**Section H2s: 0/49 take terminal periods** (consistent); narrative-sentence heads appear here too ("The most consequential player operates no vehicles").
**Standfirsts:** 210–340 chars, 2–4 sentences, all terminal-punctuated, all first-person-capable ("I have mapped all of them.", "…just what I would hand you myself."). Roughly 2× the reference's support-para budget — appropriate for a publication vs a marketing site; needs a stated budget, not shrinking.
**Eyebrows:** 5–19 chars except one 42-char outlier ("ONE RIDE, FOUR STAGES, ENDLESSLY REPEATING") which wraps to two lines at 390 [observed home_mobile_light s00].
**Buttons:** mono uppercase tool-verbs 3–17 chars (PLAY, CSV, MORE FILTERS, CLEAR ALL FILTERS, EMAIL ME) — a coherent instrument register, deliberately unlike the reference's Title Case marketing pills.
**Honesty/caveat voice (register check across pages):** map standfirst "The remainder are gaps in coverage, not evidence of absence."; partnerships "One honest limit: the data records who works with whom, not since when."; calculator callout "Read this section as a modelling tool, not as reported results… They are starting points to argue with. Change them."; method "A map that resolves conflicts invisibly is asserting an authority it has not earned." and "A fact with no date does not go on the site."; waymo stat-card source lines ("sources range 400k to 500k; TechCrunch reported 500k across 10 cities in March 2026"); spec-row label "Caveat"; provenance abbr marks D/R/E/C with first-person titles ("Derived or modelled by me"); "blank is honest" (method fact card). **Register is consistent page-to-page: first person, dated facts, falsifiable framing, caveats adjacent to the number they qualify.** [observed across 8 pages]
**Empty/loading states:** ledger "Nothing matches. The <strong>X</strong> filter is doing the excluding." + CLEAR ALL FILTERS (ledger.js:193) — diagnostic, names the culprit; search "No matches in 562 organisations" (core.js:629); loaders "Building the density grid…", "Counting…", "Loading the relationship data…" (partnerships/economics captions) — consistent present-progressive family.
**Measure:** --measure 68ch on 19px serif ≈ 65–72 rendered chars (production Archivo/SS4 metrics), .band-desc 60ch — inside the 60–75 guideline; our discipline is stronger than the reference's own 95–99-char legal columns.

---

## 3. PER-AXIS VERDICTS

**Axis F1 — Family strategy (their 1 sans vs our 3).** Verdict: **KEEP**. Rationale: mandatory divergence; internal consistency holds under inspection — 15 slices show a clean three-voice role split (display = argument, mono = instrument, serif = reading) that never contradicts itself except media.css:33 setting human bios in mono; and the reference itself runs a second instrument-mono inside diagrams (§1.7), which *validates* our mono-as-instrument role rather than contradicting it. Codify the role boundary: mono never carries multi-sentence human prose. Divergence map: "family: ref uses one sans + instrument-mono in diagrams; we use display/mono/serif with mono as the instrument voice site-wide, because a data publication's chrome IS an instrument."

**Axis F2 — Size scale.** Verdict: **ADOPT-PRINCIPLE**. Rationale: reference exposes ~7 visible text sizes per page; we ship 23 raw literals + 6 tokens with 0.5px adjacencies (13 vs 13.5 vs 14 vs 14.5 all live — §2.3), and 46 declarations already sit on token values but bypass the tokens. Principle (abstract): every size is a named step on one ladder; adjacent steps differ by a perceptible increment (≥1.5px below 20px); component-proportional sizes (monogram tiles) are ratios, not steps. Divergence map: "scale: ref shows a short ladder; we consolidate 23 literals into 9 named steps, because 0.5px neighbours are unmaintainable and invisible."

**Axis F3 — Heading hierarchy + clamps.** Verdict: **HYBRID**. Keep: our fluid clamp system with the `min(vw, vh)` landscape guard and clamp-floor-as-mobile-step reasoning (base.css:102–104) — the reference cannot demonstrate anything equivalent (Track B failed; its three static widths tell us nothing about fluidity). Adopt-principle: one H1 register per page rank — the reference holds H1 > H2 with a stable ~1.4 ratio per template, while our same-rank pages diverge (map 38 vs companies 44 vs home 76; chart-title literally duplicates section-head's formula so /map's H1 = every page's H2 — §2.6). Divergence map: "headings: ref has fixed per-template sizes; we keep fluid clamps but reduce 6 formulas to 3 named levels + article variant, because same-rank pages currently render different-rank titles."

**Axis F4 — Mobile type slope.** Verdict: **ADOPT-PRINCIPLE**. Rationale: measured — reference mobile display:body = 35:16.5 ≈ 2.1× (§1.2); ours = 26:17 ≈ 1.53× (§2.2), and our 4-line wrapped mobile H1 reads as bold body. Principle: display must keep ≥~2× body dominance at the smallest viewport; raise the clamp floor (and/or shorten titles at 390) rather than copying any of their values. Divergence map: "mobile display: ref keeps ~2.1× body at 390; we raise our 26px floor toward ~2× of 17px body, because the measured 1.53× flattens hierarchy exactly where titles wrap most."

**Axis F5 — Eyebrow grammar.** Verdict: **HYBRID**. Keep: mono + yellow tick eyebrow as signature (reference's is plain gray; the marker is our one-yellow-per-viewport device and no consistency violation attaches to it). Adopt-principle: one eyebrow style + one quieter overline style, and a length ceiling — reference eyebrows run 5–32 chars on one line with a single style; we run 5 near-duplicate styles (12/.14, 11/.12, 11/.1, 10.5/.1, 12/.12 — §2.7) and one 42-char eyebrow that wraps at 390 [observed]. Divergence map: "eyebrow: ref = plain gray label ≤32 chars; we keep tick + mono but collapse to 2 styles and cap at ~28 chars, because five variants of one role is drift, not voice."

**Axis F6 — Case + tracking conventions.** Verdict: **KEEP** (with consolidation). Rationale: our conventions are internally consistent where they matter — headings 100% sentence case (matches ref principle), uppercase confined to mono chrome, tracking rises as size falls (matches the universal small-caps discipline and ref's ~+15–20% eyebrow tracking); the violation is proliferation, not direction: 13 tracking values where 6 tokens suffice (§2.4), and .04/.05/.02 stragglers sit off every tier. Divergence map: "case/tracking: ref tracks caps ~+15–20% in one style; we keep uppercase-mono chrome but reduce 13 values to ~6 tokens, because three of the values are used once each."

**Axis F7 — Measure / line-length.** Verdict: **KEEP**. Rationale: measured — our 68ch token ≈ 65–72 chars and 60ch band-desc sit inside the 60–75 guideline on every long-form surface; the reference's own legal pages run 95–99 chars/line (§1.6), a defect we must not import. Codify: tokenized measure on every reading column including tables' prose cells. Divergence map: "measure: ref lets legal run ~99ch; we hold 60–75ch everywhere, because that is the only defensible reading-width band and we already token it."

**Axis M1 — Terminal punctuation + headline register.** Verdict: **ADOPT-PRINCIPLE**. Rationale: reference applies one rule with 100% consistency (sentence ⇒ period, label ⇒ bare; 13/13 heroes, ~15/15 sentence H2s, 0 labels — §1.4); we are 5/12 vs 7/12 on H1s with bare full sentences alongside punctuated fragments (§2.8) — a pure consistency violation. Adopt the *rule*, not their copy: punctuate sentence-form H1s ("Consumer self-driving went backwards while robotaxis scaled." gains a period; "The incident and recall record" stays bare), keep questions, keep our declarative/metric-led register and the first person. Divergence map: "headline punctuation: ref ends every sentence-form heading with a period; we adopt the same rule over our own titles, because 5/12-vs-7/12 is indefensible either way."

**Axis M2 — Caveat / provenance voice.** Verdict: **KEEP** (codify as first-class). Rationale: the reference gestures at honesty in scattered microcopy (illustrative-data captions, NDA disclaimer, AUDIT IN PROGRESS) while we implement it as system grammar — D/R/E/C marks with first-person definitions, "blank is honest" cells, dated facts ("A fact with no date does not go on the site"), diagnostic empty states that name the blocking filter, stat-card source lines — and the register held consistent across all 8 pages sampled (§2.8). Also note the convergent pattern worth codifying: both sites put honesty captions in the mono voice attached to the instrument. Divergence map: "honesty: ref does disclaimers as legal microcopy; we do provenance as data grammar (marks, dated facts, named-culprit empty states), because the site's thesis is auditability."

**Axis M3 — Copy budgets (headline/eyebrow/standfirst/CTA lengths).** Verdict: **KEEP** (write the budgets down). Rationale: measured distributions are coherent and deliberately different from the reference's marketing budgets — H1 28–59 chars (ref 15–49), standfirsts 210–340 (ref support 84–156), CTAs 3–17 mono verbs (ref 7–21 Title Case pills); no internal contradiction found except the one 42-char eyebrow (Axis F5). Codify as thresholds: H1 ≤ 60, eyebrow ≤ 28, standfirst 180–340, button ≤ 18. Divergence map: "budgets: ref caps support copy ~150 chars; we allow 2× because standfirsts are arguments not taglines — but we cap them too."

---

## 4. DRIFT LIST

**Stage 1 — consolidate at identical value (no visual decision):**

1. 46 font-size literals that equal existing tokens → substitute var(): 11px ×17 (article.css:42,60,82,167,235,270,298,322,370,377,440; map.css:206,293; home.css:132; base.css:166-ish etc.) → --fs-micro; 12px ×19 (base.css:98,226,449; article.css:131,179,207,232,242,252,294,309,354,379; ledger.css:25; map.css:25,152,179,203,277) → --fs-xs; 13.5px ×10 (article.css:98,116,136,344,433; ledger.css:165,167,174,181; base.css:455) → --fs-sm; 15.5px ×1 (ledger.css:171) → --fs-base; 16px ×2 and 19px ×1 are monogram-box sizes — exclude (component-scoped). (Counted via grep; monogram exclusions listed §2.3.)
2. map.css:8 `.chart-title` formula is byte-identical to base.css:111 `.section-head` clamp → derive one shared fluid-level custom property; keep the two class names for now (rank fix is stage 2, item 18).
3. article.css:385 `line-height: 13px` → height-lock the .cmark box with height/flex, set line-height 1 like the other ×3 lh:1 sites.
4. Prose line-heights 1.6 ×3 (article.css:63,239; qa) vs 1.62 ×1 (base.css:119) → one --lh-prose token (values differ by 0.02 = sub-pixel at 19px; no visible change).
5. Tokenize the exact-duplicate letter-spacings as-is: .1em ×8 → --track-caps; .08em ×8 → --track-caps-tight?; .06em ×8; .12em ×5; .14em ×2+base; -0.02 ×3; -0.01 ×3 (tier *merging* is stage 2, items 10–12; tokenizing identical values is mechanical).
6. Tokenize line-height duplicates at identical values: 1.45 ×6, 1.35 ×3, 1.5 ×14 (body default — components restating 1.5 drop the declaration).
7. Eyebrow-family: home.css:132 (11/.1em) and ledger.css:14 + map.css:19 (10.5/.1em) are the same overline role at two sizes; ledger/map pair is already identical → one .overline class now (size decision vs 11 is stage 2, item 13).
8. article.css:61 alert kicker duplicates .eyebrow geometry (11 vs 12px, same .14em, alert color) → restyle as `.eyebrow` + color modifier (keeps identical rendered intent; it already reads as an eyebrow).
9. base.css:39–44 token block: document each token's role name (micro=fine-print, xs=chrome, sm=dense-body…) — currently bare numbers; zero-render-change documentation fix.

**Stage 2 — value changes / decisions needed:**

10. --fs-base 15.5 vs --fs-md 16: two tokens 0.5px apart (base.css:42–43) — merge to one body size; decide 15.5 or 16.
11. Near-value literal merges: 12.5 ×9 vs 13 ×7 → one step; 14/14.5 → 14; 16.5 (article.css:239) /17 ×5 → 17; 9/9.5/10/10.5 → two micro steps; 20/22/24 numeric-display cluster (base.css:266, article.css:40, ledger.css:170, map.css:150) → one or two tokens.
12. Serif reading sizes 19/17/16.5/15.5 (base.css:119; article.css:63,239; ledger.css:171) → two steps (primary/embedded).
13. Tracking tier mergers: .04/.05/.02 stragglers (article.css:208,333; home.css:93; ledger.css:316) → nearest tier; decide whether .08 folds into .06 or .10; whether .12 folds into .14. Target 3 caps tiers + 3 negative tiers (§2.4).
14. -0.015em ×2 (article.css:16, home.css:236) → -0.02 (aligns article-head/band-title with the heading tier).
15. Line-height decisions: 1.55 ×4 → 1.5 or keep as standfirst-only token; 1.4 (ledger.css:135) → 1.45; 1.3 (ledger.css:334) → 1.35; 1.8 (ledger.css:165) → padding-driven spacing.
16. wdth axis values 118/116/112 across 6 declarations (base.css:107,112; ledger.css:6; map.css:9; article.css:16 …) → two values (display 118 / rest 112); 116 is used only by the two utility titles.
17. Card-title style split: 17px/700 (base.css:450 ch-name), 17px/800 (map.css:149), 18px/800 (article.css:115), 20px/800 (ledger.css:170, article.css:251) → one card-title token (probably 17–18/800) + one detail-title (20).
18. Same-rank H1 mismatch: /map 38px (chart-title) vs /companies 44px (ledger-title) vs narrative 76px → define utility-H1 at ONE value (38 or 44) and rank /map's title as an H1, not an H2 clone; decide whether article-head 32 stays a distinct fourth level.
19. band-title (home.css:236) middle term 3.6vw/5.5vh unique → align to section-head's 3vw/4.6vh unless the hero band needs the extra growth — visual check required.
20. Mobile display floor: raise h1.page-title clamp floor from 26px toward ~2× mobile body (≈32–34px) and/or add a shorter mobile title convention; re-check 4-line wraps at 390 (Axis F4).
21. hero-btn 15px (home.css:186) breaks the button scale (12px mono system) → decide a btn-large token or drop to 12/13.
22. H1 terminal-punctuation rule (Axis M1): content edit across 12 H1s — punctuate sentence-form titles (owning-one, and decide for "Who…" headlinese pair), keep labels bare; write the rule into the language doc.
23. Eyebrow length cap: rewrite home's 42-char eyebrow ≤ ~28 chars (wraps at 390).
24. media.css:33 `.md-who` mono for human bios → move to display face or shorten to name-only mono meta (role-boundary fix, Axis F1).
25. Nav dropdown sub-links use display face 12.5px sentence case (base.css:565 block) inside an otherwise all-mono nav — decide if the two-voice nav is intentional (it aids scanning) and codify, or unify.
26. `<br>` in 9/12 H1s: keep as deliberate rhetorical breaks but add the rule "breaks mark clause boundaries, never mimic a layout" + require balanced fallback (text-wrap: balance already on page-title) — decide per-title at mobile where breaks stack 4 lines.

Counts: **stage 1 = 9 grouped items (~85 declarations touched); stage 2 = 17 decision items.**
