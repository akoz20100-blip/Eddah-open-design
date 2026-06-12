// Independent mirror of the dashboard's documented parse/compute rules,
// applied to the REAL owner-supplied files in ../real-data/. spec-realdata
// uploads the same files through the actual UI slots and asserts the
// rendered figures equal these independently computed expectations.
//
// Mirrored rules (single source of truth: app.js parsers):
//   - workbook → first sheet → sheet_to_json({ header:1, raw:true, defval:"" })
//   - withdrawals: NUPCO Material / Order Qty / Delivery Date / Status,
//     Status must be DISPATCHED or APPROVED, code must start with "5"
//   - stock: Generic Item Number / Total Available Qty, code prefix "5"
//   - months = max((maxDate - minDate) / 86400000 / 30.44, 1)
//   - rows = union of withdrawal codes and stock codes
//
// Run standalone for a report:  node tests/real-data-expected.mjs

import { resolve, dirname } from "node:path";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { loadXLSX } from "./xlsx-loader.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REAL_DIR = resolve(__dirname, "..", "real-data");
export const REAL_WD = resolve(REAL_DIR, "NUPCO_outbound_Jan2026to10_Jun2026.sanitized.xlsx");
export const REAL_ST = resolve(REAL_DIR, "NUPCO_Stock_On_Hand_C100_MODPSMMC_04022026.xls");
export const REAL_MAP = resolve(REAL_DIR, "MODDHS_MEDICATION_CATALOG_072025.xlsx");
export const REAL_PLANNER = resolve(REAL_DIR, "PSMMC_planner_assignment_12062026.xlsx");
export const REAL_PRICES = resolve(REAL_DIR, "NUPCO_net_unit_prices_12062026.xlsx");
export const REAL_ORDERS = resolve(REAL_DIR, "NUPCO_framework_orders_asof_12062026.sanitized.xlsx");

const DAYS_PER_MONTH = 30.44;
const STATUS_OK = { DISPATCHED: 1, APPROVED: 1 };
const REORDER_MONTHS = 6;

/* ---------- effective-stock rules (owner spec v3, 2026-06-12) ----------
   - Expired stock and FEFO-unreachable (at-risk) stock must NOT count toward
     coverage, stockout/reorder projection, suggested qty, or status.
   - Hand-dispensed dosage forms (anything handed to a patient: tablets,
     syrups, tubes, sachets, pens, …) stop being dispensable GRACE_MONTHS
     before their expiry (hospital policy: nothing with ≤ 3 months shelf life
     leaves the pharmacy). Parenteral forms (vials, ampules, injections,
     syringes, IV bags) are consumed in-hospital until expiry → no grace.
   - UOM is the dosage-form source (owner decision): planner file UOM wins,
     then the catalog UOM, then the withdrawals-file UOM. Unknown → no grace.
   - Effective coverage > 13 months = "excess" (overstock) classification. */
export const GRACE_MONTHS = 3;
export const EXCESS_MONTHS = 13;
const INJECTABLE_UOMS = new Set([
  "VIAL", "VAIL", "VIA", "VL",
  "AMP", "AMPULE", "AMPOULE", "AP",
  "INJ", "IJ", "INJECTION",
  "SYRINGE", "PFS", "PS",
  "BAG", "BG", "INFUSION", "IV",
]);
export function handDispensedUom(uom) {
  if (uom == null || uom === "") return false; // unknown form → no grace
  const tok = String(uom).trim().toUpperCase().split("/")[0].trim();
  if (!tok) return false;
  return !INJECTABLE_UOMS.has(tok);
}

function aoaOf(path) {
  const XLSX = loadXLSX();
  const wb = XLSX.read(new Uint8Array(readFileSync(path)), { type: "array", cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: "" });
}

function normCode(v) {
  if (v == null || v === "") return null;
  if (typeof v === "number") return String(Math.round(v));
  let s = String(v).trim();
  if (/^\d+\.0+$/.test(s)) s = s.split(".")[0];
  return s;
}
const isDrug = (c) => Boolean(c && c.charAt(0) === "5");
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : 0; };

