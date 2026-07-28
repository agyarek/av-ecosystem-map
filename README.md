# Autonomous Vehicle Ecosystem Map

**Live: [agyarek.github.io/av-ecosystem-map](https://agyarek.github.io/av-ecosystem-map/)**

An interactive field atlas of the autonomous vehicle industry: 561 organisations across eleven layers, the partnerships between them, the money behind them, the regulators who permit them, and the adjacent industries where autonomy shipped first.

Compiled and maintained by Kofi Agyare-Kwabi, ex-Uber Country Manager, GTM & Partnerships, Wharton MBA.

## What is here

| Route | What it is |
|---|---|
| `/` | The loop: how a driverless ride works, and the waterline beneath it |
| `/map/` | The wall chart: all 561 on one poster, a hexagonal rosette; zoom, filter, full screen, export, print |
| `/companies/` | The ledger: every field, sortable, filterable, URL-shareable, CSV/JSON export |
| `/operators/` + 10 pages | The ten operators a passenger can actually meet, in depth |
| `/partnerships/` | 148 mapped relationships organised by function; the demand-layer story |
| `/funding/` | $41.8B of $200M+ events with the dataset's own known gaps published |
| `/economics/` `/regulation/` `/safety/` `/owning-one/` `/beyond-roads/` | The deep dives |
| `/method/` | Sources, taxonomy, coverage gaps, corrections |

## Architecture

True multi-page static HTML. No framework, no bundler, no npm. Python scripts freeze
everything derivable into `data/` at build time; the browser renders and never recomputes.

```
├── index.html, map/, companies/, operators/…       hand-written pages
├── assets/css/   base.css + one stylesheet per surface
├── assets/js/    core.js + one script per surface
├── assets/cards/ social cards, generated from the poster
├── data/         source of truth + generated indexes (never edit generated files by hand)
└── tools/
    ├── validate-data.py        invariants; run before every commit, fail on error
    ├── build-poster-layout.py  freezes wall-chart geometry: a hexagon of ten
    │                           operators with the ten remaining layers docked
    │                           flush on its six borders (561/561 placed, verified)
    ├── build-indexes.py        partner index, derived counts, search index
    ├── fetch-logos.py          OPTIONAL logo upgrade: fetches, trims and commits
    │                           real marks. Logos already load at runtime from a
    │                           favicon service, so this is for print/export
    │                           quality and offline resilience, not a prerequisite
    ├── build-social-cards.py   1200×630 OG cards rendered from the poster
    ├── render-poster.py        proofing render → poster-reference.svg
    └── make-csv.py             flat CSV export
```

## Updating the data

```bash
# edit data/av-companies.json, av-enrichment.json or av-funding-timeline.json, then:
python3 tools/validate-data.py        # must pass
python3 tools/build-poster-layout.py  # regenerate frozen geometry
python3 tools/build-indexes.py        # regenerate indexes
python3 tools/make-csv.py             # regenerate the flat export
python3 tools/render-poster.py        # optional: refresh the reference SVG
```

Push to `main`; GitHub Pages serves the branch root directly.

## Corrections

A company that should be listed, a partnership not yet mapped, a detail that is wrong?
Email [agyarek+avecosystemmap@gmail.com](mailto:agyarek+avecosystemmap@gmail.com).
Coverage gaps are published on [`/method/`](https://agyarek.github.io/av-ecosystem-map/method/) rather than hidden.

Third-party names and logos are reproduced nominatively to identify the organisations
discussed; all trademarks remain the property of their owners and no endorsement is
implied. Takedown contact: the address above.

## License

MIT for the code — see [LICENSE](LICENSE). Company data compiled from public sources.
