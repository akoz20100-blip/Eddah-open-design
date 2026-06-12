// Sanitizes a NUPCO framework-agreement orders export before it may be
// committed: the "Order Placed By" column carries hospital staff names and
// "Customer Comment" is free text (same risk class as the outbound file's
// Header Text). Both are blanked; every analytical column stays verbatim.
//
// Usage: node sanitize-orders.mjs <raw.xlsx> <out.sanitized.xlsx>
import { readFileSync, writeFileSync } from "node:fs";
import { loadXLSX } from "../tests/xlsx-loader.mjs";

const BLANK_HEADERS = ["Order Placed By", "Customer Comment"];

const [, , src, out] = process.argv;
if (!src || !out) {
  console.error("usage: node sanitize-orders.mjs <raw.xlsx> <out.sanitized.xlsx>");
  process.exit(1);
}

const XLSX = loadXLSX();
const wb = XLSX.read(readFileSync(src), { type: "buffer" });
let blanked = 0;
for (const name of wb.SheetNames) {
  const ws = wb.Sheets[name];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
  if (!rows.length) continue;
  const targets = rows[0]
    .map((h, i) => (BLANK_HEADERS.includes(String(h ?? "").trim()) ? i : -1))
    .filter((i) => i >= 0);
  for (let r = 1; r < rows.length; r++) {
    for (const c of targets) {
      if (rows[r][c] != null && rows[r][c] !== "") {
        rows[r][c] = "";
        blanked++;
      }
    }
  }
  wb.Sheets[name] = XLSX.utils.aoa_to_sheet(rows);
}
writeFileSync(out, XLSX.write(wb, { type: "buffer", bookType: "xlsx" }));
console.log(`sanitized ${src} -> ${out} (blanked ${blanked} cells)`);
