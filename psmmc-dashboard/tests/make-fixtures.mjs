// Generates small .xlsx fixtures for the upload / calendar / dedup / xss specs
// using the SAME vendored SheetJS the dashboard parses uploads with, so a
// fixture round-trips exactly the way a real upload would.
//
// Outputs:
//   fixtures/withdrawals-basic.xlsx  — 2 drug codes + 1 non-drug + 1 REJECTED
//   fixtures/stock-basic.xlsx        — covers one of the two drug codes
//   fixtures/withdrawals-june.xlsx   — min delivery date exactly 2026-06-01
//   fixtures/withdrawals-dup.xlsx    — byte-identical copy of -basic (dedup test)
//   fixtures/withdrawals-xss.xlsx    — code cell carries an HTML/JS payload
//   fixtures/expected.json           — computed averages/coverages/status
//
// Run standalone or via run.mjs. Pure node ESM, no npm installs.

import { mkdirSync, writeFileSync, copyFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { loadXLSX } from "./xlsx-loader.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const FIX = resolve(__dirname, "fixtures");
mkdirSync(FIX, { recursive: true });

const XLSX = loadXLSX();
const DAYS_PER_MONTH = 30.44;

// Delivery dates are written as ISO "YYYY-MM-DD" string cells rather than
// native Excel date cells. Rationale: the vendored minified SheetJS UMD build
// trips when asked to WRITE pure date-typed cells (read works, write throws),
// so we cannot reliably emit {t:'d'} cells from node. ISO strings exercise the
// SAME app code path that matters for these specs: the dashboard's parseDate()
// matches /^(\d{4})-(\d{2})-(\d{2})/ and builds `new Date(+y, +m-1, +d)` — a
// LOCAL-midnight Date, identical to what cellDates:true yields for a real date
// cell. The calendar invariant bug (isoDate -> toISOString shifting local
// midnight back a day in +offset timezones) reproduces byte-for-byte through
// this path, verified under Asia/Riyadh. Helper below converts Date inputs to
// the ISO string the app parses.
function isoCell(d) {
  if (d instanceof Date) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }
  return d;
}

function writeAoa(path, aoa) {
  const mapped = aoa.map((row) => row.map(isoCell));
  const ws = XLSX.utils.aoa_to_sheet(mapped);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
  const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
  writeFileSync(path, buf);
}

const WD_HEADERS = ["NUPCO Material", "Order Qty", "Delivery Date", "Status", "UOM", "Description"];

// ---- withdrawals-basic ----------------------------------------------------
// code 5000001 (drug, in stock):  100 Jan-01, 200 Feb-15, 300 Mar-31  = 600
// code 5000002 (drug, NOT stock):  60 Jan-10, 60  Mar-20             = 120
// code 4000003 (NON-drug, prefix4): 999 — must be EXCLUDED by the 5-prefix rule
// code 5000004 REJECTED status:     888 — must be EXCLUDED by the status filter
// min delivery 2026-01-01, max 2026-03-31
const wdBasic = [
  WD_HEADERS,
  ["5000001", 100, new Date(2026, 0, 1), "DISPATCHED", "TAB", "Paracetamol 500mg"],
  ["5000001", 200, new Date(2026, 1, 15), "APPROVED", "TAB", "Paracetamol 500mg"],
  ["5000001", 300, new Date(2026, 2, 31), "DISPATCHED", "TAB", "Paracetamol 500mg"],
  ["5000002", 60, new Date(2026, 0, 10), "DISPATCHED", "BT", "Amoxicillin syrup"],
  ["5000002", 60, new Date(2026, 2, 20), "APPROVED", "BT", "Amoxicillin syrup"],
  ["4000003", 999, new Date(2026, 1, 1), "DISPATCHED", "EA", "Surgical glove (non-drug)"],
  ["5000004", 888, new Date(2026, 1, 1), "REJECTED", "TAB", "Rejected line — excluded"],
];
writeAoa(resolve(FIX, "withdrawals-basic.xlsx"), wdBasic);

// ---- stock-basic ----------------------------------------------------------
// Covers 5000001 with 1200 units. 5000002 intentionally absent => not_in_stock.
const stBasic = [
  ["Generic Item Number", "Total Available Qty", "Generic Item description"],
  ["5000001", 1200, "Paracetamol 500mg"],
  ["4000003", 5000, "Surgical glove (non-drug)"], // non-drug, ignored anyway
];
writeAoa(resolve(FIX, "stock-basic.xlsx"), stBasic);

// ---- withdrawals-june (calendar invariant) --------------------------------
// min delivery date EXACTLY 2026-06-01 (local). The period chip must read
// "01 Jun" in every timezone — the toISOString() bug shifts it to "31 May".
const wdJune = [
  WD_HEADERS,
  ["5000001", 100, new Date(2026, 5, 1), "DISPATCHED", "TAB", "Paracetamol 500mg"],
  ["5000001", 150, new Date(2026, 5, 30), "DISPATCHED", "TAB", "Paracetamol 500mg"],
  ["5000002", 50, new Date(2026, 5, 15), "DISPATCHED", "BT", "Amoxicillin syrup"],
];
writeAoa(resolve(FIX, "withdrawals-june.xlsx"), wdJune);

