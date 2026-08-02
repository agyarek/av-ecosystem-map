# Design QA checklist

Every item is binary: pass or fail. A fail blocks merge unless it carries a dated
decision-record exemption. Items are weighted toward defects this codebase has
actually shipped (Phase 3 audit).

## Per-review protocol

**Routes** — minimum sweep: every route the change touches, plus home, /map,
/companies, /overview/ (article class), /companies/waymo/ (record class), and
/404.html. Full release sweep: all ten templates in PAGE_PATTERNS §3.

**Viewports** — 390, 768, 1440, and ≥1800 (wide). Additionally check both sides of
any named breakpoint the change crosses: 640 / 680 / 760 / 860 / 960 / 1800.

**Themes** — every visual and contrast item in BOTH light and dark. Motion items
with `prefers-reduced-motion` both off and on.

**Tools** — run before sign-off:
```
python3 tools/build-tokens.py        # must leave design/tokens.css diff-clean
python3 tools/check-palette-sync.py  # must exit clean
```

**Grep gates** — all must return zero matches in `assets/css/` outside the
generated token block:
```
grep -rn '#[0-9a-fA-F]\{3,8\}' assets/css/            # raw hex
grep -rn 'font-size:[ ]*[0-9]' assets/css/            # px font sizes
grep -rn 'box-shadow:[ ]*0' assets/css/               # literal shadows
grep -rn 'clamp(' assets/css/                         # new clamp formulas
grep -rn '@media' assets/css/ | grep -vE '640|680|760|860|960|1800'
```

---

## 1. Hierarchy

- [ ] Exactly one H1 per page.
- [ ] H1 register matches the page class in PAGE_PATTERNS §3 (display / utility /
      article); /map and /companies both render utility rank.
- [ ] No page sets its H1 with the section-H2 formula.
- [ ] All section headings use `var(--head-section)`; no new `clamp()` formulas
      exist outside the `--head-*` tokens (grep gate).
- [ ] Page-head order is eyebrow → H1 → standfirst on every hero.
- [ ] Same-rank pages render same-size titles.

## 2. Typography

- [ ] Every font-size is `var(--fs-*)` or `var(--head-*)` (grep gate); monogram
      letters are component-proportional ratios, not new steps.
- [ ] Every letter-spacing is a `var(--track-*)` token; every line-height a
      `var(--lh-*)` token.
- [ ] Mono never sets multi-sentence human prose; serif never sets chrome.
- [ ] A measure token (`--measure` / `--measure-compact` / `--measure-wide`)
      caps every reading column, including prose cells inside tables.
- [ ] Sentence-form headings end with a period; noun-label headings carry none.
- [ ] Eyebrows are ≤28 characters and render on a single line at 390.
- [ ] Uppercase appears only in mono chrome; headings are sentence case.

## 3. Spacing

- [ ] All gap/margin/padding values resolve to `--sp-*`, `--inset-*`, or
      `--rhythm-*` tokens; no off-ladder px literals.
- [ ] No vh-based rhythm exists outside the `--rhythm-*` tokens.
- [ ] Sections separate with `var(--rhythm-section)`; page tail uses
      `var(--rhythm-tail)`; no parallel hard-px rhythm system.
- [ ] Control/card insets use the named inset tokens (chip/control/field/card/panel).

## 4. Alignment

- [ ] All content aligns to the `var(--col)` container at every checked viewport.
- [ ] Wide content (tables, matrices, posters) scrolls inside its own container:
      `document.scrollWidth === viewport width` at 390, 768, and 1440.
- [ ] No floating chrome overlaps the content it indexes (secnav, jump pills).
- [ ] The article TOC occupies the reserved right field at ≥960, in-grid.

## 5. Color + contrast

- [ ] No raw hex/rgb/oklch exists outside the token block (grep gate).
- [ ] No `box-shadow` exists outside `--shadow-float` / `--shadow-raised`
      (grep gate); in-flow content is flat.
- [ ] Every meaning-bearing mark measures ≥3:1 against its ground in BOTH themes
      (focus ring, selection/partner rings, gold dots, status dots, ticks).
- [ ] Gold dots used as marks carry the ink outline in light theme.
- [ ] All text measures ≥4.5:1 in both themes, including `--med-sub` on `--med-bg`.
- [ ] Accent colors appear only as marks with an adjacent word — never as fills.
- [ ] No state is communicated by color alone (strike, tag, glyph, or containment
      always present as redundancy).

## 6. Components

- [ ] Shape encodes role: action buttons are rect (`--r-chip`); pills are tags and
      filters only. Zero pill action buttons.
- [ ] One field skin, two sizes; no third input style.
- [ ] One record, one anatomy: the company card and the ledger detail row render
      identical anatomy per COMPONENT_SPECIFICATIONS.
