# Autonomous Vehicle Ecosystem Map

**Live: [agyarek.github.io/av-ecosystem-map](https://agyarek.github.io/av-ecosystem-map/)**

An interactive field atlas of the autonomous vehicle industry: 562 organisations across eleven layers, the partnerships between them, the money behind them, the regulators who permit them, and the adjacent industries where autonomy shipped first.

Compiled and maintained by Kofi Agyare-Kwabi, ex-Uber Country Manager, GTM & Partnerships, Wharton MBA.

## What is here

| Route | What it is |
|---|---|
| `/` | The loop, a tilted preview of the wall chart, and the six chapters |
| `/overview/` | The industry in plain terms: what drives the car, human vs autonomous rideshare |
| `/media/` | Publications, podcasts and events covering autonomy |
| `/map/` | The wall chart: all 562 on one plate with an octagonal centre; zoom, filter, full screen, export, print |
| `/companies/` | The ledger: every field, sortable, filterable, URL-shareable, CSV/JSON export |
| `/companies/passenger-autonomy/` + 10 pages | The operators a passenger can actually meet, in depth (under `/companies/`) |
| `/partnerships/` | 151 mapped relationships organised by function; the demand-layer story |
| `/economics/#funding` | $41.8B of $200M+ events with the dataset's own known gaps published |
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
    ├── build-poster-layout.py  freezes wall-chart geometry: an octagon of ten
    │                           operators, the ten remaining layers tiling the
    │                           frame around it (562/562 placed, verified)
    ├── build-indexes.py        partner index, derived counts, search index
    ├── fetch-logos.py          OPTIONAL logo upgrade: fetches, trims and commits
    │                           real marks. Logos already load at runtime, measured
    │                           before display so a low-resolution icon is passed
    │                           over; this is for print/export quality and offline
    │                           resilience, not a prerequisite
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

## Two optional keys

Both are off by default and the site works without either.

| Where | What it buys |
|---|---|
| `LOGO_DEV_TOKEN` in `assets/js/core.js` | a real logo CDN in front of the keyless chain |
| `STOCK_ENDPOINT` in `assets/js/core.js` | live share prices on listed companies; needs a provider that sends CORS headers |

## Corrections

A company that should be listed, a partnership not yet mapped, a detail that is wrong?
Email [agyarek+avecosystemmap@gmail.com](mailto:agyarek+avecosystemmap@gmail.com).
Coverage gaps are published on [`/method/`](https://agyarek.github.io/av-ecosystem-map/method/) rather than hidden.

Third-party names and logos are reproduced nominatively to identify the organisations
discussed; all trademarks remain the property of their owners and no endorsement is
implied. Takedown contact: the address above.

## License

MIT for the code — see [LICENSE](LICENSE). Company data compiled from public sources.
