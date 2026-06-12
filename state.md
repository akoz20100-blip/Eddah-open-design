# state.md — Dash project loop state

## Inventory-intelligence round (2026-06-12) — owner feature spec (in progress)

Owner dropped a 6-feature spec (stockout/reorder projection, expired handling,
expiry-risk, budget forecast, planner scorecard, styled xlsx export). Decisions:
**extend the live dashboard** (not a separate tool), **price-independent features
first** (F1-F4 + export; F5/F6 deferred until price+planner files arrive — only
join slots built now). Methods documented in AUDIT.md. Branch
`claude/beautiful-wright-0zzwws`, sequential PRs.

| PR | Item | Proof |
|----|------|-------|
| PR-B | Features 3+4 — new **Expiry Watch** tab: batch-level cross-cutting list, At-Risk (FEFO remainders) / Expired (physical Total Qty) filters, by-expiry/by-quantity sort, per-planner subtotals, value column deferred to prices. parseStock splits date-merged batches into live vs expired; expiryStats returns per-batch at-risk; item card lists expired batches separately. | `spec-expiryviews` red→green vs date-merged mirror: At-Risk 300/9.2M/206 prod, Expired 158/2.7M (TRETINOIN lot 0932001). Suite 24→25. |
| PR-A | Features 1+2 — Planner column + Stockout/Reorder-By dates + ORDER NOW on the planning table; projection block + daily burn in the item card; new optional planner-mapping upload slot with by-code/by-family join (Unassigned until file dropped). Daily burn = avg ÷ 30.44; stockout anchored on stock-as-of. | `spec-projection` red-first → green vs independent mirror on real files (LINAGLIPTIN cov 3.7 → 28 May 2026 ORDER NOW; LEVETIRACETAM cov 11.2 → 10 Jan 2027 healthy) + planner join proven via synthetic file; suite 23→24. Fixed 2 index/debounce-brittle specs (spec-dedup col shift, spec-realdata → setSearch). |

Remaining this round: PR-B (F3 expired view + F4 at-risk view), PR-C (styled xlsx export). Then stop for owner's next-round decision.


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
