// spec-leadcard — wave-6 UX (P0-1): the planning view must have ONE dominant
// decision card, not three equal-weight ones.
//
// Red-first: the three top cards (Needs ordering / Items / Zero-stock) were all
// `span3` with an identical 24px value, so visual weight didn't map to decision
// weight. This makes "Needs ordering now" the lead card (`span6 lead`, larger
// value) so size agrees with the coral urgency. Red on the pre-change build (no
// `lead`, equal value sizes). Reference: Refactoring UI (emphasis by size) +
// Stephen Few (most important data most salient).

import { launch, open, makeReporter } from "./helpers.mjs";

const R = makeReporter("spec-leadcard");

async function check(lang) {
  const { browser, page, pageErrors } = await launch({ locale: lang });
  try {
    await open(page, { lang });
    await page.click("#btnSample");
    await page.waitForSelector('.cards [data-explain="ex_need_order"]', { timeout: 8000 });
    const r = await page.evaluate(() => {
      const lead = document.querySelector('.cards [data-explain="ex_need_order"]');
      const items = document.querySelector('.cards [data-explain="ex_items"]');
      if (!lead || !items) return null;
      const sz = (el) => parseFloat(getComputedStyle(el.querySelector(".kvalue")).fontSize);
      return {
        hasLead: lead.classList.contains("lead"),
        span6: lead.classList.contains("span6"),
        leadVal: sz(lead),
        itemsVal: sz(items),
      };
    });
    R.ok(r != null, `[${lang}] both decision cards present`);
    if (r) {
      R.ok(r.hasLead, `[${lang}] "needs ordering" is the lead card`);
      R.ok(r.span6, `[${lang}] lead card spans 6 columns`);
      R.ok(r.leadVal > r.itemsVal, `[${lang}] lead value (${r.leadVal}px) is larger than a secondary card (${r.itemsVal}px)`);
    }
    R.ok(pageErrors.length === 0, `[${lang}] no page errors`);
  } finally {
    await browser.close();
  }
}

await check("en");
await check("ar");
R.done();
