# state.md — Dash project loop state

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
