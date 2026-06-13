// spec-sharekhint — wave 6 D1: a clear Sharek hint when no Sharek file is loaded.
//
// The owner "sees nothing about Sharek" before uploading the Sharek file. The
// Planning filter row must therefore show a quiet, explanatory hint chip
// (instead of the void) whenever real data is loaded but no Sharek file is
// present — and tapping it opens the upload bar. With a Sharek file the full
// feature (filter chip + column) shows and the hint is gone. Sample mode shows
// no hint (there's nothing to upload there).

import { resolve } from "node:path";
import {
  launch,
  open,
  loadSample,
  uploadFiles,
  confirmDetectedPeriod,
  switchTab,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-sharekhint");
const WD = resolve(FIXTURES_DIR, "withdrawals-basic.xlsx");
const ST = resolve(FIXTURES_DIR, "stock-basic.xlsx");

const { browser, page, pageErrors } = await launch();
try {
  // ---- sample mode: no hint (nothing to upload) ----
  await open(page);
  await loadSample(page);
  await switchTab(page, "planning");
  const inSample = await page.evaluate(() => !!document.querySelector(".sharek-hint"));
  R.ok(!inSample, "no Sharek hint in sample mode");

  // ---- real upload, no Sharek file: the hint shows ----
  const ctx2 = await browser.newContext({ locale: "ar" });
  const p2 = await ctx2.newPage();
  await p2.addInitScript(() => { try { localStorage.setItem("psmmc_lang", "ar"); } catch (e) {} });
  await p2.goto((await import("./helpers.mjs")).INDEX_URL, { waitUntil: "load" });
  await p2.waitForFunction(() => !!window.PSMMC_SAMPLE, null, { timeout: 5000 });
  await uploadFiles(p2, "fileWithdrawals", WD);
  await confirmDetectedPeriod(p2);
  await uploadFiles(p2, "fileStock", ST);
  await p2.waitForSelector("table tbody tr", { timeout: 5000 });

  const state = await p2.evaluate(() => {
    const hint = document.querySelector(".sharek-hint");
    return {
      hint: hint ? hint.textContent.replace(/\s+/g, " ").trim() : null,
      sharekFilter: !!document.querySelector('.fchip[data-filter="sharek_zero"]'),
      sharekCol: [...document.querySelectorAll("table.t-main thead th")].some((th) => /شارك|Sharek/i.test(th.textContent)),
    };
  });
  R.ok(!!state.hint && /شارك|Sharek/i.test(state.hint), `D1: a Sharek hint chip shows when no Sharek file (got "${state.hint}")`);
  R.ok(state.sharekFilter === false, "D1: the Sharek filter chip is absent without a Sharek file");
  R.ok(state.sharekCol === false, "D1: the Sharek column is absent without a Sharek file");

  // Tapping the hint opens the upload bar.
  await p2.click("#sharekHintBtn");
  await p2.waitForTimeout(200);
  const expanded = await p2.evaluate(() => !document.getElementById("uploadbar").classList.contains("is-collapsed"));
  R.ok(expanded, "D1: tapping the hint opens the upload bar");

  await ctx2.close();
  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.stack);
  R.ok(false, "spec-sharekhint completed without throwing");
} finally {
  await browser.close();
}

R.done();
