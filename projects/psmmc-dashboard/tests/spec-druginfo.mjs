// spec-druginfo — OWNER REQUEST 3 (round 3): bilingual "Drug information" in
// the item drill-down — what the medicine is for (curated generic-stem
// dictionary), plus SFDA and web-search links opening in a new tab.

import { resolve } from "node:path";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-druginfo");
const WD = resolve(FIXTURES_DIR, "withdrawals-basic.xlsx");
const ST = resolve(FIXTURES_DIR, "stock-basic.xlsx");

const { browser, page, pageErrors } = await launch();
try {
  await open(page);
  await uploadFiles(page, "fileWithdrawals", WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", ST);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });

  // Open the Paracetamol item — its desc matches the PARACETAMOL stem.
  await page.click("table tbody tr[data-code='5000001']");
  await page.waitForSelector(".di-block", { timeout: 5000 });

  const di = await page.$eval(".di-block", (el) => el.textContent);
  R.ok(di.includes("معلومات الدواء"), "drug-information section title rendered (Arabic UI)");
  R.ok(di.includes("مسكن للألم"), "curated Arabic indication shown for PARACETAMOL");

  const sfda = await page.$eval("#diSfda", (a) => ({ href: a.href, target: a.target, rel: a.rel }));
  R.ok(sfda.href.startsWith("https://www.sfda.gov.sa/en/drugs-list?search="), `SFDA link points at the drugs list (${sfda.href})`);
  R.ok(sfda.href.includes("Paracetamol"), "SFDA search is seeded with the item name (URL-encoded)");
  R.eq(sfda.target, "_blank", "SFDA link opens in a new tab");
  R.ok(sfda.rel.includes("noopener"), "SFDA link carries rel=noopener");

  const web = await page.$eval("#diWeb", (a) => ({ href: a.href, target: a.target }));
  R.ok(web.href.includes("google.com/search?q="), "general web-search link present");
  R.eq(web.target, "_blank", "web-search link opens in a new tab");

  // English side of the dictionary: switch language and re-open.
  await page.keyboard.press("Escape");
  await page.click("#langBtn");
  await page.waitForFunction(() => document.documentElement.lang === "en", null, { timeout: 3000 });
  await page.click("table tbody tr[data-code='5000001']");
  await page.waitForSelector(".di-block", { timeout: 5000 });
  const diEn = await page.$eval(".di-block", (el) => el.textContent);
  R.ok(diEn.includes("Pain reliever"), "curated English indication shown after language switch");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-druginfo completed without throwing");
} finally {
  await browser.close();
}

R.done();
