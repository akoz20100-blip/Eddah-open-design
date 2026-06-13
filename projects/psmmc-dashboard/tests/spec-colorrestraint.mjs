// spec-colorrestraint — wave-6 UX (P1-2): reserve saturated colour for things
// that need attention, so the few critical signals genuinely stand out.
//
// Two restraint moves (red-first):
//  1. The "ok" (healthy) status pill was blue (a saturated attention colour) for
//     a state that needs NO action — demote it to the same quiet neutral as
//     "no movement".
//  2. The coverage bar re-encoded every status as its own hue (ok=blue,
//     warning=amber, excess=violet …) on top of the pill — a second rainbow.
//     The bar should show MAGNITUDE (its width); colour is reserved for danger
//     (coral when order-now / out-of-stock), neutral grey otherwise.
//
// The operationally-distinct order_now vs not_in_stock PILL colours are kept on
// purpose (out-of-stock != merely low). Reference: Stephen Few + Material 3 +
// NN/g — limit semantic colour so "act now" reads instantly.

import { launch, open, makeReporter } from "./helpers.mjs";

const R = makeReporter("spec-colorrestraint");
const CORAL = "rgb(238, 81, 56)";   // --coral #ee5138
const MUTED2 = "rgb(197, 200, 206)"; // --muted-2 #c5c8ce (neutral bar)

async function check(lang) {
  const { browser, page, pageErrors } = await launch({ locale: lang });
  try {
    await open(page, { lang });
    await page.click("#btnSample");
    await page.waitForSelector(".t-main tbody .pill", { timeout: 8000 });
    const r = await page.evaluate(() => {
      const bg = (el) => (el ? getComputedStyle(el).backgroundColor : null);
      const barFor = (status) => {
        const pill = document.querySelector(".t-main tbody .pill." + status);
        if (!pill) return null;
        const bar = pill.closest("tr").querySelector(".covbar i");
        return bar ? getComputedStyle(bar).backgroundColor : null;
      };
      return {
        okPillBg: bg(document.querySelector(".t-main tbody .pill.ok")),
        nmPillBg: bg(document.querySelector(".t-main tbody .pill.no_movement")),
        orderBar: barFor("order_now"),
        okBar: barFor("ok"),
        hasOk: !!document.querySelector(".t-main tbody .pill.ok"),
        hasNm: !!document.querySelector(".t-main tbody .pill.no_movement"),
        hasOrder: !!document.querySelector(".t-main tbody .pill.order_now"),
      };
    });
    R.ok(r.hasOk && r.hasNm && r.hasOrder, `[${lang}] sample has ok + no-movement + order-now rows to compare`);
    R.ok(r.okPillBg === r.nmPillBg, `[${lang}] healthy "ok" pill demoted to the neutral fill (ok=${r.okPillBg}, no-move=${r.nmPillBg})`);
    R.ok(r.orderBar === CORAL, `[${lang}] order-now coverage bar stays coral (danger) (${r.orderBar})`);
    R.ok(r.okBar === MUTED2, `[${lang}] healthy coverage bar is neutral grey, not a saturated hue (${r.okBar})`);
    R.ok(pageErrors.length === 0, `[${lang}] no page errors`);
  } finally {
    await browser.close();
  }
}

await check("en");
await check("ar");
R.done();
