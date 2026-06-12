# AUDIT — PSMMC Pharmacy Dashboard (`psmmc-dashboard/`)

Focus: the Dash project — the PSMMC pharmacy stock & reorder dashboard (its app code,
build pipeline, sample data, publish workflow). The surrounding Open Design monorepo
fork is out of scope except where it touches the dashboard (`docs/index.html`,
`.github/workflows/psmmc-pages.yml`).

## Inventory-intelligence round (2026-06-12) — owner feature spec

New owner spec: stockout/reorder projection, expired & expiry-risk handling,
budget forecast, planner scorecard, styled xlsx export. Scoped this round to
the **price-independent** features (owner decision); Features 5 (budget page)
and 6 (planner scorecard money) deferred until a price file + planner file are
supplied — only the join slots are built now.

**Methods & assumptions chosen this round (spec requires documenting):**

- **Daily burn rate** = monthly average ÷ 30.44, where monthly average = total
  DISPATCHED/APPROVED withdrawal qty ÷ the rounded detected period months. There
  is *no separate AMU/consumption file* in the project; the NUPCO outbound
  (withdrawals) file is the consumption source, so burn is derived from it. The
  rounded months are used because the period-confirm modal applies the
  display-rounded value.
- **Available stock** = `Total Available Qty` (already excludes Hold/Allocated/
  Picked). Verified against the real file: **0 expired units carry available
  qty** — NUPCO routes expired stock to Hold (`Total Qty`/`Total Hold Qty`),
  so excluding expired from "available/coverage" is a no-op on the headline
  figures, and the future Expired view must read `Total Qty` (190 expired drug
  batches / 121 products / ~2.7M units), not Available.
- **Stockout Date** = stock-as-of + (available ÷ daily burn) days, anchored on
  the file's own as-of date (traceable to the data) rather than wall-clock
  today; production files are 1-2 days old so the two coincide. (Spec said
  "today + days_to_zero"; documented deviation for traceability with stale dev
  files.)
- **Reorder-By Date** = stock-as-of + (coverage − 6) months; **ORDER NOW** when
  that date ≤ today. The 6-month line reuses the existing `REORDER_MONTHS`
  (= 180-day-equivalent), so ORDER NOW ⟺ the existing `order_now` status.
- **Planner join** = by `Generic Item Number`, with `Item Family Group` as
  fallback; "Unassigned" until a planner-mapping file is dropped into the new
  optional upload slot. No re-architecting needed when the file arrives.
- **Prices**: none in the project → all SAR-value outputs (expired value,
  at-risk value, budget totals, inventory value per planner) remain deferred and
  flagged, per the spec's degrade-gracefully rule.

PR-A (Features 1+2) shipped: Planner + Stockout/Reorder columns on the planning
table, ORDER NOW flag, projection block + daily burn in the item card, planner
upload slot. `spec-projection` (red-first) asserts the rendered dates against an
independent mirror on the real files (LINAGLIPTIN 5MG cov 3.7 → stockout 28 May
2026 / ORDER NOW; LEVETIRACETAM 500MG cov 11.2 → 10 Jan 2027 / healthy) and
proves the planner join with a synthetic mapping. Suite 23 → 24 specs.

## Routine v2 — Round 1 (2026-06-12)

Project moved to `projects/psmmc-dashboard/` (Phase 0.2). English is the
factory-default language with a persisted Arabic RTL toggle (Phase 0.1).
Vendored subset type system landed (Inter + IBM Plex Sans Arabic, inlined at
build, tabular numerals); sample-data now carries raw facts only and the demo
derives every figure through production formulas. Suite 16 → 18 specs
(spec-lang with enforced en/ar parity, spec-typography). Built standalone
1602 → 1696 KB (fonts +179 KB / data −85 KB); load→interactive 733 → 785 ms
at 4x throttle. Blocked, needs owner: repo rename to `all-dashboard` (no
rename capability in session scope). Path references in this file predate
the `projects/` move.

PR #11 (reconciled on top of PR #10) closed the real-data gap: the three
sanitized hospital files now live in `projects/psmmc-dashboard/real-data/`,
`spec-realdata` drives them through the actual upload slots every run
(1,005 medicines · 5.3-month period · 63.3M units, asserted against an
independent mirror of the parse rules), and a red-spec-first parser fix made
the real MODHS catalog's item descriptions searchable (ADRENALINE →
EPINEPHRINE class of misses). Suite 18 → 19 specs.

## Snapshot

- **Stack**: vanilla ES5 JS (single IIFE, `app.js` ~1.4k lines), hand-rolled CSS,
  SheetJS `xlsx 0.20.3` (vendored), Python build script inlining everything into a
  1.5 MB `standalone.html` (+ copy at `docs/index.html`), gh-pages publish workflow.
  100% client-side; persistence via `localStorage` (baseline, history, id-map, snapshots).
