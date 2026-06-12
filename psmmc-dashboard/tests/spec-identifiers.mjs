// spec-identifiers — OWNER REQUEST 1 (round 3): real trade names.
//
// Verifies the applyMap precedence chain end-to-end:
//   1. a trade name read from the STOCK file itself is used as a fallback;
//   2. an uploaded identifiers file OVERRIDES that fallback (real uploaded
//      names always win);
//   3. an identifiers file with no recognizable trade/scientific column warns
//      out loud (mp_no_trade) instead of silently leaving name search dead;
//   4. sample mode shows the bilingual "demo names are not real" badge, and
//      upload mode does not.

import { resolve } from "node:path";
import {
  launch,
  open,
  loadSample,
  uploadFiles,
  confirmDetectedPeriod,
  rowForCode,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-identifiers");
const WD = resolve(FIXTURES_DIR, "withdrawals-basic.xlsx");
const ST_TRADE = resolve(FIXTURES_DIR, "stock-trade.xlsx");
const MAP_TRADE = resolve(FIXTURES_DIR, "map-trade.xlsx");
const MAP_NOTRADE = resolve(FIXTURES_DIR, "map-notrade.xlsx");

const { browser, page, pageErrors } = await launch();
try {
  await open(page);

  await uploadFiles(page, "fileWithdrawals", WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", ST_TRADE);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });

  // (1) stock-file trade name is the fallback when no identifiers exist.
  let row = await rowForCode(page, "5000001");
  R.ok(row && row.join(" ").includes("StockTradeName"), "stock-file trade name used as fallback (StockTradeName visible)");

  // upload mode: the demo-names badge must NOT show.
  const demoHiddenUpload = await page.$eval("#metaDemo", (el) => el.hidden);
  R.ok(demoHiddenUpload === true, "demo-names badge hidden in upload mode");

  // (2) identifiers upload overrides the stock-file name.
  await uploadFiles(page, "fileMap", MAP_TRADE);
  await page.waitForFunction(
    () => document.body.textContent.includes("MapTradeName"),
    null,
    { timeout: 5000 },
  );
  row = await rowForCode(page, "5000001");
  R.ok(row && row.join(" ").includes("MapTradeName"), "uploaded identifiers trade name overrides (MapTradeName visible)");
  R.ok(row && !row.join(" ").includes("StockTradeName"), "stock-file fallback name no longer shown for the row");

  // (3) identifiers file without a trade/scientific column → explicit warning.
  await uploadFiles(page, "fileMap", MAP_NOTRADE);
  await page.waitForFunction(
    () => {
      const tEl = document.getElementById("toast");
      return tEl && !tEl.hidden && tEl.textContent.includes("لم يتم التعرف");
    },
    null,
    { timeout: 5000 },
  );
  R.ok(true, "mp_no_trade warning toasted for a no-trade-column identifiers file");

  // (4) sample mode shows the demo-names badge.
  await loadSample(page);
  const demo = await page.$eval("#metaDemo", (el) => ({ hidden: el.hidden, text: el.textContent }));
  R.ok(demo.hidden === false, "demo-names badge visible in sample mode");
  R.ok(demo.text.includes("غير حقيقية"), "badge carries the demo-names wording");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-identifiers completed without throwing");
} finally {
  await browser.close();
}

R.done();