// app.js parseDate, trimmed to the shapes present in the real exports:
// Date cells, Excel serials, and ISO / D-M-Y strings.
function parseDateLikeApp(v) {
  if (v instanceof Date && !Number.isNaN(+v)) return v;
  if (typeof v === "number" && v > 20000 && v < 80000) {
    const u = new Date(Math.round((v - 25569) * 86400 * 1000));
    return new Date(u.getUTCFullYear(), u.getUTCMonth(), u.getUTCDate());
  }
  if (typeof v === "string") {
    const s = v.trim();
    let m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (m) return new Date(+m[1], +m[2] - 1, +m[3]);
    m = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})/);
    if (m) {
      let dd = +m[1], mm = +m[2];
      const yyyy = +m[3];
      if (mm > 12) { if (dd <= 12) { const t = dd; dd = mm; mm = t; } else return null; }
      if (mm < 1 || dd < 1 || dd > 31) return null;
      return new Date(yyyy, mm - 1, dd);
    }
  }
  return null;
}

function findCol(header, cands) {
  const low = header.map((h) => String(h == null ? "" : h).trim().toLowerCase());
  for (const cand of cands) {
    const c = cand.toLowerCase();
    let i = low.indexOf(c);
    if (i >= 0) return i;
    i = low.findIndex((h) => h.includes(c));
    if (i >= 0) return i;
  }
  return -1;
}

export function expectedFromRealFiles() {
  // ---- withdrawals --------------------------------------------------------
  const wd = aoaOf(REAL_WD);
  const H = wd[0];
  const ci = findCol(H, ["NUPCO Material", "Generic Item Number", "Material"]);
  const qi = findCol(H, ["Order Qty", "Quantity", "Qty"]);
  const di = findCol(H, ["Delivery Date", "Ordered Date", "Date"]);
  const si = findCol(H, ["Status"]);
  const byCode = new Map();
  let minD = null, maxD = null;
  for (let r = 1; r < wd.length; r++) {
    const row = wd[r];
    if (!row) continue;
    if (si >= 0) {
      const st = String(row[si] || "").trim().toUpperCase();
      if (!STATUS_OK[st]) continue;
    }
    const code = normCode(row[ci]);
    if (!isDrug(code)) continue;
    const q = num(row[qi]);
    byCode.set(code, (byCode.get(code) || 0) + q);
    const d = parseDateLikeApp(row[di]);
    if (d) {
      if (!minD || d < minD) minD = d;
      if (!maxD || d > maxD) maxD = d;
    }
  }
  const months = minD && maxD ? Math.max((maxD - minD) / 86400000 / DAYS_PER_MONTH, 1.0) : 1.0;
  const totalWithdrawn = [...byCode.values()].reduce((a, b) => a + b, 0);

  // ---- stock ---------------------------------------------------------------
  const st = aoaOf(REAL_ST);
  const HS = st[0];
  const sci = findCol(HS, ["Generic Item Number", "NUPCO Material", "Material"]);
  let sai = findCol(HS, ["Total Available Qty", "Available Qty", "Total Available Quantity"]);
  if (sai < 0) sai = findCol(HS, ["Total Qty", "Quantity"]);
  const stockByCode = new Map();
  for (let r = 1; r < st.length; r++) {
    const row = st[r];
    if (!row) continue;
    const code = normCode(row[sci]);
    if (!isDrug(code)) continue;
    stockByCode.set(code, (stockByCode.get(code) || 0) + num(row[sai]));
  }
  const totalUnits = [...stockByCode.values()].reduce((a, b) => a + b, 0);

  // ---- row union -----------------------------------------------------------
  const union = new Set([...byCode.keys(), ...stockByCode.keys()]);

  return {
    wdRows: wd.length - 1,
    stRows: st.length - 1,
    drugCodesWithdrawn: byCode.size,
    drugCodesInStock: stockByCode.size,
    medicines: union.size,
    totalWithdrawn,
    totalUnits,
    months,
    monthsRounded1: Math.round(months * 10) / 10,
    periodStartIso: minD ? iso(minD) : null,
    periodEndIso: maxD ? iso(maxD) : null,
  };
}

