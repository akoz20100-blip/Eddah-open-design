// spec-seasonal — PLANNER FEATURE 8 (round 3): smart seasonal suggestion.
// With ≥6 months of saved history, the suggested order is forecast from the
// SAME upcoming calendar months of the prior year instead of the flat
// average, and a "seasonal" badge states the basis.
//
// Setup: seed 2025-04..2025-12 at 50 units/month for 5000001, then upload the
// Q1-2026 fixtures. Upcoming months after 2026-03 are 2026-04..2026-12, whose
// prior-year buckets are all seeded → seasonal qty9 = 9×50 = 450; with stock
// 1200 the suggestion is 0. The flat average would suggest ≈662 — the spec
// fails if the flat path is still used.

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

const R = makeReporter("spec-seasonal");
const WD = resolve(FIXTURES_DIR, "withdrawals-basic.xlsx");
const ST = resolve(FIXTURES_DIR, "stock-basic.xlsx");

const { browser, page, pageErrors } = await launch();
try {
  await open(page);

  // Seed prior-year history BEFORE the app reads it (reload re-runs init).
  // Under full-suite load the file:// localStorage write has been observed to
  // not survive an immediate reload (one-in-a-run flake): verify the seed is
  // still there after reload and retry once if the browser dropped it.
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.evaluate(() => {
      const ym = {};
      for (let m = 4; m <= 12; m++) ym[`2025-${String(m).padStart(2, "0")}`] = 50;
      localStorage.setItem(
        "psmmc_history_v1",
        JSON.stringify({ v: 1, items: { 5000001: { desc: "Paracetamol 500mg", uom: "TAB", ym } }, uploads: [] }),
      );
    });
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("#btnSample", { timeout: 5000 });
    const seeded = await page.evaluate(() => {
      try { return !!JSON.parse(localStorage.getItem("psmmc_history_v1")).items["5000001"]; } catch (e) { return false; }
    });
    if (seeded) break;
  }

  await uploadFiles(page, "fileWithdrawals", WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", ST);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });

  // 5000001: seasonal forecast 450 − stock 1200 → suggestion 0, badge shown.
  const row1 = await rowForCode(page, "5000001");
  const sugCell1 = row1[row1.length - 1];
  R.ok(sugCell1.includes("موسمي"), `seasonal badge shown on the suggested order (${sugCell1})`);
  R.ok(/(^|\s)0(\s|$)/.test(sugCell1.replace("موسمي", " ").trim()), `seasonal suggestion is 0 (prior-year demand covered by stock) — got "${sugCell1}"`);
  const qty9Cell1 = row1[row1.length - 2];
  R.eq(qty9Cell1, "450", "9-month quantity uses the prior-year same-months sum (9×50)");

  // 5000002 has no prior-year history → stays on the flat average, no badge.
  const row2 = await rowForCode(page, "5000002");
  R.ok(!row2.join(" ").includes("موسمي"), "item without prior-year history keeps the flat average (no badge)");

  // Drill-down states the basis.
  await page.click("table tbody tr[data-code='5000001']");
  await page.waitForSelector("#dtClose", { state: "visible", timeout: 5000 });
  const sheet = await page.$eval("#modalCard", (el) => el.textContent);
  R.ok(sheet.includes("اقتراح موسمي"), "drill-down note states the seasonal basis");
  R.ok(sheet.includes("9"), "basis mentions how many prior-year months matched");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-seasonal completed without throwing");
} finally {
  await browser.close();
}

R.done();
