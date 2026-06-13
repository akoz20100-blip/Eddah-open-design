// spec-sheetzones — wave-6 UX (P1-3): the item drill-down sheet was a wall of
// stat tiles with no hierarchy. Chunk it into Decision / History & price /
// Reference zones so the planner reads the action first, reference last.
//
// Red-first: there is no `.dt-zone` in the pre-change build. Reference: Apple HIG
// (lead with the essential) + Refactoring UI (group with spacing & labels).

import { launch, open, makeReporter } from "./helpers.mjs";

const R = makeReporter("spec-sheetzones");

async function check(lang) {
  const { browser, page, pageErrors } = await launch({ locale: lang });
  try {
    await open(page, { lang });
    await page.click("#btnSample");
    await page.waitForSelector(".t-main tbody tr[data-code]", { timeout: 8000 });
    await page.click(".t-main tbody tr[data-code]");
    await page.waitForSelector("#modalCard .dt-zone", { timeout: 5000 });
    const r = await page.evaluate(() => {
      const zones = Array.from(document.querySelectorAll("#modalCard .dt-zone"));
      return {
        n: zones.length,
        allLabelled: zones.length > 0 && zones.every((z) => !!z.querySelector(".dt-zone-lbl")),
        decisionLeadsWithStats: !!(zones[0] && zones[0].querySelector(".statgrid")),
        refHasDrugInfo: zones.some((z) => z.querySelector(".di-block")),
      };
    });
    R.eq(r.n, 3, `[${lang}] item sheet has 3 labelled zones`);
    R.ok(r.allLabelled, `[${lang}] every zone has a heading`);
    R.ok(r.decisionLeadsWithStats, `[${lang}] the first (Decision) zone leads with the key stats`);
    R.ok(r.refHasDrugInfo, `[${lang}] the Reference zone holds the drug-info block`);
    R.ok(pageErrors.length === 0, `[${lang}] no page errors`);
  } finally {
    await browser.close();
  }
}

await check("en");
await check("ar");
R.done();
