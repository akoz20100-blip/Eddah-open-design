// spec-projection — FEATURES 1 + 2: main-view stockout / reorder projection.
//
// The batch-level stock file plus the consumption (withdrawals) file let the
// dashboard project, per product:
//   - Stockout Date — when non-expired available stock reaches zero at the
//     current daily burn (= monthly avg ÷ 30.44), anchored on the file's
//     stock-as-of date
//   - Reorder-By Date — when coverage drops below 6 months
//   - ORDER NOW flag — when the reorder-by date is already today or past
//   - Planner — responsible planner from the (optional) planner-mapping join
//     slot; "Unassigned" until that file is provided
//
// Asserted against an independent mirror of the rules
// (real-data-expected.mjs → expectedProjectionFromRealFiles) computed from the
// same real files the spec uploads through the actual UI slots. The planner
// join slot is proved with a synthetic planner-mapping file so the
// infrastructure works the moment the real file is dropped in.

import { writeFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  setSearch,
  makeReporter,
} from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";
import { expectedProjectionFromRealFiles, REAL_WD, REAL_ST } from "./real-data-expected.mjs";

const R = makeReporter("spec-projection");
const pretty = (iso) =>
  new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const ORDER_CODE = "5118155600000"; // LINAGLIPTIN 5MG — cov ~3.7 → ORDER NOW
const HEALTHY_CODE = "5114151800100"; // LEVETIRACETAM 500MG — cov ~11 → healthy

const X = expectedProjectionFromRealFiles();
const EO = X.perCode.get(ORDER_CODE);
const EH = X.perCode.get(HEALTHY_CODE);
R.ok(EO && EO.orderNow, `mirror marks ${ORDER_CODE} ORDER NOW (stockout ${EO && pretty(EO.stockoutIso)})`);
R.ok(EH && !EH.orderNow, `mirror marks ${HEALTHY_CODE} healthy (stockout ${EH && pretty(EH.stockoutIso)})`);

// Synthetic planner-mapping file to prove the join slot (the real file is not
// yet provided). Header shape: NUPCO code + Planner Name + Planner Email.
const PLANNER_PATH = "/tmp/psmmc-planner-map.xlsx";
{
  const XLSX = loadXLSX();
  const aoa = [
    ["NUPCO Code", "Planner Name", "Planner Email"],
    [ORDER_CODE, "Dr. Fahad Al-Otaibi", "fahad@psmmc.med.sa"],
  ];
  const ws = XLSX.utils.aoa_to_sheet(aoa);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Planners");
  writeFileSync(PLANNER_PATH, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
}

async function rowCells(page, code) {
  await setSearch(page, code);
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const v = await page.evaluate((c) => {
      const tr = document.querySelector(`table tbody tr[data-code="${c}"]`);
      if (!tr || document.querySelectorAll("table tbody tr").length > 60) return null;
      const proj = tr.querySelector("td.projcell");
      const plan = tr.querySelector("td.plancell");
      return {
        proj: proj ? proj.textContent.replace(/\s+/g, " ").trim() : null,
        orderNow: proj ? proj.querySelector(".ordernow-tag") !== null : false,
        planner: plan ? plan.textContent.replace(/\s+/g, " ").trim() : null,
      };
    }, code);
    if (v) return v;
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

const { browser, page, pageErrors } = await launch({ locale: "en" });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });

  const headers = await page.$$eval("thead th", (ths) => ths.map((th) => th.textContent.trim()));
  R.ok(headers.some((h) => /Planner/i.test(h)), `planning table has a Planner column (headers: ${headers.join(" | ")})`);
  R.ok(headers.some((h) => /Stockout/i.test(h)), "planning table has a Stockout column");

  // ORDER NOW anchor
  const o = await rowCells(page, ORDER_CODE);
  R.ok(o, `ORDER NOW anchor row ${ORDER_CODE} found`);
  if (o) {
    R.ok(o.proj.includes(pretty(EO.stockoutIso)), `stockout date ${pretty(EO.stockoutIso)} shown (got "${o.proj}")`);
    R.ok(o.proj.includes(pretty(EO.reorderIso)), `reorder-by date ${pretty(EO.reorderIso)} shown (got "${o.proj}")`);
    R.ok(o.orderNow, "ORDER NOW flag present on the order-now anchor");
    R.ok(/Unassigned/i.test(o.planner), `planner is Unassigned without a planner file (got "${o.planner}")`);
  }

  // HEALTHY anchor
  const h = await rowCells(page, HEALTHY_CODE);
  R.ok(h, `healthy anchor row ${HEALTHY_CODE} found`);
  if (h) {
    R.ok(h.proj.includes(pretty(EH.stockoutIso)), `stockout date ${pretty(EH.stockoutIso)} shown (got "${h.proj}")`);
    R.ok(!h.orderNow, "no ORDER NOW flag on the healthy anchor");
  }

  // ---- planner join slot: upload the synthetic mapping ----------------------
  await uploadFiles(page, "filePlanner", [PLANNER_PATH]);
  await page.waitForSelector("#toast:not([hidden])", { timeout: 15000 });
  const o2 = await rowCells(page, ORDER_CODE);
  R.ok(o2 && /Fahad/i.test(o2.planner), `planner join populates the cell after upload (got "${o2 && o2.planner}")`);
  const h2 = await rowCells(page, HEALTHY_CODE);
  R.ok(h2 && /Unassigned/i.test(h2.planner), `unmapped product stays Unassigned (got "${h2 && h2.planner}")`);

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-projection completed without throwing");
} finally {
  await browser.close();
}

R.done();
