// spec-budget — OWNER REQUEST 5 (round 3): budget runway on the Management
// tab. Without prices: activation hint. With prices: the owner enters the
// remaining budget (persisted locally) and reads months-it-lasts =
// budget ÷ Σ(avg × unitPrice) plus a projected run-out date.

import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  switchTab,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-budget");
const WD = resolve(FIXTURES_DIR, "withdrawals-basic.xlsx");
const ST = resolve(FIXTURES_DIR, "stock-basic.xlsx");
const MAP_PRICES = resolve(FIXTURES_DIR, "map-prices.xlsx");
const expected = JSON.parse(readFileSync(resolve(FIXTURES_DIR, "expected.json"), "utf8"));

const { browser, page, pageErrors } = await launch();
try {
  await open(page);
  await uploadFiles(page, "fileWithdrawals", WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", ST);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });

  // No prices yet → activation hint, no input.
  await switchTab(page, "management");
  await page.waitForSelector(".budgetcard", { timeout: 5000 });
  const hintCard = await page.$eval(".budgetcard", (el) => el.textContent);
  R.ok(hintCard.includes("أضف الأسعار"), "without prices the budget card shows the activation hint");
  R.ok(!(await page.$("#brInput")), "no budget input before prices are loaded");

  // Load prices (5000001: pack 100 / 10 units = 10 SAR per unit).
  await uploadFiles(page, "fileMap", MAP_PRICES);
  await page.waitForSelector("#brInput", { timeout: 5000 });

  // months = budget ÷ (avg × unitPrice). avg uses the confirmed detected
  // months from expected.json.
  const avg = expected.basic.drugCode_inStock.avg;
  const monthlyValue = avg * 10;
  const budget = 6000;
  const months = budget / monthlyValue;
  const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });

  await page.fill("#brInput", String(budget));
  await page.click("#brSave");
  await page.waitForSelector("#brMonths", { timeout: 5000 });
  const shownMonths = await page.$eval("#brMonths", (el) => el.textContent.trim());
  R.eq(shownMonths, fmt1(months), "months-it-lasts = budget ÷ monthly consumption value");
  const runout = await page.$eval("#brRunout", (el) => el.textContent.trim());
  R.ok(/20\d\d/.test(runout), `projected run-out date rendered (${runout})`);

  // Persisted locally.
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem("psmmc_budget_v1")));
  R.ok(saved && saved.amount === budget, "budget persisted to this device");

  // Survives a view round-trip with the saved value pre-filled.
  await switchTab(page, "planning");
  await switchTab(page, "management");
  await page.waitForSelector("#brInput", { timeout: 5000 });
  const refilled = await page.$eval("#brInput", (el) => el.value);
  R.eq(refilled, String(budget), "saved budget pre-fills the input on re-render");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-budget completed without throwing");
} finally {
  await browser.close();
}

R.done();
