// spec-orders — PLANNER FEATURE 7 (round 3): order tracking.
// "Mark as ordered" per item (date + qty, persisted) → the item shows an
// "on order" badge and is excluded from the order-sheet re-suggestion; a
// later stock upload that covers the item clears the flag automatically.

import { resolve } from "node:path";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-orders");
const WD = resolve(FIXTURES_DIR, "withdrawals-basic.xlsx");
const ST = resolve(FIXTURES_DIR, "stock-basic.xlsx");
const ST_COVER = resolve(FIXTURES_DIR, "stock-covering.xlsx");

const { browser, page, pageErrors } = await launch();
try {
  await open(page);
  await uploadFiles(page, "fileWithdrawals", WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", ST);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });

  // 5000002 moved but is not in stock → it sits on the order sheet.
  const sheetBefore = await page.$$eval(".os-row", (rows) => rows.map((r) => r.getAttribute("data-code")));
  R.ok(sheetBefore.includes("5000002"), "5000002 is suggested on the order sheet before marking");

  // Mark it as ordered from the drill-down.
  await page.click("table tbody tr[data-code='5000002']");
  await page.waitForSelector("#ooMark", { timeout: 5000 });
  await page.click("#ooMark");
  await page.waitForSelector("#ooClear", { timeout: 5000 });
  const modalTxt = await page.$eval("#modalCard", (el) => el.textContent);
  R.ok(modalTxt.includes("تم طلبه"), "drill-down shows the on-order badge after marking");

  const flag = await page.evaluate(() => JSON.parse(localStorage.getItem("psmmc_orders_v1")));
  R.ok(flag && flag.byCode["5000002"] && flag.byCode["5000002"].q > 0, "on-order flag persisted with date + qty");

  await page.keyboard.press("Escape");
  await page.waitForSelector("#modal", { state: "hidden", timeout: 3000 });

  // Excluded from re-suggestion + badged in the table.
  const sheetAfter = await page.$$eval(".os-row", (rows) => rows.map((r) => r.getAttribute("data-code")));
  R.ok(!sheetAfter.includes("5000002"), "marked item excluded from the order-sheet suggestion");
  const rowBadge = await page.$eval("table tbody tr[data-code='5000002']", (tr) => tr.textContent);
  R.ok(rowBadge.includes("تم طلبه"), "table row carries the on-order badge");

  // A later covering stock upload clears the flag.
  await uploadFiles(page, "fileStock", ST_COVER);
  await page.waitForFunction(
    () => {
      const f = JSON.parse(localStorage.getItem("psmmc_orders_v1") || "{}");
      return !(f.byCode && f.byCode["5000002"]);
    },
    null,
    { timeout: 5000 },
  );
  R.ok(true, "covering stock upload cleared the on-order flag");
  const rowAfter = await page.$eval("table tbody tr[data-code='5000002']", (tr) => tr.textContent);
  R.ok(!rowAfter.includes("تم طلبه"), "badge removed from the table after the order landed");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-orders completed without throwing");
} finally {
  await browser.close();
}

R.done();
