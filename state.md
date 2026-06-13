# state.md — Dash project loop state

## Wave 6 UX P0-2 — order-sheet exception roll-up (2026-06-13)

Owner approved the UX track with auto-merge-on-green and picked all four groups
(P0 single-glance, P1 colour, P1 budget bar, P1 item-card/filters). P1-1 shipped
& merged (#36). This is the P0 group's first, lowest-risk piece: `cardOrderSheet`
now shows a `.os-urgency` roll-up under the title — "{below} below 1 month ·
{out} out of stock now" — counting the full candidate set (out-of-stock-now is a
subset of below-one-month), coral (`.os-hot`) only when a count > 0. Surfaces
severity before the planner scans rows (NN/g + Few: lead with the exception).
Additive (no restyle of existing elements). New i18n key `os_urgency` (T.en + T.ar,
parity via spec-lang); `data-below`/`data-out` hooks for testability. Red-first
`spec-orderurgency` (red: no `.os-urgency` → green: present, below>=out, coral iff
urgency; sample 137 below / 45 out). Suite 44/44. build.py → 1841 KB.

## Wave 6 UX P1-1 — sentence-case table headers (Arabic-joining fix) (2026-06-13)

First UX-track change after an independent re-verification confirmed all of wave 6
merged and clean (suite 42/42; 4-agent fleet: mobile-QA + desktop-QA both ✅ incl.
the two reported mobile bugs B1/B2 fixed; security clean — no Critical/High/Medium;
UX agent returned 11 prioritised recs). `thead th` used `text-transform:uppercase`
+ `letter-spacing:.04em`, and `thead th` is NOT in the Arabic letter-spacing reset
list (styles.css L51) — so Arabic column headers got .04em tracking that breaks
letter-joining (a real rendering defect in the owner's primary language), and caps
slow Latin reading. Fixed to sentence case + normal tracking (font 11→11.5px).
Red-first `spec-headerlegibility` (red: computed text-transform `uppercase`,
letter-spacing `0.44px` in EN+AR → green: `none` / `normal`). CSS-only, no DOM-text
change, no spec regressions. Suite 43/43. build.py → 1840 KB. Owner explicitly keeps
the `+/-` upload toggle (UX agent's chevron suggestion overridden). Remaining UX recs
(P0-1 lead card, P0-2 urgency rollup, P0-3 column zoning, P1-2 colour restraint, P1-3
sheet zoning, P1-4 budget bar, P1-5 hover, P1-6 toolbar) staged for owner prioritisation.

## Wave 6 §ز — latent fractional-stock bucket guard (2026-06-13)

Defensive fix for the long-noted latent bug (`renderManagement`, the stock
order-of-magnitude distribution): `floor(log10(q))+1` goes 0/negative for a
fractional available quantity 0 < q < 1, so q = 0.05 indexed `buckets[-1]` and
the item silently vanished from the chart (and wrote NaN). Clamped with
`Math.max(0, …)`. Real available quantities are integers (never triggered in
production), so no behaviour change on the real files. Added a `data-counts`
hook on the tick chart for testability. Red-first `spec-bucket` (synthetic
fractional stock: red the 8 buckets summed to 3 of 4 in-stock items → green 4).

## Wave 6 §F — budget at a glance + per-month order cards + exports (2026-06-13)

Owner's flagged priority («إعادة تصميم الميزانية + التصدير ... ناقص حاليًّا وإلزامي»).
Built on the wave-6 line already merged by a parallel session (A1–A4 #27, B1/B2/C1
#28, security #29, D1 #30, E1/E2 #31). This session confirmed before building: D1 and
E1/E2 were already done by the parallel session, so its own duplicate D1 PR (#32) was
closed and the only-uncovered priority item — §F — was taken.

- **F4 budget at a glance** (`budgetCard` → full-width overview): one look shows
  budget · spent (delivered orders) · committed (undelivered orders) · remaining
  (= budget − spent − committed) · monthly consumption value · runway months +
  run-out date. New `ledgerMoney()` splits ledger value by supply state and uses
  #31's `orderDelivered()` predicate, so a manually-marked delivery moves money
  from "committed" to "spent". On the real files: committed 19.44M SAR (= mirror
  Σ open-order value, exact), monthly 27.6M, runway 18.1 mo.
- **F1 per-planner amount + F2 clickable month** (`monthlyWorkload` now collects
  per-item rows + `plannerVal`; `openMonthCard`): clicking any workload month opens
  a card listing that month's orders (code/name/planner/qty/value) with a
  per-planner money split (e.g. this month 644 orders / 136.3M; Ghazi 112·87.3M …).
- **F3 exports** (`exportMonth`, `exportToYearEnd`): each month card exports its own
  Excel (one row per order); a workload-card button exports every order from now to
  year-end as Summary + Detail sheets (757 detail rows on the real files). All paths
  reuse the security-hardened `sheetFrom`/`sanitizeAoa`.

Red-first `spec-budgetview` (red on main: no `.bo-stats`/`.bw-row`/exports → green:
14 asserts incl. committed == mirror Σ open-order value, remaining arithmetic, month
card lists exactly the month's N orders, per-month export = N rows, year-end Summary
+ Detail). New i18n keys `bw_export_year`, `bw_view_month`, `bo_title/bo_spent/
bo_undelivered/bo_remaining/bo_set_hint`, `mc_title/mc_export/mc_qty/mc_planner_split`
(T.en + T.ar, parity enforced by spec-lang). Suite 41/41. build.py → 1839 KB.

## Independent audit + Sharek-wave fix (2026-06-13)

Owner asked for a no-trust re-audit. Verified the environment (suite 35/35, `build.py`
in sync, PWA cache stamp rotates per build), then all 21 v3 owner items + the 3 reported
bugs live in headless Chromium against the six real files via 3 agents (EN/AR, mobile
390px + desktop), plus a FROM-SCRATCH node calc (no project mirrors) for FERINJECT + 15
drugs. Independent FERINJECT == the live screen exactly: avg **1,589.1**, stock 2,860,
cov **1.8**, ORDER NOW, suggested 11,442 (period 5.3 mo from delivery dates; the owner's
old 43.8 needs an outlier-dated row this file lacks). Reported bugs all clear: mobile item
card no longer clipped, FERINJECT correct, MSD/hospital codes copyable. **No item missing.**

Fixed 3 wave-5 Sharek regressions (red-first `spec-sharekfix`, suite 34→35): (1) the
catalog-fallback row `colspan` is now `SHAREK ? 13 : 12` so it spans the 15-column header
when a Sharek file is loaded; (2) `applyStatic` now rehydrates the `#shkName` slot label
(name + count) like every other slot, on upload AND reload; (3) the per-filter export marks
the Sharek column only for ZERO-stock codes (`r.stock <= 0`), matching the on-screen table.
Branch `claude/psmmc-dashboard-audit-verify`. Latent note (not fixed, no real-data trigger):
the management distribution bucket index mis-buckets fractional stock < 1 (real available
quantities are integers).

## Owner spec v3 round (2026-06-12) — comprehensive audit + effective stock

Owner sent a large v3 spec (Arabic) + 3 real files (per-unit prices, planner
assignment with UOM, framework-agreement orders) + 2 screenshots, and asked
for a full re-audit with a complete plan before any execution. Plan approved
(6 waves); branch `claude/psmmc-dashboard-audit-lbnrqt`, PR #20.

Owner decisions taken this round: NO exceljs (reports stay light, no cell
colors); 3-month hand-dispense rule classified by UOM (parenterals exempt);
Sharek slot built now, file later; work from repo files + synthetic outlier
fixtures.

| Wave | Item | Proof |
|------|------|-------|
| 0 | Owner files landed in `real-data/`: `NUPCO_net_unit_prices_12062026.xlsx` (2,863 per-UNIT prices), `PSMMC_planner_assignment_12062026.xlsx` (1,173 items, UOM + planner names, no email), `NUPCO_framework_orders_asof_12062026.sanitized.xlsx` (1,162 orders Dec 2025→May 2026; only 19 drug rows; Arabic statuses). New `sanitize-orders.mjs` blanks `Order Placed By` + `Customer Comment` (staff names/free text); verified 0 leftovers. | re-read verification script; README table updated |
| 1 | **Effective-stock engine** (`applyEffective`): coverage, status, stockout/reorder dates, suggested qty all run on DISPENSABLE stock — FEFO waste (incl. 3-month grace for hand-dispensed UOMs; vial/ampule/inj/syringe/IV-bag exempt) and expired stock excluded. New `excess` status (eff cov > 13 mo) + filter chip. Planner-file UOM is authoritative (then catalog, then withdrawals UOM); planner/identifier uploads re-grade rows (`recomputeEffective`). Item sheet shows dispensable units + raw coverage for transparency. Seasonal suggestion subtracts dispensable (not raw) stock; `clearCoveredOrders` treats `excess` as covered. Real-file impact: **26 items flip healthy→ORDER NOW** (e.g. raw cov 127 mo → eff 3.8), 186 items excess, order-now 216→242. | `spec-effective` red-first (8 red) → green: grace anchor 5114170300500 raw 12.9→eff 0.0 ORDER NOW; excess anchor 5115180100100 raw 29.4→17.9; planner-UOM flip 5118190100100 AMP→EACH ok→order_now |
| 1 | **Dense-period guard** (the owner's FERINJECT screenshot bug, root-caused numerically: his live card values = correct values ÷ ~65-month period; 2,860÷65=43.8 exactly matches the screenshot): edge months holding < max(2, 0.5%) of dated rows are outliers — counted in totals, excluded from period detection/monthly buckets, named on the quality card (`qr_outlier`). | `spec-period` red-first (64.8 mo with one 2021-dated row) → green (5.3 mo + quality warning) |
| 1 | **All-items mirror net** (owner: "راجع كل البنود"): report workbook's Reorder sheet (all 1,005 products) compared field-by-field (avg/stock/cov/stockout/reorder/status/sug incl. seasonal) against `expectedEffectiveFromRealFiles`. FERINJECT verified: avg 1,589/mo, cov 1.8, ORDER NOW. | `spec-allitems` red (246 cov + 569 status mismatches) → green (0 mismatches ×8 fields) |

| 2 | **KPI item census + explainers + frozen columns + copyable codes**: the total-units and monthly-consumption cards are replaced by item counts (1,005 total / 669 with stock 67% / 336 zero 33% on the real files; MoM badge moved to the monthly-stream card so the signal survives). Every KPI card and planning/management column header now opens a bilingual "how is this computed?" modal (`openExplainer`, 14 metric keys ×2 langs). The table wrap became a two-axis scrollbox with a frozen header row + frozen code & name columns — pinned with PHYSICAL left/right per `html[dir]` because chromium resolved `inset-inline-start` to a left pin under RTL (caught by screenshot, now locked by an RTL assertion). Planner-file hospital + MSD codes fill row gaps (`applyPlannerCodes`) and every subcode is individually copyable. | `spec-kpi` red-first (17 red) → green (25 asserts incl. RTL block); spec-sample/spec-realdata repointed to the new cards; suite 30/30 |
| 3 | **Real prices live + budget workload**: parseMapping recognizes the owner's price list (`Generic Mat Code` + `Net Price/Per unit 1` — already PER UNIT, never divided by pack size; greedy-substring guard keeps "Unit Price" from re-binding "Unit Pack Price", red spec-budget caught the 10× regression). 672 unique drug prices (file also carries 2,191 supply codes). Activates: management unit-price/stock-value columns, budget runway, Expiry Watch SAR values (summary 42.7M at-risk + per-batch values), report SAR columns. New **Monthly order workload** card on Management: per upcoming month, items hitting their reorder-by date (overdue → current month: 644 now, Jul 21, Aug 29 …), split per planner, SAR value when priced. Item card splits the suggested order into paid/free shares when award+free quantities exist (renders price-independent). Prices persist on-device (upload once). | `spec-prices` red-first (11 red) → green (23 asserts); suite 31/31 twice |
| 4a | **Procurement orders ledger**: the framework-agreement export (and later tenders/direct, same shape, tagged by `source`) feeds a persistent ledger through the orders slot. `parseOrdersLedger` keys each row by Child order + drug code (the composite `code_tradecode_supplier` NUPCO column splits on `_`), excludes rejected/cancelled rows on import (`isOrderRejected`), and `parseOrderDate` pulls month/day/year out of "Wed Dec 31 13:25:14 AST 2025" directly (V8 rejects the AST zone). Re-uploads dedupe (same order# → nothing added); the ledger survives orders completing + reloads. `openOrderFor` drives: a table "Order placed" badge, a card block listing every order (number copyable, date, qty, status, supplier), a new "Ordered (under 6 mo)" filter for tight-but-already-procured items, and exclusion from the order sheet. Real file: 19 drug orders (all open), 2 are order_now+open. | `spec-ledger` red-first → green (24 asserts incl. a synthetic rejected-row exclusion + dedupe + reload); suite 32/32 twice. Hardened spec-prices' reload check (confirm write landed pre-reload). |
| 4b | **Arabic procurement emails + top-50 rankings**: the item card gains two ready-to-send mailto buttons — "expedite order" (on items with an open ledger order; Arabic body with drug name, NUPCO code, hospital item no., PO number, ordered qty, supplier) and "request replacement" (on items with expired/at-risk batches; Arabic body listing each lot, qty and expiry + total). Management gains two scrollable rank cards: **Top 50 by order spend** (Σ ledger order value per drug, price-independent — #1 5118242800600 @ 13.9M) and **Top 50 by inventory value** (stock × unit price — #1 5114000000000 @ 18.9M). | `spec-emails` red-first → green (25 asserts, decodes the mailto bodies + checks both rankings vs mirrors); suite 33/33 twice. Caught a real regression — the rank `<table>`s collided with specs' generic `table tbody tr` selector (scoped spec-prices to `table.t-main`); plus a deterministic flush-window fix for the price-map reload-persistence flake under load. |
| 5 | **Sharek slot + per-filter export + item-count expiry views**: new 6th upload slot (`fileSharek`, `psmmc_sharek_v1`, replace-on-upload snapshot semantics) joins by NUPCO code; zero-stock KPI card states "{n} of them available on Sharek"; new planning filter "Zero & on Sharek" + a Sharek column after the suggested order (✓ on zero items); new **Export view** toolbar button downloads exactly the active filter+search rows (the one-planner batch report). Expiry-Watch planner chips now count distinct ITEMS, not units; the report's At-Risk/Expired sheets gained Item total stock / Coverage / Excess qty (>9 mo) columns. The real Sharek file is still pending — proven with a synthetic file built from real zero-stock codes; activates untouched when the owner drops the real export. | `spec-sharek` red-first → green (13 asserts incl. export-only-filtered + reload persistence); red-first additions to `spec-expiryviews` (chip counts 247 items, not 11.5M units) and `spec-report` (3 new columns); suite 34/34 twice |
Mirrors updated for the approved semantics: `expectedExpiryFromRealFiles` /
`expectedExpiryViewsFromRealFiles` grace-aware (at-risk 300→351 batches /
9.2M→11.5M units; BISOPROLOL eff 16.7→13.7; digest 199→226);
`expectedProjectionFromRealFiles` now delegates to the effective mirror.
Suite 26 → 29 specs.

Pending owner files: Sharek platform export, undelivered tenders, direct
purchases, free-goods price columns. Next waves: KPI item-count cards +
explainers + sticky table; prices/budget; orders ledger + Arabic
urgency/replacement emails; Sharek + per-filter reports.


## Inventory-intelligence round (2026-06-12) — owner feature spec (in progress)

Owner dropped a 6-feature spec (stockout/reorder projection, expired handling,
expiry-risk, budget forecast, planner scorecard, styled xlsx export). Decisions:
**extend the live dashboard** (not a separate tool), **price-independent features
first** (F1-F4 + export; F5/F6 deferred until price+planner files arrive — only
join slots built now). Methods documented in AUDIT.md. Branch
`claude/beautiful-wright-0zzwws`, sequential PRs.

| PR | Item | Proof |
|----|------|-------|
| PR-C | Reporting — export FAB now builds one structured workbook: Summary sheet (KPIs+totals) first, then Reorder/At-Risk/Expired detail sheets, with column widths, autofilters, SAR/thousands number formats, zero formula errors. Community SheetJS can't emit color fills/freeze (probed) → conditional-format COLORS deferred as a dependency decision (exceljs ≈ +270KB) raised to owner for round 2. | `spec-report` red→green: sheet order, KPI values (1,005/63.3M/300/158), row counts, number formats, autofilter, 0 error cells. Suite 25→26. |
| PR-B | Features 3+4 — new **Expiry Watch** tab: batch-level cross-cutting list, At-Risk (FEFO remainders) / Expired (physical Total Qty) filters, by-expiry/by-quantity sort, per-planner subtotals, value column deferred to prices. parseStock splits date-merged batches into live vs expired; expiryStats returns per-batch at-risk; item card lists expired batches separately. | `spec-expiryviews` red→green vs date-merged mirror: At-Risk 300/9.2M/206 prod, Expired 158/2.7M (TRETINOIN lot 0932001). Suite 24→25. |
| PR-A | Features 1+2 — Planner column + Stockout/Reorder-By dates + ORDER NOW on the planning table; projection block + daily burn in the item card; new optional planner-mapping upload slot with by-code/by-family join (Unassigned until file dropped). Daily burn = avg ÷ 30.44; stockout anchored on stock-as-of. | `spec-projection` red-first → green vs independent mirror on real files (LINAGLIPTIN cov 3.7 → 28 May 2026 ORDER NOW; LEVETIRACETAM cov 11.2 → 10 Jan 2027 healthy) + planner join proven via synthetic file; suite 23→24. Fixed 2 index/debounce-brittle specs (spec-dedup col shift, spec-realdata → setSearch). |

Round 1 COMPLETE: PR-A (F1+F2), PR-B (F3+F4), PR-C (Reporting) all merged. Stop for owner's round-2 decision. Open decisions for round 2: (a) report color-fill styling → vendor exceljs (~+270KB) vs keep lightweight; (b) Features 5 (budget forecast) + 6 (planner scorecard) need a real price file + planner-mapping file from the owner (join slots already built).


## Routine v2 — Round 2 (2026-06-12) — owner bug + ROADMAP steps 1–3

- Baseline HEAD: `b78b8e6` (merge of PR #12) · suite 19/19 green before changes.
- Branch: `claude/beautiful-wright-0zzwws`, sequential PRs (each merged at green
  CI before the next step starts, per ROADMAP rule 3).

### Shipped

| PR | Item | Proof |
|----|------|-------|
| #13 (merged `0233730`) | Owner bug (recurring): searching a COMMERCIAL name found nothing — no file carries the planner's brand (MODHS catalog has no trade column; warehouse stocks VAROXA while planner types Xarelto; sample names synthetic). Fix: curated `TRADE_SYNONYMS` (~280 brands incl. Arabic spellings, stems validated against the real MODHS catalog) expanding search terms in rows + catalog fallback, applied mapping shown above results. | red spec first (`spec-tradename`, 4 red assertions on main), suite 19→20 green; standalone +18 KB (the dictionary) |
| step 3 PR | ROADMAP step 3 — watchlist: star button on every planning row (inside the copyable code cell, propagation-stopped) + in the item-sheet header; pins persist in `psmmc_watch_v1` via the shared `persist()` helper, sort first within the active planning sort, and back a "متابعتي/My watchlist" filter chip with live count. | `spec-watchlist` red → green on the real files incl. reload survival (baseline withdrawals auto-load + fresh stock upload); suite 23/23 twice consecutively |
| step 2 PR | ROADMAP step 2 — per-upload data-quality report: every parser (withdrawals/stock/identifiers/PO) now returns `{total, accepted, rejects[], warns[], cols[]}`; an expandable bilingual quality card (native `<details>`) at the top of Planning names every rejection reason + the matched column headers, exports to xlsx, dismissible, never shown in sample mode. Real-file truth: withdrawals 10,130→5,913 accepted (4,217 non-drug), stock 20,984→1,528 (19,456 non-drug), catalog 1,462→1,447 (9 missing code + 6 non-drug). | `spec-quality` red (11 asserts) → green against `expectedQualityFromRealFiles` mirror; download-event assertion on the xlsx export; suite 22/22 |
| step 1 PR | ROADMAP step 1 — expiry intelligence: stock-file `Expiry Date`+`Lot No/Batch` → per-code batches, FEFO walk vs monthly avg from stock-as-of → earliest-expiry column (sortable) in planning, at-risk flag with effective coverage + units-at-risk tooltip, digest callout (fires on first upload), batches block + effective figures in item sheet, expiry columns in order-sheet export/print; withdrawals-file `Expiry Date`/`Batch No` used as ≈fallback when stock has no batches. | `spec-expiry` red (10 asserts) → green against an independent FEFO mirror (`expectedExpiryFromRealFiles`); real-file anchor BISOPROLOL 5MG cov 69.5 → eff 16.7 mo, 633,977 units at risk; 199 flagged items; suite 21/21 |

### Lessons

- Headless chromium starves in-page rAF/timers on idle file:// pages: the
  150 ms search debounce can take seconds and `waitForFunction` (raf polling)
  freezes; `--disable-background-timer-throttling` does NOT help, and even
  Node-side evaluate polling + real key events still flaked under suite load.
  Settled pattern (helpers `setSearch`): drive the production `oninput`
  handler with a direct `input` event dispatch and poll via `page.evaluate`
  — search specs verify search behavior, not keystroke plumbing. Used by
  `spec-tradename`/`spec-expiry`/`spec-watchlist`; suite then passed 23/23
  twice consecutively.
- Search-assertion predicates must prove the table is FILTERED (small row
  count) before matching rows, or the unfiltered 1,000-row table satisfies
  any regex.

## Routine v2 — Round 1 (2026-06-12) — Phase 0 + design track

- Baseline HEAD: `27042d1` (merge of PR #8) · suite 16/16 green before changes.
- Branch: `claude/clever-pascal-flojyt` (single PR with one gated commit wave per
  Phase 0 item — the session is restricted to one branch, so "each item its own
  PR" became "each item its own green-gated commit wave"; deviation reported).

### Shipped (waves, suite green after each)

| Wave | Item | Commit | Proof |
|------|------|--------|-------|
| 1 | Phase 0.2 — move `psmmc-dashboard/` → `projects/psmmc-dashboard/` (build.py ROOT, spec-pwa, publish workflow, guard allowlist, docs) | `f21f8a3` | suite 16/16, byte-identical rebuild |
| 2 | Phase 0.1 — English factory default (static shell EN, dict default EN, localized `document.title`, EN copy proofread; Arabic untouched) | `3c1dcb3` | new `spec-lang` (EN default, toggle persistence, en/ar parity 233/233 enforced by a string-aware dict scanner); suite 17/17 |
| 3 | Design track — vendored type system (subset Inter 400/600 ~17 KB ea; IBM Plex Sans Arabic 400/500/700 ~32 KB ea; tabular numerals everywhere; AR drops Latin negative tracking, line-height 1.65) + sample-data slimming (raw facts only; loadSample derives avg/cov/qty9/sug/status through `statusOf` — demo can never drift from production math) | `b046cba` | new `spec-typography` (faces load from file://, stacks per language, no font url() left in standalone); suite 18/18 |

### Measurements (4x CPU throttle ≈ mid phone, median of 3)

- Built standalone: 1602 → **1696 KB** (+94 KB: fonts +179 KB base64, sample data −85 KB).
- load→interactive: 733 → 785 ms (+7%, font registration).
- Sample full render: 674 → 713 ms (loadSample now derives fields). Table re-render (sort): 579 → 558 ms.
- Conflict noted: the round-1 typography mandate (vendor + inline fonts) and the
  "lighter every round" budget pull in opposite directions; offsets recovered 85 KB,
  net +94 KB raw. Next-round levers: lazy sample data, leaner SheetJS build.

### Reconciliation (PR #11, merged after PR #10)

Two sessions executed round 1 concurrently. PR #10 landed first (move, English
default, vendored type, sample slimming); PR #11 reconciled onto it, keeping
its unique contributions:

- **Real-data set landed** — `projects/psmmc-dashboard/real-data/` (cherry-pick of
  PR #9 head `ad2ec16`): sanitized outbound Jan→10 Jun 2026 (10,130 rows),
  stock-on-hand `.xls` (20,984 rows), MODHS catalog 07/2025 (1,462 active).
  This clears former blocked item 1 below.
- **Real-file validation harness** — `tests/real-data-expected.mjs` (independent
  mirror of the documented parse rules) + `tests/spec-realdata.mjs` (uploads all
  three real files through the actual UI slots in headless Chromium). Rendered
  figures == mirror: **1,005 medicines · period 01 Jan→10 Jun 2026 = 5.3 mo ·
  stock-as-of 04 Feb 2026 · 63.3M available units · zero page errors**.
- **Catalog-names bug, red spec first** — parseMapping did not recognize the real
  MODHS catalog's `MODHS ITEM DESCRIPTION`/`NUPCO ITEM DESCRIPTION` columns, so
  the owner's real identifiers file linked codes but left name search dead
  ("name search will stay limited" toast). Catalog descriptions now feed the
  scientific-name slot: searching "adrenaline" finds the EPINEPHRINE rows,
  "acyclovir" finds the ACICLOVIR row. `spec-realdata` was red on both, green
  after the one-line fix.
- Duplicated work (typography, English default, move) resolved in favor of the
  already-merged PR #10 versions; PR #11's parallel implementations dropped.
- Lesson: two routine sessions on one round duplicate ~80% of the work — round 2
  should run as a single session (or partition parts explicitly up front).

### Blocked (need owner action)

1. ~~**Real data files absent**~~ — RESOLVED by PR #11 (see Reconciliation):
   `real-data/` is now in the repo and `spec-realdata` validates against it
   every run.
2. **Phase 0.3 repo rename → `all-dashboard`** — the session's GitHub access has no
   repository-rename capability (scope is pinned to `akoz20100-blip/eddah-open-design`).
   Owner action: GitHub → Settings → rename to `all-dashboard`; Pages URL becomes
   `https://akoz20100-blip.github.io/all-dashboard/psmmc/` (old Pages link dies;
   installed PWAs must be re-installed). Git remotes keep redirecting.

### Part-by-part audit log (found / improved / suggestions)

- **parsers**: found solid tolerant matching (round 2/3 work holds) / improved: none this round / suggest: per-upload data-quality report (pool #5); explicit duplicate-column warning; unit-tests for Arabic header variants.
- **calculation core**: found sample path bypassing production math / improved: loadSample now derives via `statusOf` + shared formulas / suggest: extract pure calc module for node-level tests; expiry-aware coverage (pool #2); forecasting (pool #3).
- **three tabs**: found EN copy inconsistencies ("enable"/"activate") / improved: EN proofread + localized title / suggest: management-tab ABC view (pool #1); pinned watchlist (pool #15); per-tab empty-state CTAs.
- **item sheet**: found OK (round-3 dvh/swipe work holds) / improved: typography (tabular nums, Plex Arabic) / suggest: expiry line per batch (pool #2); PO lead-time stat (pool #14); inline threshold editing affordance.
- **storage & history**: found quota-safe persistence holding / improved: lang key default flip / suggest: sync bundle/QR export (pool #9); history compaction; storage usage indicator.
- **export/share/print**: found OK / improved: tabular numerals in printed sheets via shared CSS / suggest: executive monthly report (pool #10); approval workflow stamps (pool #6); Arabic print headers audit.
- **PWA & publishing**: found workflow paths fixed post-move / improved: spec-pwa root resolution / suggest: complete rename runbook (blocked item 2); cache-size guard spec; install-prompt UX.
- **tests**: found 16 specs green / improved: +spec-lang +spec-typography (18), Arabic pinning isolated to helper / suggest: real-data specs once files land; perf spec with budget gates; visual-diff harness.
- **sample data**: found 85 KB of derivable fields / improved: stripped to raw facts / suggest: regenerate from real files when attached; smaller monthlyByCode encoding; seasonal-pattern demo data.
- **build.py**: found single-purpose inliner / improved: font inlining + repo-root fix / suggest: size budget assertion in build; optional minify pass; build provenance comment in output.
- **design system**: found strong soft-card identity, weak type discipline / improved: full vendored type system / suggest: spacing-scale tokens; semantic status color audit (AA on tints); motion tokens for enter/exit per UI philosophy.


## Round 3 (2026-06-12) — owner request audit + planner features

- Baseline HEAD: `80e6e63` (merge of PR #7) · suite 5/5 green before changes.

### Phase 1 feature inventory (evidence-checked)

| # | Owner request | Status | Evidence |
|---|---------------|--------|----------|
| 1a | AR+EN trade-name header recognition in identifiers parser | present | `app.js` `parseMapping` — Arabic candidates («كود نبكو», «الاسم التجاري», «الاسم العلمي», …) |
| 1b | Warning when no trade-name column recognized | present | `app.js` map-upload handler toasts `mp_no_trade` when `!parsed.hasTrade` |
| 1c | Real uploaded names override demo names (applyMap precedence) | partial → done | precedence chain `(m && m.trade) \|\| r.trade` existed; spec was missing → `tests/spec-identifiers.mjs`; demo-name badge added in sample mode |
| 2 | Catalog-wide search (Skyrizi 0/1,077 root cause) | missing → built | search misses now scan saved MAP; catalog-only rows render with «in catalog · no movement/stock» note; spec `tests/spec-catalog.mjs` |
| 3 | SFDA drug info + per-item SFDA/web links | missing → built | curated bilingual generic-stem dictionary + MODHS classification fallback in drill-down; `tests/spec-druginfo.mjs` |
| 4 | iOS bottom sheet: close inside dvh viewport + swipe-down dismiss | present (PR #7) | `app.js` `wireSheetSwipe`, `styles.css` `@supports (height:1dvh)` + grab handle; verified by `tests/spec-sheet.mjs` |
| 5 | Budget runway card (Management tab) | missing → built | budget input persisted, months-left = budget ÷ Σ(avg×unitPrice), run-out date; hint when no prices; `tests/spec-budget.mjs` |
| 6 | Previous-orders (PO) upload + last order + in-transit badge | missing → built | 4th upload slot, tolerant headers, compact ledger via `persist()`; `tests/spec-po.mjs` |
| 7 | Order tracking (mark as ordered, auto-clear on covering stock) | missing → built | per-item ordered flag persisted; excluded from order sheet; cleared by a later covering stock upload; `tests/spec-orders.mjs` |
| 8 | Seasonal suggestion (≥6 mo history weighs prior-year same months) | missing → built | seasonal qty9 from prior-year upcoming months + badge; `tests/spec-seasonal.mjs` |
| 9 | "What changed" digest after upload | missing → built | dismissible card: entered danger / spikes >30% / new / recovered; `tests/spec-digest.mjs` |
| 10 | PWA (manifest + service worker, offline, installable) | missing → built | `manifest.webmanifest` + version-stamped cache-first `sw.js`, build.py emits both to `docs/`; `tests/spec-pwa.mjs` |
| 11 | Per-item alert threshold override | missing → built | drill-down threshold action, persisted, marked in table; `tests/spec-threshold.mjs` |

No real identifiers/catalog file exists under `psmmc-dashboard/` → demo names stay synthetic; bilingual "demo names are not real" badge shown in sample mode (item 1c).

### Round-3 result

- Waves: features `5e5a844`, PWA `5843e8f`, rebuild `f2228c9`, docs (this commit).
- Suite: 5/5 before → **16/16 after** (10 new browser specs + node-level spec-pwa). i18n parity 233/233.
- Boundary note: `.github/workflows/psmmc-pages.yml` extended (copy `sw.js` + `manifest.webmanifest` to `/psmmc/`) — the only edit outside the allowed paths, required for PWA-offline at the permanent link and explicitly in this audit's scope per AUDIT.md's header.
- Lessons:
  - Arabic substring assertions must ignore proclitics (`الصدفية` vs `للصدفية`) — assert the bare stem.
  - Synthetic touch sequences via plain `Event` + a `touches` array test the swipe handler without a `hasTouch` context.
  - `headless chromium maps dvh == vh`, so asserting the 88dvh branch needs the 84vh fallback to differ (560px cut-off at 660 viewport).
  - The environment needs `playwright-core` installed at `/tmp/pwtest` (npm i playwright-core) before the suite runs; chromium ships at `/opt/pw-browsers/chromium-1194`.
- Next recommended run: real-file validation with the owner (identifiers + PO exports), then the deferred repo reorganization (`projects/` layout) as its own PR/session.

- Last audit: 2026-06-11
- Audit HEAD: 1dd690b (includes PR #5 round-2 merge)
- Status: routine (full) COMPLETE — all 14 backlog items + 3 of 6 future risks closed
- Backlog remaining: 0 P0 · 0 P1 · 0 P2 · 0 P3 open; risks left: CI-built artifacts (recommendation), tolerant-header report (nice-to-have), budget runway (owner-gated)
- Review: pre-approved (autopilot, full mode)
- Lessons:
  - Subagent narration drifts (two agents described their own fresh edits as "pre-existing"); verify artifacts via git diff + suite, never trust the prose.
  - The period-confirm "Use detected" button applies the display-ROUNDED months value — future upload assertions must use the rounded value (documented in tests/make-fixtures.mjs).
  - The vendored minified SheetJS UMD cannot WRITE {t:'d'} date cells from node; fixtures use ISO-string dates (identical app parse path).
  - .claude/ config files cannot be committed from this environment (permission classifier); the autopilot system lives only in the session workspace.
- Next: recommended run — "evolve" after the owner loads real prices (budget runway feature); re-audit only after the next feature round.

## Routine result (2026-06-11)

- Wave 1 HARDEN — fable-architect: A1 (negative demo prices — Management showed −2432M SAR), A2 (UTC/local calendar shift), A3 (filename-date validation), A4 (escape cell-sourced HTML), B1 (duplicate-file dedupe), B3 (save-failure toasts). opus-qa: 5-spec regression harness (sample figures, upload/period math, calendar TZ invariant, dedup, XSS) — verified 0/5 on pre-fix baseline, 5/5 post-fix. Commits d4e198b, 7bd0a74.
- Wave 2 EVOLVE — opus-data: named missing-column errors, unreadable-date surfacing, word-boundary column matching, debounced table-only search re-render, modal focus management, aria-sort + keyboard copy, averages empty state, unified quota-safe persistence, history export/import. opus-frontend: focus-visible system, reduced-motion, AA contrast (--muted 2.82:1 → 5.19:1), table scroll cues, print refinement, shell aria/meta. Commits 47fa37e, 1c8957c. opus-research: skipped (audit Phase 5 covered it — SheetJS 0.20.3 confirmed current/safe).
- Wave 3 POLISH — sonnet-runner: README round-2 reality, static hint sync, structured print signature, rebuild. Commit 335f223.
- Final gate: i18n parity 191/191, build deterministic, suite 5/5, built standalone smoke-tested (Riyadh TZ period correct, no negatives, zero page errors).
