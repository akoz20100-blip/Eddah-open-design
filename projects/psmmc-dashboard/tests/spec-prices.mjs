// spec-prices — owner spec v3 wave 3: the real per-unit price file activates
// every SAR figure, and the budget page forecasts the monthly order workload.
//
// The owner's price file carries `Generic Mat Code` + `Net Price/Per unit 1`:
// the price is already per dispensing unit — it must NOT be divided by a pack
// size, and the hospital counts in the same unit («إذا كانت المستشفى بالحب
// يحاسب فيكون السعر بالحب»). Under test:
//   - uploading the real price file through the identifiers slot prices the
//     rows (unit price + stock value on the management table, budget runway)
//   - the Expiry Watch value column / summary switch from "add prices" to
//     real SAR totals
//   - the budget page shows the MONTHLY ORDER WORKLOAD: for each upcoming
//     month, how many items hit their reorder-by date and at which planners
//     («أعرف كل شهر كم عدد الطلبات اللي ممكن أرفع وعند مين من المخططين»)
//   - prices persist on-device: a reload keeps the priced columns with no
//     re-upload («ملف الأسعار ويحفظها ما يحتاج أرفع كل مرة»)
//   - free-goods structure: when award + free quantities exist, the item card
//     splits the suggested order into paid/free shares that sum to the need
//     («يطلع كمية بفلوس والمجانية بحيث يكون مجموعها 1000»)

import { writeFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  setSearch,
  switchTab,
  makeReporter,
} from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";
import {
  expectedEffectiveFromRealFiles,
  expectedExpiryViewsFromRealFiles,
  realUnitPrices,
  GRACE_MONTHS,
  handDispensedUom,
  REAL_WD,
  REAL_ST,
  REAL_PLANNER,
  REAL_PRICES,
} from "./real-data-expected.mjs";

