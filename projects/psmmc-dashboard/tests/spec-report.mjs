// spec-report — REPORTING: one-click structured .xlsx report workbook.
//
// The export FAB produces a single workbook: a Summary sheet first (KPIs +
// totals), then detail sheets (Reorder, At-Risk, Expired). Values carry SAR/
// thousands number formats, detail sheets carry an autofilter and column
// widths, and the file opens with zero formula errors. (True background-color
// conditional formatting needs a styling-capable writer — a separate
// dependency decision — so this asserts the structure the vendored community
// SheetJS can produce.)
//
// Counts/totals are asserted against the independent mirrors on the real files.

import { readFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
} from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";
import {
  expectedFromRealFiles,
  expectedExpiryViewsFromRealFiles,
  REAL_WD,
  REAL_ST,
} from "./real-data-expected.mjs";

const R = makeReporter("spec-report");
const F = expectedFromRealFiles();
const EV = expectedExpiryViewsFromRealFiles();

const { browser, page, pageErrors } = await launch({
  locale: "en",
  contextOptions: { acceptDownloads: true },
});
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });

  const dl = page.waitForEvent("download", { timeout: 20000 });
  await page.click("#btnExport");
  const download = await dl;
  R.ok(/PSMMC_report_.*\.xlsx$/.test(download.suggestedFilename()), `FAB downloads a report workbook (got "${download.suggestedFilename()}")`);
  const path = await download.path();
  const XLSX = loadXLSX();
  const wb = XLSX.read(new Uint8Array(readFileSync(path)), { type: "array", cellStyles: true });

  const names = wb.SheetNames;
  R.ok(names[0] === "Summary", `Summary sheet is first (sheets: ${names.join(", ")})`);
  ["Reorder", "At-Risk", "Expired"].forEach((nm) => R.ok(names.includes(nm), `report has a ${nm} detail sheet`));

  // ---- Summary KPIs ---------------------------------------------------------
  const sumCells = Object.keys(wb.Sheets.Summary)
    .filter((k) => k[0] !== "!")
    .map((k) => wb.Sheets.Summary[k].v);
  R.ok(sumCells.includes(F.medicines), `Summary carries the medicine count ${F.medicines}`);
  R.ok(sumCells.includes(F.totalUnits), `Summary carries total available units ${F.totalUnits}`);
  R.ok(sumCells.includes(EV.atRisk.batches), `Summary carries the at-risk batch count ${EV.atRisk.batches}`);
  R.ok(sumCells.includes(EV.expired.batches), `Summary carries the expired batch count ${EV.expired.batches}`);

  // ---- detail sheet row counts ---------------------------------------------
  function dataRows(sheet) {
    const ref = XLSX.utils.decode_range(sheet["!ref"]);
    return ref.e.r - ref.s.r; // minus header
  }
  R.ok(dataRows(wb.Sheets["At-Risk"]) === EV.atRisk.batches, `At-Risk sheet has ${EV.atRisk.batches} batch rows (got ${dataRows(wb.Sheets["At-Risk"])})`);
  R.ok(dataRows(wb.Sheets["Expired"]) === EV.expired.batches, `Expired sheet has ${EV.expired.batches} batch rows (got ${dataRows(wb.Sheets["Expired"])})`);

  // ---- number formats + autofilter + zero formula errors --------------------
  let hasNumFmt = false, errorCells = 0;
  for (const nm of names) {
    const sh = wb.Sheets[nm];
    for (const k of Object.keys(sh)) {
      if (k[0] === "!") continue;
      if (sh[k].z && /#,##0/.test(sh[k].z)) hasNumFmt = true;
      if (sh[k].t === "e") errorCells++;
    }
  }
  R.ok(hasNumFmt, "value cells carry a thousands/SAR number format (#,##0)");
  R.ok(errorCells === 0, `workbook opens with zero formula-error cells (found ${errorCells})`);
  R.ok(!!wb.Sheets["At-Risk"]["!autofilter"], "detail sheets carry an autofilter");
  R.ok(Array.isArray(wb.Sheets.Reorder["!cols"]) && wb.Sheets.Reorder["!cols"].length > 0, "detail sheets carry column widths");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-report completed without throwing");
} finally {
  await browser.close();
}

R.done();
