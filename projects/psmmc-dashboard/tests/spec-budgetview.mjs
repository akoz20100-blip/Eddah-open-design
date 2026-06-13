// spec-budgetview — owner wave 6 §F: budget redesign + per-month order cards
// + exports.
//
// F1: each upcoming month carries the SAR amount to spend, split per planner.
// F2: clicking a month opens a card listing that month's orders
//     (code/name/qty/planner/value).
// F3: every month card exports its own Excel report, and a single button
//     exports all orders from now to the end of the year.
// F4: the budget page shows — in one glance — spent (delivered), committed
//     (undelivered), remaining, and the monthly consumption value.
//
// Red-first: before the change there is no `.bo-stats` overview, the workload
// rows are not clickable (`.bw-row`), and the export buttons do not exist.

import { readFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  switchTab,
  makeReporter,
} from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";
import {
  expectedOrdersLedger,
  REAL_WD,
  REAL_ST,
  REAL_PRICES,
  REAL_PLANNER,
  REAL_ORDERS,
} from "./real-data-expected.mjs";

const R = makeReporter("spec-budgetview");
const L = expectedOrdersLedger();
// Real framework orders are all open (none delivered) → all their value is
// "committed but undelivered". Mirror spend = Σ Item Total Value.
const expectUndelivered = Math.round(L.spend);
R.ok(L.spend > 0, `mirror: ${L.count} open orders worth ${expectUndelivered} SAR`);

const { browser, page, pageErrors } = await launch({ locale: "en", contextOptions: { acceptDownloads: true } });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 120000 });
  await uploadFiles(page, "filePlanner", REAL_PLANNER);
  await page.waitForTimeout(1200);
  await uploadFiles(page, "fileMap", REAL_PRICES);
  await page.waitForTimeout(1500);
  await uploadFiles(page, "filePo", REAL_ORDERS);
  for (let i = 0; i < 60; i++) {
    const s = await page.evaluate(() => { try { return Object.keys(JSON.parse(localStorage.getItem("psmmc_orders_ledger_v1")).entries).length; } catch (e) { return -1; } });
    if (s === 19) break;
    await page.waitForTimeout(200);
  }

  await switchTab(page, "management");
  await page.waitForSelector(".budgetcard", { timeout: 8000 });

  // ---- F4: set a budget and read the one-glance overview ---------------------
  const BUDGET = 500000000;
  await page.fill("#brInput", String(BUDGET));
  await page.click("#brSave");
  await page.waitForSelector('.budgetcard .bo-stats .stat[data-k="remaining"]', { timeout: 8000 });
  const stats = await page.evaluate(() => {
    const out = {};
    document.querySelectorAll(".budgetcard .bo-stats .stat[data-k]").forEach((s) => {
      out[s.getAttribute("data-k")] = Number(s.querySelector("b").getAttribute("data-sar"));
    });
    return out;
  });
  R.ok("delivered" in stats && "undelivered" in stats && "remaining" in stats && "monthly" in stats,
    `budget overview shows spent/committed/remaining/monthly (keys: ${Object.keys(stats).join(",")})`);
  R.eq(stats.delivered, 0, "no delivered orders yet → spent = 0");
  R.ok(Math.abs(stats.undelivered - expectUndelivered) <= Math.max(2, expectUndelivered * 0.005),
    `committed (undelivered) value = Σ open-order value (${stats.undelivered} vs ${expectUndelivered})`);
  R.ok(Math.abs(stats.remaining - (BUDGET - stats.delivered - stats.undelivered)) <= 2,
    `remaining = budget − spent − committed (${stats.remaining})`);
  R.ok(stats.monthly > 0, `monthly consumption value present (${stats.monthly})`);

  // ---- F1/F2: clickable month card lists that month's orders -----------------
  const first = await page.evaluate(() => {
    const tr = document.querySelector(".workloadcard .bw-row");
    return tr ? { ym: tr.getAttribute("data-ym"), count: Number(tr.getAttribute("data-count")) } : null;
  });
  R.ok(first && first.count > 0, `workload rows are clickable (.bw-row), first month has ${first && first.count} orders`);
  await page.evaluate(() => document.querySelector(".workloadcard .bw-row").click());
  await page.waitForSelector(".month-table tbody tr", { timeout: 5000 });
  const monthInfo = await page.evaluate(() => ({
    rows: document.querySelectorAll(".month-table tbody tr").length,
    cols: document.querySelectorAll(".month-table thead th").length,
    split: !!document.querySelector(".mc-split .mc-chip"),
    hasExport: !!document.getElementById("monthExport"),
    firstHasValue: !!document.querySelector(".month-table tbody tr td.right"),
  }));
  R.eq(monthInfo.rows, first.count, "the month card lists exactly that month's orders");
  R.ok(monthInfo.cols >= 6, `month card columns: code/name/planner/qty/value (got ${monthInfo.cols})`);
  R.ok(monthInfo.split, "F1: the month card shows a per-planner split");
  R.ok(monthInfo.hasExport, "F3: the month card has its own export button");

  // ---- F3: per-month export carries exactly that month's rows ----------------
  const XLSX = loadXLSX();
  const dl1 = page.waitForEvent("download", { timeout: 20000 });
  await page.evaluate(() => document.getElementById("monthExport").click());
  const d1 = await dl1;
  const wb1 = XLSX.read(new Uint8Array(readFileSync(await d1.path())), { type: "array" });
  const sh1 = XLSX.utils.sheet_to_json(wb1.Sheets[wb1.SheetNames[0]], { header: 1, defval: "" });
  R.eq(sh1.length - 1, first.count, "the month export carries exactly that month's order rows");

  // close the month card
  await page.keyboard.press("Escape");
  await page.waitForSelector("#modal", { state: "hidden", timeout: 4000 }).catch(() => {});

  // ---- F3: export-to-year-end → Summary + Detail -----------------------------
  R.ok(await page.$("#bwExportYear"), "F3: an 'export to year-end' button exists");
  const dl2 = page.waitForEvent("download", { timeout: 20000 });
  await page.evaluate(() => document.getElementById("bwExportYear").click());
  const d2 = await dl2;
  const wb2 = XLSX.read(new Uint8Array(readFileSync(await d2.path())), { type: "array" });
  R.ok(wb2.SheetNames.includes("Summary") && wb2.SheetNames.includes("Detail"),
    `year-end export has Summary + Detail sheets (got ${wb2.SheetNames.join(",")})`);
  const detail = XLSX.utils.sheet_to_json(wb2.Sheets["Detail"], { header: 1, defval: "" });
  R.ok(detail.length - 1 >= first.count, `year-end Detail lists all orders to year-end (${detail.length - 1} ≥ ${first.count})`);

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-budgetview completed without throwing");
} finally {
  await browser.close();
}

R.done();
