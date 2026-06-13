// spec-ledger — owner spec v3 wave 4a: the procurement orders ledger.
//
// Uploading the framework-agreement export through the orders slot builds a
// persistent ledger (owner rules):
//   - the composite NUPCO CODE (`code_tradecode_supplier`) keys on its drug
//     code; rejected/cancelled rows are excluded on import
//     («استثني منها المرفوضه»)
//   - identity is Child order + code, so re-uploading the same report adds
//     nothing («اذا نفس الرقم ما يضيفة واذا رقم مختلف يضيفهة»)
//   - the ledger persists across reloads (survives the order completing)
//   - the textual order date "Wed Dec 31 13:25:14 AST 2025" parses correctly
//     (V8 rejects the AST zone)
// Each item that carries an open order shows it in two places — a table badge
// and a card block with the order number/date/qty/status («في كرت البند ويكون
// موجود في الجدول هل عليه طلب او لا») — the order number is copyable, items
// tight-but-already-ordered get a dedicated filter, and an open order keeps
// the item OUT of the order sheet.

import { writeFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  setSearch,
  makeReporter,
} from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";
import {
  expectedEffectiveFromRealFiles,
  expectedOrdersLedger,
  REAL_WD,
  REAL_ST,
  REAL_ORDERS,
} from "./real-data-expected.mjs";

const R = makeReporter("spec-ledger");
const pretty = (iso) =>
  new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const L = expectedOrdersLedger();
const X = expectedEffectiveFromRealFiles();
R.ok(L.count === 19 && L.rejected === 0, `mirror: ${L.count} drug orders, ${L.rejected} rejected, ${L.openCount} open`);

// order_now + open-order anchor (the "tight but already ordered" case) and a
// not-in-stock + open anchor.
const ORDER_OPEN = "5118242800600"; // order_now, open order 3200005967
const NIS_OPEN = "5114200100000";
const eo = L.byCode.get(ORDER_OPEN)?.[0];
const xo = X.perCode.get(ORDER_OPEN);
R.ok(eo && eo.open && xo && xo.status === "order_now",
  `mirror: ${ORDER_OPEN} is order_now with open order ${eo && eo.orderNo} (${eo && eo.date})`);

// covered-order count = dashboard rows that are order_now AND have an open order.
let coveredExpected = 0;
for (const [code, v] of X.perCode) {
  if (v.status !== "order_now") continue;
  const list = L.byCode.get(code);
  if (list && list.some((e) => e.open)) coveredExpected++;
}
R.ok(coveredExpected > 0, `mirror: ${coveredExpected} items are order_now with an open order`);

