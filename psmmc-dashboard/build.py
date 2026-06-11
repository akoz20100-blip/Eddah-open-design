#!/usr/bin/env python3
"""Inline styles.css, app.js, vendor SheetJS, sample-data.js and the crest
into a single self-contained HTML file. Outputs:
  - psmmc-dashboard/standalone.html  (shareable / drag-to-host / open locally)
  - docs/index.html                  (served by classic /docs GitHub Pages)
Run:  python3 psmmc-dashboard/build.py
"""
import base64, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
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

kb = round(len(html.encode("utf-8")) / 1024)
print("built standalone.html and docs/index.html (%d KB each)" % kb)
