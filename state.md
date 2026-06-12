# state.md — Dash project loop state

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
