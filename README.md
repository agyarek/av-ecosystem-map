# Autonomous Vehicle Ecosystem Map

**Live map: [agyarek.github.io/av-ecosystem-map](https://agyarek.github.io/av-ecosystem-map/)**

An interactive map of the autonomous-vehicle industry — 560 companies, 148 mapped partnerships, 11 layers. Select any company to reveal its partners and trace its route to a passenger-facing robotaxi operator.

Compiled and maintained by Kofi Agyare-Kwabi — ex-Uber Country Manager · GTM & Partnerships · Wharton MBA.

## Structure

The site is fully static — a single `index.html` that loads three JSON data files. No build step.

```
av-ecosystem-map/
├── index.html                    # The entire app: markup, styles, logic
├── data/
│   ├── av-companies.json         # Company records: layers, partnerships, sublines
│   ├── av-enrichment.json        # Verified metrics, funding, acquirer outcomes
│   ├── av-funding-timeline.json  # Funding-timeline events
│   └── av-companies.csv          # Airtable-ready flat export (generated)
└── tools/
    └── make-csv.py               # Regenerates av-companies.csv from the JSON files
```

## Updating the data

Edit the JSON files in `data/`, then regenerate the CSV export:

```bash
python3 tools/make-csv.py
```

Push to `main` and GitHub Pages rebuilds the site automatically (Pages is configured to deploy from the `main` branch, root folder).

## Contact

Spotted a missing company or partnership? Email [agyarek+avecosystemmap@gmail.com](mailto:agyarek+avecosystemmap@gmail.com).

## License

MIT — see [LICENSE](LICENSE).
