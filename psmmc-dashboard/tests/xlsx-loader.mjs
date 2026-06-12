// Loads the vendored SheetJS (UMD) under Node.
//
// The vendored build registers its namespace on a browser-style `window`/`self`
// global and, under CommonJS, only populates a copy that does not survive a
// plain `require()` (observed: require() returns an empty object). To get a
// stable handle to the real XLSX namespace we evaluate the file inside a tiny
// VM sandbox that provides a `window`, then read `window.XLSX` back out. This
// is the same API the browser sees, so fixtures we generate here parse exactly
// the way the dashboard parses uploads.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";

const __dirname = dirname(fileURLToPath(import.meta.url));
const VENDOR = resolve(__dirname, "../vendor/xlsx.full.min.js");

let _XLSX = null;
export function loadXLSX() {
  if (_XLSX) return _XLSX;
  const code = readFileSync(VENDOR, "utf8");
  const ctx = { window: {}, self: {}, console };
  vm.createContext(ctx);
  vm.runInContext(code, ctx, { filename: "xlsx.full.min.js" });
  const XLSX = ctx.window.XLSX || ctx.XLSX;
  if (!XLSX || !XLSX.utils || !XLSX.write) {
    throw new Error("Failed to load vendored SheetJS namespace");
  }
  _XLSX = XLSX;
  return XLSX;
}
