// spec-effective — owner spec v3: decisions run on EFFECTIVE (expiry-adjusted)
// stock, not raw stock.
//
// The owner's core bug report: an item whose stock "covers 12 months" but
// whose batches expire long before that was still shown as healthy, with a
// reorder date a year out. The rules under test (documented in
// real-data-expected.mjs → expectedEffectiveFromRealFiles):
//   - expired + FEFO-unreachable (at-risk) units are excluded from coverage,
//     stockout/reorder projection, suggested qty, and status
//   - hand-dispensed forms (UOM not a vial/ampule/injection/syringe/IV bag)
//     stop being dispensable 3 months before expiry (hospital policy);
//     parenteral forms consume until expiry
//   - effective coverage > 13 months = new "excess" (overstock) status
//   - raw coverage stays visible in the item sheet for transparency
//   - the real planner-assignment file's UOM column overrides the
//     withdrawals-file UOM (it is the owner's authoritative dosage form)
//
// Anchors come from the independent mirror on the real files:
//   GRACE_ANCHOR  5114170300500 — raw cov 12.9 "ok" today, but every batch
//                 sits inside the 3-month no-dispense window → effective 0.0,
//                 ORDER NOW (pure grace effect: a no-grace FEFO would consume
//                 it, since all batches expire after the as-of date)
//   EXCESS_ANCHOR 5115180100100 — raw 29.4 / effective 17.9 → "excess"
//   PLANNER_FLIP  5118190100100 — withdrawals UOM AMP (no grace, eff 8.9 ok);
//                 planner file says EACH → grace applies → eff 5.9 ORDER NOW

import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  setSearch,
  makeReporter,
} from "./helpers.mjs";
import {
  expectedEffectiveFromRealFiles,
  REAL_WD,
  REAL_ST,
  REAL_PLANNER,
} from "./real-data-expected.mjs";

