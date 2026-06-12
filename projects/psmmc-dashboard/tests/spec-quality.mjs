// spec-quality — ROADMAP step 2: per-upload data-quality report.
//
// Invalid rows used to be excluded silently. After every upload the planner
// must see a quality card: how many rows were accepted/rejected and WHY
// (status not approved, missing code, non-medicine code, unreadable dates),
// plus which file header each app column was matched to — expandable per
// file and exportable to Excel. The card belongs to real uploads only
// (sample mode never shows it).
//
// Expected counts come from an INDEPENDENT mirror of the parser taxonomy
// (tests/real-data-expected.mjs → expectedQualityFromRealFiles) computed
// from the same real files the spec uploads through the actual UI slots.

import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  makeReporter,
} from "./helpers.mjs";
import {
  expectedQualityFromRealFiles,
  REAL_WD,
  REAL_ST,
  REAL_MAP,
} from "./real-data-expected.mjs";

const R = makeReporter("spec-quality");
const fmtInt = (n) => Math.round(n).toLocaleString("en-US");

const Q = expectedQualityFromRealFiles();
R.ok(Q.withdrawals.total === 10130, `mirror reads ${Q.withdrawals.total} withdrawal rows`);
R.ok(Q.withdrawals.nonDrug > 1000, `mirror rejects ${Q.withdrawals.nonDrug} non-drug withdrawal rows`);
R.ok(Q.stock.nonDrug > 10000, `mirror rejects ${Q.stock.nonDrug} non-drug stock rows`);
R.ok(Q.mapping.badCode + Q.mapping.nonDrug > 0, `mirror rejects ${Q.mapping.badCode + Q.mapping.nonDrug} catalog rows`);

async function readCard(page) {
  return page.evaluate(() => {
    const card = document.querySelector(".qualitycard");
    if (!card) return null;
    const files = {};
    card.querySelectorAll("details.ql-file").forEach((d) => {
      files[d.getAttribute("data-kind")] = {
        summary: d.querySelector("summary").textContent.replace(/\s+/g, " ").trim(),
        reasons: [...d.querySelectorAll(".ql-line")].map((l) => l.textContent.replace(/\s+/g, " ").trim()),
        cols: d.querySelector(".ql-cols") ? d.querySelector(".ql-cols").textContent.replace(/\s+/g, " ").trim() : "",
      };
    });
    return { files, hasExport: !!document.getElementById("qcExport"), hasDismiss: !!document.getElementById("qcDismiss") };
  });
}

const { browser, page, pageErrors } = await launch({
  locale: "en",
  contextOptions: { acceptDownloads: true },
});
try {
  await open(page, { lang: "en" });

  // ---- withdrawals ----------------------------------------------------------
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  // ---- stock ---------------------------------------------------------------
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });

  let card = await readCard(page);
  R.ok(card, "quality card renders after a real upload");
  const wd = card && card.files.wd;
  R.ok(wd && wd.summary.includes(fmtInt(Q.withdrawals.total)), `withdrawals line shows ${fmtInt(Q.withdrawals.total)} rows (got "${wd && wd.summary}")`);
  R.ok(wd && wd.summary.includes(fmtInt(Q.withdrawals.accepted)), `withdrawals line shows ${fmtInt(Q.withdrawals.accepted)} accepted`);
  R.ok(
    wd && wd.reasons.some((x) => x.includes(fmtInt(Q.withdrawals.nonDrug)) && /non-medicine/i.test(x)),
    `withdrawals details name the non-medicine rejection with ${fmtInt(Q.withdrawals.nonDrug)} rows (got ${JSON.stringify(wd && wd.reasons)})`,
  );
  R.ok(
    wd && /NUPCO Material/i.test(wd.cols) && /Order Qty/i.test(wd.cols),
    `withdrawals column mapping names the matched headers (got "${wd && wd.cols}")`,
  );

  const st = card && card.files.st;
  R.ok(st && st.summary.includes(fmtInt(Q.stock.total)) && st.summary.includes(fmtInt(Q.stock.accepted)),
    `stock line shows ${fmtInt(Q.stock.total)} rows → ${fmtInt(Q.stock.accepted)} accepted (got "${st && st.summary}")`);
  R.ok(
    st && st.reasons.some((x) => x.includes(fmtInt(Q.stock.nonDrug)) && /non-medicine/i.test(x)),
    `stock details name the ${fmtInt(Q.stock.nonDrug)} non-medicine rows`,
  );

  // ---- identifiers ----------------------------------------------------------
  await uploadFiles(page, "fileMap", REAL_MAP);
  await page.waitForSelector("#toast:not([hidden])", { timeout: 30000 });
  card = await readCard(page);
  const mp = card && card.files.mp;
  R.ok(mp && mp.summary.includes(fmtInt(Q.mapping.total)) && mp.summary.includes(fmtInt(Q.mapping.accepted)),
    `identifiers line shows ${fmtInt(Q.mapping.total)} rows → ${fmtInt(Q.mapping.accepted)} accepted (got "${mp && mp.summary}")`);
  R.ok(
    mp && mp.reasons.some((x) => x.includes(fmtInt(Q.mapping.badCode)) && /missing/i.test(x)),
    `identifiers details name the ${fmtInt(Q.mapping.badCode)} missing-code rows`,
  );

  // ---- export ----------------------------------------------------------------
  R.ok(card && card.hasExport, "quality card offers an export button");
  const dl = page.waitForEvent("download", { timeout: 15000 }).catch(() => null);
  await page.click("#qcExport");
  const download = await dl;
  R.ok(
    download && /PSMMC_data_quality_.*\.xlsx$/.test(download.suggestedFilename()),
    `export produces an xlsx download (got "${download && download.suggestedFilename()}")`,
  );

  // ---- dismiss + sample-mode hygiene ----------------------------------------
  await page.click("#qcDismiss");
  const afterDismiss = await page.evaluate(() => !!document.querySelector(".qualitycard"));
  R.ok(!afterDismiss, "dismiss hides the quality card");
  await page.click("#btnSample");
  await page.waitForSelector(".kcard", { timeout: 5000 });
  const inSample = await page.evaluate(() => !!document.querySelector(".qualitycard"));
  R.ok(!inSample, "sample mode never shows the quality card");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-quality completed without throwing");
} finally {
  await browser.close();
}

R.done();
