// spec-orderdelivered — wave 6 E2: manual "delivered" marking on ledger orders.
//
// E1 (historical persistence + dedupe + "already has an order so don't order
// twice") is already covered by spec-ledger. This spec covers the NEW E2 piece:
// next to each order the planner can mark it delivered by hand; a delivered
// order shows a "Delivered" badge, loses its "order placed" highlight, drops
// out of the open-order signal (so the item can be ordered again), and the
// mark PERSISTS across reloads.

import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
} from "./helpers.mjs";
import { expectedOrdersLedger, REAL_WD, REAL_ST, REAL_ORDERS } from "./real-data-expected.mjs";

const R = makeReporter("spec-orderdelivered");
const ORDER_OPEN = "5118242800600"; // order_now with an OPEN (not-delivered) order
const L = expectedOrdersLedger();
const eo = L.byCode.get(ORDER_OPEN)?.[0];
R.ok(eo && eo.open, `mirror: ${ORDER_OPEN} carries an open order ${eo && eo.orderNo}`);

async function openDetail(page, code) {
  await page.evaluate((c) => {
    const si = document.getElementById("searchInput");
    si.value = c; si.dispatchEvent(new Event("input", { bubbles: true }));
  }, code);
  // Wait until the search has filtered the table down to the anchor row.
  await page.waitForFunction((c) => {
    const trs = document.querySelectorAll("table tbody tr");
    return trs.length > 0 && trs.length <= 60 && !!document.querySelector(`table tbody tr[data-code="${c}"]`);
  }, code, { timeout: 10000 });
  // Click the row and confirm the detail modal opened with its ledger block;
  // retry the click if the first one didn't land.
  for (let i = 0; i < 5; i++) {
    await page.evaluate((c) => document.querySelector(`table tbody tr[data-code="${c}"]`)?.click(), code);
    try {
      await page.waitForSelector("#modalCard .ledger-block", { timeout: 2000 });
      return;
    } catch (e) { await new Promise((r) => setTimeout(r, 300)); }
  }
  await page.waitForSelector("#modalCard .ledger-block", { timeout: 3000 });
}

const { browser, page, pageErrors } = await launch({ locale: "en" });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 120000 });
  const waitLedger = async (n) => {
    for (let i = 0; i < 60; i++) {
      const s = await page.evaluate(() => { try { return Object.keys(JSON.parse(localStorage.getItem("psmmc_orders_ledger_v1")).entries).length; } catch (e) { return -1; } });
      if (s === n) return true; await new Promise((r) => setTimeout(r, 200));
    }
    return false;
  };
  await uploadFiles(page, "filePo", REAL_ORDERS);
  R.ok(await waitLedger(19), "ledger persisted 19 entries");

  // ---- open the order_now + open-order item -------------------------------
  await openDetail(page, ORDER_OPEN);
  const before = await page.evaluate(() => {
    const blk = document.querySelector("#modalCard .ledger-block");
    return {
      openBadge: !!blk.querySelector(".di-title .pill.onorder"),
      hasBtn: !!blk.querySelector(".led-deliver"),
      delivered: !!blk.querySelector(".ledger-delivered"),
    };
  });
  R.ok(before.openBadge, "E2: the item shows the open 'order placed' badge before delivery");
  R.ok(before.hasBtn, "E2: each open order offers a 'mark delivered' button");
  R.ok(!before.delivered, "E2: not delivered yet");

  // ---- mark the order delivered -------------------------------------------
  await page.click("#modalCard .ledger-block .led-deliver");
  await page.waitForSelector("#modalCard .ledger-block", { timeout: 5000 });
  const after = await page.evaluate(() => {
    const blk = document.querySelector("#modalCard .ledger-block");
    return {
      delivered: !!blk.querySelector(".ledger-delivered"),
      openBadge: !!blk.querySelector(".di-title .pill.onorder"),
      btnOn: !!blk.querySelector(".led-deliver.is-on"),
    };
  });
  R.ok(after.delivered, "E2: a 'Delivered' badge appears after marking");
  R.ok(!after.openBadge, "E2: the open 'order placed' badge is gone once delivered");
  R.ok(after.btnOn, "E2: the toggle reads as on (can be undone)");

  // The delivered mark is persisted in the ledger store.
  const persisted = await page.evaluate(() => {
    try { const d = JSON.parse(localStorage.getItem("psmmc_orders_ledger_v1")).delivered || {}; return Object.keys(d).length; } catch (e) { return 0; }
  });
  R.ok(persisted >= 1, `E2: the manual delivered mark is persisted (got ${persisted} keys)`);

  // ---- reload: the mark survives ------------------------------------------
  // The withdrawals baseline + ledger (incl. the delivered map) persist on the
  // device; stock is re-dropped each session, so re-upload it after reload.
  await page.reload({ waitUntil: "load" });
  await page.waitForFunction(() => !!window.PSMMC_SAMPLE, null, { timeout: 5000 });
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });
  await openDetail(page, ORDER_OPEN);
  const reloaded = await page.evaluate(() => {
    const blk = document.querySelector("#modalCard .ledger-block");
    return { delivered: !!blk.querySelector(".ledger-delivered"), openBadge: !!blk.querySelector(".di-title .pill.onorder") };
  });
  R.ok(reloaded.delivered, "E2: the delivered mark survives a reload");
  R.ok(!reloaded.openBadge, "E2: the item stays out of the open-order signal after reload");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.stack);
  R.ok(false, "spec-orderdelivered completed without throwing");
} finally {
  await browser.close();
}

R.done();
