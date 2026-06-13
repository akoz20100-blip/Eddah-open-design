// spec-sharekfix — red-first regressions for the wave-5 Sharek column/slot.
// Three independent defects found in the audit, each asserted to FAIL on the
// pre-fix build and pass after:
//
//   1. The Sharek upload slot label (#shkName) never updates — applyStatic()
//      refreshes every other slot label (wd/st/mp/po/pl) but omits shkName, so
//      the saved file's name/count never shows (on upload OR reload), unlike
//      every other persisted slot.
//   2. The per-filter export marks the Sharek column for ANY on-Sharek code,
//      ignoring stock, while the on-screen table marks only ZERO-stock items —
//      so a with-stock-on-Sharek row reads "On Sharek" in the file but "—" on
//      screen (table/export disagree).
//   3. The catalog-fallback row hardcodes colspan=12 (code + desc + 12 = 14
//      logical columns), but a loaded Sharek file makes the planning header 15
//      columns, so the fallback row is one column short / misaligned.

import { readFileSync, writeFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  setSearch,
  makeReporter,
} from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";
import { expectedEffectiveFromRealFiles, REAL_WD, REAL_ST } from "./real-data-expected.mjs";

const R = makeReporter("spec-sharekfix");
const X = expectedEffectiveFromRealFiles();
const XLSX = loadXLSX();

// pick one real with-stock code (to put on Sharek) + a few zero codes
let stockOnSharek = null;
const zeros = [];
for (const [code, v] of X.perCode) {
  if (v.stock > 0 && !stockOnSharek) stockOnSharek = code;
  else if (v.stock <= 0 && zeros.length < 3) zeros.push(code);
  if (stockOnSharek && zeros.length === 3) break;
}
R.ok(stockOnSharek && zeros.length === 3, `picked a with-stock code ${stockOnSharek} + ${zeros.length} zero codes`);

// synthetic Sharek file (named so the slot label is checkable)
const SHAREK_FIX = "/tmp/psmmc-sharekfix.xlsx";
{
  const aoa = [["NUPCO Code", "Available"]];
  zeros.concat([stockOnSharek]).forEach((c) => aoa.push([c, "YES"]));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Sharek");
  writeFileSync(SHAREK_FIX, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}
// synthetic identifiers/catalog file carrying ONE code that is NOT in the
// withdrawals/stock files, so searching its unique name yields zero table rows
// and triggers the catalog-fallback row.
const CAT_CODE = "5777770001000";
const CAT_NAME = "ZZZUNIQUEDRUG SUPER TABLET";
const CAT_FIX = "/tmp/psmmc-catfix.xlsx";
{
  const aoa = [["NUPCO CODE", "NUPCO ITEM DESCRIPTION"], [CAT_CODE, CAT_NAME]];
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Catalog");
  writeFileSync(CAT_FIX, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

const { browser, page, pageErrors } = await launch({ locale: "en", contextOptions: { acceptDownloads: true } });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 120000 });
  await uploadFiles(page, "fileMap", CAT_FIX);
  await uploadFiles(page, "fileSharek", SHAREK_FIX);
  // wait for the Sharek mapping to persist
  for (let i = 0; i < 40; i++) {
    const n = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem("psmmc_sharek_v1")).count || 0; } catch (e) { return 0; } });
    if (n >= 4) break;
    await new Promise((r) => setTimeout(r, 200));
  }

  // ---- BUG 1: the Sharek slot label reflects the saved file --------------------
  const shk = await page.evaluate(() => { const el = document.getElementById("shkName"); return el ? el.textContent.replace(/\s+/g, " ").trim() : null; });
  R.ok(shk && shk.indexOf("psmmc-sharekfix.xlsx") >= 0, `Sharek slot label shows the saved file name (got "${shk}")`);
  R.ok(shk && /optional|اختياري/.test(shk) === false, `Sharek slot label is no longer the default hint (got "${shk}")`);

  // ---- BUG 2: the export Sharek cell matches the table (zero-stock only) -------
  // clean state: no search, "all" filter, then export the full view
  await setSearch(page, "");
  await page.evaluate(() => { const c = document.querySelector('.fchip[data-filter="all"]'); if (c) c.click(); });
  await new Promise((r) => setTimeout(r, 400));
  const dl = page.waitForEvent("download", { timeout: 30000 });
  await page.evaluate(() => document.getElementById("exportView").click());
  const download = await dl;
  const wb = XLSX.read(new Uint8Array(readFileSync(await download.path())), { type: "array" });
  const sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
  const hdr = sheet[0].map((c) => String(c).trim());
  const shCol = hdr.findIndex((h) => /Sharek|شارك/i.test(h));
  R.ok(shCol >= 0, `export has a Sharek column (headers: ${hdr.join(" | ")})`);
  const stockRow = sheet.slice(1).find((r) => String(r[0]) === stockOnSharek);
  R.ok(stockRow, `with-stock-on-Sharek code ${stockOnSharek} is in the export`);
  const cell = stockRow ? String(stockRow[shCol]).trim() : "?";
  R.ok(cell === "", `export Sharek cell for a WITH-STOCK code is blank, matching the table's "—" (got "${cell}")`);

  // ---- BUG 3: the catalog-fallback row spans the full column count -------------
  await setSearch(page, CAT_NAME.split(" ")[0]); // "ZZZUNIQUEDRUG"
  let span = null, ths = null;
  for (let i = 0; i < 40; i++) {
    const res = await page.evaluate(() => {
      const head = Array.from(document.querySelectorAll(".tablecard table.t-main thead th")).length;
      const tr = document.querySelector(".tablecard table.t-main tbody tr.cat-row");
      if (!tr) return null;
      const sum = Array.from(tr.querySelectorAll("td")).reduce((a, td) => a + (td.colSpan || 1), 0);
      return { head, sum };
    });
    if (res) { ths = res.head; span = res.sum; break; }
    await new Promise((r) => setTimeout(r, 200));
  }
  R.ok(ths != null, "catalog-fallback row rendered for a catalog-only search");
  R.eq(span, ths, "catalog-fallback row spans exactly the planning header column count");

  // ---- BUG 1 (persistence): the label survives a reload ------------------------
  await new Promise((r) => setTimeout(r, 1500));
  let after = null;
  for (let attempt = 0; attempt < 3; attempt++) {
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("#btnSample");
    after = await page.evaluate(() => { const el = document.getElementById("shkName"); return el ? el.textContent.replace(/\s+/g, " ").trim() : null; });
    if (after && after.indexOf("psmmc-sharekfix.xlsx") >= 0) break;
    await new Promise((r) => setTimeout(r, 700));
  }
  R.ok(after && after.indexOf("psmmc-sharekfix.xlsx") >= 0, `Sharek slot label still shows the saved file after reload (got "${after}")`);

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-sharekfix completed without throwing");
} finally {
  await browser.close();
}

R.done();
