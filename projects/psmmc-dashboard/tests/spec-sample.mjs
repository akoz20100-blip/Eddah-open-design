// spec-sample — the embedded sample data must load cleanly and the Planning
// decision figures must match the audited expected values.
//
// Protects: zero page errors on sample load; the 4 Planning decision cards
// (needs-ordering 283, critical 72, total units 109.7M, monthly ≈ 9.5M);
// order sheet shows 7 rows; Management value card renders NO negative figure
// (audit A1 — the "−2432M" regression); Averages tab renders.

import {
  launch,
  open,
  loadSample,
  switchTab,
  cardTexts,
  makeReporter,
} from "./helpers.mjs";

const R = makeReporter("spec-sample");

// Loosely parse the leading number from a localized string (Western digits).
function leadNum(s) {
  const m = String(s).replace(/[,\s]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : NaN;
}

const { browser, page, pageErrors, consoleErrors } = await launch();
try {
  await open(page);
  await loadSample(page);

  R.ok(pageErrors.length === 0, `no page errors on sample load (saw: ${JSON.stringify(pageErrors)})`);
  R.ok(consoleErrors.length === 0, `no console errors on sample load (saw: ${JSON.stringify(consoleErrors)})`);

  // --- Planning decision cards ---
  await switchTab(page, "planning");
  const cards = await cardTexts(page);

  function findCard(...labelFrags) {
    return cards.find((c) => labelFrags.some((f) => c.label.includes(f) || c.full.includes(f)));
  }

  // needs-ordering = 283 (order_now count). Arabic label "يحتاج طلبًا".
  const needOrder = findCard("يحتاج طلبًا", "Needs ordering");
  R.ok(!!needOrder, "needs-ordering card present");
  if (needOrder) R.ok(leadNum(needOrder.value) === 283, `needs-ordering value is 283 (got "${needOrder.value}")`);

  // critical zero-balance = 72. Arabic "حرج".
  const critical = findCard("حرج", "Critical");
  R.ok(!!critical, "critical card present");
  if (critical) R.ok(leadNum(critical.value) === 72, `critical value is 72 (got "${critical.value}")`);

  // total available units ≈ 109.7M. Arabic "إجمالي المخزون المتاح".
  const totalUnits = findCard("إجمالي المخزون المتاح", "Total available stock");
  R.ok(!!totalUnits, "total available units card present");
  if (totalUnits)
    R.ok(/109\.7\s*M/.test(totalUnits.value) || leadNum(totalUnits.value) === 109.7,
      `total units ~109.7M (got "${totalUnits.value}")`);

  // monthly consumption ≈ 9.5M. Arabic "الاستهلاك الشهري".
  const monthly = findCard("الاستهلاك الشهري", "Monthly consumption");
  R.ok(!!monthly, "monthly consumption card present");
  if (monthly)
    R.ok(/9\.5\s*M/.test(monthly.value) || Math.abs(leadNum(monthly.value) - 9.5) < 0.1,
      `monthly consumption ~9.5M (got "${monthly.value}")`);

  // MoM badge present (the .kdelta inside the consumption card).
  const hasDelta = await page.$(".kdelta");
  R.ok(!!hasDelta, "monthly consumption MoM badge (.kdelta) rendered");

  // --- order sheet shows 7 rows ---
  const osRows = await page.$$eval(".ordersheet .os-row", (els) => els.length);
  R.ok(osRows === 7, `order sheet shows 7 rows (got ${osRows})`);

  // --- Management value card: NO negative figure (audit A1) ---
  await switchTab(page, "management");
  // Every displayed figure in the app is wrapped in a `.num` element. A
  // negative price/value (the "−2432M" regression) would surface there. Scan
  // only the numeric-figure elements so prose like "تفوق 12 شهرًا" (">12 mo")
  // and SVG path data can't create false positives.
  const negFigures = await page.$$eval(".num", (els) =>
    els
      .map((e) => e.textContent.replace(/\s+/g, " ").trim())
      // A leading minus (ASCII -, unicode − or –) directly before a digit.
      .filter((txt) => /^[-−–]\s*[\d.]/.test(txt) || /(^|[\s(])[-−–][\d.]/.test(txt)),
  );
  R.ok(
    negFigures.length === 0,
    `Management tab: no negative figure in any .num element (found: ${JSON.stringify(negFigures)})`,
  );

  // Specifically assert the value card's figure text has no negative.
  const valueCard = await page.$$eval(".kcard", (cards) => {
    const c = cards.find((x) => /قيمة المخزون|Stock value|Total stock value/.test(x.textContent));
    if (!c) return null;
    return Array.from(c.querySelectorAll(".num, .kfoot b"))
      .map((n) => n.textContent.replace(/\s+/g, " ").trim())
      .join(" | ");
  });
  if (valueCard) {
    R.ok(!/[-−–]\s*[\d.]/.test(valueCard), `value card figures have no negative (text: "${valueCard}")`);
  }

  // --- Averages tab renders ---
  await switchTab(page, "averages");
  const avgRendered = await page.$("#content .kcard, #content .tablecard");
  R.ok(!!avgRendered, "Averages tab renders content");
  R.ok(pageErrors.length === 0, `no page errors after tab navigation (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-sample completed without throwing");
} finally {
  await browser.close();
}

R.done();
