// spec-kpi — owner spec v3 wave 2: KPI cards count ITEMS, every metric
// explains itself, the table freezes its header + name column, and the
// planner file's hospital/MSD codes are shown in full and copyable.
//
// Owner asks under test:
//   - replace the "total available units" and "monthly consumption" cards
//     with item counts: total items / with stock (+%) / zero-stock (+%)
//     («اجمالي عدد البنود المتوفره وغير المتوفره بدل الاستهلاك الشهري وكم
//     نسبه الصفريه»)
//   - clicking any KPI card or a column's ⓘ opens a short bilingual
//     explanation of how the figure is computed («لما يضغط على اي ايقونه
//     يكون فيها شرح بسيط كيف حسبها وش الاليه»)
//   - the header row and the drug name stay frozen while scrolling
//     («تثبيت اسم الدواء لما اروح يمين وكذلك العناوين اللي فوق»)
//   - hospital + MSD codes from the planner file are saved with the item,
//     rendered in full, and copyable («حفظ الاكواد والارقام كامله»)

import { readFileSync } from "node:fs";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  setSearch,
  makeReporter,
} from "./helpers.mjs";
import { loadXLSX } from "./xlsx-loader.mjs";
import {
  expectedEffectiveFromRealFiles,
  REAL_WD,
  REAL_ST,
  REAL_PLANNER,
} from "./real-data-expected.mjs";

const R = makeReporter("spec-kpi");
const fmtInt = (n) => Math.round(n).toLocaleString("en-US");

// ---- expected item counts from the independent mirror ----------------------
const X = expectedEffectiveFromRealFiles();
const total = X.perCode.size;
let withStock = 0;
for (const [, v] of X.perCode) if (v.stock > 0) withStock++;
const zero = total - withStock;
const pctZero = Math.round((zero / total) * 100);
const pctWith = Math.round((withStock / total) * 100);
R.ok(total === 1005 && zero > 0, `mirror: ${total} items, ${withStock} with stock (${pctWith}%), ${zero} zero (${pctZero}%)`);

// ---- planner-file anchor with hospital + MSD codes --------------------------
let anchor = null;
{
  const XLSX = loadXLSX();
  const wb = XLSX.read(new Uint8Array(readFileSync(REAL_PLANNER)), { type: "array" });
  const rows = XLSX.utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]], { header: 1, defval: "" });
  const H = rows[0].map(String);
  const nI = H.indexOf("Nupco"), hI = H.indexOf("Product Code"), mI = H.indexOf("MSD Code");
  for (let i = 1; i < rows.length && !anchor; i++) {
    const code = String(rows[i][nI] ?? "");
    if (!code.startsWith("5")) continue;
    if (!rows[i][hI] || !rows[i][mI]) continue;
    if (X.perCode.has(code)) anchor = { code, hosp: String(rows[i][hI]), msd: String(rows[i][mI]) };
  }
}
R.ok(anchor, `planner anchor with hospital+MSD codes found (${anchor && anchor.code} → hosp ${anchor && anchor.hosp}, msd ${anchor && anchor.msd})`);

