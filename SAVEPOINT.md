# Savepoint: objective fixes only

This branch (`savepoint/objective-fixes-only`) is a prepared fallback. It is the
site exactly as it was before the 2026-08 design-language review (`adc8840`),
plus ONLY the objective fixes from that review, re-ported minimally — none of
the design system rides along.

## What it contains

- **WCAG contrast repairs**: `--cyan-text` (#007A8A light / #22C4D6 dark) for
  all functional cyan (link and hover text, focus ring, field-focus borders,
  selection/keyboard/partner strokes, live ring, accent-color) — bright cyan
  measured 2.84:1 on light paper; `--med-sub` #63665C (was 4.39:1 on the tint
  surface); 1px ink outline on the poster's gold spoken-with dots (1.74:1
  sole-carrier mark).
- **Horizontal-overflow fixes**: `.ch-controls` wraps instead of using
  max-content grid tracks (/economics/ measured 1489px wide in a 1440
  viewport); `.visually-hidden` pinned left/top.
- **Accessibility wirings**: regulation tabs keyboard contract, search
  combobox ARIA, formula-tooltip announcement + Esc dismiss, live empty-state
  announcement, row `aria-controls`, chart-pin status role, reduced-motion
  gates on JS smooth-scrolls and all hover lifts.
- **Designed 404 page**, **generated sitemap** (`tools/build-sitemap.py`; the
  old hand-listed file canonicalized dead URLs), README operator-count fix,
  `data/logo-manifest.json` (kills a guaranteed 404 on every /map/ load),
  poster boot status line, noscript notices on the four instrument pages.

## What it deliberately excludes

The design-tokens system and generated block, all Stage-1/Stage-2
consolidation (type/spacing/radius/shadow/motion ladders, breakpoint
consolidation), the `design/` documentation package, the mobile display-floor
change, the heading-rank fix, and the copy edits.

## To restore the site to this savepoint

```bash
git fetch origin
git checkout main
git reset --hard origin/savepoint/objective-fixes-only
git push --force-with-lease origin main
```

Check `git log origin/main` first: if anything unrelated landed on main after
the review merge, use `git revert` on the review's merge commit instead, then
cherry-pick from this branch.

Verified 2026-08-02: /economics/ document width equals the viewport at
390/768/1440; regulation tabs respond to arrow keys; focus ring computes to
#007A8A; home and directory render correctly in both themes.