- **Repo size (project)**: ~3.1 MB (951 KB vendor xlsx, 479 KB sample data, 103 KB app.js).
- **Audit date**: 2026-06-11 · **git HEAD**: `1dd690b` (after merging PR #5 round-2 work).
- **Health scores (/10)**:
  - Correctness: **6** — solid core formulas, but a live P0 (negative demo prices) and a
    UTC/local date-mixing defect class that corrupts month boundaries.
  - Architecture: **6** — clean single-file discipline, clear parse→compute→render flow,
    but zero separation of pure calculation from DOM, which blocks unit testing.
  - Design: **8** — coherent premium-soft identity, real RTL, real empty states,
    purposeful micro-interactions. Minor a11y gaps.
  - Performance: **6** — full innerHTML re-render of a 1,077-row table per keystroke.
  - Future-readiness: **4** — no tests at all, silent localStorage failures, tolerant
    column matching with no visibility into what was matched.

## Backlog

Status after autopilot routine 2026-06-11: **A1–A4, B1–B4, C1–C4, D1, D2 — all done**
(waves: harden `d4e198b`+`7bd0a74`, evolve `47fa37e`+`1c8957c`, polish `335f223`).
Future risks #1 (test harness), #2 (quota-safe persistence), #4 (history export/import)
also closed; #3 partially (named-column errors landed; tolerant header report not).
Remaining open: risk #5 (CI-built artifacts — recommendation only).

Status after round 3 (2026-06-12, owner request audit + planner features):
**budget runway (north-star move 3) — DONE** (prices-gated card on the
Management tab). Also shipped: catalog-wide search, bilingual drug info +
SFDA links, previous-orders (PO) upload + in-transit badge, order tracking
(mark-as-ordered with auto-clear), seasonal suggestion (prior-year same
months), what-changed digest, per-item alert threshold, installable offline
PWA. Suite grew 5 → 16 specs (see `state.md` round-3 inventory). The
`psmmc-pages.yml` workflow now also publishes `sw.js` + `manifest.webmanifest`
to `/psmmc/` (in-scope per this audit's header). i18n parity 233/233.

- [A1] [P0] [FABLE] [5/5] [2/5] Demo shows negative SAR billions — 587/1,077 sample items have negative `packPrice`, 517 negative `awardQty`; `loadSample` bypasses the `>0` validation that `parseMapping` enforces, so the public demo's Management tab shows "Total stock value −2432M · frozen capital −1466.4M" — files: `psmmc-dashboard/sample-data.js`, `psmmc-dashboard/app.js` — AC: prices are sanitized at every ingestion boundary (sample load AND mapping/stock merge: non-positive price/units/award ⇒ null, negative free ⇒ null); sample dataset regenerated with positive values; Management tab on sample data shows positive total + frozen capital.
- [A2] [P0] [FABLE] [4/5] [3/5] Local/UTC date mixing shifts period boundaries — `isoDate()` uses `toISOString()` (UTC) on local-midnight dates, so in Riyadh (UTC+3) every parsed date serializes as the *previous* day; monthly buckets use local `getFullYear/getMonth` while `period_start/end` use UTC, so `ymOf(period_end) !== last bucket ym` at month starts ⇒ partial-month detection and MoM comparison silently break, and `ymRange` history clearing can clear a wrong month — files: `psmmc-dashboard/app.js` (`isoDate`, `decisionStats`, `renderDetail`, `mergeHistory`) — AC: a local-date formatter replaces `toISOString` everywhere a calendar date is meant; a date parsed as 1 June serializes as `…-06-01` regardless of timezone; partial-month logic agrees with bucket keys.
- [A3] [P0] [OPUS] [3/5] [1/5] `dateFromFilename` accepts any 8-digit run as DDMMYYYY — a `YYYYMMDD`-named stock file (e.g. `20260610`) yields month 26 → garbage "stock as of" year ~0610 displayed as truth — files: `psmmc-dashboard/app.js` — AC: month 1–12 and year 20xx validated; `YYYYMMDD` recognized; otherwise null (falls back to workbook modified date).
- [A4] [P0] [SONNET] [3/5] [1/5] Unescaped `r.code` interpolation — `codeCell`, order-sheet rows and the print sheet inject `r.code` into HTML without `esc()`; `normCode` passes arbitrary strings through, so a crafted cell becomes markup (self-XSS via shared file) — files: `psmmc-dashboard/app.js` — AC: every `r.code` (and other cell-sourced strings) rendered through `esc()`.
- [B1] [P1] [FABLE] [4/5] [3/5] Duplicate withdrawals double-count silently — selecting the same file twice (or two overlapping exports) sums quantities with no warning, doubling every average and flipping order decisions — files: `psmmc-dashboard/app.js` (`combineWithdrawals` flow) — AC: duplicate selections (same name+size, or identical parsed period & totals) are detected and either deduped or confirmed by the user before merging.
- [B2] [P1] [OPUS] [3/5] [2/5] Ambiguous string-date parsing — `parseDate` assumes `DD/MM/YYYY` then falls back to `new Date(s)` (US `MM/DD` semantics), so mixed-format files mis-bucket months with no signal — files: `psmmc-dashboard/app.js` — AC: explicit format list; impossible day/month combos (>12) used to disambiguate; unparseable dates counted and surfaced ("N rows had unreadable dates") instead of silently dropped.
- [B3] [P1] [SONNET] [3/5] [1/5] Silent persistence failures — `saveBaseline`/`saveMap` swallow quota errors (`catch {}`), so the promised "saved on this device" baseline can silently not exist — files: `psmmc-dashboard/app.js` — AC: failed saves toast a bilingual warning (keys added to both `en` and `ar` dicts).
- [B4] [P1] [OPUS] [3/5] [2/5] Column matching is invisible — `findCol`'s substring fallback can bind the wrong column ("Qty" → "Free Qty") and the user never sees which header was used — files: `psmmc-dashboard/app.js` — AC: parse errors name the missing column; word-boundary/prefix matching preferred over bare substring for short candidates like "Qty".
- [C1] [P2] [OPUS] [3/5] [2/5] Whole-view re-render per search keystroke — 1,077-row table rebuilt via innerHTML on every input event (with a caret-restore hack); freezes at 5–10k rows — files: `psmmc-dashboard/app.js` — AC: search input debounced (~150 ms) and only the table card re-rendered on search/sort/filter; caret hack removed.
- [C2] [P2] [OPUS] [2/5] [1/5] Modal ESC listener stacking — `openModal` over an open modal adds a second document keydown listener and one survives close — files: `psmmc-dashboard/app.js` — AC: listener added once / removed symmetrically.
- [C3] [P2] [OPUS] [3/5] [2/5] A11y gaps — sortable headers lack `aria-sort`, modal has no focus management (focus stays behind the dialog), copy chips aren't keyboard-actionable — files: `psmmc-dashboard/app.js`, `psmmc-dashboard/index.html` — AC: `aria-sort` reflects state; modal takes focus on open and restores on close; chips are buttons or have key handlers.
- [C4] [P2] [OPUS] [2/5] [1/5] Averages tab empty state — with no history and no live upload the tab renders a bare table; needs the same guided empty state as Planning — files: `psmmc-dashboard/app.js` — AC: bilingual empty-state with a hint that history accumulates from uploads.
- [D1] [P3] [SONNET] [2/5] [1/5] README drift — still says "Two dashboards", no mention of the Averages tab, consumption history, period confirm, MODHS catalog/prices, or share actions — files: `psmmc-dashboard/README.md` — AC: README matches round-2 reality.
- [D2] [P3] [SONNET] [1/5] [1/5] Stale static hint — `index.html` `upl_hint` body text differs from the JS dict (overwritten at runtime, confusing in source) — AC: static text matches the `ar` dict string.

## Future risks

1. **No test harness (highest)** [OPUS] — every calculation that drives an order decision
   (months span, averages, coverage, suggested qty, MoM, frozen capital, history merge)
   is unverifiable; any future edit can silently corrupt orders. *Preemptive fix*: a
   `tests/` harness — pure-function unit specs (extract calculation core into
   `calc.js`, inlined by `build.py` before `app.js`) + a playwright-core e2e smoke
   (load page → sample → assert the four decision figures, tab switch, drill-down).
2. **localStorage quota exhaustion** [FABLE] — history (24 mo × ~1k items), baseline,
   MODHS map (1,447 items with prices) and snapshots compete for ~5 MB; only history
   handles quota errors. *Preemptive fix*: shared persistence helper with quota
   handling + user-visible failure, and size-aware pruning.
3. **NUPCO/MODHS schema drift** [OPUS] — a renamed column yields a generic "could not
   read" toast with no clue. *Preemptive fix*: named-column error messages (B4) and a
   tolerant header report.
4. **History portability** [OPUS] — 24 months of consumption history lives on one
   device/browser; clearing site data destroys it. *Preemptive fix*: export/import
   history as a JSON file from the UI.
5. **Repo bloat** [SONNET] — every rebuild commits ~3 MB (standalone + docs copy).
   *Preemptive fix (recommendation only)*: build in CI on publish instead of
   committing artifacts; keep for now since classic /docs Pages may still serve it.
6. **Dependency status** — SheetJS 0.20.3 is the current safe line (CVE-2023-30533
   fixed ≥0.19.3, ReDoS CVE-2024-22363 fixed ≥0.20.2; Snyk flags against 0.20.3 are
   known false positives). Keep vendored+pinned; re-check on release.

## North star

The planner opens one link on any device, drops this month's files, and leaves with a
signed order sheet and a budget picture they trust enough to defend in a meeting.
The three fastest moves:
1. **Make the numbers bulletproof** — fix A1/A2/B1, then lock everything with the test
   harness so trust never regresses.
2. **Make history durable** — export/import the consumption ledger so a lost phone
   doesn't erase two years of seasonality.
3. **Budget runway** — once real prices load, project "will the budget last to
   year-end" from monthly consumption value (owner-confirmed next round).
