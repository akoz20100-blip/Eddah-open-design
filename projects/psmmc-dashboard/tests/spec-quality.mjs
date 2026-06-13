// spec-quality — parser taxonomy + wave 6 A3 (data-quality card removed).
//
// The data-quality CARD was removed from the Planning view in wave 6 (owner
// asked for a cleaner first glance). What remains under test:
//  (1) the parser taxonomy still rejects the right rows — verified through an
//      INDEPENDENT mirror (tests/real-data-expected.mjs →
//      expectedQualityFromRealFiles) computed from the same real files; and
//  (2) the on-screen quality card is GONE even after a real upload, and the
//      real files still parse + render a planning table (the upload pipeline
//      that fed the card is unbroken).

import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
} from "./helpers.mjs";
import {
  expectedQualityFromRealFiles,
  REAL_WD,
  REAL_ST,
  REAL_MAP,
} from "./real-data-expected.mjs";

const R = makeReporter("spec-quality");

// ---- independent parser-taxonomy mirror (UI-independent) ------------------
const Q = expectedQualityFromRealFiles();
R.ok(Q.withdrawals.total === 10130, `mirror reads ${Q.withdrawals.total} withdrawal rows`);
R.ok(Q.withdrawals.nonDrug > 1000, `mirror rejects ${Q.withdrawals.nonDrug} non-drug withdrawal rows`);
R.ok(Q.stock.nonDrug > 10000, `mirror rejects ${Q.stock.nonDrug} non-drug stock rows`);
R.ok(Q.mapping.badCode + Q.mapping.nonDrug > 0, `mirror rejects ${Q.mapping.badCode + Q.mapping.nonDrug} catalog rows`);

const { browser, page, pageErrors } = await launch({
  locale: "en",
  contextOptions: { acceptDownloads: true },
});
try {
  await open(page, { lang: "en" });

  // ---- real upload still parses + renders ----------------------------------
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });
  await uploadFiles(page, "fileMap", REAL_MAP);
  await page.waitForSelector("#toast:not([hidden])", { timeout: 30000 });

  const rowCount = await page.$$eval("table tbody tr", (trs) => trs.length);
  R.ok(rowCount > 100, `real files parse + render a planning table (got ${rowCount} rows)`);

  // ---- A3: the data-quality card is gone -----------------------------------
  const cardGone = await page.evaluate(() => !document.querySelector(".qualitycard"));
  R.ok(cardGone, "wave 6 A3: no data-quality card in the Planning view after a real upload");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-quality completed without throwing");
} finally {
  await browser.close();
}

R.done();
