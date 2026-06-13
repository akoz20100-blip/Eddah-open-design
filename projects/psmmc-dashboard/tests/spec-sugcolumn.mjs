// spec-sugcolumn — wave-6 UX (P0-3): the planning table's "Suggested order"
// column is its primary output and must read as "the answer", not as one more
// flat numeric column.
//
// Red-first: every column shared identical header/cell backgrounds, so the
// decision output (suggested qty) sat undifferentiated next to reference columns
// (qty9, total). This tints the suggested column (header + cells) and separates
// it from its neighbour. Red on the pre-change build (sug header == qty9 header,
// sug cell == a normal numeric cell). Reference: IBM Carbon (data-table primary
// column emphasis) + Refactoring UI (group/zone columns).

import { launch, open, makeReporter } from "./helpers.mjs";

const R = makeReporter("spec-sugcolumn");

async function check(lang) {
  const { browser, page, pageErrors } = await launch({ locale: lang });
  try {
    await open(page, { lang });
    await page.click("#btnSample");
    await page.waitForSelector('.t-main thead th[data-sort="sug"]', { timeout: 8000 });
    const r = await page.evaluate(() => {
      const bg = (el) => (el ? getComputedStyle(el).backgroundColor : null);
      const sugTh = document.querySelector('.t-main thead th[data-sort="sug"]');
      const qtyTh = document.querySelector('.t-main thead th[data-sort="qty9"]');
      const sugTd = document.querySelector('.t-main tbody td.sug');
      const normTd = sugTd ? sugTd.closest("tr").querySelector("td.right.num:not(.sug)") : null;
      return { sugTh: bg(sugTh), qtyTh: bg(qtyTh), sugTd: bg(sugTd), normTd: bg(normTd), hasNorm: !!normTd };
    });
    R.ok(r.hasNorm, `[${lang}] a normal numeric cell exists to compare against`);
    R.ok(r.sugTh !== r.qtyTh, `[${lang}] suggested header tinted distinct from neighbour qty9 (sug=${r.sugTh}, qty9=${r.qtyTh})`);
    R.ok(r.sugTd !== r.normTd, `[${lang}] suggested cell tinted distinct from a normal numeric cell (sug=${r.sugTd}, normal=${r.normTd})`);
    R.ok(pageErrors.length === 0, `[${lang}] no page errors`);
  } finally {
    await browser.close();
  }
}

await check("en");
await check("ar");
R.done();
