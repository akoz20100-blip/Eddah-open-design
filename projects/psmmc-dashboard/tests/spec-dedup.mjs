// spec-dedup — GUARDS AUDIT ITEM B1: duplicate withdrawals upload must not
// double the totals.
//
// The withdrawals onchange handler combines ALL selected files via
// combineWithdrawals(), which SUMS per-code quantities. Selecting the same
// content twice in one go therefore doubles every total/avg unless the app
// de-duplicates identical uploads. This spec uploads two byte-identical files
// with different names (withdrawals-basic.xlsx + withdrawals-dup.xlsx) so the
// browser yields two file entries even if it would dedupe identical PATHS;
// this covers the same-CONTENT duplicate case.
//
// EXPECTED (post-fix): code 5000001 total stays 600 (not 1200) and avg stays
// 206.9 (not 413.8). Pre-fix this spec goes red because totals double.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  rowForCode,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-dedup");
const expected = JSON.parse(readFileSync(resolve(FIXTURES_DIR, "expected.json"), "utf8"));
const WD = resolve(FIXTURES_DIR, "withdrawals-basic.xlsx");
const WD_DUP = resolve(FIXTURES_DIR, "withdrawals-dup.xlsx"); // identical bytes, different name
const ST = resolve(FIXTURES_DIR, "stock-basic.xlsx");

const { browser, page, pageErrors } = await launch();
try {
  await open(page);

  // Select the same content twice in ONE selection.
  await uploadFiles(page, "fileWithdrawals", [WD, WD_DUP]);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", ST);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);

  const E = expected.basic.drugCode_inStock;
  const row = await rowForCode(page, E.code);
  R.ok(!!row, `row for ${E.code} present`);
  if (row) {
    const joined = row.join(" | ");
    // Columns: code(0) desc(1) planner(2) uom(3) total(4) — the Planner column
    // (FEATURE 1) sits after the description, so the total is at index 4.
    const totalCell = row[4].replace(/[,\s]/g, "");
    R.ok(
      totalCell === String(E.total),
      `[B1] total NOT doubled: expected ${E.total}, got ${totalCell} (row: "${joined}")`,
    );
    // Monthly avg must equal the single-upload avg (206.9), not 2× (413.8).
    R.ok(
      joined.includes(E.avg_fmt1),
      `[B1] avg NOT doubled: expected ${E.avg_fmt1} (row: "${joined}")`,
    );
    // Doubled avg would read 413.8; doubled total cell would read 1,200.
    R.ok(
      !joined.includes("413.8") && totalCell !== "1200",
      `[B1] no doubled figures present (avg!=413.8, total!=1200) (row: "${joined}")`,
    );
  }
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-dedup completed without throwing");
} finally {
  await browser.close();
}

R.done();
