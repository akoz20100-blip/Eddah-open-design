// spec-upload — uploading withdrawals + stock, confirming the detected period,
// and re-running with a 6-month override.
//
// Protects: the detected period chip (01 Jan → 31 Mar); the in-stock drug
// code's monthly avg / coverage / status from expected.json; exclusion of the
// non-drug (prefix-4) code and the REJECTED-status row (row count = 2);
// the override rescale (avg = total ÷ 6 when the user picks "6 mo").

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  choosePeriodOverride,
  periodText,
  rowForCode,
  switchTab,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-upload");
const expected = JSON.parse(readFileSync(resolve(FIXTURES_DIR, "expected.json"), "utf8"));
const WD = resolve(FIXTURES_DIR, "withdrawals-basic.xlsx");
const ST = resolve(FIXTURES_DIR, "stock-basic.xlsx");

async function uploadAndCompute(page, months /* null=detected */) {
  // Upload withdrawals first -> period modal appears -> choose period.
  await uploadFiles(page, "fileWithdrawals", WD);
  if (months == null) await confirmDetectedPeriod(page);
  else await choosePeriodOverride(page, months);
  // Then stock -> tryCompute fires and renders.
  await uploadFiles(page, "fileStock", ST);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });
}

const { browser, page, pageErrors } = await launch();
try {
  await open(page);

  // ---------- detected period ----------
  await uploadAndCompute(page, null);
  R.ok(pageErrors.length === 0, `no page errors on upload (saw: ${JSON.stringify(pageErrors)})`);

  const period = await periodText(page);
  const E = expected.basic;
  R.ok(
    period.includes(E.period_start_pretty) || period.includes("01 Jan"),
    `period chip shows start ${E.period_start_pretty} (got "${period}")`,
  );
  R.ok(
    period.includes(E.period_end_pretty) || period.includes("31 Mar"),
    `period chip shows end ${E.period_end_pretty} (got "${period}")`,
  );

  // ---------- in-stock drug code row ----------
  const inStock = E.drugCode_inStock;
  const row = await rowForCode(page, inStock.code);
  R.ok(!!row, `table has a row for in-stock code ${inStock.code}`);
  if (row) {
    const joined = row.join(" | ");
    // Columns: code | desc | uom | total | avg | trend | stock | cov | status | qty9 | sug
    R.ok(joined.includes(inStock.avg_fmt1), `row shows monthly avg ${inStock.avg_fmt1} (row: "${joined}")`);
    R.ok(joined.includes(inStock.cov_fmt1), `row shows coverage ${inStock.cov_fmt1} (row: "${joined}")`);
    // status order_now -> Arabic pill "اطلب الآن"
    R.ok(/اطلب الآن|Order now/.test(joined), `row status is order_now (row: "${joined}")`);
  }

  // ---------- exclusions + row count ----------
  const allRows = await page.$$eval("table tbody tr", (trs) =>
    trs.map((tr) => tr.getAttribute("data-code")),
  );
  R.eq(allRows.length, E.expectedRowCount, "exactly 2 drug rows render (non-drug + REJECTED excluded)");
  R.ok(!allRows.includes(E.excluded.nonDrug), `non-drug code ${E.excluded.nonDrug} excluded`);
  R.ok(!allRows.includes(E.excluded.rejected), `REJECTED-status code ${E.excluded.rejected} excluded`);
  // the not-in-stock drug code IS present (absent from stock file -> not_in_stock).
  R.ok(allRows.includes(E.drugCode_notInStock.code), `not-in-stock drug ${E.drugCode_notInStock.code} present`);

  // ---------- 6-month override rescale ----------
  // Fresh page/context so saved baseline/snapshots from the first upload don't
  // bleed into the override run.
  await browser.close();
} catch (err) {
  console.log("  ✗ detected-period phase threw:", err && err.message);
  R.ok(false, "spec-upload detected phase completed without throwing");
  await browser.close();
}

// Override phase in a clean context.
{
  const { browser, page } = await launch();
  try {
    await open(page);
    await uploadFiles(page, "fileWithdrawals", WD);
    await choosePeriodOverride(page, 6);
    await uploadFiles(page, "fileStock", ST);
    await page.waitForSelector("table tbody tr", { timeout: 5000 });

    const ov = expected.override6.drugCode_inStock;
    const row = await rowForCode(page, ov.code);
    R.ok(!!row, `[override 6mo] row for ${ov.code} present`);
    if (row) {
      const joined = row.join(" | ");
      R.ok(joined.includes(ov.avg_fmt1), `[override 6mo] avg rescaled to ${ov.avg_fmt1} = total÷6 (row: "${joined}")`);
      R.ok(joined.includes(ov.cov_fmt1), `[override 6mo] coverage rescaled to ${ov.cov_fmt1} (row: "${joined}")`);
      R.ok(/جيد|OK/.test(joined), `[override 6mo] status now ok (cov 12 > 7) (row: "${joined}")`);
    }
    // The period chip should mark the months source as manual.
    const period = await periodText(page);
    R.ok(/يدوي|manual/.test(period), `[override 6mo] period chip marks months_source=manual (got "${period}")`);
  } catch (err) {
    console.log("  ✗ override phase threw:", err && err.message);
    R.ok(false, "spec-upload override phase completed without throwing");
  } finally {
    await browser.close();
  }
}

R.done();
