// spec-orderurgency — wave-6 UX (P0-2): the order-sheet header must surface an
// exception roll-up so the planner sees SEVERITY before scanning rows.
//
// Red-first: the order-sheet card currently shows only "top / total" as a
// neutral badge; the count of items below one month of cover / out of stock now
// is buried per-row. This adds a `.os-urgency` summary ("X below 1 month · Y out
// of stock now"), coral when > 0. Red on the pre-change build (no `.os-urgency`).
// Reference: NN/g + Stephen Few — surface the exception, not the inventory.

import { launch, open, makeReporter } from "./helpers.mjs";

const R = makeReporter("spec-orderurgency");

async function check(lang) {
  const { browser, page, pageErrors } = await launch({ locale: lang });
  try {
    await open(page, { lang });
    await page.click("#btnSample");
    await page.waitForSelector(".ordersheet", { timeout: 8000 });
    const u = await page.evaluate(() => {
      const el = document.querySelector(".ordersheet .os-urgency");
      if (!el) return null;
      const nums = Array.from(el.querySelectorAll(".num")).map((n) => n.textContent.replace(/[^\d]/g, ""));
      return {
        below: Number(el.getAttribute("data-below")),
        out: Number(el.getAttribute("data-out")),
        firstNum: nums[0],
        hotCount: el.querySelectorAll(".os-hot").length,
      };
    });
    R.ok(u != null, `[${lang}] order-sheet header has an urgency roll-up (.os-urgency)`);
    if (u) {
      R.ok(Number.isInteger(u.below) && u.below >= 0, `[${lang}] data-below is a non-negative integer (${u.below})`);
      R.ok(Number.isInteger(u.out) && u.out >= 0, `[${lang}] data-out is a non-negative integer (${u.out})`);
      // out-of-stock-now is a subset of below-one-month (covEff 0 < 1).
      R.ok(u.below >= u.out, `[${lang}] below-1-month (${u.below}) >= out-of-stock-now (${u.out})`);
      R.ok(String(u.below) === u.firstNum, `[${lang}] rendered first count matches data-below (${u.firstNum})`);
      // Coral only when there is genuine urgency.
      R.ok(u.below > 0 ? u.hotCount > 0 : u.hotCount === 0, `[${lang}] coral .os-hot present iff there is urgency (below=${u.below}, hot=${u.hotCount})`);
    }
    R.ok(pageErrors.length === 0, `[${lang}] no page errors`);
  } finally {
    await browser.close();
  }
}

await check("en");
await check("ar");
R.done();
