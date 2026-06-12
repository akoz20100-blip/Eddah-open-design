// spec-threshold — PLANNER FEATURE 11 (round 3): per-item alert threshold.
// The drill-down lets the planner override the 6-month rule for one item
// (e.g. alert a critical drug at 13 months); the override is persisted and
// marked in the table, and clearing it restores the default rule.
//
// Setup: Q1 with the 6-month override → 5000001 avg 100, cov 12.0 → OK under
// the default rule, but "order now" under a 13-month threshold.

import { resolve } from "node:path";
import {
  launch,
  open,
  uploadFiles,
  choosePeriodOverride,
  rowForCode,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-threshold");
const WD = resolve(FIXTURES_DIR, "withdrawals-basic.xlsx");
const ST = resolve(FIXTURES_DIR, "stock-basic.xlsx");

const { browser, page, pageErrors } = await launch();
try {
  await open(page);
  await uploadFiles(page, "fileWithdrawals", WD);
  await choosePeriodOverride(page, 6);
  await uploadFiles(page, "fileStock", ST);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });

  let row = await rowForCode(page, "5000001");
  R.ok(row.join(" ").includes("جيد"), "baseline: 12.0 months coverage is OK under the default 6-month rule");

  // Set a 13-month threshold from the drill-down.
  await page.click("table tbody tr[data-code='5000001']");
  await page.waitForSelector("#thInput", { timeout: 5000 });
  await page.fill("#thInput", "13");
  await page.click("#thSave");
  await page.waitForSelector("#thClear", { timeout: 5000 });

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("psmmc_threshold_v1")));
  R.ok(saved && saved.byCode["5000001"] === 13, "threshold persisted per item");

  await page.keyboard.press("Escape");
  await page.waitForSelector("#modal", { state: "hidden", timeout: 3000 });

  row = await rowForCode(page, "5000001");
  R.ok(row.join(" ").includes("اطلب الآن"), "12.0 ≤ 13 → status flips to 'order now' under the override");
  const hasFlag = await page.$eval("table tbody tr[data-code='5000001']", (tr) => !!tr.querySelector(".th-flag"));
  R.ok(hasFlag, "table row marked with the custom-threshold flag");

  // Clear restores the default rule.
  await page.click("table tbody tr[data-code='5000001']");
  await page.waitForSelector("#thClear", { timeout: 5000 });
  await page.click("#thClear");
  await page.waitForFunction(
    () => {
      const v = JSON.parse(localStorage.getItem("psmmc_threshold_v1") || "{}");
      return !(v.byCode && v.byCode["5000001"]);
    },
    null,
    { timeout: 3000 },
  );
  await page.keyboard.press("Escape");
  await page.waitForSelector("#modal", { state: "hidden", timeout: 3000 });
  row = await rowForCode(page, "5000001");
  R.ok(row.join(" ").includes("جيد"), "clearing the override restores OK under the 6-month rule");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-threshold completed without throwing");
} finally {
  await browser.close();
}

R.done();
