# state.md — Dash project loop state

- Last audit: 2026-06-11
- Audit HEAD: 1dd690b (includes PR #5 round-2 merge)
- Status: audit complete → routine (full) running
- Backlog: P0:4 P1:4 P2:4 P3:2 | FABLE:3 OPUS:7 SONNET:4 (+6 future risks)
- Review: pre-approved (autopilot, full mode)
- Lessons: -
- Next: routine full — Wave 1 HARDEN (A1 A2 A3 A4 B1 B3 + test harness), Wave 2 EVOLVE (B2 B4 C1–C4 + history export), Wave 3 POLISH (D1 D2)

## Routine plan (written before dispatch)

File-ownership tracks per wave (no two agents share a file in the same wave):

- Wave 1 HARDEN
  - fable-architect → `psmmc-dashboard/app.js` + `psmmc-dashboard/sample-data.js`: A1, A2, A3, A4, B1, B3 (fable tier)
  - opus-qa → `psmmc-dashboard/tests/**` (new) only: e2e harness via playwright-core against the page; red-first asserts for A1/A2 where observable (opus tier)
  - fable-futurist deferred to Wave 2 — its quota/persistence work shares app.js with fable-architect, so it runs next wave to keep ownership disjoint
- Wave 2 EVOLVE
  - opus-data (absorbing fable-futurist's storage items) → `psmmc-dashboard/app.js`: B2, B4, C1, C2, C4, storage-quota helper, history export/import
  - opus-frontend → `psmmc-dashboard/styles.css` + `psmmc-dashboard/index.html`: C3 markup/styles, visual polish (no data logic)
  - opus-research → skipped: audit Phase 5 already produced the research findings (SheetJS status); no separate dispatch needed
- Wave 3 POLISH
  - sonnet-runner → `psmmc-dashboard/README.md` (D1), `index.html` static hint (D2, after Wave 2 lands), rebuild standalone

Test suite between waves: `node --check` on app/sample, `python3 build.py`, tests under `psmmc-dashboard/tests/` once Wave 1 lands.
