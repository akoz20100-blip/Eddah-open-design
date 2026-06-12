// spec-expiry — ROADMAP step 1: expiry-date intelligence from the real files.
//
// The real stock file carries Expiry Date + Lot No/Batch on every drug row;
// the outbound file carries Expiry Date + Batch No per dispatch. The
// dashboard must read them and connect them to the coverage math:
//   - an "Expiry (mo)" column in the planning table (earliest batch expiry,
//     months from the stock-as-of date), flagged when the flat coverage
//     outlives the expiry (units would expire before they can be used)
//   - the per-upload "what changed" digest calls out items whose coverage
//     outlives their expiry
//   - the item sheet lists the batches with their expiry dates and shows
//     the effective coverage after deducting at-risk units
//   - the order-sheet card flags expiry-risk candidates
//
// Expected figures come from an INDEPENDENT mirror of the documented rules
// (tests/real-data-expected.mjs → expectedExpiryFromRealFiles), computed
// from the same real files the spec uploads through the actual UI slots.

import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
} from "./helpers.mjs";
import { expectedExpiryFromRealFiles, REAL_WD, REAL_ST } from "./real-data-expected.mjs";

const R = makeReporter("spec-expiry");

const fmt1 = (n) =>
  (Math.round(n * 10) / 10).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtInt = (n) => Math.round(n).toLocaleString("en-US");

const X = expectedExpiryFromRealFiles();
R.ok(X.riskCount > 50, `independent mirror finds ${X.riskCount} expiry-risk items in the real files`);

// Stable, high-signal anchor: BISOPROLOL FUMARATE 5 MG — large stock whose
// flat coverage far outlives the earliest batch expiries.
const ANCHOR = "5112172500100";
const A = X.perCode.get(ANCHOR);
R.ok(A && A.risk, `anchor ${ANCHOR} is expiry-risk in the mirror (cov ${A && fmt1(A.cov)} → eff ${A && fmt1(A.expCov)} mo)`);

const { browser, page, pageErrors } = await launch({ locale: "en" });
try {
  // The order-sheet print path calls window.print(); neutralize it so the
  // headless run can inspect the rendered #printSheet DOM instead.
  await page.addInitScript(() => { window.print = function () {}; });
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });

  // ---- planning table: expiry column ---------------------------------------
  const headers = await page.$$eval("thead th", (ths) => ths.map((th) => th.textContent.trim()));
  R.ok(headers.some((h) => /Expiry/i.test(h)), `planning table has an Expiry column (headers: ${headers.join(" | ")})`);

  // Search down to the anchor row (node-side polling — headless chromium
  // starves in-page timers on idle file:// pages).
  await page.fill("#searchInput", ANCHOR);
  let row = null;
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    row = await page.evaluate((code) => {
      const tr = document.querySelector(`table tbody tr[data-code="${code}"]`);
      if (!tr || document.querySelectorAll("table tbody tr").length > 60) return null;
      const expCell = tr.querySelector("td.expcell");
      return {
        cells: [...tr.querySelectorAll("td")].map((td) => td.textContent.trim()),
        exp: expCell ? expCell.textContent.trim() : null,
        risk: expCell ? expCell.querySelector(".exp-risk") !== null : false,
        riskTitle: expCell && expCell.querySelector(".exp-risk") ? expCell.querySelector(".exp-risk").getAttribute("title") : null,
      };
    }, ANCHOR);
    if (row) break;
    await new Promise((r) => setTimeout(r, 200));
  }
  R.ok(row, `anchor row ${ANCHOR} found via search`);
  if (row) {
    R.ok(row.exp != null && row.exp.includes(fmt1(A.expMonths)), `expiry cell shows earliest expiry ${fmt1(A.expMonths)} mo (got "${row.exp}")`);
    R.ok(row.risk, "expiry cell carries the at-risk flag (coverage outlives expiry)");
    R.ok(
      row.riskTitle && row.riskTitle.includes(fmt1(A.expCov)),
      `at-risk tooltip carries the effective coverage ${fmt1(A.expCov)} mo (got "${row.riskTitle}")`,
    );
  }

  // ---- item sheet: batches + effective coverage ----------------------------
  await page.click(`table tbody tr[data-code="${ANCHOR}"]`);
  await page.waitForSelector("#modalCard .dt-title", { timeout: 5000 });
  const sheet = await page.evaluate(() => ({
    text: document.getElementById("modalCard").textContent.replace(/\s+/g, " "),
    batchRows: document.querySelectorAll("#modalCard .batch-row").length,
  }));
  R.ok(sheet.batchRows > 0, `item sheet lists batch rows (got ${sheet.batchRows})`);
  R.ok(
    sheet.text.includes(fmt1(A.expCov)),
    `item sheet shows the effective coverage after expiry ${fmt1(A.expCov)} mo`,
  );
  R.ok(
    sheet.text.includes(fmtInt(A.waste)) || sheet.text.includes(fmt1(A.waste / 1000) + "K"),
    `item sheet shows the units at risk (${fmtInt(A.waste)})`,
  );
  await page.keyboard.press("Escape");

  // ---- digest: coverage-outlives-expiry callout ----------------------------
  const digest = await page.evaluate(() => {
    const card = document.querySelector(".digest");
    return card ? card.textContent.replace(/\s+/g, " ") : null;
  });
  R.ok(digest, "the what-changed digest card is shown after a real upload");
  R.ok(
    digest && digest.includes(fmtInt(X.riskCount)),
    `digest counts ${fmtInt(X.riskCount)} items whose coverage outlives expiry (digest: "${digest && digest.slice(0, 200)}")`,
  );

  // ---- order sheet: expiry column on the printable sheet --------------------
  // The card shows only the 7 most urgent candidates (typically zero-stock
  // items with no batches); the printable sheet lists ALL candidates, so the
  // expiry column is asserted there.
  await page.click("#osPrint");
  const prn = await page.evaluate(() => {
    const el = document.getElementById("printSheet");
    if (!el) return null;
    return {
      head: [...el.querySelectorAll("thead th")].map((th) => th.textContent.trim()),
      riskCells: el.querySelectorAll("td .exp-risk, td.exp-risk").length,
    };
  });
  R.ok(prn && prn.head.some((h) => /Expiry/i.test(h)), `printed order sheet includes the expiry column (headers: ${prn && prn.head.join(" | ")})`);

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-expiry completed without throwing");
} finally {
  await browser.close();
}

R.done();
