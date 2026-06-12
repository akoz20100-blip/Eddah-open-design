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

const DAYS_PER_MONTH = 30.44;
const STATUS_OK = { DISPATCHED: 1, APPROVED: 1 };

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

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(expectedFromRealFiles());
}
