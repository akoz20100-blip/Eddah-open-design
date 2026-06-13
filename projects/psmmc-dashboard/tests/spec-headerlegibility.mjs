// spec-headerlegibility — wave-6 UX (P1-1): table column headers must not use
// ALL-CAPS + letter-spacing.
//
// Why red-first: `thead th` sets `text-transform:uppercase; letter-spacing:.04em`
// (styles.css). The Arabic letter-spacing reset list does NOT cover `thead th`,
// so in Arabic mode the joined script gets .04em tracking that breaks letter
// connections — a real rendering defect in the owner's primary language. Caps
// also slow Latin reading (word-shape loss). Fix: text-transform:none +
// letter-spacing normal. Asserted on the live computed style in EN and AR.

import { launch, open, makeReporter } from "./helpers.mjs";

const R = makeReporter("spec-headerlegibility");

async function check(lang) {
  const { browser, page, pageErrors } = await launch({ locale: lang });
  try {
    await open(page, { lang });
    await page.click("#btnSample"); // language-agnostic sample load
    await page.waitForSelector(".tablecard table.t-main thead th", { timeout: 8000 });
    const s = await page.evaluate(() => {
      const th = document.querySelector(".tablecard table.t-main thead th");
      const cs = getComputedStyle(th);
      return { ls: cs.letterSpacing, tt: cs.textTransform };
    });
    R.ok(s.tt === "none", `[${lang}] header text-transform is none (got "${s.tt}")`);
    R.ok(s.ls === "normal" || s.ls === "0px", `[${lang}] header letter-spacing is normal/0 — Arabic joining intact (got "${s.ls}")`);
    R.ok(pageErrors.length === 0, `[${lang}] no page errors`);
  } finally {
    await browser.close();
  }
}

await check("en");
await check("ar");
R.done();
