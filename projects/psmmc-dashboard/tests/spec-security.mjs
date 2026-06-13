// spec-security — wave 6 security hardening (audit findings M1, M2, L3).
//
// M1: Excel/CSV formula injection. A file-derived string starting with = + - @
//     must be neutralized (leading apostrophe) before it is written to an
//     exported .xlsx cell, so reopening the report can't run it as a formula.
// M2: a Content-Security-Policy meta tag ships on the page.
// L3: esc() escapes the single quote so single-quoted attributes are safe.
//
// The fixture (make-fixtures) carries a drug whose DESCRIPTION is
// =HYPERLINK("http://evil…","pwn"); the spec exports the current view and reads
// the produced workbook back to confirm the description cell is now literal.

import { resolve } from "node:path";
import { readFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
  FIXTURES_DIR,
  DASHBOARD_DIR,
} from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";

const R = makeReporter("spec-security");
const XLSX = loadXLSX();
const WD_XSS = resolve(FIXTURES_DIR, "withdrawals-xss.xlsx");
const ST_XSS = resolve(FIXTURES_DIR, "stock-xss.xlsx");
const expected = JSON.parse(readFileSync(resolve(FIXTURES_DIR, "expected.json"), "utf8"));
const FORMULA_DESC = expected.formula.desc; // =HYPERLINK("http://evil.example","pwn")

// ---- L3 + M2: static source checks (cheap, no browser) ----------------------
{
  const appjs = readFileSync(resolve(DASHBOARD_DIR, "app.js"), "utf8");
  R.ok(/replace\(\/\[&<>"'\]\/g/.test(appjs) && /"'": "&#39;"/.test(appjs), "L3: esc() escapes the single quote");
  R.ok(/function csvSafe/.test(appjs) && /function sanitizeAoa/.test(appjs), "M1: csvSafe/sanitizeAoa helpers exist");
  const html = readFileSync(resolve(DASHBOARD_DIR, "index.html"), "utf8");
  R.ok(/http-equiv="Content-Security-Policy"/.test(html), "M2: a CSP meta tag is present in index.html");
  R.ok(/script-src 'self' 'unsafe-inline'/.test(html), "M2: CSP allows the inlined scripts the build produces");
  // The standalone build must inherit the CSP too.
  const standalone = readFileSync(resolve(DASHBOARD_DIR, "standalone.html"), "utf8");
  R.ok(/http-equiv="Content-Security-Policy"/.test(standalone), "M2: the built standalone.html carries the CSP");
}

// ---- M1: live export neutralizes the formula ------------------------------
const { browser, page, pageErrors } = await launch({
  locale: "en",
  contextOptions: { acceptDownloads: true },
});
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", WD_XSS);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", ST_XSS);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });

  // Export exactly the on-screen rows (includes the formula-desc drug).
  const dl = page.waitForEvent("download", { timeout: 15000 });
  await page.click("#exportView");
  const download = await dl;
  const path = await download.path();
  const wb = XLSX.read(readFileSync(path), { type: "buffer" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

  // Find the cell carrying our description and assert it is neutralized.
  let cell = null;
  for (const row of rows) {
    for (const v of row) {
      if (typeof v === "string" && v.indexOf("HYPERLINK") !== -1) cell = v;
    }
  }
  R.ok(cell !== null, `formula-desc drug reached the export (got ${JSON.stringify(cell)})`);
  R.ok(cell && cell[0] === "'", `M1: the exported description is neutralized with a leading apostrophe (got ${JSON.stringify(cell)})`);
  R.ok(cell !== FORMULA_DESC, "M1: the raw formula string is not written verbatim");

  // No exported string cell may still START with a formula trigger char.
  const dangerous = [];
  for (const row of rows) {
    for (const v of row) {
      if (typeof v === "string" && /^[=+\-@]/.test(v)) dangerous.push(v);
    }
  }
  R.ok(dangerous.length === 0, `M1: no exported string cell starts with = + - @ (found: ${JSON.stringify(dangerous)})`);

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.stack);
  R.ok(false, "spec-security completed without throwing");
} finally {
  await browser.close();
}

R.done();
