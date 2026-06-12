// spec-calendar — CRITICAL calendar invariant (audit A2).
//
// Delivery dates are CALENDAR dates. A file whose minimum delivery date cell is
// 2026-06-01 must show a period starting "01 Jun" in EVERY timezone. The known
// bug class: isoDate() calls toISOString() on a local-midnight Date, which in a
// positive-offset timezone (e.g. Asia/Riyadh, +3) rolls back to "2026-05-31",
// so the period chip reads "31 May".
//
// This spec asserts the FIXED behavior ("01 Jun", never "31 May") under two
// timezones: Asia/Riyadh (+3, where the bug bites) and America/New_York (−4/−5,
// the opposite offset, to prove the fix doesn't over-correct the other way).

import { resolve } from "node:path";
import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  periodText,
  makeReporter,
  FIXTURES_DIR,
} from "./helpers.mjs";

const R = makeReporter("spec-calendar");
const WD_JUNE = resolve(FIXTURES_DIR, "withdrawals-june.xlsx");
const ST = resolve(FIXTURES_DIR, "stock-basic.xlsx");

async function periodFor(timezoneId) {
  const { browser, page, pageErrors } = await launch({ timezoneId });
  try {
    await open(page);
    await uploadFiles(page, "fileWithdrawals", WD_JUNE);
    await confirmDetectedPeriod(page);
    await uploadFiles(page, "fileStock", ST);
    await page.waitForSelector("table tbody tr", { timeout: 5000 }).catch(() => {});
    const period = await periodText(page);
    return { period, pageErrors: pageErrors.slice() };
  } finally {
    await browser.close();
  }
}

for (const tz of ["Asia/Riyadh", "America/New_York"]) {
  const { period, pageErrors } = await periodFor(tz);
  R.ok(pageErrors.length === 0, `[${tz}] no page errors (saw: ${JSON.stringify(pageErrors)})`);
  R.ok(period.includes("01 Jun"), `[${tz}] period starts "01 Jun" — calendar date preserved (got "${period}")`);
  R.ok(
    !period.includes("31 May"),
    `[${tz}] period does NOT show "31 May" — no toISOString day-shift (got "${period}")`,
  );
}

R.done();
