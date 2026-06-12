#!/usr/bin/env python3
"""Inline styles.css, app.js, vendor SheetJS, sample-data.js and the crest
into a single self-contained HTML file. Outputs:
  - projects/psmmc-dashboard/standalone.html  (shareable / drag-to-host / open locally)
  - docs/index.html                  (served by classic /docs GitHub Pages)
Also stamps sw.js with the build hash (in place + docs/sw.js) and copies
manifest.webmanifest to docs/, so the PWA can install and work offline from
the published copies.
Run:  python3 projects/projects/psmmc-dashboard/build.py
"""
import base64, hashlib, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
# repo root is two levels up: <root>/projects/psmmc-dashboard
ROOT = os.path.dirname(os.path.dirname(HERE))
read = lambda p: open(os.path.join(HERE, p), encoding="utf-8").read()

html  = read("index.html")
css   = read("styles.css")
appjs = read("app.js")
xlsx  = read("vendor/xlsx.full.min.js")
sample= read("sample-data.js")
crest = read("assets/psmmc-crest.svg")
crest_uri = "data:image/svg+xml;base64," + base64.b64encode(crest.encode("utf-8")).decode("ascii")

# stylesheet -> inline <style>
html = html.replace('<link rel="stylesheet" href="./styles.css" />', "<style>\n" + css + "\n</style>")
# favicon + logo -> inline crest data URI (no external assets in single file)
html = html.replace('<link rel="icon" href="./assets/psmmc-crest.svg" />', '<link rel="icon" href="' + crest_uri + '" />')
html = re.sub(r'<img src="\./assets/psmmc-logo\.png"[^>]*>',
              '<img src="' + crest_uri + '" alt="PSMMC"/>', html)
# scripts -> inline (order preserved: sheetjs, sample, app)
html = html.replace('<script src="./vendor/xlsx.full.min.js"></script>', "<script>\n" + xlsx + "\n</script>")
html = html.replace('<script src="./sample-data.js"></script>', "<script>\n" + sample + "\n</script>")
html = html.replace('<script src="./app.js"></script>', "<script>\n" + appjs + "\n</script>")

with open(os.path.join(HERE, "standalone.html"), "w", encoding="utf-8") as f:
    f.write(html)
with open(os.path.join(ROOT, "docs", "index.html"), "w", encoding="utf-8") as f:
    f.write(html)

# Service worker: rewrite the cache stamp from the built HTML's content hash so
# installed PWAs detect a changed sw.js and refresh their offline copy. The
# stamped file is written back in place (the publish workflow copies it from
# the repo) and mirrored to docs/ next to docs/index.html.
stamp = hashlib.sha1(html.encode("utf-8")).hexdigest()[:10]
sw = read("sw.js")
sw = re.sub(r'var CACHE = "psmmc-[^"]*";', 'var CACHE = "psmmc-%s";' % stamp, sw, count=1)
with open(os.path.join(HERE, "sw.js"), "w", encoding="utf-8") as f:
    f.write(sw)
with open(os.path.join(ROOT, "docs", "sw.js"), "w", encoding="utf-8") as f:
    f.write(sw)
with open(os.path.join(ROOT, "docs", "manifest.webmanifest"), "w", encoding="utf-8") as f:
    f.write(read("manifest.webmanifest"))

kb = round(len(html.encode("utf-8")) / 1024)
print("built standalone.html and docs/index.html (%d KB each) · sw stamp psmmc-%s" % (kb, stamp))
