#!/usr/bin/env python3
"""Generate sitemap.xml from the real route set.

Scans the repo for index.html pages, excludes redirect stubs (meta refresh)
and scratch/error pages, and writes sitemap.xml with per-file lastmod dates.
Run after adding or removing a page. Never hand-edit sitemap.xml.
"""
import os, re, datetime

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HOST = "https://agyarek.github.io/av-ecosystem-map/"
EXCLUDE_FILES = {"404.html", "loop-variants.html"}

PRIORITY = {
    "": "1.0", "map/": "1.0",
    "companies/": "0.9", "overview/": "0.9", "economics/": "0.9",
    "partnerships/": "0.8", "regulation/": "0.8", "companies/passenger-autonomy/": "0.8",
}


def is_redirect(path):
    head = open(path, encoding="utf-8", errors="ignore").read(2000)
    return "http-equiv=\"refresh\"" in head or "http-equiv='refresh'" in head


def lastmod(path):
    return datetime.date.fromtimestamp(os.path.getmtime(path)).isoformat()


routes = []
for dirpath, dirnames, filenames in os.walk(ROOT):
    dirnames[:] = [d for d in dirnames if not d.startswith(".") and d not in
                   ("assets", "data", "tools", "design", "node_modules")]
    if "index.html" not in filenames:
        continue
    idx = os.path.join(dirpath, "index.html")
    rel = os.path.relpath(dirpath, ROOT)
    route = "" if rel == "." else rel.replace(os.sep, "/") + "/"
    if is_redirect(idx):
        continue
    routes.append((route, lastmod(idx)))

routes.sort(key=lambda r: (r[0].count("/"), r[0]))

lines = ['<?xml version="1.0" encoding="UTF-8"?>',
         '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for route, mod in routes:
    pr = PRIORITY.get(route, "0.7" if route.count("/") <= 1 else "0.6")
    lines.append(f"  <url><loc>{HOST}{route}</loc><lastmod>{mod}</lastmod><priority>{pr}</priority></url>")
lines.append("</urlset>")

out = os.path.join(ROOT, "sitemap.xml")
open(out, "w").write("\n".join(lines) + "\n")
print(f"wrote sitemap.xml with {len(routes)} routes (redirect stubs excluded)")
