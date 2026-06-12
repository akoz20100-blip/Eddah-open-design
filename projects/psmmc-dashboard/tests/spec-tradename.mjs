// spec-tradename — recurring owner complaint: typing a medicine's COMMERCIAL
// name in search does not find the medicine. None of the hospital's files
// carry the brand the planner knows: the MODHS catalog has no trade-name
// column at all, and the warehouse often stocks a DIFFERENT brand of the same
// generic (stock says VAROXA while the planner searches Xarelto). The fix is
// a curated brand → generic synonyms layer in search, with the applied
// mapping shown to the planner so the result is verifiable.
//
// Red before the synonyms layer exists; green after.

import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
} from "./helpers.mjs";
import { REAL_WD, REAL_ST, REAL_MAP } from "./real-data-expected.mjs";

const R = makeReporter("spec-tradename");

/* The search input re-renders the table after a 150 ms debounce, so the
   predicate must prove the table is actually FILTERED (small row count)
   before reading matches — otherwise the unfiltered 1,000-row table
   satisfies any row regex and the assertion is meaningless.
   Polling runs on the NODE side via evaluate: headless chromium starves
   in-page rAF/timer callbacks on an idle file:// page, which both delays
   the app's debounce and freezes waitForFunction's raf polling; each
   evaluate round-trip wakes the renderer so the debounce can fire. */
async function searchFinds(page, term, regexSource) {
  await page.fill("#searchInput", term);
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const ok = await page.evaluate((src) => {
      const rows = [...document.querySelectorAll("table tbody tr[data-code]")];
      if (!rows.length || rows.length > 60) return false;
      return rows.some((tr) => new RegExp(src, "i").test(tr.textContent));
    }, regexSource);
    if (ok) return true;
    await new Promise((r) => setTimeout(r, 200));
  }
  return false;
}

// ---- sample mode: demo trade names are synthetic, so only the synonyms
// ---- layer can resolve a real brand --------------------------------------
{
  const { browser, page, pageErrors } = await launch({ locale: "en" });
  try {
    await open(page, { lang: "en" });
    await page.click("#btnSample");
    await page.waitForSelector(".kcard", { timeout: 5000 });

    R.ok(
      await searchFinds(page, "rinvoq", "UPADACITINIB"),
      'sample mode: searching the brand "rinvoq" finds the UPADACITINIB row',
    );
    const card = await page.$eval(".tablecard", (el) => el.textContent).catch(() => "");
    R.ok(
      /RINVOQ/i.test(card) && /UPADACITINIB/i.test(card),
      "the applied brand → generic mapping is visible above the results",
    );
    R.ok(pageErrors.length === 0, `no page errors in sample mode (saw ${JSON.stringify(pageErrors)})`);
  } catch (err) {
    console.log("  ✗ spec threw:", err && err.message);
    R.ok(false, "sample-mode block completed without throwing");
  } finally {
    await browser.close();
  }
}

// ---- real files: the planner searches the brand they know, the warehouse
// ---- stocks another brand of the same generic ----------------------------
{
  const { browser, page, pageErrors } = await launch({ locale: "en" });
  try {
    await open(page, { lang: "en" });
    await uploadFiles(page, "fileWithdrawals", REAL_WD);
    await confirmDetectedPeriod(page);
    await uploadFiles(page, "fileStock", REAL_ST);
    await page.waitForSelector("table tbody tr", { timeout: 60000 });
    await uploadFiles(page, "fileMap", REAL_MAP);
    await page.waitForSelector("#toast:not([hidden])", { timeout: 30000 });

    // XARELTO is rivaroxaban. This hospital stocks VAROXA (Tabuk) — no
    // uploaded file contains the string "xarelto" anywhere, so only the
    // synonyms layer can connect the planner's brand to the stocked generic.
    R.ok(
      await searchFinds(page, "xarelto", "RIVAROXABAN"),
      'real files: searching "xarelto" finds the RIVAROXABAN rows (stocked brand is VAROXA)',
    );

    // Brand typed in Arabic.
    R.ok(
      await searchFinds(page, "بنادول", "PARACETAMOL"),
      'real files: searching the Arabic spelling "بنادول" finds the PARACETAMOL rows',
    );

    // A brand the warehouse actually stocks under the same name must keep
    // working through the existing trade-description haystack.
    R.ok(
      await searchFinds(page, "olumiant", "BARICITINIB"),
      'real files: searching "olumiant" still finds BARICITINIB (stocked under that very brand)',
    );

    R.ok(pageErrors.length === 0, `no page errors with real files (saw ${JSON.stringify(pageErrors)})`);
  } catch (err) {
    console.log("  ✗ spec threw:", err && err.message);
    R.ok(false, "real-files block completed without throwing");
  } finally {
    await browser.close();
  }
}

R.done();