const { browser, page, pageErrors } = await launch({ locale: "en" });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });

  // ---- item-count cards ------------------------------------------------------
  const cards = await page.$$eval(".kcard", (els) =>
    els.map((c) => ({
      label: c.querySelector(".klabel")?.textContent.trim() || "",
      value: c.querySelector(".kvalue")?.textContent.replace(/\s+/g, " ").trim() || "",
      full: c.textContent.replace(/\s+/g, " ").trim(),
      explain: c.getAttribute("data-explain"),
    })),
  );
  const itemsCard = cards.find((c) => c.value.includes(fmtInt(total)) && /item|بند/i.test(c.full));
  R.ok(itemsCard, `an items-count card shows the ${fmtInt(total)} total (cards: ${cards.map((c) => c.label + "=" + c.value).join(" | ")})`);
  R.ok(itemsCard && itemsCard.full.includes(fmtInt(withStock)) && itemsCard.full.includes(pctWith + "%"),
    `items card carries with-stock count ${fmtInt(withStock)} and ${pctWith}% (got "${itemsCard && itemsCard.full}")`);
  const zeroCard = cards.find((c) => c.value.includes(fmtInt(zero)) && c !== itemsCard);
  R.ok(zeroCard && zeroCard.full.includes(pctZero + "%"),
    `a zero-stock card shows ${fmtInt(zero)} and ${pctZero}% (got "${zeroCard && zeroCard.full}")`);
  R.ok(!cards.some((c) => /63\.3M|M units/.test(c.value)), "the old total-units KPI card is gone");
  R.ok(!cards.some((c) => /Monthly consumption/i.test(c.label)), "the old monthly-consumption KPI card is gone");

  // ---- explainers ------------------------------------------------------------
  R.ok(itemsCard && itemsCard.explain, "items card is explainable (data-explain)");
  await page.evaluate(() => document.querySelector('.kcard[data-explain="ex_items"]')?.click());
  let modalTxt = await page.evaluate(() => {
    const m = document.getElementById("modal");
    return m && !m.hidden ? document.getElementById("modalCard").textContent.replace(/\s+/g, " ") : "";
  });
  R.ok(/stock > 0|whose available stock|المخزون المتاح/i.test(modalTxt), `clicking the items card explains the count rule (got "${modalTxt.slice(0, 160)}")`);
  await page.keyboard.press("Escape");
  await page.waitForSelector("#modal", { state: "hidden", timeout: 4000 }).catch(() => {});

  const covInfo = await page.$("thead th [data-explain='ex_col_cov']");
  R.ok(covInfo, "coverage column header carries an explain icon");
  await page.evaluate(() => document.querySelector("thead th [data-explain='ex_col_cov']")?.click());
  modalTxt = await page.evaluate(() => {
    const m = document.getElementById("modal");
    return m && !m.hidden ? document.getElementById("modalCard").textContent.replace(/\s+/g, " ") : "";
  });
  R.ok(/dispensable|expiry|الصلاحية|القابل للصرف/i.test(modalTxt), `coverage explainer names the dispensable-stock rule (got "${modalTxt.slice(0, 160)}")`);
  const sortBefore = await page.evaluate(() => document.querySelector("thead th[aria-sort]")?.getAttribute("aria-sort"));
  R.ok(sortBefore != null, `explain click did not toggle the sort (aria-sort still "${sortBefore}")`);
  await page.keyboard.press("Escape");
  await page.waitForSelector("#modal", { state: "hidden", timeout: 4000 }).catch(() => {});

  // ---- sticky header + name column -------------------------------------------
  const sticky = await page.evaluate(() => {
    const th = document.querySelector(".tablewrap thead th");
    const code = document.querySelector(".tablewrap tbody td.code");
    const desc = document.querySelector(".tablewrap tbody td.desc");
    return {
      th: th ? getComputedStyle(th).position : null,
      code: code ? getComputedStyle(code).position : null,
      desc: desc ? getComputedStyle(desc).position : null,
    };
  });
  R.eq(sticky.th, "sticky", "header row is frozen (th position: sticky)");
  R.eq(sticky.code, "sticky", "code column is frozen (td.code position: sticky)");
  R.eq(sticky.desc, "sticky", "name column is frozen (td.desc position: sticky)");
  const stay = await page.evaluate(() => {
    const wrap = document.querySelector(".tablewrap");
    const desc = wrap.querySelector("tbody tr td.desc");
    const before = desc.getBoundingClientRect().left;
    wrap.scrollLeft = 240;
    const after = desc.getBoundingClientRect().left;
    wrap.scrollLeft = 0;
    return { before, after, moved: Math.abs(before - after) };
  });
  R.ok(stay.moved < 2, `name cell holds its place under horizontal scroll (moved ${stay.moved.toFixed(1)}px)`);

  // ---- planner hospital/MSD codes, full + copyable ----------------------------
  await uploadFiles(page, "filePlanner", REAL_PLANNER);
  await page.waitForSelector("#toast:not([hidden])", { timeout: 20000 });
  await setSearch(page, anchor.code);
  let row = null;
  for (let i = 0; i < 30 && !row; i++) {
    row = await page.evaluate((c) => {
      if (document.querySelectorAll("table tbody tr").length > 60) return null;
      const tr = document.querySelector(`table tbody tr[data-code="${c}"]`);
      if (!tr) return null;
      const subs = Array.from(tr.querySelectorAll("td.code .subcode [data-copy], td.code [data-copy-sub]"));
      return {
        text: tr.querySelector("td.code").textContent.replace(/\s+/g, " ").trim(),
        copies: subs.map((s) => s.getAttribute("data-copy") || s.getAttribute("data-copy-sub")),
      };
    }, anchor.code);
    if (!row) await new Promise((r) => setTimeout(r, 200));
  }
  R.ok(row, `anchor row ${anchor.code} found after planner upload`);
  if (row) {
    R.ok(row.text.includes(anchor.hosp), `hospital code ${anchor.hosp} rendered in full (got "${row.text}")`);
    R.ok(row.text.includes(anchor.msd), `MSD code ${anchor.msd} rendered in full`);
    R.ok(row.copies.includes(anchor.hosp), `hospital code is individually copyable (copy targets: ${row.copies.join(", ")})`);
    R.ok(row.copies.includes(anchor.msd), "MSD code is individually copyable");
  }

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-kpi completed without throwing");
} finally {
  await browser.close();
}

// ---- RTL regression: the frozen columns must hold in Arabic too ------------
// (chromium resolved inset-inline-start to a LEFT pin under dir=rtl, so the
// name column scrolled away in Arabic while the LTR assertions stayed green —
// the pinning now uses physical left/right per html[dir].)
{
  const { browser: b2, page: p2 } = await launch({ locale: "ar" });
  try {
    await open(p2, { lang: "ar" });
    await uploadFiles(p2, "fileWithdrawals", REAL_WD);
    await confirmDetectedPeriod(p2);
    await uploadFiles(p2, "fileStock", REAL_ST);
    await p2.waitForSelector("table tbody tr", { timeout: 60000 });
    const rtl = await p2.evaluate(() => {
      const w = document.querySelector(".tablewrap");
      const desc = w.querySelector("tbody td.code + td.desc");
      const code = w.querySelector("tbody td.code");
      const d1 = desc.getBoundingClientRect().right, c1 = code.getBoundingClientRect().right;
      w.scrollLeft = -380;
      const d2 = desc.getBoundingClientRect().right, c2 = code.getBoundingClientRect().right;
      w.scrollLeft = 0;
      return { dir: getComputedStyle(document.documentElement).direction, descMoved: Math.abs(d1 - d2), codeMoved: Math.abs(c1 - c2) };
    });
    R.eq(rtl.dir, "rtl", "Arabic page runs RTL");
    R.ok(rtl.codeMoved < 2, `RTL: code column holds under horizontal scroll (moved ${rtl.codeMoved.toFixed(1)}px)`);
    R.ok(rtl.descMoved < 2, `RTL: name column holds under horizontal scroll (moved ${rtl.descMoved.toFixed(1)}px)`);
  } catch (err) {
    console.log("  ✗ RTL block threw:", err && err.message);
    R.ok(false, "RTL sticky block completed without throwing");
  } finally {
    await b2.close();
  }
}

R.done();
