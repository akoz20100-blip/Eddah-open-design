# AUTOPILOT — zero-touch end-to-end run

You have FULL PRE-APPROVAL for every step below. Do not stop to ask for
confirmation at any phase. Halt only on risk of irreversible data loss or
an unrecoverable failure — and if you halt, say exactly why and what remains.

## Phase 0 — Sync & integrate pending work
- `git fetch --all`. List open PRs (gh pr list) and check working tree.
- If a dashboard PR (e.g. round-2 work) is open: merge it into main IF it
  merges cleanly and its tests pass. If not, create your working branch FROM
  its head so none of that work is lost. Never discard or overwrite it.
- Create working branch: `autopilot/dash-<YYYYMMDD>`.
- Commit the installed `.claude/` system and this file.

## Phase 1 — Audit (read-only)
- Open `.claude/commands/audit.md` and execute its instructions yourself,
  fully and literally. Output: AUDIT.md + updated state.md. No code changes.

## Phase 2 — Pre-approval
- Append to state.md: `Review: pre-approved (autopilot, full mode)`.

## Phase 3 — Routine (full)
- Open `.claude/commands/routine.md` and execute it in mode **full**:
  respect the agent roster, wave structure (Harden → Evolve → Polish),
  hard limits (max 2 Fable-tier, max 5 Opus), disjoint file ownership,
  test suite between waves, one commit per wave.

## Phase 4 — Finalize
- Run the complete test suite one final time.
- Push the branch and open a PR titled `autopilot: harden + evolve <date>`
  containing the wave reports and the AUDIT.md snapshot.
- If every test passes and the PR is green → merge it to main.
  If anything fails → leave the PR open and state exactly what failed.
- Final report ≤ 20 lines: shipped / tested / merged-or-open / risks left /
  recommended next run.

## Standing rules
- Never force-push. Never touch branches other than yours (and main via merge).
- Everything must remain revertible through git history.
- If a phase produces zero items (e.g. no open PR), note it and continue.
