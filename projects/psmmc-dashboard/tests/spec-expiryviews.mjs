// spec-expiryviews — FEATURES 3 + 4: dedicated Expired and At-Risk views.
//
// A new "Expiry watch" tab lists batch-level rows across the whole file:
//   - At-Risk (default): every live batch whose units will not be consumed
//     before it expires (FEFO vs the monthly burn), sortable by expiry/qty,
//     subtotaled per planner, with a value column that activates once prices
//     are loaded ("—" until then)
//   - Expired: every batch already past its expiry (read from Total Qty, since
//     NUPCO zeroes Available for expired stock), with the same breakdown
// The item card additionally lists a product's expired batches separately.
//
// Counts/qty are asserted against an independent mirror computed from the same
// real files (real-data-expected.mjs → expectedExpiryViewsFromRealFiles).

import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  setSearch,
  makeReporter,
} from "./helpers.mjs";
import { expectedExpiryViewsFromRealFiles, REAL_WD, REAL_ST } from "./real-data-expected.mjs";

const R = makeReporter("spec-expiryviews");
function fmtM(n) {
  n = Math.round(n);
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (a >= 1e4) return Math.round(n / 1e3) + "K";
  if (a >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

const X = expectedExpiryViewsFromRealFiles();
R.ok(X.atRisk.batches > 200, `mirror finds ${X.atRisk.batches} at-risk batches`);
R.ok(X.expired.batches > 100, `mirror finds ${X.expired.batches} expired batches`);

const AR_CODE = "5112172500100"; // BISOPROLOL 5MG — has at-risk batches
const EXP_CODE = "5124122000100"; // TRETINOIN 0.05% — has an expired batch (lot 0932001)

async function poll(page, fn, arg, timeout = 8000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const v = await page.evaluate(fn, arg);
    if (v) return v;
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

const { browser, page, pageErrors } = await launch({ locale: "en" });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });

  // ---- open the Expiry watch tab -------------------------------------------
  const tab = await page.$('.tab[data-view="expiry"]');
  R.ok(tab, "an Expiry watch tab exists in the dock");
  await page.click('.tab[data-view="expiry"]');
  const arState = await poll(page, (code) => {
    const rows = document.querySelectorAll("tr.batch-row[data-code]");
    if (!rows.length) return null;
    const qty = document.querySelector(".ev-total-qty");
    return {
      n: rows.length,
      qty: qty ? qty.textContent.replace(/\s+/g, " ").trim() : "",
      hasAnchor: !!document.querySelector(`tr.batch-row[data-code="${code}"]`),
      planner: [...document.querySelectorAll(".ev-planner")].map((e) => e.textContent.replace(/\s+/g, " ").trim()),
      value: (document.querySelector("tr.batch-row .ev-value") || {}).textContent || "",
    };
  }, AR_CODE);
  R.ok(arState, "At-Risk batch list renders by default");
  if (arState) {
    R.ok(arState.n === X.atRisk.batches, `At-Risk shows ${X.atRisk.batches} batch rows (got ${arState.n})`);
    R.ok(arState.qty.includes(fmtM(X.atRisk.qty)), `At-Risk total units ${fmtM(X.atRisk.qty)} shown (got "${arState.qty}")`);
    R.ok(arState.hasAnchor, `at-risk batch for ${AR_CODE} (BISOPROLOL) is listed`);
    R.ok(arState.planner.some((p) => /Unassigned/i.test(p)), `per-planner subtotal shows Unassigned (got ${JSON.stringify(arState.planner)})`);
    R.ok(/—|add prices/i.test(arState.value), `value column is pending prices (got "${arState.value.trim()}")`);
  }

  // ---- switch to Expired ----------------------------------------------------
  await page.click('.fchip[data-efilter="expired"]');
  const expState = await poll(page, (code) => {
    const rows = document.querySelectorAll("tr.batch-row[data-code]");
    if (!rows.length) return null;
    const qty = document.querySelector(".ev-total-qty");
    return {
      n: rows.length,
      qty: qty ? qty.textContent.replace(/\s+/g, " ").trim() : "",
      hasAnchor: !!document.querySelector(`tr.batch-row[data-code="${code}"]`),
      hasLot: document.body.textContent.includes("0932001"),
    };
  }, EXP_CODE);
  R.ok(expState, "Expired batch list renders after switching the filter");
  if (expState) {
    R.ok(expState.n === X.expired.batches, `Expired shows ${X.expired.batches} batch rows (got ${expState.n})`);
    R.ok(expState.qty.includes(fmtM(X.expired.qty)), `Expired total units ${fmtM(X.expired.qty)} shown (got "${expState.qty}")`);
    R.ok(expState.hasAnchor, `expired batch for ${EXP_CODE} (TRETINOIN) is listed`);
    R.ok(expState.hasLot, "the expired batch lot number (0932001) is shown");
  }

  // ---- item card lists expired batches separately ---------------------------
  await page.click(`tr.batch-row[data-code="${EXP_CODE}"]`);
  await page.waitForSelector("#modalCard .dt-title", { timeout: 5000 });
  const card = await page.evaluate(() => ({
    expiredBlock: !!document.querySelector("#modalCard .expired-block"),
    text: document.getElementById("modalCard").textContent.replace(/\s+/g, " "),
  }));
  R.ok(card.expiredBlock, "item card has a dedicated expired-batches block");
  R.ok(card.text.includes("0932001"), "item card expired block shows the lot number");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-expiryviews completed without throwing");
} finally {
  await browser.close();
}

R.done();
