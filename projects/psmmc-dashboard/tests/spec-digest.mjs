// spec-digest — PLANNER FEATURE 9 (round 3): "what changed" digest.
// After an upload that has a previous snapshot to compare against, a
// dismissible card on the Planning tab lists items that entered danger,
// consumption spikes >30%, and new items.
//
// Timeline: Q1 upload with the 6-month override (5000001 avg 100 → cov 12 →
// ok) seeds the snapshot; the Q2 upload (5000001 avg 400 → cov 3 → order now;
// 5000005 brand new) must produce danger + spike + new entries.

import { resolve } from "node:path";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  choosePeriodOverride,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-digest");
const WD_Q1 = resolve(FIXTURES_DIR, "withdrawals-basic.xlsx");
const WD_Q2 = resolve(FIXTURES_DIR, "withdrawals-q2.xlsx");
const ST = resolve(FIXTURES_DIR, "stock-basic.xlsx");

const { browser, page, pageErrors } = await launch();
try {
  await open(page);

  // Q1: override to 6 months so 5000001 computes to OK (snapshot baseline).
  await uploadFiles(page, "fileWithdrawals", WD_Q1);
  await choosePeriodOverride(page, 6);
  await uploadFiles(page, "fileStock", ST);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });
  R.ok(!(await page.$(".digest")), "no digest on the first upload (nothing to compare against)");

  // Q2: spike + status flip + a brand-new item.
  await uploadFiles(page, "fileWithdrawals", WD_Q2);
  await confirmDetectedPeriod(page);
  await page.waitForSelector(".digest", { timeout: 5000 });
  const digest = await page.$eval(".digest", (el) => el.textContent);
  R.ok(digest.includes("ماذا تغيّر"), "digest card titled 'what changed'");
  R.ok(digest.includes("دخلت نطاق الخطر") && digest.includes("Paracetamol"), "items that entered danger are listed");
  R.ok(digest.includes("قفزة استهلاك"), "consumption spikes >30% are listed");
  R.ok(digest.includes("أصناف جديدة") && digest.includes("Insulin"), "new items are listed");

  // Dismissible.
  await page.click("#dgDismiss");
  await page.waitForFunction(() => !document.querySelector(".digest"), null, { timeout: 3000 });
  R.ok(true, "digest card dismisses");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-digest completed without throwing");
} finally {
  await browser.close();
}

R.done();