// Synthetic framework file with a REJECTED drug row + an OPEN drug row, to
// prove the import-time exclusion deterministically (the real file has no
// rejected drug rows).
const REJ_FIX = "/tmp/psmmc-orders-reject.xlsx";
const OPEN_CODE = "5999990001000", REJ_CODE = "5999990002000";
{
  const XLSX = loadXLSX();
  const aoa = [
    ["Child order", "Order Date", "Framework Agreement Number", "Status", "NUPCO CODE", "Quantity", "PO Number", "Item Total Value"],
    ["3200099001", "Wed Jan 14 09:00:00 AST 2026", "5500000099", "جاري التنفيذ", OPEN_CODE + "_x_400", 1234, "4600199001", 5000],
    ["3200099002", "Thu Jan 15 09:00:00 AST 2026", "5500000099", "تم الرفض من المالية", REJ_CODE + "_x_400", 999, "", 9999],
  ];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Sheet1");
  writeFileSync(REJ_FIX, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

async function rowInfo(page, code) {
  await setSearch(page, code);
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const v = await page.evaluate((c) => {
      if (document.querySelectorAll("table tbody tr").length > 60) return null;
      const tr = document.querySelector(`table tbody tr[data-code="${c}"]`);
      if (!tr) return null;
      const st = tr.querySelector("td:nth-last-child(3)") || tr;
      return { badges: tr.textContent.replace(/\s+/g, " "), hasOpen: /Order placed|عليه طلب/.test(tr.textContent) };
    }, code);
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
  await page.waitForSelector("table tbody tr", { timeout: 120000 });

  // Poll the persisted ledger size (deterministic — avoids racing the toast,
  // whose "#toast:not([hidden])" can still match a lingering compute toast).
  const ledgerSize = () => page.evaluate(() => {
    try { return Object.keys(JSON.parse(localStorage.getItem("psmmc_orders_ledger_v1")).entries).length; } catch (e) { return -1; }
  });
  const waitLedger = async (n) => {
    for (let i = 0; i < 60; i++) { if ((await ledgerSize()) === n) return true; await new Promise((r) => setTimeout(r, 200)); }
    return false;
  };

  // ---- upload the real framework orders through the orders slot --------------
  await uploadFiles(page, "filePo", REAL_ORDERS);
  R.ok(await waitLedger(19), `ledger persisted 19 entries (got ${await ledgerSize()}; rejected excluded — none here)`);
  // The render driven by the upload must have run before we read the table.
  await page.waitForFunction(() => document.querySelector('.fchip[data-filter="covered_order"]'), null, { timeout: 8000 }).catch(() => {});

  // ---- table badge on the order_now + open anchor ----------------------------
  const ord = await rowInfo(page, ORDER_OPEN);
  R.ok(ord && ord.hasOpen, `table row ${ORDER_OPEN} shows the "order placed" badge (got "${ord && ord.badges}")`);

  // ---- covered-order filter chip ---------------------------------------------
  await setSearch(page, ""); // clear the lingering anchor search before filtering
  await new Promise((r) => setTimeout(r, 350)); // let the 150ms search debounce flush
  const chip = await page.evaluate(() => {
    const c = document.querySelector('.fchip[data-filter="covered_order"]');
    return c ? c.textContent.replace(/\s+/g, " ").trim() : null;
  });
  R.ok(chip, `the "ordered (under 6 mo)" filter chip is present (got "${chip}")`);
  R.ok(chip && chip.includes(String(coveredExpected)), `filter chip count = ${coveredExpected} (got "${chip}")`);
  await page.evaluate(() => document.querySelector('.fchip[data-filter="covered_order"]').click());
  await page.waitForFunction(() => document.querySelectorAll("table tbody tr").length > 0, null, { timeout: 5000 });
  const filtered = await page.evaluate(() => ({
    n: document.querySelectorAll("table tbody tr").length,
    allOrdered: Array.from(document.querySelectorAll("table tbody tr")).every((tr) => /Order placed|عليه طلب/.test(tr.textContent)),
  }));
  R.eq(filtered.n, coveredExpected, "covered-order filter shows exactly the tight-but-ordered items");
  R.ok(filtered.allOrdered, "every covered-order row carries the badge");

  // ---- item card: the procurement-orders block -------------------------------
  // Re-show all rows (the covered-order filter is still active) before drilling.
  await page.evaluate(() => document.querySelector('.fchip[data-filter="all"]').click());
  await rowInfo(page, ORDER_OPEN);
  await page.evaluate((c) => document.querySelector(`table tbody tr[data-code="${c}"]`)?.click(), ORDER_OPEN);
  await page.waitForSelector("#modalCard .ledger-block", { timeout: 5000 });
  const cardTxt = await page.$eval("#modalCard .ledger-block", (el) => el.textContent.replace(/\s+/g, " "));
  R.ok(cardTxt.includes(eo.orderNo), `card lists the order number ${eo.orderNo} (got "${cardTxt.slice(0, 180)}")`);
  R.ok(cardTxt.includes(pretty(eo.date)), `card lists the order date ${pretty(eo.date)}`);
  R.ok(cardTxt.includes(eo.qty.toLocaleString("en-US")), `card lists the order qty ${eo.qty.toLocaleString("en-US")}`);
  const copyTarget = await page.$eval("#modalCard .ledger-block .ledger-row b", (b) => b.getAttribute("data-copy"));
  R.eq(copyTarget, eo.orderNo, "the order number in the card is copyable");
  await page.keyboard.press("Escape");
  await page.waitForSelector("#modal", { state: "hidden", timeout: 4000 }).catch(() => {});

  // ---- open order keeps the item OUT of the order sheet ----------------------
  const onSheet = await page.evaluate((c) => {
    return Array.from(document.querySelectorAll(".ordersheet .os-row, .os-row")).some((r) => r.textContent.includes(c));
  }, ORDER_OPEN);
  R.ok(!onSheet, `order_now item with an open order is excluded from the order sheet (${ORDER_OPEN})`);

  // ---- re-upload the same file adds nothing (dedupe) -------------------------
  // Wait for the prior toast to auto-hide so we read THIS upload's toast, not a
  // lingering "19 new orders" from the first import.
  await page.waitForSelector("#toast[hidden]", { timeout: 6000 }).catch(() => {});
  await uploadFiles(page, "filePo", REAL_ORDERS);
  let toast2 = "";
  for (let i = 0; i < 60; i++) {
    toast2 = await page.evaluate(() => { const el = document.getElementById("toast"); return el && !el.hidden ? el.textContent : ""; });
    if (/new orders|طلب/.test(toast2)) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  R.ok(/\b0\b/.test(toast2), `re-uploading the same file adds 0 new orders (got "${toast2}")`);
  R.eq(await ledgerSize(), 19, "ledger still has 19 entries after a duplicate import");

  // ---- rejected rows excluded, open rows kept (synthetic) --------------------
  await uploadFiles(page, "filePo", REJ_FIX);
  R.ok(await waitLedger(20), `one non-rejected synthetic order added → 20 (got ${await ledgerSize()})`);
  const after = await page.evaluate((codes) => {
    const e = JSON.parse(localStorage.getItem("psmmc_orders_ledger_v1")).entries;
    const has = (code) => Object.values(e).some((x) => x.code === code);
    return { total: Object.keys(e).length, open: has(codes.open), rej: has(codes.rej) };
  }, { open: OPEN_CODE, rej: REJ_CODE });
  R.eq(after.total, 20, "exactly the one non-rejected synthetic order was added (19 + 1)");
  R.ok(after.open && !after.rej, "the open row entered the ledger and the rejected row was excluded");

  // ---- persistence across reload ---------------------------------------------
  // file:// localStorage can drop the most-recent write if the page navigates
  // before it flushes (same environment flake spec-prices/spec-seasonal guard
  // against): give the write a beat, and retry the reload check.
  let afterReload = -1;
  for (let attempt = 0; attempt < 3 && afterReload !== 20; attempt++) {
    await new Promise((r) => setTimeout(r, 700));
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("#btnSample");
    afterReload = await page.evaluate(() => {
      try { return Object.keys(JSON.parse(localStorage.getItem("psmmc_orders_ledger_v1")).entries).length; } catch (e) { return -1; }
    });
  }
  R.eq(afterReload, 20, "ledger survives a reload (orders persist on-device)");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-ledger completed without throwing");
} finally {
  await browser.close();
}

R.done();