function iso(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/* ---------- effective-stock mirror (owner spec v3) ----------
   Independently mirrors the full decision pipeline per product:
     - monthly avg = total DISPATCHED/APPROVED qty ÷ ROUNDED detected months
     - live batches = stock rows with available qty > 0 and expiry ≥ as-of,
       merged per expiry date (same-date rows sum)
     - grace months = 3 when the product's UOM is hand-dispensed (see
       handDispensedUom), 0 for parenteral forms and unknown UOM
     - FEFO walk with the grace cutoff: a batch contributes only what can be
       consumed before (expiry − grace); the remainder is waste (at risk)
     - usable = stock − waste; effective coverage = usable ÷ avg
     - raw coverage = stock ÷ avg (kept for display transparency)
     - status from EFFECTIVE coverage: not_in_stock / no_movement /
       order_now (≤6) / warning (≤7) / excess (>13) / ok
     - Stockout = as-of + effCov months; Reorder-By = as-of + (effCov − 6)
       months; ORDER NOW when Reorder-By ≤ today
     - products with no dated batches keep raw figures (degrade gracefully)
   `withPlanner` mirrors the state after the real planner-assignment file is
   uploaded (its UOM column overrides the withdrawals-file UOM). */
export function expectedEffectiveFromRealFiles({ withPlanner = false } = {}) {
  const base = expectedFromRealFiles();
  const months = base.monthsRounded1;

  // withdrawals: totals + UOM fallback per code
  const wd = aoaOf(REAL_WD);
  let H = wd[0];
  let ci = findCol(H, ["NUPCO Material"]);
  const qi = findCol(H, ["Order Qty"]);
  const si = findCol(H, ["Status"]);
  const ui = findCol(H, ["UOM"]);
  const di = findCol(H, ["Delivery Date"]);
  const tot = new Map();
  const wdUom = new Map();
  const monthly = new Map(); // code → Map(ym → qty), feeds the seasonal rule
  for (let r = 1; r < wd.length; r++) {
    const row = wd[r];
    if (!row) continue;
    if (!STATUS_OK[String(row[si] || "").trim().toUpperCase()]) continue;
    const code = normCode(row[ci]);
    if (!isDrug(code)) continue;
    tot.set(code, (tot.get(code) || 0) + num(row[qi]));
    if (!wdUom.has(code) && ui >= 0 && row[ui] != null && String(row[ui]).trim() !== "") {
      wdUom.set(code, String(row[ui]).trim());
    }
    const d = parseDateLikeApp(row[di]);
    if (d) {
      const ym = d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0");
      const m = monthly.get(code) || new Map();
      m.set(ym, (m.get(ym) || 0) + num(row[qi]));
      monthly.set(code, m);
    }
  }

  // optional planner-file UOM override (the owner's authoritative dosage form)
  const plUom = new Map();
  if (withPlanner) {
    const pl = aoaOf(REAL_PLANNER);
    const HP = pl[0];
    const pci = findCol(HP, ["Nupco"]);
    const pui = findCol(HP, ["UOM"]);
    for (let r = 1; r < pl.length; r++) {
      const row = pl[r];
      if (!row) continue;
      const code = normCode(row[pci]);
      if (!isDrug(code)) continue;
      if (pui >= 0 && row[pui] != null && String(row[pui]).trim() !== "" && !plUom.has(code)) {
        plUom.set(code, String(row[pui]).trim());
      }
    }
  }

  // stock: totals + live/expired date-merged batches per code
  const st = aoaOf(REAL_ST);
  H = st[0];
  ci = findCol(H, ["Generic Item Number"]);
  const ai = findCol(H, ["Total Available Qty"]);
  const xi = findCol(H, ["Expiry Date"]);
  const asOf = new Date(2026, 1, 4); // from the stock filename 04022026
  const asOfIso = iso(asOf);
  const stk = new Map();
  const batchesBy = new Map();
  for (let r = 1; r < st.length; r++) {
    const row = st[r];
    if (!row) continue;
    const code = normCode(row[ci]);
    if (!isDrug(code)) continue;
    const q = num(row[ai]);
    stk.set(code, (stk.get(code) || 0) + q);
    const d = parseDateLikeApp(row[xi]);
    if (d && q > 0) {
      const key = iso(d);
      if (key >= asOfIso) {
        const m = batchesBy.get(code) || new Map();
        m.set(key, (m.get(key) || 0) + q);
        batchesBy.set(code, m);
      }
    }
  }

  const todayIso = iso(new Date());
  const addDays = (d, n) => iso(new Date(d.getFullYear(), d.getMonth(), d.getDate() + Math.round(n)));
  const perCode = new Map();
  const union = new Set([...tot.keys(), ...stk.keys()]);
  for (const code of union) {
    const avg = (tot.get(code) || 0) / months;
    const inStock = stk.has(code);
    const stock = stk.get(code) || 0;
    const uom = plUom.get(code) || wdUom.get(code) || null;
    const grace = handDispensedUom(uom) ? GRACE_MONTHS : 0;
    const covRaw = avg > 0 ? stock / avg : null;
    let waste = 0;
    const m = batchesBy.get(code);
    if (m && avg > 0) {
      let consumed = 0;
      for (const k of [...m.keys()].sort()) {
        const d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
        const tMo = Math.max(0, (d - asOf) / 86400000 / DAYS_PER_MONTH - grace);
        const q = m.get(k);
        const use = Math.min(q, Math.max(0, avg * tMo - consumed));
        waste += q - use;
        consumed += use;
      }
    }
    const usable = stock - waste;
    const covEff = avg > 0 ? usable / avg : null;
    let status;
    if (!inStock) status = "not_in_stock";
    else if (avg === 0) status = "no_movement";
    else if (covEff <= REORDER_MONTHS) status = "order_now";
    else if (covEff <= REORDER_MONTHS + 1) status = "warning";
    else if (covEff > EXCESS_MONTHS) status = "excess";
    else status = "ok";
    const stockoutIso = avg > 0 ? (usable > 0 ? addDays(asOf, covEff * DAYS_PER_MONTH) : asOfIso) : null;
    const reorderIso = avg > 0 ? addDays(asOf, ((covEff == null ? 0 : covEff) - REORDER_MONTHS) * DAYS_PER_MONTH) : null;
    // Seasonal suggestion (round-3 rule): with ≥6 months of history, the
    // 9 upcoming months take their prior-year same-month figure when known
    // (falling back to the flat avg); when ≥3 months matched, the suggestion
    // becomes Σ(target) − dispensable stock.
    let sug = Math.max(0, avg * 9 - usable);
    let seasonal = 0;
    const my = monthly.get(code);
    if (my && avg > 0 && base.periodEndIso) {
      const y0 = +base.periodEndIso.slice(0, 4);
      const m0 = +base.periodEndIso.slice(5, 7);
      let sum = 0, matched = 0;
      for (let i = 1; i <= 9; i++) {
        let mm = m0 + i, yy = y0;
        while (mm > 12) { mm -= 12; yy++; }
        const prior = (yy - 1) + "-" + String(mm).padStart(2, "0");
        if (my.has(prior)) { sum += my.get(prior); matched++; }
        else sum += avg;
      }
      if (matched >= 3) { sug = Math.max(0, sum - usable); seasonal = matched; }
    }
    perCode.set(code, {
      avg, stock, usable, waste, covRaw, covEff, status, uom, grace,
      stockoutIso, reorderIso, orderNow: !!(reorderIso && reorderIso <= todayIso), sug, seasonal,
      hasBatches: !!m,
    });
  }
  return { months, asOfIso, todayIso, perCode };
}

/* ---------- expiry-views mirror (FEATURE 3 + 4) ----------
   Independently mirrors the dedicated Expired and At-Risk batch views. Both
   merge a product's stock rows by expiry DATE (matching the app's per-code
   per-date batch grouping), then:
     - Expired = date-batches whose expiry < stock-as-of, counted by their
       Total Qty (NUPCO routes expired stock to Hold, so Available is 0)
     - At-Risk = FEFO over the live (expiry ≥ as-of, available > 0) batches at
       the monthly average; a batch's unconsumed remainder (≥ 1 unit) before
       its own expiry is at-risk */
export function expectedExpiryViewsFromRealFiles() {
  const base = expectedFromRealFiles();
  const months = base.monthsRounded1;

  const wd = aoaOf(REAL_WD);
  let H = wd[0];
  let ci = findCol(H, ["NUPCO Material"]);
  const qi = findCol(H, ["Order Qty"]);
  const si = findCol(H, ["Status"]);
  const tot = new Map();
  for (let r = 1; r < wd.length; r++) {
    const row = wd[r];
    if (!row) continue;
    if (!STATUS_OK[String(row[si] || "").trim().toUpperCase()]) continue;
    const code = normCode(row[ci]);
    if (!isDrug(code)) continue;
    tot.set(code, (tot.get(code) || 0) + num(row[qi]));
  }

  const st = aoaOf(REAL_ST);
  H = st[0];
  ci = findCol(H, ["Generic Item Number"]);
  const ai = findCol(H, ["Total Available Qty"]);
  const tqi = findCol(H, ["Total Qty"]);
  const xi = findCol(H, ["Expiry Date"]);
  const asOf = new Date(2026, 1, 4);
  const asOfIso = isoFromDate(asOf);

  const byCode = new Map();
  for (let r = 1; r < st.length; r++) {
    const row = st[r];
    if (!row) continue;
    const code = normCode(row[ci]);
    if (!isDrug(code)) continue;
    const d = parseDateLikeApp(row[xi]);
    if (!d) continue;
    const key = isoFromDate(d);
    const m = byCode.get(code) || new Map();
    const slot = m.get(key) || { av: 0, tot: 0 };
    slot.av += num(row[ai]);
    slot.tot += tqi >= 0 ? num(row[tqi]) : num(row[ai]);
    m.set(key, slot);
    byCode.set(code, m);
  }

  let expBatches = 0, expQty = 0, arBatches = 0, arQty = 0;
  const arProd = new Set();
  for (const [code, m] of byCode) {
    const dates = [...m.keys()].sort();
    for (const k of dates) if (k < asOfIso && m.get(k).tot > 0) { expBatches++; expQty += m.get(k).tot; }
    const avg = (tot.get(code) || 0) / months;
    if (avg <= 0) continue;
    let consumed = 0;
    for (const k of dates.filter((x) => x >= asOfIso && m.get(x).av > 0)) {
      const d = new Date(+k.slice(0, 4), +k.slice(5, 7) - 1, +k.slice(8, 10));
      const tMo = Math.max(0, (d - asOf) / 86400000 / DAYS_PER_MONTH);
      const q = m.get(k).av;
      const use = Math.min(q, Math.max(0, avg * tMo - consumed));
      const risk = q - use;
      consumed += use;
      if (risk >= 1) { arBatches++; arQty += risk; arProd.add(code); }
    }
  }
  return {
    asOfIso: iso(asOf), months,
    expired: { batches: expBatches, qty: expQty },
    atRisk: { batches: arBatches, qty: arQty, products: arProd.size },
  };
}

/* ---------- projection mirror (FEATURE 1 + 2) ----------
   Independently mirrors the documented projection rules so spec-projection
   can assert the rendered Stockout Date / Reorder-By Date / ORDER NOW flag:
     - daily burn = monthly average ÷ 30.44 (monthly avg = total withdrawn ÷
       ROUNDED detected months — the period modal applies the display-rounded
       value)
     - available excludes expired (NUPCO already routes expired stock to Hold,
       so Total Available Qty is the non-expired figure)
     - Stockout Date = stock-as-of + (available ÷ daily burn) days — anchored
       on the file's own as-of date so the projection is traceable to the data
       (in production the file is 1-2 days old, so as-of ≈ today)
     - Reorder-By Date = the date coverage drops below 6 months =
       stock-as-of + (coverage − 6) months of consumption
     - ORDER NOW when Reorder-By Date ≤ today (≡ coverage ≤ 6 at as-of) */
export function expectedProjectionFromRealFiles() {
  const REORDER_MONTHS = 6;
  const base = expectedFromRealFiles();
  const months = base.monthsRounded1;

  const wd = aoaOf(REAL_WD);
  let H = wd[0];
  let ci = findCol(H, ["NUPCO Material"]);
  const qi = findCol(H, ["Order Qty"]);
  const si = findCol(H, ["Status"]);
  const tot = new Map();
  for (let r = 1; r < wd.length; r++) {
    const row = wd[r];
    if (!row) continue;
    if (!STATUS_OK[String(row[si] || "").trim().toUpperCase()]) continue;
    const code = normCode(row[ci]);
    if (!isDrug(code)) continue;
    tot.set(code, (tot.get(code) || 0) + num(row[qi]));
  }

  const st = aoaOf(REAL_ST);
  H = st[0];
  ci = findCol(H, ["Generic Item Number"]);
  const ai = findCol(H, ["Total Available Qty"]);
  const stk = new Map();
  for (let r = 1; r < st.length; r++) {
    const row = st[r];
    if (!row) continue;
    const code = normCode(row[ci]);
    if (!isDrug(code)) continue;
    stk.set(code, (stk.get(code) || 0) + num(row[ai]));
  }

  const asOf = new Date(2026, 1, 4); // 04-02-2026 from the filename
  const todayIso = isoFromDate(new Date());
  const addDays = (d, n) => isoFromDate(new Date(d.getFullYear(), d.getMonth(), d.getDate() + Math.round(n)));
  const perCode = new Map();
  for (const [code, stock] of stk) {
    const avg = (tot.get(code) || 0) / months;
    if (avg <= 0 || stock <= 0) {
      perCode.set(code, { avg, stock, cov: avg > 0 ? stock / avg : null, stockoutIso: null, reorderIso: null, orderNow: avg > 0 });
      continue;
    }
    const cov = stock / avg;
    const stockoutIso = addDays(asOf, cov * DAYS_PER_MONTH);
    const reorderIso = addDays(asOf, (cov - REORDER_MONTHS) * DAYS_PER_MONTH);
    perCode.set(code, { avg, stock, cov, stockoutIso, reorderIso, orderNow: reorderIso <= todayIso });
  }
  return { months, asOfIso: iso(asOf), todayIso, perCode };
}

function isoFromDate(d) {
  return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
}

/* ---------- data-quality mirror (ROADMAP step 2) ----------
   Independently mirrors the parsers' accept/reject taxonomy so spec-quality
   can assert the per-upload quality card against it:
     withdrawals — checked in order: status not DISPATCHED/APPROVED →
       missing code → non-drug code; accepted rows may still carry an
       unreadable non-empty date (warning, row stays counted)
     stock — missing code → non-drug; warning for qty>0 rows whose non-empty
       expiry cell cannot be parsed
     identifiers — missing code → non-drug → no usable identifier fields */
export function expectedQualityFromRealFiles() {
  const wd = aoaOf(REAL_WD);
  let H = wd[0];
  let ci = findCol(H, ["NUPCO Material"]);
  const qi = findCol(H, ["Order Qty"]);
  const di = findCol(H, ["Delivery Date"]);
  const si = findCol(H, ["Status"]);
  const W = { total: 0, status: 0, badCode: 0, nonDrug: 0, accepted: 0, badDate: 0 };
  for (let r = 1; r < wd.length; r++) {
    const row = wd[r];
    if (!row) continue;
    W.total++;
    const st = String(row[si] || "").trim().toUpperCase();
    if (!STATUS_OK[st]) { W.status++; continue; }
    const code = normCode(row[ci]);
    if (code == null) { W.badCode++; continue; }
    if (!isDrug(code)) { W.nonDrug++; continue; }
    W.accepted++;
    const cell = row[di];
    if (!parseDateLikeApp(cell) && cell != null && String(cell).trim() !== "") W.badDate++;
  }

  const st = aoaOf(REAL_ST);
  H = st[0];
  ci = findCol(H, ["Generic Item Number"]);
  const ai = findCol(H, ["Total Available Qty"]);
  const xi = findCol(H, ["Expiry Date"]);
  const S = { total: 0, badCode: 0, nonDrug: 0, accepted: 0, badExp: 0 };
  for (let r = 1; r < st.length; r++) {
    const row = st[r];
    if (!row) continue;
    S.total++;
    const code = normCode(row[ci]);
    if (code == null) { S.badCode++; continue; }
    if (!isDrug(code)) { S.nonDrug++; continue; }
    S.accepted++;
    const cell = row[xi];
    if (num(row[ai]) > 0 && !parseDateLikeApp(cell) && cell != null && String(cell).trim() !== "") S.badExp++;
  }

  const mp = aoaOf(REAL_MAP);
  H = mp[0];
  ci = findCol(H, ["NUPCO Code", "NUPCO"]);
  const gi = findCol(H, ["MODHS Item Description", "NUPCO Item Description"]);
  const mi = findCol(H, ["MODHS-CODE"]);
  const cl = findCol(H, ["Classification"]);
  const has = (row, idx) => idx >= 0 && row[idx] != null && String(row[idx]).trim() !== "";
  const M = { total: 0, badCode: 0, nonDrug: 0, empty: 0, accepted: 0 };
  for (let r = 1; r < mp.length; r++) {
    const row = mp[r];
    if (!row) continue;
    M.total++;
    const code = normCode(row[ci]);
    if (code == null) { M.badCode++; continue; }
    if (!isDrug(code)) { M.nonDrug++; continue; }
    if (!has(row, gi) && !has(row, mi) && !has(row, cl)) { M.empty++; continue; }
    M.accepted++;
  }

  return { withdrawals: W, stock: S, mapping: M };
}

/* ---------- expiry intelligence mirror (ROADMAP step 1) ----------
   Independently mirrors the documented expiry rules so spec-expiry can
   assert the UI figures against them:
     - stock rows with available qty > 0 and a parseable Expiry Date form
       per-code batches; same-date batches merge (qty sums)
     - months-to-expiry are measured from the stock-as-of date with the
       30.44 days/month constant
     - FEFO simulation: batches are consumed earliest-expiry-first at the
       item's monthly average; whatever a batch cannot contribute before
       its own expiry is waste ("units at risk")
     - effective coverage = (stock − waste) ÷ avg
     - the monthly average uses the ROUNDED detected months — the period
       modal's "Use detected" button applies the display-rounded value
       (documented lesson in tests/make-fixtures.mjs)
   An item is "expiry-risk" when waste ≥ 1 unit AND the flat coverage
   exceeds the effective coverage by ≥ 1 month. */
export function expectedExpiryFromRealFiles() {
  const base = expectedFromRealFiles();
  const months = base.monthsRounded1;

  const wd = aoaOf(REAL_WD);
  const H = wd[0];
  const ci = findCol(H, ["NUPCO Material"]);
  const qi = findCol(H, ["Order Qty"]);
  const si = findCol(H, ["Status"]);
  const totals = new Map();
  for (let r = 1; r < wd.length; r++) {
    const row = wd[r];
    if (!row) continue;
    const st = String(row[si] || "").trim().toUpperCase();
    if (!STATUS_OK[st]) continue;
    const code = normCode(row[ci]);
    if (!isDrug(code)) continue;
    totals.set(code, (totals.get(code) || 0) + num(row[qi]));
  }

  const st = aoaOf(REAL_ST);
  const HS = st[0];
  const sci = findCol(HS, ["Generic Item Number"]);
  const sai = findCol(HS, ["Total Available Qty"]);
  const sei = findCol(HS, ["Expiry Date"]);
  const stockBy = new Map();
  const batchesBy = new Map();
  for (let r = 1; r < st.length; r++) {
    const row = st[r];
    if (!row) continue;
    const code = normCode(row[sci]);
    if (!isDrug(code)) continue;
    const q = num(row[sai]);
    stockBy.set(code, (stockBy.get(code) || 0) + q);
    const d = parseDateLikeApp(row[sei]);
    if (d && q > 0) {
      const key = iso(d);
      const m = batchesBy.get(code) || new Map();
      m.set(key, (m.get(key) || 0) + q);
      batchesBy.set(code, m);
    }
  }

  // stock-as-of comes from the filename (04022026 → 2026-02-04), mirroring
  // the app's dateFromFilename rule.
  const asOf = new Date(2026, 1, 4);
  const perCode = new Map();
  let riskCount = 0;
  for (const [code, byDate] of batchesBy) {
    const avg = (totals.get(code) || 0) / months;
    const stock = stockBy.get(code) || 0;
    const batches = [...byDate.entries()]
      .map(([e, q]) => ({ e, q }))
      .sort((a, b) => (a.e < b.e ? -1 : a.e > b.e ? 1 : 0));
    let consumed = 0;
    let waste = 0;
    for (const b of batches) {
      const d = new Date(+b.e.slice(0, 4), +b.e.slice(5, 7) - 1, +b.e.slice(8, 10));
      const tMo = Math.max(0, (d - asOf) / 86400000 / DAYS_PER_MONTH);
      if (avg > 0) {
        const can = Math.max(0, avg * tMo - consumed);
        const use = Math.min(b.q, can);
        waste += b.q - use;
        consumed += use;
      }
    }
    const first = new Date(+batches[0].e.slice(0, 4), +batches[0].e.slice(5, 7) - 1, +batches[0].e.slice(8, 10));
    const expMonths = (first - asOf) / 86400000 / DAYS_PER_MONTH;
    const cov = avg > 0 ? stock / avg : null;
    const expCov = avg > 0 ? (stock - waste) / avg : null;
    const risk = avg > 0 && waste >= 1 && cov - expCov >= 1;
    if (risk) riskCount++;
    perCode.set(code, { avg, stock, cov, expMonths, waste, expCov, risk, batchCount: batches.length, firstExp: batches[0].e });
  }
  return { months, asOfIso: iso(asOf), perCode, riskCount };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(expectedFromRealFiles());
}
