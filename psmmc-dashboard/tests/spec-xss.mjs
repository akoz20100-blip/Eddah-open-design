// spec-xss — GUARDS AUDIT ITEM A4: a malicious NUPCO code cell must not execute.
//
// The fixture's code cell is the string `5<img src=x onerror=window.__xss=1>`.
// It starts with "5" so it survives the drug filter (isDrug). If the app
// injects the code into innerHTML unescaped (e.g. codeCell builds
// '...">' + r.code + '<...' with raw r.code), the <img> loads, its onerror
// fires, and window.__xss becomes 1.
//
// EXPECTED (post-fix): window.__xss stays undefined and no live element with
// src="x" exists in the document. The code text may still be VISIBLE (escaped),
// that's fine — we only assert it isn't EXECUTED.

import { resolve } from "node:path";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  switchTab,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-xss");
const WD_XSS = resolve(FIXTURES_DIR, "withdrawals-xss.xlsx");
const ST_XSS = resolve(FIXTURES_DIR, "stock-xss.xlsx");

const { browser, page, pageErrors } = await launch();
try {
  await open(page);

  await uploadFiles(page, "fileWithdrawals", WD_XSS);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", ST_XSS);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });

  // Visit every tab so the code is rendered in tables, cards, order sheet, etc.
  for (const view of ["planning", "management", "averages"]) {
    await switchTab(page, view);
    await page.waitForTimeout(150); // let any injected onerror fire
  }
  // Also open the item detail drill-down where the code is echoed again.
  const firstRow = await page.$("table tbody tr");
  if (firstRow) {
    await firstRow.click();
    await page.waitForTimeout(150);
    await page.keyboard.press("Escape").catch(() => {});
  }

  const xss = await page.evaluate(() => window.__xss);
  R.ok(xss === undefined || xss === null, `window.__xss not set — payload did not execute (got ${JSON.stringify(xss)})`);

  const liveImg = await page.$$eval('img[src="x"], img[src$="/x"]', (els) => els.length);
  R.eq(liveImg, 0, 'no live <img src="x"> element injected into the DOM');

  // Sanity: the code text should still appear somewhere (escaped + visible),
  // proving the row rendered rather than silently failing.
  const codeVisible = await page.evaluate(() =>
    document.body.textContent.includes("<img") || document.body.textContent.includes("onerror"),
  );
  R.ok(codeVisible, "escaped code text is still rendered (row was not dropped)");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-xss completed without throwing");
} finally {
  await browser.close();
}

R.done();
