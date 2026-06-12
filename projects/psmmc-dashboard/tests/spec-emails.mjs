// spec-emails — owner spec v3 wave 4b: ready-to-send Arabic procurement
// emails + the top-50 rankings.
//
// Owner asks under test:
//   - items with an open purchase order get a one-tap "expedite" email
//     («ايميل استعجال»): an Arabic mailto carrying the drug name, NUPCO code,
//     hospital item number, PO number and ordered quantity
//   - items with expired / soon-to-expire batches get a "request replacement"
//     email («ايميل تبديل الكميات المنتهية»): Arabic, listing the lot numbers,
//     quantities and expiry dates
//   - Management shows the **top 50 drugs by order spend** (from the ledger)
//     and the **top 50 items by inventory value** (stock × unit price)
//     («وش أعلى ٥٠ أدوية تستهلك فلوس… وش أعلى مخزون بقيمة أعلى ٥٠ بند»)

import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  setSearch,
  switchTab,
  makeReporter,
} from "./helpers.mjs";
import {
  expectedEffectiveFromRealFiles,
  expectedOrdersLedger,
  realUnitPrices,
  REAL_WD,
  REAL_ST,
  REAL_PLANNER,
  REAL_PRICES,
  REAL_ORDERS,
} from "./real-data-expected.mjs";

