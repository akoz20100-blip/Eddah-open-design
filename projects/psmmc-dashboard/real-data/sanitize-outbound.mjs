// Sanitizes a real NUPCO outbound export before it may live in this public
// repository. The dashboard reads ONLY: NUPCO Material, Order Qty,
// Delivery Date, Status (plus Description for display) — so the personal
// columns below carry zero analytical value and are blanked entirely:
//
//   - "Customer Ref."  → requester phone numbers + first names
//   - "Created By"     → full staff names / account ids
//   - "Header Text"    → free text with phone numbers and building refs
//
// "Item Text" (batch-number requests) is kept: scanned, no personal data.
// Every other column, row order, and sheet name is preserved verbatim.
//
// Usage:  node sanitize-outbound.mjs <raw.xlsx> <sanitized.xlsx>
// (The raw file must never be committed; only the sanitized output is.)

import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const { loadXLSX } = await import(resolve(__dirname, "../tests/xlsx-loader.mjs"));
const XLSX = await loadXLSX();

const BLANK_COLUMNS = ["Customer Ref.", "Created By", "Header Text"];

const [, , rawPath, outPath] = process.argv;
if (!rawPath || !outPath) {
  console.error("usage: node sanitize-outbound.mjs <raw.xlsx> <sanitized.xlsx>");
  process.exit(1);
}

const wb = XLSX.read(readFileSync(rawPath), { type: "buffer" });
const sheetName = wb.SheetNames[0];
const rows = XLSX.utils.sheet_to_json(wb.Sheets[sheetName], { header: 1 });

const header = rows[0];
const blankIdx = BLANK_COLUMNS.map((name) => {
  const i = header.indexOf(name);
  if (i === -1) throw new Error(`expected column not found: ${name}`);
  return i;
});

let cleared = 0;
for (let r = 1; r < rows.length; r++) {
  for (const i of blankIdx) {
    if (rows[r][i] != null && rows[r][i] !== "") { rows[r][i] = null; cleared++; }
  }
}

const out = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(out, XLSX.utils.aoa_to_sheet(rows), sheetName);
const buf = XLSX.write(out, { type: "buffer", bookType: "xlsx", compression: true });
writeFileSync(outPath, buf);
console.log(`sanitized ${rows.length - 1} data rows; cleared ${cleared} cells across ${BLANK_COLUMNS.length} columns → ${outPath}`);
