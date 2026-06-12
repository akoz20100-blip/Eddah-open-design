// spec-catalog — OWNER REQUEST 2 (round 3): catalog-wide search.
//
// Root cause being guarded: searching "Skyrizi" with the real files loaded
// returned 0 of 1,077 because the drug existed only in the saved identifiers
// catalog (no movement, no stock in the uploaded files). A search that misses
// every loaded row must also scan the saved MAP and render matches as
// lightweight catalog-only rows, and the drill-down must open for them.

import { resolve } from "node:path";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-catalog");
const WD = resolve(FIXTURES_DIR, "withdrawals-basic.xlsx");
const ST = resolve(FIXTURES_DIR, "stock-basic.xlsx");
const MAP_TRADE = resolve(FIXTURES_DIR, "map-trade.xlsx");

const { browser, page, pageErrors } = await launch();
try {
  await open(page);
  await uploadFiles(page, "fileWithdrawals", WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", ST);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });
  await uploadFiles(page, "fileMap", MAP_TRADE);
  await page.waitForFunction(() => document.body.textContent.includes("MapTradeName"), null, { timeout: 5000 });

  // Search a name that exists ONLY in the catalog.
  await page.fill("#searchInput", "skyrizi");
  await page.waitForSelector("tr.cat-row", { timeout: 5000 });
  const cat = await page.$eval("tr.cat-row", (tr) => ({
    code: tr.getAttribute("data-code"),
    text: tr.textContent,
  }));
  R.eq(cat.code, "5777001", "catalog-only match renders with its NUPCO code");
  R.ok(cat.text.includes("Skyrizi"), "catalog row shows the trade name");
  R.ok(cat.text.includes("موجود في الكتالوج"), "catalog row carries the 'in catalog · no movement/stock' note");

  // The drill-down opens for a catalog-only item (names + drug info + SFDA).
  await page.click("tr.cat-row");
  await page.waitForSelector("#dtClose", { state: "visible", timeout: 5000 });
  const sheet = await page.$eval("#modalCard", (el) => el.textContent);
  R.ok(sheet.includes("Skyrizi"), "drill-down opens for the catalog-only item");
  R.ok(sheet.includes("صدفية"), "curated drug info resolves from the scientific name (RISANKIZUMAB → psoriasis)");
  const sfdaHref = await page.$eval("#diSfda", (a) => a.href);
  R.ok(sfdaHref.includes("sfda.gov.sa/en/drugs-list?search="), "SFDA link present on the catalog-only drill-down");
  await page.keyboard.press("Escape");

  // A search that DOES hit loaded rows stays a normal result (no catalog rows).
  await page.fill("#searchInput", "paracetamol");
  await page.waitForFunction(
    () => !document.querySelector("tr.cat-row") && document.querySelector("table tbody tr[data-code='5000001']"),
    null,
    { timeout: 5000 },
  );
  R.ok(true, "a search matching loaded rows renders normal rows, no catalog fallback");

  // A search hitting nothing anywhere shows the empty message (not a crash).
  await page.fill("#searchInput", "zzz-not-anywhere");
  await page.waitForFunction(
    () => document.querySelector("table tbody td.muted") && !document.querySelector("tr.cat-row"),
    null,
    { timeout: 5000 },
  );
  R.ok(true, "a miss in both rows and catalog falls back to the empty-rows message");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-catalog completed without throwing");
} finally {
  await browser.close();
}

R.done();
