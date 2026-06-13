// spec-sharekempty — owner wave 6 §D1: Sharek discoverability when NO file.
//
// Owner complaint: «لا أرى أي شيء يخص شارك» before a Sharek file is uploaded —
// the whole feature (KPI line, filter chip, column) is silently absent, so the
// planner has no idea it exists. Acceptance:
//   - WITHOUT a Sharek file, the zero-stock KPI card carries a clear hint
//     pointing the planner to the upload slot (instead of just emptiness),
//     shown exactly where the Sharek count would otherwise appear;
//   - the feature still stays quiet (no filter chip / no column) so the table
//     is not cluttered before the file exists;
//   - the hint only appears when there ARE zero-stock items to source.
//
// This is the no-file half of the Sharek behaviour; spec-sharek covers the
// with-file half (count, chip, column, export, persistence).

import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
} from "./helpers.mjs";
import { REAL_WD, REAL_ST } from "./real-data-expected.mjs";

const R = makeReporter("spec-sharekempty");

const { browser, page, pageErrors } = await launch({ locale: "ar", contextOptions: {} });
try {
  await open(page, { lang: "ar" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 120000 });

  // Read the zero-stock KPI card (Arabic label "البنود الصفرية").
  const zero = await page.evaluate(() => {
    const cards = Array.from(document.querySelectorAll(".kcard"));
    const c = cards.find((x) => /البنود الصفرية/.test(x.textContent));
    if (!c) return { found: false };
    const num = (c.querySelector(".kvalue")?.textContent || "").replace(/[^\d]/g, "");
    return { found: true, text: c.textContent.replace(/\s+/g, " ").trim(), count: parseInt(num || "0", 10) };
  });
  R.ok(zero.found, "zero-stock KPI card is rendered");
  R.ok(zero.count > 0, `there are zero-stock items to source (count ${zero.count})`);

  // RED-FIRST: the card must carry the Sharek discoverability hint when no file.
  R.ok(/ارفع ملف شارك/.test(zero.text), `zero-stock card hints how to activate Sharek (got "${zero.text}")`);
  // It must NOT show the count phrasing reserved for the loaded state.
  R.ok(!/متاح في منصة شارك/.test(zero.text), "no fake Sharek count is shown before the file is uploaded");

  // The feature still stays quiet: no filter chip and no table column yet.
  const chip = await page.$('.fchip[data-filter="sharek_zero"]');
  R.ok(!chip, "no Sharek filter chip before a Sharek file is uploaded (stays quiet)");
  const hasCol = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".tablecard table.t-main thead th")).some((th) => /شارك/.test(th.textContent)),
  );
  R.ok(!hasCol, "no Sharek table column before a Sharek file is uploaded (stays quiet)");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-sharekempty completed without throwing");
} finally {
  await browser.close();
}

R.done();
