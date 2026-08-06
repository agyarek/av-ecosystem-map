#!/usr/bin/env bash
# The one command after any data edit: regenerates every derived surface in
# dependency order and proves the result still holds together.
#
#   ./tools/build-all.sh
#
# Logo fetching is deliberately not here; it needs the open internet. Run the
# "Fetch logos" workflow from the Actions tab (or tools/fetch-logos.py
# locally), which rebuilds and commits everything downstream itself.
set -euo pipefail
cd "$(dirname "$0")/.."

python3 tools/validate-data.py         # source invariants first, fail fast
python3 tools/build-indexes.py         # partner index, counts, search, skeleton, shards
python3 tools/build-poster-layout.py   # frozen geometry + logo refs (reads search-index)
python3 tools/build-minimap.py         # home hero preview from the same geometry
python3 tools/bake-static.py           # org index + directory rows into the HTML
python3 tools/make-csv.py              # the flat CSV export
python3 tools/build-sitemap.py         # sitemap from the real routes
python3 tools/sync-counts.py           # counts in prose match the data
python3 tools/validate-data.py         # generated files agree with the source
echo "build-all: done"
