// spec-codes — wave 6 owner items B1, B2, C1 (the codes column).
//
// C1: every identifier in the code cell carries a short type label — NUPCO,
//     Hospital, MSD — and each value is individually copyable.
// B1: on a 390px phone the Hospital/MSD codes are SHOWN and stay INSIDE the
//     code cell (they used to overflow and overlap the drug name in RTL).
// B2: on a 390px phone the drug-NAME column stays pinned (position:sticky)
//     next to the code column in BOTH RTL and LTR, so a horizontal scroll
//     never makes the name disappear; the header row stays pinned too.
//
// Driven against the real files (the only data that carries hospital + MSD
// codes), uploaded through the actual slots.

import { launch, makeReporter } from "./helpers.mjs";
import { INDEX_URL } from "./helpers.mjs";
import { REAL_WD, REAL_ST, REAL_MAP, REAL_PLANNER } from "./real-data-expected.mjs";

const R = makeReporter("spec-codes");

async function loadReal(page, lang) {
  await page.addInitScript((l) => { try { localStorage.setItem("psmmc_lang", l); } catch (e) {} }, lang);
  await page.goto(INDEX_URL, { waitUntil: "load" });
  await page.waitForFunction(() => !!window.PSMMC_SAMPLE, null, { timeout: 5000 });
  await page.setInputFiles("#fileWithdrawals", REAL_WD);
  await page.waitForSelector("#pcUseDetected", { state: "visible", timeout: 20000 });
  await page.click("#pcUseDetected");
  await page.setInputFiles("#fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 60000 });
  await page.setInputFiles("#fileMap", REAL_MAP);
  await page.waitForSelector("#toast:not([hidden])", { timeout: 30000 });
  await page.setInputFiles("#filePlanner", REAL_PLANNER);
  await page.waitForTimeout(1500);
}

// ---------- AR mobile (390px): C1 labels + B1 containment + B2 sticky --------
{
  const { browser, page, pageErrors } = await launch({
    locale: "ar",
    contextOptions: { viewport: { width: 390, height: 850 } },
  });
  try {
    await loadReal(page, "ar");

    // Find a row that carries both hospital + MSD subcodes.
    const info = await page.evaluate(() => {
      const rows = [...document.querySelectorAll("table.t-main tbody tr")];
      const tr = rows.find((r) => r.querySelectorAll(".code-sub .copy-sub, .subcode .copy-sub").length >= 2);
      if (!tr) return { found: false };
      const code = tr.querySelector("td.code");
      const cRect = code.getBoundingClientRect();
      const labels = [...tr.querySelectorAll(".code-lbl")].map((e) => e.textContent.trim());
      // NUPCO copies via the cell's own data-copy; hospital/MSD via their <u>.
      const copyTargets = [code.getAttribute("data-copy")].concat(
        [...code.querySelectorAll("[data-copy]")].map((e) => e.getAttribute("data-copy")),
      );
      // Every rendered code value box must sit inside the cell horizontally.
      const subRects = [...tr.querySelectorAll(".code-sub .copy-sub, .subcode .copy-sub")].map((e) => {
        const r = e.getBoundingClientRect();
        return { left: r.left, right: r.right, text: e.textContent.trim(), visible: r.width > 0 && r.height > 0 };
      });
      return {
        found: true,
        labels,
        copyTargets,
        cellLeft: cRect.left,
        cellRight: cRect.right,
        subRects,
      };
    });

    R.ok(info.found, "found a real row carrying hospital + MSD subcodes");
    if (info.found) {
      // C1: type labels present (Arabic).
      const hasNupco = info.labels.some((l) => /نبكو|NUPCO/i.test(l));
      const hasHosp = info.labels.some((l) => /مستشفى|Hospital/i.test(l));
      const hasMsd = info.labels.some((l) => /MSD/i.test(l));
      R.ok(hasNupco && hasHosp && hasMsd, `C1: NUPCO/Hospital/MSD labels present (got ${JSON.stringify(info.labels)})`);

      // C1: at least 3 distinct copyable code values (nupco + hosp + msd).
      const uniq = [...new Set(info.copyTargets.filter(Boolean))];
      R.ok(uniq.length >= 3, `C1: nupco + hospital + MSD are each copyable (got ${uniq.length} copy targets)`);

      // B1: every subcode value renders and stays inside the code cell.
      R.ok(info.subRects.length >= 2 && info.subRects.every((s) => s.visible), "B1: hospital + MSD codes render on mobile");
      const overflow = info.subRects.filter((s) => s.left < info.cellLeft - 1 || s.right > info.cellRight + 1);
      R.ok(overflow.length === 0, `B1: subcodes stay inside the code cell — no overlap into the name (overflowing: ${JSON.stringify(overflow)})`);
    }

    // B2: the drug-name column is pinned (sticky) right after the code column.
    const b2ar = await page.evaluate(() => {
      const desc = document.querySelector("table.t-main tbody td.code + td.desc");
      if (!desc) return null;
      const cs = getComputedStyle(desc);
      return { position: cs.position, right: cs.right, left: cs.left };
    });
    R.ok(b2ar && b2ar.position === "sticky", `B2 (RTL): name column is sticky on mobile (got "${b2ar && b2ar.position}")`);
    R.ok(b2ar && b2ar.right !== "auto" && b2ar.right !== "", `B2 (RTL): name column pins to a right offset (got "${b2ar && b2ar.right}")`);

    // The name must survive a horizontal scroll (still visible in the viewport).
    await page.evaluate(() => { const w = document.querySelector(".tablewrap"); w.scrollLeft = w.scrollWidth ? -300 : 0; });
    await page.waitForTimeout(300);
    const nameVisible = await page.evaluate(() => {
      const desc = document.querySelector("table.t-main tbody td.code + td.desc");
      const r = desc.getBoundingClientRect();
      return r.left >= -2 && r.right <= window.innerWidth + 2 && r.width > 40;
    });
    R.ok(nameVisible, "B2 (RTL): the drug name stays inside the viewport after a horizontal scroll");

    R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
  } catch (err) {
    console.log("  ✗ spec threw:", err && err.stack);
    R.ok(false, "spec-codes AR completed without throwing");
  } finally {
    await browser.close();
  }
}

// ---------- EN mobile (390px): B2 sticky offset uses the LEFT edge ----------
{
  const { browser, page, pageErrors } = await launch({
    locale: "en",
    contextOptions: { viewport: { width: 390, height: 850 } },
  });
  try {
    await loadReal(page, "en");
    const b2en = await page.evaluate(() => {
      const desc = document.querySelector("table.t-main tbody td.code + td.desc");
      const cs = getComputedStyle(desc);
      return { position: cs.position, left: cs.left };
    });
    R.ok(b2en.position === "sticky", `B2 (LTR): name column is sticky on mobile (got "${b2en.position}")`);
    R.ok(b2en.left !== "auto" && b2en.left !== "", `B2 (LTR): name column pins to a left offset (got "${b2en.left}")`);
    R.ok(pageErrors.length === 0, `no page errors EN (saw: ${JSON.stringify(pageErrors)})`);
  } catch (err) {
    console.log("  ✗ spec threw (EN):", err && err.stack);
    R.ok(false, "spec-codes EN completed without throwing");
  } finally {
    await browser.close();
  }
}

R.done();
