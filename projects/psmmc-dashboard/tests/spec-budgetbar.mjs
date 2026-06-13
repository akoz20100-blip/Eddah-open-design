// spec-budgetbar — wave-6 UX (P1-4): give the budget overview a single
// spent + committed vs budget progress bar so "how much is left" is a SHAPE,
// not just five equal numbers.
//
// Red-first: the §F budget card shows the figures (.bo-stats) but no visual
// ratio. This adds a `.bo-bar` with a spent segment + a committed segment over a
// remaining track; the segment widths must match delivered/undelivered ÷ budget.
// Reference: Stephen Few (bullet/budget-vs-actual) + Refactoring UI (visual ratios).

import {
  launch, open, uploadFiles, confirmDetectedPeriod, switchTab, makeReporter,
} from "./helpers.mjs";
import {
  REAL_WD, REAL_ST, REAL_PRICES, REAL_PLANNER, REAL_ORDERS,
} from "./real-data-expected.mjs";

const R = makeReporter("spec-budgetbar");

const { browser, page, pageErrors } = await launch({ locale: "en" });
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
  const BUDGET = 500000000;
  await page.fill("#brInput", String(BUDGET));
  await page.click("#brSave");
  await page.waitForSelector(".budgetcard .bo-bar", { timeout: 8000 });

  const r = await page.evaluate(() => {
    const stat = (k) => { const el = document.querySelector('.budgetcard .bo-stats .stat[data-k="' + k + '"] b'); return el ? Number(el.getAttribute("data-sar")) : null; };
    const bar = document.querySelector(".budgetcard .bo-bar");
    const seg = (c) => { const el = bar.querySelector(".bo-seg.bo-" + c); return el ? parseFloat(getComputedStyle(el).width) : null; };
    return {
      budget: stat("budget"), delivered: stat("delivered"), undelivered: stat("undelivered"),
      spentPct: Number(bar.getAttribute("data-spent-pct")),
      commPct: Number(bar.getAttribute("data-committed-pct")),
      barW: parseFloat(getComputedStyle(bar).width),
      spentW: seg("spent"), commW: seg("committed"),
    };
  });
  R.ok(r.budget === BUDGET, `budget read back (${r.budget})`);
  const expSpent = (r.delivered / r.budget) * 100;
  const expComm = (r.undelivered / r.budget) * 100;
  R.ok(Math.abs(r.spentPct - expSpent) <= 0.2, `spent segment % = delivered/budget (${r.spentPct} vs ${expSpent.toFixed(2)})`);
  R.ok(Math.abs(r.commPct - expComm) <= 0.2, `committed segment % = undelivered/budget (${r.commPct} vs ${expComm.toFixed(2)})`);
  R.ok(r.undelivered > 0 && r.commW > 0, `committed value > 0 renders a visible committed segment (${r.commW.toFixed(1)}px)`);
  // committed pixel width ≈ commPct of the bar width.
  R.ok(Math.abs(r.commW - (r.commPct / 100) * r.barW) <= 2, `committed segment pixel width matches its % of the bar`);
  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-budgetbar completed without throwing");
} finally {
  await browser.close();
}

R.done();
