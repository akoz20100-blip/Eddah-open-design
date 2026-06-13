// spec-budgetplan — wave 6 §F: budget redesign + per-month order plan + export.
//
// F1: each upcoming month shows the value to be spent (Σ suggested qty × unit
//     price) — already on the workload card.
// F2: clicking a month opens a card listing the medicines to order that month
//     (code / name / planner / qty / value).
// F3: a per-month Excel export from that card, AND a one-click "export every
//     order from now to year-end" on the workload card.
// F4: a single-glance budget overview — budget set · spent (delivered) ·
//     remaining · undelivered order value · delivered order value.
//
// Driven against the real files (prices + planner + framework orders) so the
// money figures and the ledger split are real.

import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  switchTab,
  makeReporter,
} from "./helpers.mjs";
import { REAL_WD, REAL_ST, REAL_PLANNER, REAL_PRICES, REAL_ORDERS } from "./real-data-expected.mjs";

const R = makeReporter("spec-budgetplan");

const { browser, page, pageErrors } = await launch({
  locale: "en",
  contextOptions: { acceptDownloads: true },
});
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 120000 });
  await uploadFiles(page, "filePlanner", REAL_PLANNER);
  await uploadFiles(page, "fileMap", REAL_PRICES);
  await page.waitForSelector("#toast:not([hidden])", { timeout: 30000 }).catch(() => {});
  await uploadFiles(page, "filePo", REAL_ORDERS);
  await page.waitForFunction(() => { try { return Object.keys(JSON.parse(localStorage.getItem("psmmc_orders_ledger_v1")).entries).length === 19; } catch (e) { return false; } }, null, { timeout: 20000 });

  await switchTab(page, "management");
  await page.waitForSelector(".workloadcard", { timeout: 8000 });

  // ---- F1 + F2: clickable months ------------------------------------------
  const wl = await page.evaluate(() => {
    const rows = [...document.querySelectorAll(".workloadcard tbody tr.bw-row")];
    const valued = rows.some((tr) => /\d/.test(tr.querySelector("td:nth-child(4)")?.textContent || ""));
    return { rows: rows.length, hasYearExport: !!document.getElementById("bwExportYear"), valued };
  });
  R.ok(wl.rows > 0, `F2: workload months are clickable rows (got ${wl.rows})`);
  R.ok(wl.hasYearExport, "F3: a year-end export button is on the workload card");
  R.ok(wl.valued, "F1: months show a SAR value column");

  // Click the first month → the medicine list modal.
  await page.click(".workloadcard tbody tr.bw-row");
  await page.waitForSelector(".modal-md .t-md", { timeout: 5000 });
  const modal = await page.evaluate(() => {
    const rows = document.querySelectorAll(".modal-md .t-md tbody tr");
    return {
      rows: rows.length,
      firstHasCode: !!rows[0]?.querySelector("td.code[data-copy]"),
      hasExport: !!document.getElementById("mdExport"),
    };
  });
  R.ok(modal.rows > 0, `F2: the month card lists the medicines to order (got ${modal.rows})`);
  R.ok(modal.firstHasCode, "F2: each listed medicine shows its (copyable) code");
  R.ok(modal.hasExport, "F3: the month card offers a per-month export");

  // ---- F3: per-month export download ---------------------------------------
  const dl1 = page.waitForEvent("download", { timeout: 15000 });
  await page.click("#mdExport");
  const d1 = await dl1;
  R.ok(/PSMMC_order_plan_\d{4}-\d{2}\.xlsx$/.test(d1.suggestedFilename()), `F3: per-month export downloads (got "${d1.suggestedFilename()}")`);
  await page.keyboard.press("Escape");

  // ---- F3: year-end export download ----------------------------------------
  const dl2 = page.waitForEvent("download", { timeout: 15000 });
  await page.click("#bwExportYear");
  const d2 = await dl2;
  R.ok(/PSMMC_orders_to_year_end_.*\.xlsx$/.test(d2.suggestedFilename()), `F3: year-end export downloads (got "${d2.suggestedFilename()}")`);

  // ---- F4: budget overview -------------------------------------------------
  const bo = await page.evaluate(() => {
    const card = document.querySelector(".budgetoverview");
    if (!card) return null;
    const labels = [...card.querySelectorAll(".stat i")].map((e) => e.textContent.trim());
    return { labels, text: card.textContent.replace(/\s+/g, " ") };
  });
  R.ok(bo, "F4: a budget overview card is shown");
  R.ok(bo && ["Budget set", "Spent (delivered)", "Remaining", "Undelivered orders", "Delivered orders"].every((l) => bo.labels.includes(l)),
    `F4: overview shows budget/spent/remaining/undelivered/delivered (got ${JSON.stringify(bo && bo.labels)})`);

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.stack);
  R.ok(false, "spec-budgetplan completed without throwing");
} finally {
  await browser.close();
}

R.done();
