// spec-allitems — every product's figures match the independent mirror.
//
// The owner audited one drug (FERINJECT) by hand and lost trust in the whole
// table; anchor-item specs cannot answer "is every row right?". This spec
// closes that hole: it exports the report workbook (whose Reorder sheet
// carries EVERY planning row) and compares each row's monthly average, stock,
// effective coverage, projection dates, status, and suggested quantity
// against expectedEffectiveFromRealFiles — an independent implementation of
// the documented rules. Any future formula drift on ANY item turns this red.

import { readFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
} from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";
import { expectedEffectiveFromRealFiles, REAL_WD, REAL_ST } from "./real-data-expected.mjs";

const R = makeReporter("spec-allitems");
const X = expectedEffectiveFromRealFiles();
const pretty = (iso) =>
  new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

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
  const XLSX = loadXLSX();
  const wb = XLSX.read(new Uint8Array(readFileSync(await download.path())), { type: "array" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets.Reorder, { header: 1, defval: "" });
  const H = rows[0].map((h) => String(h));
  const col = (re) => H.findIndex((h) => re.test(h));
  const C = {
    code: col(/code/i),
    avg: col(/avg|average/i),
    stock: col(/stock$|^stock|on hand/i),
    cov: col(/coverage/i),
    stockout: col(/stockout/i),
    reorder: col(/reorder/i),
    status: col(/status/i),
    sug: col(/suggested/i),
  };
  R.ok(Object.values(C).every((i) => i >= 0), `Reorder sheet has all audited columns (${JSON.stringify(C)})`);
  R.eq(rows.length - 1, X.perCode.size, `Reorder sheet carries every product (${X.perCode.size})`);

  // Compare EVERY row to the mirror. Collect mismatches by field; the first
  // few examples are printed so a regression names the drugs it broke.
  const bad = { missing: [], avg: [], stock: [], cov: [], stockout: [], reorder: [], status: [], sug: [] };
  const near = (a, b, tol) => Math.abs(a - b) <= tol;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const code = String(row[C.code]);
    const m = X.perCode.get(code);
    if (!m) { bad.missing.push(code); continue; }
    if (!near(Number(row[C.avg]) || 0, m.avg, 0.05 + m.avg * 0.001)) bad.avg.push(`${code}: ${row[C.avg]} vs ${m.avg.toFixed(1)}`);
    if (!near(Number(row[C.stock]) || 0, m.stock, 0.5)) bad.stock.push(`${code}: ${row[C.stock]} vs ${m.stock}`);
    const covCell = row[C.cov];
    if (m.covEff == null) {
      if (covCell !== "" && covCell != null) bad.cov.push(`${code}: ${covCell} vs (none)`);
    } else if (!near(Number(covCell) || 0, m.covEff, 0.051)) bad.cov.push(`${code}: ${covCell} vs ${m.covEff.toFixed(1)}`);
    const so = String(row[C.stockout] || "");
    if (m.stockoutIso ? so !== pretty(m.stockoutIso) : so !== "") bad.stockout.push(`${code}: "${so}" vs ${m.stockoutIso}`);
    const ro = String(row[C.reorder] || "");
    if (m.reorderIso ? ro !== pretty(m.reorderIso) : ro !== "") bad.reorder.push(`${code}: "${ro}" vs ${m.reorderIso}`);
    if (!near(Number(row[C.sug]) || 0, m.sug, 0.5 + m.sug * 0.001)) bad.sug.push(`${code}: ${row[C.sug]} vs ${Math.round(m.sug)}`);
    // Status text mirrors the sheet's display rule: the ORDER NOW flag
    // (reorder-by ≤ today) replaces the status label whenever it fires.
    const stTxt = String(row[C.status] || "").toLowerCase();
    const okStatus = m.orderNow
      ? /order/i.test(stTxt)
      : (m.status === "warning" && /watch|warning/i.test(stTxt)) ||
        (m.status === "ok" && /^ok/i.test(stTxt)) ||
        (m.status === "excess" && /excess|زائد/i.test(stTxt)) ||
        (m.status === "no_movement" && /movement/i.test(stTxt)) ||
        (m.status === "not_in_stock" && /stock|zero/i.test(stTxt)) ||
        (m.status === "order_now" && /order/i.test(stTxt));
    if (!okStatus) bad.status.push(`${code}: "${stTxt}" vs ${m.status}${m.orderNow ? "+ORDER NOW" : ""}`);
  }
  for (const k of Object.keys(bad)) {
    R.ok(bad[k].length === 0, `${k}: 0 mismatches across ${X.perCode.size} products (got ${bad[k].length}; e.g. ${bad[k].slice(0, 3).join(" | ")})`);
  }

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-allitems completed without throwing");
} finally {
  await browser.close();
}

R.done();
