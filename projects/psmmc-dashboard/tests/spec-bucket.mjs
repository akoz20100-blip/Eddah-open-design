// spec-bucket — wave 6 §G (latent fix): the Management stock-distribution
// histogram must not collapse fractional stock (0 < qty < 1) into the
// zero-stock bucket (or a negative index).
//
// The bucket index is floor(log10(stock)) + 1. For 0 < stock < 1 that is ≤ 0:
// stock in [0.1,1) → index 0 (the ZERO bucket — wrong), stock < 0.1 → a
// NEGATIVE index (the item vanishes from the eight-bar distribution / NaN).
// The fix clamps any positive stock to the lowest non-zero bucket (index ≥ 1).
//
// Falsifiable signal: with every item at stock 0.5, the tallest (highlighted)
// bar of the "in stock" histogram sits at bucket 0 on the buggy build and at
// bucket 1 after the fix. The highlighted bar is the blue, width-4 <rect>.

import { writeFileSync } from "node:fs";
import { launch, open, uploadFiles, confirmDetectedPeriod, switchTab, makeReporter } from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";

const R = makeReporter("spec-bucket");
const XLSX = loadXLSX();
const WD = "/tmp/psmmc-frac-wd.xlsx";
const ST = "/tmp/psmmc-frac-st.xlsx";

// Three moving drugs, each with FRACTIONAL stock 0.5 (no zero-stock items).
{
  const wd = [
    ["NUPCO Material", "Order Qty", "Delivery Date", "Status", "UOM", "Description"],
    ["5000001", 100, "2026-01-01", "DISPATCHED", "VIAL", "Frac drug A"],
    ["5000001", 100, "2026-03-31", "DISPATCHED", "VIAL", "Frac drug A"],
    ["5000002", 100, "2026-01-01", "DISPATCHED", "VIAL", "Frac drug B"],
    ["5000002", 100, "2026-03-31", "DISPATCHED", "VIAL", "Frac drug B"],
    ["5000003", 100, "2026-01-01", "DISPATCHED", "VIAL", "Frac drug C"],
    ["5000003", 100, "2026-03-31", "DISPATCHED", "VIAL", "Frac drug C"],
  ];
  const st = [
    ["Generic Item Number", "Total Available Qty", "Generic Item description"],
    ["5000001", 0.5, "Frac drug A"],
    ["5000002", 0.5, "Frac drug B"],
    ["5000003", 0.5, "Frac drug C"],
  ];
  for (const [path, aoa] of [[WD, wd], [ST, st]]) {
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), "Sheet1");
    writeFileSync(path, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
  }
}

const { browser, page, pageErrors } = await launch();
try {
  await open(page);
  await uploadFiles(page, "fileWithdrawals", WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", ST);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });
  await switchTab(page, "management");
  await page.waitForSelector(".kcard", { timeout: 5000 });

  // Locate the "in stock" distribution card and read its histogram bars.
  const hot = await page.evaluate(() => {
    const cards = [...document.querySelectorAll(".kcard")];
    const card = cards.find((c) => /بالمخزون|in stock/i.test(c.querySelector(".klabel")?.textContent || ""));
    if (!card) return { err: "card not found" };
    const rects = [...card.querySelectorAll("svg rect")];
    if (!rects.length) return { err: "no bars" };
    // The highlighted (tallest) bar is blue, width 4; the rest are gray width 3.
    const hotIdx = rects.findIndex((r) => r.getAttribute("fill") === "#2456f5" || r.getAttribute("width") === "4");
    return { count: rects.length, hotIdx };
  });

  R.ok(!hot.err, `in-stock distribution card + bars present (${hot.err || "ok"})`);
  R.ok(hot.count === 8, `histogram renders all 8 buckets (got ${hot.count})`);
  R.ok(hot.hotIdx >= 1, `§G: fractional-stock items land in a non-zero bucket — highlighted bar is bucket ${hot.hotIdx} (≥1), not the zero bucket`);

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.stack);
  R.ok(false, "spec-bucket completed without throwing");
} finally {
  await browser.close();
}

R.done();
