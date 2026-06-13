// spec-sharek — owner spec v3 wave 5: the Sharek-platform slot + per-filter
// export.
//
// Owner asks under test («كم عدد البنود الصفريه اللي موجودة في منصة شارك …
// فلتر جديد البنود الصفرية واللي موجودة في شارك بحيث يقدر يسحب تقرير
// عشان يرسلها لمخطط واحد»):
//   - a Sharek upload slot (NUPCO-code join) that persists on-device; the
//     real file comes later, so the spec proves the slot with a synthetic
//     file built from real zero-stock codes
//   - the zero-stock KPI card states how many of the zero items are
//     available on Sharek
//   - a new planning filter shows exactly the zero-stock items on Sharek
//   - a Sharek column appears after the suggested order marking those items
//   - an "export view" button downloads ONLY the currently filtered rows —
//     a report the planner can send for one batch of orders

import { readFileSync, writeFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
} from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";
import { expectedEffectiveFromRealFiles, REAL_WD, REAL_ST } from "./real-data-expected.mjs";

const R = makeReporter("spec-sharek");
const X = expectedEffectiveFromRealFiles();

// Synthetic Sharek file: 8 real zero-stock codes + 2 with-stock codes + one
// unknown code. Expected "zero & on Sharek" = exactly the 8.
const zeroCodes = [], stockCodes = [];
for (const [code, v] of X.perCode) {
  if (v.stock <= 0 && zeroCodes.length < 8) zeroCodes.push(code);
  else if (v.stock > 0 && stockCodes.length < 2) stockCodes.push(code);
  if (zeroCodes.length === 8 && stockCodes.length === 2) break;
}
R.ok(zeroCodes.length === 8 && stockCodes.length === 2, `synthetic Sharek built from ${zeroCodes.length} zero + ${stockCodes.length} stocked real codes`);
const SHAREK_FIX = "/tmp/psmmc-sharek.xlsx";
{
  const XLSX = loadXLSX();
  const aoa = [["NUPCO Code", "Available"]];
  zeroCodes.concat(stockCodes).forEach((c) => aoa.push([c, "YES"]));
  aoa.push(["5999990009000", "YES"]); // not in the dashboard at all
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Sharek");
  writeFileSync(SHAREK_FIX, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

const { browser, page, pageErrors } = await launch({ locale: "en", contextOptions: { acceptDownloads: true } });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 120000 });

  // ---- the Sharek slot exists and ingests the file ---------------------------
  const slot = await page.$("#fileSharek");
  R.ok(slot, "a Sharek upload slot exists (#fileSharek)");
  await uploadFiles(page, "fileSharek", SHAREK_FIX);
  let saved = 0;
  for (let i = 0; i < 40; i++) {
    saved = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem("psmmc_sharek_v1")).count || 0; } catch (e) { return 0; } });
    if (saved > 0) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  R.eq(saved, 11, "Sharek codes persisted on-device (10 real + 1 unknown)");

  // ---- zero-stock card states the Sharek overlap -----------------------------
  const zeroCard = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".kcard"));
    const c = cards.find((x) => /Zero-stock/i.test(x.textContent));
    return c ? c.textContent.replace(/\s+/g, " ") : "";
  });
  R.ok(/Sharek|شارك/.test(zeroCard) && zeroCard.includes("8"), `zero-stock card counts 8 items available on Sharek (got "${zeroCard}")`);

  // ---- filter: zero & on Sharek ----------------------------------------------
  const chip = await page.evaluate(() => {
    const c = document.querySelector('.fchip[data-filter="sharek_zero"]');
    return c ? c.textContent.replace(/\s+/g, " ").trim() : null;
  });
  R.ok(chip && chip.includes("8"), `"zero & on Sharek" filter chip counts 8 (got "${chip}")`);
  await page.evaluate(() => document.querySelector('.fchip[data-filter="sharek_zero"]').click());
  let rows = [];
  for (let i = 0; i < 30; i++) {
    rows = await page.evaluate(() => Array.from(document.querySelectorAll(".tablecard table.t-main tbody tr[data-code]")).map((tr) => tr.getAttribute("data-code")));
    if (rows.length && rows.length <= 10) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  R.eq(rows.length, 8, "filter shows exactly the 8 zero-stock Sharek items");
  R.ok(zeroCodes.every((c) => rows.includes(c)), "every expected code is in the filtered view");

  // ---- Sharek column after the suggested order --------------------------------
  const col = await page.evaluate(() => {
    const ths = Array.from(document.querySelectorAll(".tablecard table.t-main thead th")).map((th) => th.textContent.trim());
    const tr = document.querySelector(".tablecard table.t-main tbody tr[data-code]");
    const tds = tr ? Array.from(tr.querySelectorAll("td")).map((td) => td.textContent.trim()) : [];
    return { ths, last: tds[tds.length - 1] };
  });
  R.ok(col.ths.some((h) => /Sharek|شارك/i.test(h)), `planning table gained a Sharek column (headers: ${col.ths.join(" | ")})`);
  R.ok(/✓|متوفر|yes|on sharek/i.test(col.last), `zero item marked available on Sharek (got "${col.last}")`);

  // ---- per-filter export: only the filtered rows ------------------------------
  const exportBtn = await page.$("#exportView");
  R.ok(exportBtn, "toolbar has an export-current-view button");
  const dl = page.waitForEvent("download", { timeout: 20000 });
  await page.evaluate(() => document.getElementById("exportView").click());
  const download = await dl;
  const XLSX = loadXLSX();
  const wb = XLSX.read(new Uint8Array(readFileSync(await download.path())), { type: "array" });
  const sheet = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
  const codesInSheet = sheet.slice(1).map((r) => String(r[0]));
  R.eq(codesInSheet.length, 8, "the export carries ONLY the filtered rows");
  R.ok(zeroCodes.every((c) => codesInSheet.includes(c)), "every filtered code is in the export");

  // ---- persistence: a reload keeps the Sharek mapping -------------------------
  await new Promise((r) => setTimeout(r, 1500));
  let after = 0;
  for (let attempt = 0; attempt < 3 && after !== 11; attempt++) {
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector("#btnSample");
    after = await page.evaluate(() => { try { return JSON.parse(localStorage.getItem("psmmc_sharek_v1")).count || 0; } catch (e) { return 0; } });
    if (after !== 11) await new Promise((r) => setTimeout(r, 700));
  }
  R.eq(after, 11, "Sharek mapping survives a reload (upload once)");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-sharek completed without throwing");
} finally {
  await browser.close();
}

R.done();