const R = makeReporter("spec-emails");
function fmtM(n) {
  n = Math.round(n); const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (a >= 1e4) return Math.round(n / 1e3) + "K";
  if (a >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}

const URGENCY_CODE = "5118242800600"; // open order 3200005967, qty 6000
const REPLACE_CODE = "5124122000100"; // TRETINOIN — expired batches (lots 0932001…)

// ---- expected rankings from the independent mirrors ------------------------
const L = expectedOrdersLedger();
const X = expectedEffectiveFromRealFiles({ withPlanner: true });
const PRICES = realUnitPrices();

const spend = [...L.byCode.entries()]
  .map(([code, list]) => ({ code, val: list.reduce((s, e) => s + (e.totalValue || 0), 0), n: list.length }))
  .filter((x) => x.val > 0)
  .sort((a, b) => b.val - a.val);
R.ok(spend[0].code === URGENCY_CODE, `mirror: top order-spend drug is ${URGENCY_CODE} (${fmtM(spend[0].val)})`);

const inv = [...X.perCode.entries()]
  .filter(([c, v]) => PRICES.has(c) && v.stock > 0)
  .map(([c, v]) => ({ code: c, val: v.stock * PRICES.get(c) }))
  .sort((a, b) => b.val - a.val);
const TOP_INV = inv[0].code;
R.ok(TOP_INV && inv[0].val > 0, `mirror: top inventory-value item is ${TOP_INV} (${fmtM(inv[0].val)})`);

const eo = L.byCode.get(URGENCY_CODE)[0];

// Read a mailto link's decoded subject + body from its href property.
function decodeMailto(href) {
  const q = href.slice(href.indexOf("?") + 1);
  const out = {};
  q.split("&").forEach((kv) => {
    const i = kv.indexOf("=");
    out[kv.slice(0, i)] = decodeURIComponent(kv.slice(i + 1).replace(/\+/g, " "));
  });
  return out;
}

async function openCard(page, code) {
  await setSearch(page, code);
  for (let i = 0; i < 30; i++) {
    const ok = await page.evaluate((c) => {
      if (document.querySelectorAll("table tbody tr").length > 60) return false;
      const tr = document.querySelector(`table tbody tr[data-code="${c}"]`);
      if (!tr) return false;
      tr.click();
      return true;
    }, code);
    if (ok) { await page.waitForSelector("#modalCard", { timeout: 4000 }); return true; }
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

const { browser, page, pageErrors } = await launch({ locale: "en" });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 120000 });
  await uploadFiles(page, "filePlanner", REAL_PLANNER);
  await page.waitForFunction(() => true);
  await uploadFiles(page, "fileMap", REAL_PRICES);
  await uploadFiles(page, "filePo", REAL_ORDERS);
  await page.waitForFunction(() => {
    try { return Object.keys(JSON.parse(localStorage.getItem("psmmc_orders_ledger_v1")).entries).length === 19; } catch (e) { return false; }
  }, null, { timeout: 20000 });

  // ---- urgency email on the open-order item ----------------------------------
  await openCard(page, URGENCY_CODE);
  const urgHref = await page.$eval("#mailUrgency", (a) => a.href).catch(() => null);
  R.ok(urgHref, "the expedite-order email button is present on an item with an open order");
  if (urgHref) {
    const m = decodeMailto(urgHref);
    R.ok(/استعجال/.test(m.subject), `urgency subject is Arabic "expedite" (got "${m.subject}")`);
    R.ok(m.body.includes(URGENCY_CODE), "urgency body carries the NUPCO code");
    R.ok(m.body.includes(eo.orderNo), `urgency body carries the order number ${eo.orderNo}`);
    R.ok(m.body.includes(eo.poNumber), `urgency body carries the PO number ${eo.poNumber}`);
    R.ok(m.body.includes(eo.qty.toLocaleString("en-US")), "urgency body carries the ordered quantity");
    R.ok(/رقم البند بالمستشفى/.test(m.body), "urgency body includes the hospital item-number line");
  }
  await page.keyboard.press("Escape");
  await page.waitForSelector("#modal", { state: "hidden", timeout: 4000 }).catch(() => {});

  // ---- replacement email on the expired-batch item ---------------------------
  await openCard(page, REPLACE_CODE);
  const repHref = await page.$eval("#mailReplace", (a) => a.href).catch(() => null);
  R.ok(repHref, "the request-replacement email button is present on an item with expired batches");
  if (repHref) {
    const m = decodeMailto(repHref);
    R.ok(/استبدال/.test(m.subject), `replacement subject is Arabic "replacement" (got "${m.subject}")`);
    R.ok(m.body.includes(REPLACE_CODE), "replacement body carries the NUPCO code");
    R.ok(/تشغيلة/.test(m.body), "replacement body lists batches by lot");
    R.ok(/0932001/.test(m.body), "replacement body names a real expired lot number (0932001)");
    R.ok(/انتهت|تنتهي/.test(m.body), "replacement body carries the expiry dates");
    R.ok(/إجمالي الكمية/.test(m.body), "replacement body totals the quantity");
  }
  await page.keyboard.press("Escape");
  await page.waitForSelector("#modal", { state: "hidden", timeout: 4000 }).catch(() => {});

  // ---- top-50 rankings on Management -----------------------------------------
  await switchTab(page, "management");
  await page.waitForSelector(".rankcard", { timeout: 8000 });
  const ranks = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".rankcard"));
    return cards.map((c) => {
      const title = c.querySelector(".ktitle").textContent.trim();
      const first = c.querySelector("tbody tr");
      return {
        title,
        firstCode: first ? first.querySelector("td.code")?.textContent.trim() : null,
        firstVal: first ? first.querySelector("td:last-child")?.textContent.trim() : null,
        rows: c.querySelectorAll("tbody tr").length,
      };
    });
  });
  const spendCard = ranks.find((r) => /spend|إنفاق/i.test(r.title));
  const invCard = ranks.find((r) => /inventory|مخزون/i.test(r.title));
  R.ok(spendCard, "Management has a top-by-order-spend card");
  R.ok(spendCard && spendCard.firstCode === URGENCY_CODE, `top-spend #1 is ${URGENCY_CODE} (got "${spendCard && spendCard.firstCode}")`);
  R.ok(spendCard && spendCard.firstVal.includes(fmtM(spend[0].val)), `top-spend #1 value ${fmtM(spend[0].val)} (got "${spendCard && spendCard.firstVal}")`);
  R.ok(spendCard && spendCard.rows === Math.min(50, spend.length), `top-spend lists up to 50 (got ${spendCard && spendCard.rows})`);
  R.ok(invCard, "Management has a top-by-inventory-value card");
  R.ok(invCard && invCard.firstCode === TOP_INV, `top-inventory #1 is ${TOP_INV} (got "${invCard && invCard.firstCode}")`);
  R.ok(invCard && invCard.firstVal.includes(fmtM(inv[0].val)), `top-inventory #1 value ${fmtM(inv[0].val)} (got "${invCard && invCard.firstVal}")`);
  R.eq(invCard && invCard.rows, 50, "top-inventory lists 50 items");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-emails completed without throwing");
} finally {
  await browser.close();
}

R.done();
