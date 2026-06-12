# state.md — Dash project loop state

## Routine v2 · Round 1 (2026-06-12) — Phase 0 + design track + real-data harness

- Baseline HEAD: `27042d1` (merge of PR #8) · suite 16/16 green before changes.
- Real-data set landed from PR #9 head (`ad2ec16` cherry-pick): outbound (sanitized),
  stock-on-hand `.xls`, MODHS catalog — now the round's primary validation evidence.

### Shipped (commit waves, suite green between each)

| Wave | What | Proof |
|------|------|-------|
| 0.1 English default | First visit renders English/LTR; Arabic toggle + persistence intact; EN copy proofread; manifest + title follow language | `spec-lang` (default, toggle, persistence, T.en/T.ar parity 233/233) |
| 0.2 Move to `projects/` | `psmmc-dashboard/` → `projects/psmmc-dashboard/`; build.py ROOT, publish workflow, guard allowlist updated | byte-identical build stamp before/after (`psmmc-75f9155fa8`); suite green from new path |
| 0.3 Repo rename | **BLOCKED — tooling**: GitHub MCP toolset has no repository-rename API (no `gh` CLI either); session repo scope is pinned to the current name. Owner action documented in the round report | — |
| Typography | Vendored Inter variable (latin subset) + IBM Plex Sans Arabic 400/600/700 (arabic subset); `html[lang=ar]` stack switch; tracking reset for Arabic; build.py inlines woff2 as data URIs | `spec-fonts` (files, data-URI inlining, FontFace resolution both languages, tabular-nums) |
| Real-data harness | `tests/real-data-expected.mjs` (independent mirror of parse rules) + `spec-realdata` driving all three REAL files through the actual upload slots | rendered figures == mirror: 1,005 medicines · period 01 Jan→10 Jun 2026 = 5.3 mo · stock-as-of 04 Feb 2026 · 63.3M units |
| Catalog-names fix | RED→GREEN: parseMapping now recognizes `MODHS ITEM DESCRIPTION`/`NUPCO ITEM DESCRIPTION` as name sources; "adrenaline" finds EPINEPHRINE rows, "acyclovir" finds ACICLOVIR | `spec-realdata` (was red on both before the one-line fix) |

### Part ownership log (found / improved / suggestions)

| Part | Found | Improved this round | Top suggestions (→ proposals) |
|------|-------|--------------------|-------------------------------|
| Parsers | MODHS catalog name columns unrecognized → name search dead on the real identifiers file; warning toast fired on the owner's real file | Catalog descriptions feed the scientific-name slot (red spec first) | Per-upload data-quality report; expiry-date intake (real outbound carries `Expiry Date`/`Batch`); multi-warehouse split via `Supply WH` |
| Calculation core | Figures verified against an independent mirror over real files — no drift found | Real-file regression net (`spec-realdata`) now guards every future change | Pure-function extraction for unit tests; ABC/VEN classification; forecasting |
| i18n / copy | EN copy was solid but Arabic-first; several EN strings missing articles/sentence case | English default + proofread; static parity check automated | Localized number formatting toggle (Arabic-Indic digits opt-in) |
| Design system | Font stack referenced Inter/Tajawal but vendored nothing — real devices fell back to system faces | Self-hosted subsetted type, Arabic heading rhythm, tabular numerals everywhere | Spacing-scale tokens; semantic status color audit; calmer card hierarchy (round-2 candidate) |
| Tests | 16 specs, all synthetic fixtures | +3 specs (lang, fonts, realdata); real files are now primary evidence | Period-modal real-file override case; PO ledger real file once owner supplies one |
| Build / PWA | build.py had no asset-inlining for fonts; size 1602 KB | Font data-URI inlining; size 1802 KB (+200 KB = the fonts, gzip 476→627 KB) | Minify app.js at build (≈−25% wire size); precompress for Pages |
| Publish workflow | Path triggers pointed at old directory | Updated to `projects/`; URL unchanged | Auto-build standalone in CI instead of committing built artifacts |

### Round-1 lessons

- Google Fonts serves Inter as a single variable woff2 (~47 KB latin) — one file
  covers 100–900, no per-weight downloads needed.
- The real MODHS catalog headers differ from every synthetic fixture; round-3's
  "names resolve" smoke claim was true only for codes/classification, not names.
  Real-file specs catch what fixture specs cannot.
- `page.click` on `#btnSample` times out in iPhone-viewport playwright (dock
  overlay); `evaluate(() => btn.click())` is the reliable harness path.

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
