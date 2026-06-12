// spec-realdata — ROUTINE v2 MANDATE: every round validates against the REAL
// owner-supplied hospital files through the actual upload slots, asserting
// the rendered figures — never a textual "works with real data" claim.
//
// Files (see ../real-data/README.md):
//   withdrawals  NUPCO outbound Jan→10 Jun 2026 (10,130 rows, sanitized)
//   stock        NUPCO stock-on-hand as of 2026-02-04 (20,984 rows, real .xls)
//   identifiers  MODHS unified medication catalog 07/2025 (1,462 active rows)
//
// Expected figures are computed INDEPENDENTLY in node by mirroring the
// documented parse rules (tests/real-data-expected.mjs), then compared with
// what the UI actually renders.
//
// Also guards the round-1 real-data fix: the MODHS catalog's name columns
// (MODHS ITEM DESCRIPTION / NUPCO ITEM DESCRIPTION) must feed name search —
// a planner searching the catalog name ("adrenaline") must find the stock
// row even when the warehouse file says EPINEPHRINE.

import {
  launch,
  open,
  uploadFiles,
  waitForPeriodModal,
  confirmDetectedPeriod,
  makeReporter,
} from "./helpers.mjs";
import {
  expectedFromRealFiles,
  REAL_WD,
  REAL_ST,
  REAL_MAP,
} from "./real-data-expected.mjs";

const R = makeReporter("spec-realdata");

// fmtM/fmtInt mirrors (app.js) for asserting rendered figures.
const fmtInt = (n) => Math.round(n).toLocaleString("en-US");
function fmtM(n) {
  n = Math.round(n);
  const a = Math.abs(n);
  if (a >= 1e6) return (n / 1e6).toFixed(1).replace(/\.0$/, "") + "M";
  if (a >= 1e4) return Math.round(n / 1e3) + "K";
  if (a >= 1e3) return (n / 1e3).toFixed(1).replace(/\.0$/, "") + "K";
  return String(n);
}
const pretty = (iso) =>
  new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const X = expectedFromRealFiles();
R.ok(X.medicines > 900, `independent mirror computed ${X.medicines} medicines from the real files`);

const { browser, page, pageErrors } = await launch({ locale: "en" });
try {
  await open(page, { lang: "en" });

  // ---- withdrawals (10,130 rows) -----------------------------------------
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await waitForPeriodModal(page);
  const modalText = await page.$eval("#modalCard", (el) => el.textContent.replace(/\s+/g, " "));
  R.ok(modalText.includes(pretty(X.periodStartIso)), `period modal shows detected start ${pretty(X.periodStartIso)}`);
  R.ok(modalText.includes(pretty(X.periodEndIso)), `period modal shows detected end ${pretty(X.periodEndIso)}`);
  R.ok(modalText.includes(X.monthsRounded1.toFixed(1)), `period modal shows ${X.monthsRounded1.toFixed(1)} detected months`);
  await confirmDetectedPeriod(page);

  // ---- stock-on-hand (20,984 rows, real JasperReports .xls) ---------------
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });

  const meta = await page.evaluate(() => ({
    period: document.getElementById("metaPeriod").textContent,
    stock: document.getElementById("metaStock").textContent,
    count: document.getElementById("metaCount").textContent,
    demoHidden: document.getElementById("metaDemo").hidden,
  }));
  R.ok(meta.count.includes(fmtInt(X.medicines)), `meta chip shows ${fmtInt(X.medicines)} medicines (got "${meta.count}")`);
  R.ok(meta.period.includes(pretty(X.periodStartIso)) && meta.period.includes(pretty(X.periodEndIso)),
    `period chip spans ${pretty(X.periodStartIso)} → ${pretty(X.periodEndIso)} (got "${meta.period}")`);
  R.ok(meta.period.includes(X.monthsRounded1.toFixed(1)), `period chip carries ${X.monthsRounded1.toFixed(1)} months`);
  R.ok(meta.stock.includes("04 Feb 2026"), `stock-as-of resolved from the filename (got "${meta.stock}")`);
  R.ok(meta.demoHidden, "demo-names badge is hidden with real uploads");

  // ---- KPI: total available units equals the independent sum --------------
  const cards = await page.$$eval(".kcard", (cs) => cs.map((c) => c.textContent.replace(/\s+/g, " ")));
  const unitsCard = cards.find((c) => c.includes("Total available stock"));
  R.ok(unitsCard && unitsCard.includes(fmtM(X.totalUnits)),
    `total available stock card shows ${fmtM(X.totalUnits)} (card: "${unitsCard}")`);

  // ---- identifiers: the real MODHS catalog -------------------------------
  await uploadFiles(page, "fileMap", REAL_MAP);
  await page.waitForSelector("#toast:not([hidden])", { timeout: 30000 });
  const toast = await page.$eval("#toast", (el) => el.textContent);
  R.ok(toast.includes("linked"), `catalog upload links codes (toast: "${toast}")`);
  R.ok(!toast.includes("No trade-name column"),
    `MODHS catalog name columns are recognized — no "name search stays limited" warning (toast: "${toast}")`);

  // Planner searches the CATALOG name; the warehouse files say EPINEPHRINE.
  await page.fill("#searchInput", "adrenaline");
  await page.waitForFunction(
    () => {
      // a LOADED row (not the catalog-only fallback) must match
      const rows = document.querySelectorAll("table tbody tr[data-code]:not(.cat-row)");
      return [...rows].some((tr) => (tr.getAttribute("data-code") || "").startsWith("51151703"));
    },
    null,
    { timeout: 10000 },
  );
  R.ok(true, 'searching the catalog name "adrenaline" finds the EPINEPHRINE stock rows');

  // Catalog spelling vs warehouse spelling (ACYCLOVIR vs ACICLOVIR).
  await page.fill("#searchInput", "acyclovir");
  await page.waitForFunction(
    () => [...document.querySelectorAll("table tbody tr[data-code]:not(.cat-row)")]
      .some((tr) => tr.getAttribute("data-code") === "5110230100300"),
    null,
    { timeout: 10000 },
  );
  R.ok(true, 'searching the catalog spelling "acyclovir" finds the ACICLOVIR row');

  R.ok(pageErrors.length === 0, `no page errors with real files (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-realdata completed without throwing");
} finally {
  await browser.close();
}

R.done();
