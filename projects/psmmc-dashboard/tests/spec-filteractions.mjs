// spec-filteractions — wave-6 UX (P1-6): the planning toolbar mixed up to 11
// items in one chip row — status FILTERS and ACTIONS (copy-all codes, export
// view) styled identically, so an action looked like a filter toggle.
//
// Red-first: Copy-all + Export-view sit inside `.filters` as plain `.fchip`.
// This pulls them into a separate `.filter-actions` cluster with a distinct
// `.fchip-action` treatment. Reference: Shopify Polaris (separate filters from
// actions) + NN/g (visual grouping / choice overload).

import { launch, open, makeReporter } from "./helpers.mjs";

const R = makeReporter("spec-filteractions");

async function check(lang) {
  const { browser, page, pageErrors } = await launch({ locale: lang });
  try {
    await open(page, { lang });
    await page.click("#btnSample");
    await page.waitForSelector(".toolbar #copyAllCodes", { timeout: 8000 });
    const r = await page.evaluate(() => {
      const actions = document.querySelector(".toolbar .filter-actions");
      const copy = document.getElementById("copyAllCodes");
      const exp = document.getElementById("exportView");
      return {
        hasActions: !!actions,
        copyInActions: !!(actions && copy && actions.contains(copy)),
        expInActions: !!(actions && exp && actions.contains(exp)),
        copyInFilters: !!(copy && copy.closest(".filters")),
        copyHasActionClass: !!(copy && copy.classList.contains("fchip-action")),
        // a real status filter must still be a plain filter chip in .filters
        filterStillChip: !!document.querySelector('.filters .fchip[data-filter="order_now"]'),
      };
    });
    R.ok(r.hasActions, `[${lang}] toolbar has a separate .filter-actions cluster`);
    R.ok(r.copyInActions && r.expInActions, `[${lang}] Copy-all + Export-view live in the actions cluster`);
    R.ok(!r.copyInFilters, `[${lang}] Copy-all is no longer inside the .filters chip group`);
    R.ok(r.copyHasActionClass, `[${lang}] action buttons carry a distinct .fchip-action class`);
    R.ok(r.filterStillChip, `[${lang}] status filters remain plain filter chips`);
    R.ok(pageErrors.length === 0, `[${lang}] no page errors`);
  } finally {
    await browser.close();
  }
}

await check("en");
await check("ar");
R.done();
