// spec-po — OWNER REQUEST 6 (round 3): previous-orders (PO) upload slot.
// Tolerant headers (NUPCO code / order date / qty / status), compact local
// ledger, and per item in the drill-down: last order date + qty plus an
// "in transit" badge when a recent order is not yet reflected in stock.

import { resolve } from "node:path";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-po");
const WD = resolve(FIXTURES_DIR, "withdrawals-basic.xlsx");
const ST = resolve(FIXTURES_DIR, "stock-basic.xlsx");
const PO = resolve(FIXTURES_DIR, "po-basic.xlsx");

const { browser, page, pageErrors } = await launch();
try {
  await open(page);
  await uploadFiles(page, "fileWithdrawals", WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", ST);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });

  await uploadFiles(page, "filePo", PO);
  await page.waitForFunction(
    () => {
      const lbl = document.getElementById("lblPo");
      return lbl && lbl.classList.contains("is-loaded");
    },
    null,
    { timeout: 5000 },
  );

  // Ledger persisted, newest order first, capped shape.
  const ledger = await page.evaluate(() => JSON.parse(localStorage.getItem("psmmc_po_v1")));
  R.ok(ledger && ledger.byCode && Array.isArray(ledger.byCode["5000001"]), "PO ledger persisted per code");
  R.eq(ledger.byCode["5000001"].length, 2, "both order lines kept for the code");
  R.eq(ledger.byCode["5000001"][0].q, 500, "newest order (today, qty 500) is first in the ledger");

  // Drill-down: last order + in-transit badge (today's APPROVED order cannot
  // be reflected in the current stock picture yet).
  await page.click("table tbody tr[data-code='5000001']");
  await page.waitForSelector(".po-block", { timeout: 5000 });
  const po = await page.$eval(".po-block", (el) => el.textContent);
  R.ok(po.includes("آخر طلب"), "drill-down shows the last-order line");
  R.ok(po.includes("500"), "last order quantity shown");
  R.ok((await page.$(".po-transit")) !== null, "in-transit badge shown for a recent unreflected order");

  // Re-uploading the same file must not grow the ledger (dedupe by date+qty).
  await page.keyboard.press("Escape");
  await uploadFiles(page, "filePo", PO);
  await page.waitForTimeout(400);
  const ledger2 = await page.evaluate(() => JSON.parse(localStorage.getItem("psmmc_po_v1")));
  R.eq(ledger2.byCode["5000001"].length, 2, "re-uploading the same PO file does not duplicate ledger lines");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-po completed without throwing");
} finally {
  await browser.close();
}

R.done();
