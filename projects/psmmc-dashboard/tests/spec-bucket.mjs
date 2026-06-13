// spec-bucket — owner wave 6 §ز (latent): the Management stock-distribution
// chart mis-buckets fractional available quantities < 1.
//
// `floor(log10(q)) + 1` is the order-of-magnitude bucket. For 0 < q < 1 the
// log is negative, so the index becomes 0 or NEGATIVE — a negative index drops
// the item from the chart entirely (and writes NaN onto buckets[-1]). Real
// available quantities are integers so it never fires in production, but the
// guard must still bucket every in-stock item. Fixed with Math.max(0, …).
//
// Red-first: with a fractional-stock item (q = 0.05) the 8 rendered buckets sum
// to fewer than the in-stock item count (the item is lost); green: they sum to
// exactly the in-stock count.

import { writeFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  switchTab,
  makeReporter,
} from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";

const R = makeReporter("spec-bucket");
const XLSX = loadXLSX();

// One moving drug to set a sane period, four in-stock drugs spanning magnitudes
// including two fractional (< 1) quantities that exercise the negative index.
const WD = "/tmp/psmmc-bucket-wd.xlsx";
const ST = "/tmp/psmmc-bucket-st.xlsx";
{
  const wd = [
    ["NUPCO Material", "Order Qty", "Delivery Date", "Status", "UOM", "Description"],
    ["5000001", 100, new Date(2026, 0, 10), "DISPATCHED", "TAB", "Drug A"],
    ["5000001", 100, new Date(2026, 4, 20), "DISPATCHED", "TAB", "Drug A"],
  ];
  const st = [
    ["Generic Item Number", "Total Available Qty", "Generic Item description"],
    ["5000001", 500, "Drug A"],   // mag 3
    ["5000002", 5, "Drug B"],     // mag 1
    ["5000003", 0.5, "Drug C"],   // 0<q<1 → index 0 (was lumped, still counted)
    ["5000004", 0.05, "Drug D"],  // 0<q<1 → index -1 (DROPPED by the bug)
  ];
  for (const [path, aoa] of [[WD, wd], [ST, st]]) {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Sheet1");
    writeFileSync(path, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }
}

const { browser, page, pageErrors } = await launch({ locale: "en" });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", ST);
  await page.waitForSelector("table tbody tr", { timeout: 8000 });
  await switchTab(page, "management");
  await page.waitForSelector(".inset-ticks[data-counts]", { timeout: 8000 });

  const info = await page.evaluate(() => {
    // The 8-bucket stock-distribution chart (the 13-bucket one is coverage).
    const dist = Array.from(document.querySelectorAll(".inset-ticks[data-counts]"))
      .map((el) => el.getAttribute("data-counts").split(",").map(Number))
      .find((arr) => arr.length === 8);
    // in-stock item count = the "in stock" tick card's kvalue.
    let inStock = null;
    document.querySelectorAll(".kcard").forEach((c) => {
      if (/in stock/i.test(c.querySelector(".klabel")?.textContent || "")) {
        inStock = parseInt((c.querySelector(".kvalue")?.textContent || "").replace(/[^\d]/g, ""), 10);
      }
    });
    return { dist, inStock };
  });
  R.ok(info.dist && info.dist.length === 8, `stock-distribution chart found (8 buckets: ${info.dist})`);
  R.ok(info.dist.every((n) => n >= 0 && !Number.isNaN(n)), "no negative or NaN bucket counts");
  R.eq(info.inStock, 4, "four in-stock items loaded");
  const sum = info.dist.reduce((a, b) => a + b, 0);
  R.eq(sum, 4, "every in-stock item is bucketed — including the q=0.05 fractional item");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-bucket completed without throwing");
} finally {
  await browser.close();
}

R.done();
