// Test runner: regenerate fixtures, then run every spec-*.mjs sequentially.
// Prints a summary table; exits 1 if any spec fails.
//
//   node psmmc-dashboard/tests/run.mjs
//
// Env overrides (forwarded to each child): PSMMC_CHROME, PSMMC_PW_DIR.

import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));

function run(label, file) {
  const start = Date.now();
  const res = spawnSync(process.execPath, [resolve(__dirname, file)], {
    stdio: "inherit",
    env: process.env,
  });
  const ms = Date.now() - start;
  return { label, ok: res.status === 0, ms };
}

console.log("== Generating fixtures ==");
const fix = run("make-fixtures", "make-fixtures.mjs");
if (!fix.ok) {
  console.error("\nFixture generation FAILED — aborting.");
  process.exit(1);
}

const specs = readdirSync(__dirname)
  .filter((f) => /^spec-.*\.mjs$/.test(f))
  .sort();

const results = [];
for (const spec of specs) {
  console.log(`\n== ${spec} ==`);
  results.push(run(spec.replace(/\.mjs$/, ""), spec));
}

console.log("\n========== SUMMARY ==========");
let failed = 0;
for (const r of results) {
  const tag = r.ok ? "PASS" : "FAIL";
  if (!r.ok) failed++;
  console.log(`  ${tag}  ${r.label.padEnd(16)} ${(r.ms / 1000).toFixed(1)}s`);
}
console.log("=============================");
console.log(`${results.length - failed}/${results.length} specs passed`);

process.exit(failed ? 1 : 0);
