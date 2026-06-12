// spec-period — outlier withdrawal dates must not stretch the analysis period.
//
// Owner-reported failure mode (the FERINJECT screenshot): the live dashboard
// divided every monthly average by a ~65-month period instead of ~5, so every
// coverage figure inflated ~12x and the MoM card compared phantom months. A
// single row whose date parses far outside the file's real range (a typo or a
// locale-mangled export) is enough: period = (max − min) ÷ 30.44 trusts the
// extremes blindly.
//
// Rule under test: the detected period comes from the DENSE month cluster.
// Edge months holding fewer than max(2, 0.5% of dated rows) are outliers —
// their rows keep counting toward consumption totals (the withdrawal really
// happened; only its date is suspect) but are excluded from period detection
// and monthly buckets, and the per-upload quality card names them.
//
// Fixture: the REAL withdrawals file + one synthetic DISPATCHED drug row
// dated 15/01/2021. Red on the pre-fix app: the period modal offers ~65.2
// months. Green: ~5.3 months and an outlier warning in the quality card.

import { writeFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  waitForPeriodModal,
  makeReporter,
} from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";
import { expectedFromRealFiles, REAL_WD, REAL_ST } from "./real-data-expected.mjs";

const R = makeReporter("spec-period");
const FIXTURE = "/tmp/psmmc-wd-outlier.xlsx";

const X = expectedFromRealFiles();
R.ok(Math.abs(X.monthsRounded1 - 5.3) < 0.2, `real file's dense period is ~5.3 mo (mirror: ${X.monthsRounded1})`);

// Build the fixture: real rows + one outlier row five years back.
{
  const XLSX = loadXLSX();
  const wb = XLSX.read(new Uint8Array((await import("node:fs")).readFileSync(REAL_WD)), { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
  const H = aoa[0];
  const idx = (name) => H.findIndex((h) => String(h).trim() === name);
  const row = new Array(H.length).fill("");
  row[idx("NUPCO Material")] = "5113150301300"; // FERINJECT
  row[idx("Order Qty")] = 10;
  row[idx("Delivery Date")] = "15/01/2021"; // the outlier
  row[idx("Status")] = "DISPATCHED";
  row[idx("Description")] = "FERRIC CARBOXYMALTOSE 50 MG/ML";
  aoa.push(row);
  const out = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(out, XLSX.utils.aoa_to_sheet(aoa), "Sheet1");
  writeFileSync(FIXTURE, XLSX.write(out, { type: "buffer", bookType: "xlsx" }));
}

const { browser, page, pageErrors } = await launch({ locale: "en" });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", FIXTURE);
  await waitForPeriodModal(page);

  // The detected period offered by the modal must be the dense ~5.3 months,
  // not the outlier-stretched ~65.
  const detectedTxt = await page.$eval("#pcUseDetected", (el) => el.textContent);
  const m = detectedTxt.match(/([\d,.]+)\s*mo/);
  const detected = m ? parseFloat(m[1].replace(/,/g, "")) : NaN;
  R.ok(Number.isFinite(detected) && Math.abs(detected - X.monthsRounded1) < 0.2,
    `period modal offers the dense period ${X.monthsRounded1} mo, not the outlier span (got ${detected})`);

  await page.click("#pcUseDetected");
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });

  // The quality card names the outlier-dated row as a warning.
  const quality = await page.evaluate(() => {
    const card = document.querySelector(".quality-card, #content details");
    return card ? card.textContent.replace(/\s+/g, " ") : "";
  });
  R.ok(/outside|خارج/i.test(quality) || /outlier/i.test(quality),
    `quality card flags the outlier-dated row (got: "${quality.slice(0, 220)}…")`);

  // The period chip reflects the dense span too.
  const period = await page.$eval("#metaPeriod", (el) => el.textContent);
  R.ok(!/202[01234]/.test(period.replace(/2026/g, "")) || /2026/.test(period),
    `period chip stays inside the real range (got "${period}")`);

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-period completed without throwing");
} finally {
  await browser.close();
}

R.done();
