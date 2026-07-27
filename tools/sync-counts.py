#!/usr/bin/env python3
"""sync-counts.py :: keep the counts written into the copy true to the data.

Numbers like "560 organisations" and "128 of 560 have mapped partnerships"
appear in prose across two dozen files. Editing them by hand after every data
change is how a research site quietly starts lying, so this rewrites them from
data/derived-counts.json instead.

    python3 tools/sync-counts.py            # rewrite and report
    python3 tools/sync-counts.py --check    # fail if anything is out of date

data/counts-lock.json records what is currently written, which makes the
rewrite exact and idempotent: it replaces the previous value, never a number
that happens to look similar. Word boundaries protect against substrings, so
the 4560 in the poster's 6800 x 4560 canvas is never touched.
"""
import json, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
LOCK = os.path.join(ROOT, "data", "counts-lock.json")
TARGET_EXT = (".html", ".md")
SKIP_DIRS = {".git", "assets/cards", "assets/logos", "data", "node_modules"}

# key -> where the live value comes from in derived-counts.json
KEYS = {
    "companies": lambda d: d["gaps"]["companies"],
    "withMappedPartners": lambda d: d["gaps"]["withMappedPartners"],
    "withoutMappedPartners": lambda d: d["gaps"]["withoutMappedPartners"],
    "mappedEdges": lambda d: d["gaps"]["mappedEdges"],
    "withDomain": lambda d: d["gaps"]["withDomain"],
    "withDisclosedFunding": lambda d: d["gaps"]["withDisclosedFunding"],
}

def files():
    for base, dirs, names in os.walk(ROOT):
        rel = os.path.relpath(base, ROOT)
        dirs[:] = [d for d in dirs
                   if os.path.join(rel, d).lstrip("./") not in SKIP_DIRS and d != ".git"]
        for n in names:
            if n.endswith(TARGET_EXT):
                yield os.path.join(base, n)

def main():
    check = "--check" in sys.argv
    derived = json.load(open(os.path.join(ROOT, "data", "derived-counts.json"), encoding="utf-8"))
    live = {k: fn(derived) for k, fn in KEYS.items()}
    old = json.load(open(LOCK, encoding="utf-8")) if os.path.exists(LOCK) else {}

    # nothing to do when the lock already matches the data
    changes = {k: (old.get(k), v) for k, v in live.items() if old.get(k) != v}
    if not changes:
        print("counts already in sync:", ", ".join(f"{k}={v}" for k, v in live.items()))
        return

    if check:
        print("FAIL: copy is out of date with the data")
        for k, (o, n) in changes.items():
            print(f"  - {k}: copy says {o}, data says {n}")
        print("run: python3 tools/sync-counts.py")
        sys.exit(1)

    # Longest values first so a shorter number can never eat part of a longer one.
    pairs = sorted(((str(o), str(n)) for k, (o, n) in changes.items() if o is not None),
                   key=lambda p: -len(p[0]))
    if not pairs:
        json.dump(live, open(LOCK, "w", encoding="utf-8"), indent=1)
        print("lock initialised:", live)
        return

    edited = 0
    for path in files():
        src = open(path, encoding="utf-8").read()
        out = src
        for o, n in pairs:
            out = re.sub(rf"\b{re.escape(o)}\b", n, out)
        if out != src:
            open(path, "w", encoding="utf-8").write(out)
            edited += 1
            print("  updated", os.path.relpath(path, ROOT))

    json.dump(live, open(LOCK, "w", encoding="utf-8"), indent=1)
    for k, (o, n) in changes.items():
        print(f"{k}: {o} -> {n}")
    print(f"rewrote {edited} file(s); lock updated")

if __name__ == "__main__":
    main()