const R = makeReporter("spec-effective");
const fmt1 = (n) => (Math.round(n * 10) / 10).toLocaleString("en-US", { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const fmtInt = (n) => Math.round(n).toLocaleString("en-US");
const pretty = (iso) =>
  new Date(+iso.slice(0, 4), +iso.slice(5, 7) - 1, +iso.slice(8, 10))
    .toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

const GRACE_ANCHOR = "5114170300500";
const EXCESS_ANCHOR = "5115180100100";
const PLANNER_FLIP = "5118190100100";

const X = expectedEffectiveFromRealFiles();
const XP = expectedEffectiveFromRealFiles({ withPlanner: true });
const G = X.perCode.get(GRACE_ANCHOR);
const E = X.perCode.get(EXCESS_ANCHOR);
const PF0 = X.perCode.get(PLANNER_FLIP);
const PF1 = XP.perCode.get(PLANNER_FLIP);

// Mirror sanity: the anchors still encode the scenario this spec is about.
R.ok(G && G.covRaw > 6 && G.covEff === 0 && G.status === "order_now",
  `mirror: grace anchor raw ${G && fmt1(G.covRaw)} → eff 0.0 ORDER NOW`);
R.ok(E && E.status === "excess" && E.covEff > 13,
  `mirror: excess anchor eff ${E && fmt1(E.covEff)} → excess`);
R.ok(PF0 && PF1 && PF0.status !== "order_now" && PF1.status === "order_now",
  `mirror: planner UOM flips ${PLANNER_FLIP} ${PF0 && PF0.status} → ${PF1 && PF1.status}`);

/** Read the planning row for a code: effective cov text, status pill class,
 * projection cell text, suggested-qty cell text. */
async function rowFigures(page, code) {
  await setSearch(page, code);
  const deadline = Date.now() + 6000;
  while (Date.now() < deadline) {
    const v = await page.evaluate((c) => {
      if (document.querySelectorAll("table tbody tr").length > 60) return null;
      const tr = document.querySelector(`table tbody tr[data-code="${c}"]`);
      if (!tr) return null;
      const covTd = tr.querySelector("td .covbar")?.closest("td");
      const pill = tr.querySelector("td .pill");
      const proj = tr.querySelector("td.projcell");
      const sug = tr.querySelector("td.sug");
      return {
        cov: covTd ? covTd.querySelector(".num")?.textContent.trim() : null,
        pillClass: pill ? pill.className : null,
        pillText: pill ? pill.textContent.trim() : null,
        proj: proj ? proj.textContent.replace(/\s+/g, " ").trim() : null,
        orderNow: proj ? proj.querySelector(".ordernow-tag") !== null : false,
        sug: sug ? sug.textContent.trim() : null,
      };
    }, code);
    if (v) return v;
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

const { browser, page, pageErrors } = await launch({ locale: "en" });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });

  // ---- grace anchor: decisions must use effective stock --------------------
  const g = await rowFigures(page, GRACE_ANCHOR);
  R.ok(g, `grace anchor row ${GRACE_ANCHOR} found`);
  if (g) {
    R.eq(g.cov, fmt1(G.covEff), `coverage column shows EFFECTIVE coverage (raw is ${fmt1(G.covRaw)})`);
    R.ok(/order_now/.test(g.pillClass || ""), `status comes from effective coverage (got pill "${g.pillClass}")`);
    R.ok(g.orderNow, "ORDER NOW tag present (reorder-by is in the past at effective burn)");
    R.ok(g.proj && g.proj.includes(pretty(G.stockoutIso)), `stockout projected from usable stock: ${pretty(G.stockoutIso)} (got "${g.proj}")`);
    R.eq(g.sug, fmtInt(G.sug), "suggested qty replaces unusable (at-risk) stock");
  }

  // ---- excess anchor: new overstock classification --------------------------
  const e = await rowFigures(page, EXCESS_ANCHOR);
  R.ok(e, `excess anchor row ${EXCESS_ANCHOR} found`);
  if (e) {
    R.eq(e.cov, fmt1(E.covEff), "excess anchor coverage is the effective figure");
    R.ok(/excess/.test(e.pillClass || ""), `effective coverage > 13 months classifies as excess (got pill "${e.pillClass}")`);
  }

  // ---- transparency: the item sheet still shows the raw figure --------------
  await setSearch(page, GRACE_ANCHOR);
  let opened = false;
  for (let i = 0; i < 30 && !opened; i++) {
    opened = await page.evaluate((c) => {
      if (document.querySelectorAll("table tbody tr").length > 60) return false;
      const tr = document.querySelector(`table tbody tr[data-code="${c}"]`);
      if (!tr) return false;
      tr.click();
      return true;
    }, GRACE_ANCHOR);
    if (!opened) await new Promise((r) => setTimeout(r, 200));
  }
  await page.waitForSelector("#modalCard .statgrid", { timeout: 5000 });
  const sheetText = await page.$eval("#modalCard", (el) => el.textContent.replace(/\s+/g, " "));
  R.ok(sheetText.includes(fmt1(G.covEff)), `item sheet shows effective coverage ${fmt1(G.covEff)}`);
  R.ok(sheetText.includes(fmt1(G.covRaw)), `item sheet keeps the raw coverage ${fmt1(G.covRaw)} visible for transparency`);
  await page.keyboard.press("Escape");
  await page.waitForSelector("#modal", { state: "hidden", timeout: 4000 }).catch(() => {});

  // ---- real planner file: its UOM column drives the dosage form -------------
  await uploadFiles(page, "filePlanner", REAL_PLANNER);
  await page.waitForSelector("#toast:not([hidden])", { timeout: 20000 });
  const pf = await rowFigures(page, PLANNER_FLIP);
  R.ok(pf, `planner-flip row ${PLANNER_FLIP} found after planner upload`);
  if (pf) {
    R.eq(pf.cov, fmt1(PF1.covEff), `planner UOM (EACH) re-grades coverage to ${fmt1(PF1.covEff)} (was ${fmt1(PF0.covEff)} from withdrawals UOM AMP)`);
    R.ok(/order_now/.test(pf.pillClass || ""), `planner UOM flips the status to order_now (got pill "${pf.pillClass}")`);
  }

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-effective completed without throwing");
} finally {
  await browser.close();
}

R.done();