const R = makeReporter("spec-prices");
const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmt2 = (n) => (Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Math.round(n).toLocaleString("en-US");
function fmtM(n) {
  n = Math.round(n); const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (a >= 1e4) return Math.round(n / 1e3) + "K";
  if (a >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

// ---- expectations from the independent mirrors ------------------------------
const PRICES = realUnitPrices();
const X = expectedEffectiveFromRealFiles({ withPlanner: true });
// The file mixes drugs with 2,191 medical-supply codes; 672 unique DRUG
// prices remain after the prefix-5 filter — unpriced drugs stay "—".
R.ok(PRICES.size > 500, `price file carries ${PRICES.size} per-unit drug prices`);

// Priced anchor: in the table, has stock and a price.
let anchor = null;
for (const [code, v] of X.perCode) {
  if (PRICES.has(code) && v.stock > 0 && v.avg > 0) { anchor = { code, price: PRICES.get(code), ...v }; break; }
}
R.ok(anchor, `priced anchor found (${anchor && anchor.code} @ ${anchor && anchor.price} SAR/unit, stock ${anchor && anchor.stock})`);

// Budget figures: monthly consumption value = Σ avg × unit price.
let monthlyVal = 0;
for (const [code, v] of X.perCode) if (PRICES.has(code) && v.avg > 0) monthlyVal += v.avg * PRICES.get(code);
R.ok(monthlyVal > 0, `monthly consumption value ${fmtM(monthlyVal)} SAR`);

// Monthly order workload: bucket reorder-by dates by calendar month (overdue
// collapses into the current month), counting items per planner.
const todayYm = X.todayIso.slice(0, 7);
const workload = new Map();
for (const [, v] of X.perCode) {
  if (!v.reorderIso || v.avg <= 0) continue;
  const ym = v.reorderIso <= X.todayIso ? todayYm : v.reorderIso.slice(0, 7);
  const b = workload.get(ym) || { count: 0, planners: new Map() };
  b.count++;
  const p = v.planner || "?";
  b.planners.set(p, (b.planners.get(p) || 0) + 1);
  workload.set(ym, b);
}
const nowBucket = workload.get(todayYm);
R.ok(nowBucket && nowBucket.count > 100, `current-month workload bucket has ${nowBucket && nowBucket.count} orders`);
const topPlanner = nowBucket && [...nowBucket.planners.entries()].sort((a, b) => b[1] - a[1])[0];
R.ok(topPlanner && topPlanner[0] !== "?", `top planner this month: ${topPlanner && topPlanner[0]} (${topPlanner && topPlanner[1]})`);

// Expiry-watch at-risk value: Σ per-batch at-risk remainder × unit price.
const EV = expectedExpiryViewsFromRealFiles();
R.ok(EV.atRisk.batches > 300, `at-risk batches (grace-aware): ${EV.atRisk.batches}`);

// Free-goods fixture: award 500 / free 500 (50% free) on the anchor.
const FREE_FIX = "/tmp/psmmc-free-goods.xlsx";
{
  const XLSX = loadXLSX();
  const aoa = [
    ["NUPCO Code", "Awarded Qty", "Free Qty"],
    [anchor.code, 500, 500],
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Sheet1");
  writeFileSync(FREE_FIX, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

const { browser, page, pageErrors } = await launch({ locale: "en" });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });
  await uploadFiles(page, "filePlanner", REAL_PLANNER);
  await page.waitForSelector("#toast:not([hidden])", { timeout: 20000 });

  // ---- price upload through the identifiers slot -----------------------------
  await uploadFiles(page, "fileMap", REAL_PRICES);
  await page.waitForSelector("#toast:not([hidden])", { timeout: 30000 });

  // Management table: unit price + stock value for the anchor.
  await switchTab(page, "management");
  await setSearch(page, anchor.code);
  let row = null;
  for (let i = 0; i < 30 && !row; i++) {
    row = await page.evaluate((c) => {
      if (document.querySelectorAll("table tbody tr").length > 60) return null;
      const tr = document.querySelector(`table tbody tr[data-code="${c}"]`);
      return tr ? Array.from(tr.querySelectorAll("td")).map((td) => td.textContent.trim()) : null;
    }, anchor.code);
    if (!row) await new Promise((r) => setTimeout(r, 200));
  }
  R.ok(row, `management row for ${anchor.code} found`);
  if (row) {
    R.ok(row.includes(fmt2(anchor.price)), `unit price ${fmt2(anchor.price)} SAR rendered, NOT divided by any pack size (row: ${row.join(" | ")})`);
    R.ok(row.includes(fmtInt(anchor.stock * anchor.price)), `stock value = stock × unit price = ${fmtInt(anchor.stock * anchor.price)}`);
  }

  // Budget runway card: monthly consumption value live.
  const budgetTxt = await page.evaluate(() => document.querySelector(".budgetcard")?.textContent.replace(/\s+/g, " ") || "");
  R.ok(budgetTxt.includes(fmtM(monthlyVal)), `budget card shows monthly value ${fmtM(monthlyVal)} (got "${budgetTxt.slice(0, 160)}")`);

  // ---- monthly order workload (budget page) ----------------------------------
  const workloadTxt = await page.evaluate(() => document.querySelector(".workloadcard")?.textContent.replace(/\s+/g, " ") || "");
  R.ok(workloadTxt.length > 0, "budget page has a monthly order-workload card");
  R.ok(workloadTxt.includes(fmtInt(nowBucket.count)), `current month lists ${fmtInt(nowBucket.count)} orders to raise (got "${workloadTxt.slice(0, 200)}")`);
  R.ok(workloadTxt.includes(topPlanner[0]), `workload names the planner ${topPlanner[0]}`);

  // ---- Expiry Watch values ----------------------------------------------------
  await switchTab(page, "expiry");
  await page.waitForSelector(".expiry-summary", { timeout: 10000 });
  const evTxt = await page.evaluate(() => document.querySelector(".expiry-summary")?.textContent.replace(/\s+/g, " ") || "");
  R.ok(!/add prices|أضف الأسعار/i.test(evTxt), `expiry summary no longer says "add prices" (got "${evTxt.slice(0, 160)}")`);
  R.ok(/SAR|ريال|﷼/i.test(evTxt) || /[\d.]+[MK]/.test(evTxt), "expiry summary carries a SAR value figure");
  const rowVal = await page.evaluate(() => {
    const tr = document.querySelector("table.t-exp tbody tr");
    if (!tr) return null;
    const tds = Array.from(tr.querySelectorAll("td")).map((td) => td.textContent.trim());
    return tds[tds.length - 1];
  });
  R.ok(rowVal != null && rowVal !== "—" && rowVal !== "", `at-risk batch rows carry a value (got "${rowVal}")`);

  // ---- persistence: reload keeps the prices ----------------------------------
  // file:// localStorage occasionally needs a moment to flush under suite
  // load (same environment flake spec-seasonal hardens against): give the
  // write a beat and retry the reload check before judging.
  let priced = 0;
  for (let attempt = 0; attempt < 3 && priced <= 500; attempt++) {
    await new Promise((r) => setTimeout(r, 600));
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("#btnSample");
    priced = await page.evaluate(() => {
      try { return JSON.parse(localStorage.getItem("psmmc_idmap_v1") || "{}").priced || 0; } catch (e) { return 0; }
    });
  }
  R.ok(priced > 500, `prices persisted on-device across reload (${priced} priced codes)`);

  // ---- free-goods split on the item card --------------------------------------
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });
  await uploadFiles(page, "fileMap", FREE_FIX);
  await page.waitForSelector("#toast:not([hidden])", { timeout: 20000 });
  await setSearch(page, anchor.code);
  let opened = false;
  for (let i = 0; i < 30 && !opened; i++) {
    opened = await page.evaluate((c) => {
      if (document.querySelectorAll("table tbody tr").length > 60) return false;
      const tr = document.querySelector(`table tbody tr[data-code="${c}"]`);
      if (!tr) return false;
      tr.click();
      return true;
    }, anchor.code);
    if (!opened) await new Promise((r) => setTimeout(r, 200));
  }
  await page.waitForSelector("#modalCard .statgrid", { timeout: 5000 });
  // award 500 / free 500 → 50% free: the card's own suggested order must
  // split into paid + free shares that SUM back to it (self-consistent
  // against whatever stock/planner state survived the reload).
  const split = await page.evaluate(() => {
    const card = document.getElementById("modalCard");
    const items = Array.from(card.querySelectorAll(".priceblock .pb-item"));
    const grab = (re) => {
      const it = items.find((x) => re.test(x.textContent));
      return it ? parseInt(it.querySelector("b").textContent.replace(/,/g, ""), 10) : null;
    };
    const sugStat = Array.from(card.querySelectorAll(".statgrid .stat"))
      .find((s) => /suggested order|الطلب المقترح/i.test(s.textContent));
    return {
      paid: grab(/paid share|الكمية المدفوعة/i),
      free: grab(/free share|الكمية المجانية/i),
      pct: items.some((x) => /50% free|50% مجاني/.test(x.textContent)),
      sug: sugStat ? parseInt(sugStat.querySelector("b").textContent.replace(/,/g, ""), 10) : null,
    };
  });
  R.ok(split.sug > 0, `anchor card shows a positive suggested order (${split.sug})`);
  R.ok(split.paid != null && split.free != null, `item card carries paid + free shares (got ${JSON.stringify(split)})`);
  R.ok(split.paid != null && split.paid + split.free === split.sug,
    `paid ${split.paid} + free ${split.free} = suggested ${split.sug}`);
  R.ok(split.pct, "free share states the 50% ratio");
  R.ok(split.free != null && Math.abs(split.free - split.sug / 2) <= 1, "50% free → the shares split the need in half");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-prices completed without throwing");
} finally {
  await browser.close();
}

R.done();
