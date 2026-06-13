// spec-digest — wave 6 A3: the "what changed" digest card was removed from
// the Planning view (owner asked for a cleaner first glance). This spec proves
// the two-upload snapshot pipeline still works end-to-end (no page errors, the
// table re-renders after a second upload that would previously have triggered
// the digest) AND that the digest card no longer appears on screen.
//
// Timeline: Q1 upload with the 6-month override seeds the snapshot; the Q2
// upload (spike + status flip + a brand-new item) would have produced the
// digest before — it must NOT render now.

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
  R.ok(!(await page.$(".digest")), "no digest on the first upload");

  // Q2: a comparison upload that previously produced the digest.
  await uploadFiles(page, "fileWithdrawals", WD_Q2);
  await confirmDetectedPeriod(page);
  await page.waitForSelector("table tbody tr", { timeout: 5000 });
  const noDigest = await page.evaluate(() => !document.querySelector(".digest"));
  R.ok(noDigest, "wave 6 A3: no digest card after the comparison upload");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-digest completed without throwing");
} finally {
  await browser.close();
}

R.done();
