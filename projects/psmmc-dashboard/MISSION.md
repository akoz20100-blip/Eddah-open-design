# MISSION — PSMMC Dashboard Round 3 (owner-approved, zero-touch)

**Execution policy:** Full pre-approval. Do not stop to ask for confirmation at any phase.
Run the orchestrator and all reasoning-critical subagents on the **most capable model
available (Fable tier, latest)**; mechanical tasks may use cheaper tiers. Be
token-frugal: read only `AUDIT.md`, `state.md`, `projects/psmmc-dashboard/README.md` and this
file up front; use grep for everything else; never re-read large files whole.

**Project:** `projects/psmmc-dashboard/` — bilingual (AR-default, RTL) client-side pharmacy
stock & reorder dashboard. Live: https://akoz20100-blip.github.io/Eddah-open-design/psmmc/
Stack: single ES5 IIFE `app.js`, `styles.css`, vendored SheetJS, `build.py` →
`standalone.html` + `docs/index.html`, gh-pages workflow publishes on main pushes.
Regression suite: `node projects/psmmc-dashboard/tests/run.mjs` (must be green before AND after;
every new feature ships with a new spec). i18n: every new string goes into BOTH `T.en`
and `T.ar` dicts in app.js — verify 1:1 key parity. Touch nothing outside
`projects/psmmc-dashboard/`, `docs/index.html`, `AUDIT.md`, `state.md`. Never force-push.

## Phase 0 — Baseline
`git fetch`, branch from main, run the suite (expect 5/5), record HEAD in state.md.

## Phase 1 — Feature inventory
Build a checklist of every feature promised in README, AUDIT.md (North star), state.md
and this file. Mark each: present / partial / missing, with evidence (code line or a
headless check). Write the table into state.md before implementing anything.

## Phase 2 — Implement (priority order)

1. **Real trade names + name search (owner complaint: searching "Skyrizi" returned
   0 of 1,077 with the real file loaded).** Already landed in the prep round: Arabic
   header candidates for trade/scientific/hospital/NUPCO columns in `parseMapping`,
   plus an explicit toast when no trade-name column is recognized. Remaining here:
   (a) **catalog-wide search** — a search term that misses every loaded row must also
   scan the saved identifiers MAP; matching catalog-only items render as lightweight
   rows ("in catalog · no movement and no stock in the uploaded files") so a drug like
   Skyrizi is findable even when it never moved; with a spec. (b) Verify the
   `applyMap` precedence chain (real upload values override demo) with a spec.
   (c) If a real identifiers/catalog .xlsx exists anywhere under `projects/psmmc-dashboard/`,
   regenerate `sample-data.js` trade/hosp/msd/agent from it; otherwise keep the demo
   synthetic and add a visible bilingual badge in sample mode: "demo names are not
   real — upload the identifiers file once to see real names".

2. **Drug info / SFDA (Saudi Food & Drug Authority) — owner request.** In the item
   drill-down sheet add a "Drug information" section: ¶ what the medicine is used for /
   which disease it treats. Implementation (client-side only, no API keys): derive the
   indication from the MODHS `CLASSIFICATION` field plus a curated bilingual dictionary
   mapping the top ~150 generic-name stems in the sample (e.g. CLOPIDOGREL → antiplatelet,
   prevents heart attack/stroke · مميع يقي من الجلطات) — store it as a compact JS map;
   fall back to the classification text alone when unmapped. Add action links per item:
   "SFDA" → https://www.sfda.gov.sa/en/drugs-list?search=<scientific or trade name>
   (URL-encoded) and a generic web search link. Links open in a new tab; pure <a> tags.

3. **Budget runway.** Management tab card: owner enters remaining budget (persisted
   locally via the existing `persist()` helper); show months-it-lasts = budget ÷ monthly
   consumption value (Σ avg×unitPrice over priced items) and the projected run-out date.
   Render only when `hasPrices()`; otherwise show the activation hint.

4. **Previous-orders / PO file.** Optional fourth upload slot: a purchase-orders file
   (tolerant headers: NUPCO code, order date, qty, status). Per item in the drill-down:
   last order date + qty, and an "in transit" badge when a recent order is not yet
   reflected in stock. Keep a compact local ledger via `persist()`.

5. Any **partial** feature found in Phase 1.

Stretch (only if the above lands green and budget remains): "what changed since last
upload" summary toast/card; per-item custom alert threshold overriding the 6-month rule.

## Phase 3 — Close
Full suite green (old + new specs) → `python3 projects/projects/psmmc-dashboard/build.py` → commit waves
separately → push → open PR (body: inventory table + what shipped + validation) →
**merge to main automatically when CI is green**. Update AUDIT.md statuses + state.md
(lessons, recommended next run). Final report ≤ 15 lines.

## Deferred (do NOT do now)
- Repository reorganization into a `projects/` layout — separate PR, separate session.
- CI-built publish artifacts instead of committed standalone (recommendation only).
