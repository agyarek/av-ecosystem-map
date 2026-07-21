#!/usr/bin/env python3
"""Generate data/av-companies.csv — the Airtable-ready flat table.

One row per company, one column per field, partner names joined with ' | '.
Re-run after any change to data/av-companies.json or data/av-enrichment.json:
    python3 tools/make-csv.py
Import into Airtable via "CSV file"; the Name column is the primary field.
"""
import csv, json, os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
comps = json.load(open(os.path.join(ROOT, 'data', 'av-companies.json')))
enrich = json.load(open(os.path.join(ROOT, 'data', 'av-enrichment.json')))

partners = {}
for e in enrich['edges']:
    partners.setdefault(e['a'], []).append(e['b'])
    partners.setdefault(e['b'], []).append(e['a'])

COLS = [
    ('Name', 'name'), ('Layer', 'cat'), ('Subline', 'sub'), ('World', None), ('Type', 'type'),
    ('HQ City', 'hqCity'), ('HQ State', 'hqState'), ('HQ Country', 'hqCountry'), ('Region', 'region'),
    ('Founded', 'foundedYear'), ('Total Funding ($M)', 'fundingUSD'), ('Active Fleet', 'fleetSize'),
    ('Real Miles (M)', 'milesReal'), ('Simulated Miles (M)', 'milesVirtual'),
    ('Spoken With', 'spokenTo'), ('Exited', 'exited'), ('Acquired By', 'acquiredBy'),
    ('L4 Passenger Operator', 'l4credible'), ('Op Maturity', 'opMaturity'),
    ('About', 'about'), ('Known For', None), ('Website', None), ('Operating Footprint', 'regions'),
    ('Leadership', 'leadership'), ('Business Model', 'model'), ('Financing Notes', 'financing'),
    ('Investors Notes', 'investors'), ('Deployment Notes', 'deployment'), ('Metrics Notes', 'metrics'),
    ('Signal', 'signal'), ('Partner Count', None), ('Partners', None), ('Salience Score', 'score'),
]

out = os.path.join(ROOT, 'data', 'av-companies.csv')
with open(out, 'w', newline='', encoding='utf-8') as f:
    w = csv.writer(f)
    w.writerow([c[0] for c in COLS])
    for c in comps:
        plist = sorted(partners.get(c['name'], []))
        row = []
        for label, key in COLS:
            if label == 'World':
                row.append({'freight': 'Adjacent: Freight & Trucking', 'delivery': 'Adjacent: Delivery'}.get(c.get('segment'), 'Passenger loop'))
            elif label == 'Known For':
                row.append(enrich.get('known', {}).get(c['name'], ''))
            elif label == 'Website':
                d = enrich.get('domains', {}).get(c['name'], '')
                row.append(f'https://{d}' if d else '')
            elif label == 'Partner Count':
                row.append(len(plist))
            elif label == 'Partners':
                row.append(' | '.join(plist))
            elif label in ('Spoken With', 'Exited', 'L4 Passenger Operator'):
                row.append('Yes' if c.get(key) else '')
            else:
                v = c.get(key, '')
                row.append('' if v is None else v)
        w.writerow(row)
print(f'wrote {out}: {len(comps)} rows x {len(COLS)} cols')