- [ ] Pure-data grids use shared hairlines (E7), not gapped bordered cards.
- [ ] Cards are objects; rows are lists; no data table rebuilt as a card pile.
- [ ] Icons and glyph marks use one stroke weight throughout.
- [ ] Every borrowed image and logo is credit-badged.
- [ ] Every logo sits over a monogram tile in a fixed box (never a blank square).
- [ ] Every metric carries a source line; derived numbers carry a provenance mark
      (D/R/E/C); blank cells state why they are blank.

## 7. Responsiveness

- [ ] Media queries exist only at the named breakpoint values 640 / 680 / 760 /
      860 / 960 / 1800 (grep gate).
- [ ] JS breakpoint constants read the same values as CSS (`AV.bp`); no
      off-by-one pairs (759/760, 859/860).
- [ ] Mobile page height ≤ ~2.2× desktop, except the two documented exceptions
      (atlas poster, ledger conversion) with their mitigations intact.
- [ ] All content present on mobile (stacked, not hidden); display H1 keeps ≥ ~2×
      body dominance at 390.
- [ ] Touch targets ≥24px, and chrome controls sit on the one documented floor —
      not three different sizes.

## 8. Interaction + motion

- [ ] Every transition/animation duration is a `var(--dur-*)` token; easings are
      `var(--ease-*)` in CSS and the shared `AV.ease` in JS. No literal ms values.
- [ ] Reduced-motion covers everything: the CSS kill, ALL hover lifts (door,
      op-card, md-tile alike), and every JS smooth-scroll
      (`behavior: reducedMotion ? 'auto' : 'smooth'`).
- [ ] Under reduced motion every control still functions (loop play/step leaves an
      active card; flyTo becomes a jump cut).
- [ ] Nothing moves on a timer without a visible pause control.
- [ ] Hover reveals or shifts — it never accelerates, autoplays, or navigates.
- [ ] Same-role transitions share one duration (all carets, all lifts).

## 9. Accessibility

- [ ] Focus ring visible on every interactive element, ≥3:1 in both themes, and
      not occluded by adjacent chrome (nav underline collision).
- [ ] Tablists implement APG keys: arrow keys, roving tabindex, `aria-controls`.
- [ ] Search is wired as a combobox (`aria-expanded`, `aria-activedescendant`).
- [ ] Tooltips are announced (`aria-describedby`) and dismiss on Esc.
- [ ] Every `aria-expanded` pairs with `aria-controls` to the element it opens.
- [ ] Filter-to-zero and other empty results are announced through a live region.
- [ ] Skip link, landmarks, `aria-current`, and live regions intact on new pages.
- [ ] Data instruments offer a browse-mode reading order or explicitly point to
      one (poster → /companies).

## 10. Content / voice

- [ ] H1 ≤60 chars; standfirst 180–340 chars; buttons ≤18 chars mono uppercase.
- [ ] Sentence-form headings take the terminal period (S2-18) — checked on every
      new or edited heading.
- [ ] Empty states name the blocking filter and offer the clearing action.
- [ ] Loading copy uses the present-progressive family ("Drawing…", "Counting…").
- [ ] Honesty captions sit in mono, adjacent to the number they qualify.
- [ ] Facts are dated; first-person register; no marketing imperatives.

## 11. Performance

- [ ] No surface renders blank while loading: monogram tiles for images, a status
      line (live region) for instruments before boot.
- [ ] `<noscript>` notice present on every data surface (/map, /companies, and any
      new instrument).
- [ ] Footers exist as static markup without JS.
- [ ] No data fetched for unopened features (compare picker lazy-loads); the lazy
      pattern of the poster is the default for heavy datasets.
- [ ] No guaranteed-404 fetches: every fetched path exists in the repo
      (`data/logo-manifest.json` ships).
- [ ] Images and logos load into fixed boxes with opacity-only fades — zero CLS.
- [ ] The route's first-load gzip total does not exceed its template family's
      current ceiling without a decision-record entry.

## 12. Consistency

- [ ] Any new or changed token carries a dated entry in the design-tokens
      changelog.
- [ ] `tools/build-tokens.py` regenerates `design/tokens.css` diff-clean;
      `tools/check-palette-sync.py` passes.
- [ ] Every section composes from the named archetype set (PAGE_PATTERNS §1); no
      unnamed one-off layouts.
- [ ] The closing sequence (content → chapters block → bio footer) is present;
      only the 404 uses its sanctioned variation.
- [ ] sitemap.xml regenerated when routes change; README counts match the
      filesystem.
- [ ] No legacy alias var is removed while any stylesheet still references it.
- [ ] When a literal is replaced by a token, the token's value equals the
      replaced literal exactly — verified against the source, not assumed.
      (Added 2026-08-02: the Stage-1 gate caught `--head-utility` shipping a
      22px floor against the 20px literal it replaced.)
- [ ] Before substituting any literal with a token, confirm the token is not
      viewport-conditional (e.g. `--fs-lg` is 19px desktop / 17px ≤ phone);
      component-ratio values (monogram glyphs) never take text-scale tokens.
      (Added 2026-08-02: the gate caught `.md-logo` monograms shrinking on
      mobile after a 19px → `--fs-lg` substitution.)