// ---- dedup copy (B1) ------------------------------------------------------
// Byte-identical copy so two different paths carry the same content. Some
// browsers de-duplicate identical PATHS in one setInputFiles call; using two
// distinct names with identical bytes guarantees the file picker yields two
// entries, exercising the same-content duplicate-upload case.
copyFileSync(resolve(FIX, "withdrawals-basic.xlsx"), resolve(FIX, "withdrawals-dup.xlsx"));

// ---- xss fixture (A4) -----------------------------------------------------
// Code cell starts with "5" so it survives the drug filter, then carries an
// HTML/JS injection payload. A fixed app must render it escaped (no live img,
// no window.__xss).
const XSS_CODE = '5<img src=x onerror=window.__xss=1>';
const wdXss = [
  WD_HEADERS,
  [XSS_CODE, 100, new Date(2026, 0, 1), "DISPATCHED", "TAB", "XSS probe <b>desc</b>"],
  [XSS_CODE, 100, new Date(2026, 2, 31), "DISPATCHED", "TAB", "XSS probe"],
];
writeAoa(resolve(FIX, "withdrawals-xss.xlsx"), wdXss);
const stXss = [
  ["Generic Item Number", "Total Available Qty", "Generic Item description"],
  [XSS_CODE, 500, "XSS probe"],
];
writeAoa(resolve(FIX, "stock-xss.xlsx"), stXss);

// ---- expected.json --------------------------------------------------------
const startBasic = new Date(2026, 0, 1);
const endBasic = new Date(2026, 2, 31);
const monthsRaw = Math.max((endBasic - startBasic) / 86400000 / DAYS_PER_MONTH, 1.0);
// IMPORTANT app behavior: the period-confirm "Use detected" button applies the
// DISPLAY-ROUNDED month value (Math.round(raw*10)/10), not the raw value — see
// showPeriodConfirm()'s `detected` in app.js. So every average computed after
// confirming the detected period uses the rounded months. Specs must expect
// this.
const monthsBasic = Math.round(monthsRaw * 10) / 10;

const fmt1 = (n) =>
  (Math.round(n * 10) / 10).toLocaleString("en-US", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  });

function statusOf(cov, avg, inStock) {
  if (!inStock) return "not_in_stock";
  if (avg === 0) return "no_movement";
  if (cov <= 6) return "order_now";
  if (cov <= 7) return "warning";
  return "ok";
}

const total1 = 600,
  stock1 = 1200,
  total2 = 120;
const avg1 = total1 / monthsBasic,
  cov1 = stock1 / avg1;
const avg2 = total2 / monthsBasic;

const avg1_6 = total1 / 6,
  cov1_6 = stock1 / avg1_6;

const expected = {
  basic: {
    detected_months: monthsBasic,
    detected_months_fmt1: fmt1(monthsBasic),
    period_start: "2026-01-01",
    period_end: "2026-03-31",
    // pretty (en-GB) form used in the period chip:
    period_start_pretty: "01 Jan 2026",
    period_end_pretty: "31 Mar 2026",
    drugCode_inStock: {
      code: "5000001",
      total: total1,
      stock: stock1,
      avg: avg1,
      avg_fmt1: fmt1(avg1),
      cov: cov1,
      cov_fmt1: fmt1(cov1),
      status: statusOf(cov1, avg1, true),
    },
    drugCode_notInStock: {
      code: "5000002",
      total: total2,
      avg: avg2,
      status: statusOf(0, avg2, false),
    },
    excluded: { nonDrug: "4000003", rejected: "5000004" },
    // After upload+stock, only the two drug codes appear: 1 in stock + 1 not.
    expectedRowCount: 2,
  },
  override6: {
    months: 6,
    drugCode_inStock: {
      code: "5000001",
      avg: avg1_6,
      avg_fmt1: fmt1(avg1_6),
      cov: cov1_6,
      cov_fmt1: fmt1(cov1_6),
      status: statusOf(cov1_6, avg1_6, true),
    },
    // The override rescales avg by detected/6.
    rescaleFactor: monthsBasic / 6,
  },
  june: {
    period_start: "2026-06-01",
    period_start_pretty_prefix: "01 Jun",
    bug_shifted_prefix: "31 May",
  },
  xss: { code: XSS_CODE, prefix: "5" },
};

writeFileSync(resolve(FIX, "expected.json"), JSON.stringify(expected, null, 2));

console.log("Fixtures written to", FIX);
console.log("  withdrawals-basic.xlsx, stock-basic.xlsx, withdrawals-june.xlsx,");
console.log("  withdrawals-dup.xlsx, withdrawals-xss.xlsx, stock-xss.xlsx, expected.json");
console.log(`  basic: detected ${fmt1(monthsBasic)} mo, code 5000001 avg ${fmt1(avg1)} cov ${fmt1(cov1)} (${expected.basic.drugCode_inStock.status})`);
