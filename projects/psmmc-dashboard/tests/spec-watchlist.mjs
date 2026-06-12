// spec-watchlist — ROADMAP step 3: pin items for the morning review.
//
// A star on any planning row (and in the item sheet) pins the item; pinned
// items surface first in the planning table, a "My watchlist" filter chip
// shows only them, and the list persists in localStorage like the rest of
// the saved state — so the planner's critical drugs are one tap away every
// morning instead of a repeated search.
//
// Validated on the REAL files through the actual upload slots (rule 1), and
// across a page reload: the withdrawals baseline auto-loads, a fresh stock
// upload recomputes, and the pins must still be there.

import {
  launch,
  open,
  uploadFiles,
  confirmDetectedPeriod,
  setSearch,
  makeReporter,
} from "./helpers.mjs";
import { REAL_WD, REAL_ST } from "./real-data-expected.mjs";

const R = makeReporter("spec-watchlist");

const PIN_A = "5112172500100"; // BISOPROLOL 5MG — moved + stocked
const PIN_B = "5118361100000"; // SEMAGLUTIDE 1MG (OZEMPIC) — moved + stocked

/* Node-side polling: headless chromium starves in-page timers on idle
   file:// pages, so waits go through evaluate round-trips. */
async function poll(page, fn, arg, timeout = 6000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const v = await page.evaluate(fn, arg);
    if (v) return v;
    await new Promise((r) => setTimeout(r, 200));
  }
  return null;
}

async function searchTo(page, term) {
  await setSearch(page, term);
  return poll(page, (code) => {
    const rows = document.querySelectorAll("table tbody tr[data-code]");
    return rows.length > 0 && rows.length < 60 && !!document.querySelector(`tr[data-code="${code}"]`);
  }, term);
}

async function clearSearch(page) {
  await setSearch(page, "");
  await poll(page, () => document.querySelectorAll("table tbody tr[data-code]").length > 200);
}

const { browser, page, pageErrors } = await launch({ locale: "en" });
try {
  await open(page, { lang: "en" });
  await uploadFiles(page, "fileWithdrawals", REAL_WD);
  await confirmDetectedPeriod(page);
  await uploadFiles(page, "fileStock", REAL_ST);
  await page.waitForSelector("table tbody tr", { timeout: 120000 });

  // ---- pin two items from the table -----------------------------------------
  for (const code of [PIN_A, PIN_B]) {
    R.ok(await searchTo(page, code), `row ${code} reachable via search`);
    await page.click(`tr[data-code="${code}"] .pin-btn`);
    const on = await poll(page, (c) => {
      const b = document.querySelector(`tr[data-code="${c}"] .pin-btn`);
      return b && b.classList.contains("is-on");
    }, code);
    R.ok(on, `star on ${code} turns on after pinning`);
  }

  // ---- pinned first + watchlist chip ----------------------------------------
  await clearSearch(page);
  const firstTwo = await page.evaluate(() =>
    [...document.querySelectorAll("table tbody tr[data-code]")].slice(0, 2).map((tr) => tr.getAttribute("data-code")),
  );
  R.ok(
    firstTwo.includes(PIN_A) && firstTwo.includes(PIN_B),
    `pinned items sort first in the planning table (got ${JSON.stringify(firstTwo)})`,
  );
  const chip = await page.evaluate(() => {
    const c = document.querySelector('.fchip[data-filter="watchlist"]');
    return c ? c.textContent.replace(/\s+/g, " ").trim() : null;
  });
  R.ok(chip && chip.includes("2"), `watchlist filter chip shows the pin count (got "${chip}")`);

  await page.click('.fchip[data-filter="watchlist"]');
  const onlyPinned = await poll(page, () => {
    const rows = [...document.querySelectorAll("table tbody tr[data-code]")];
    return rows.length === 2 ? rows.map((tr) => tr.getAttribute("data-code")) : null;
  });
  R.ok(
    onlyPinned && onlyPinned.includes(PIN_A) && onlyPinned.includes(PIN_B),
    `watchlist filter shows exactly the pinned items (got ${JSON.stringify(onlyPinned)})`,
  );

  // ---- survives reload --------------------------------------------------------
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("#btnSample");
  await uploadFiles(page, "fileStock", REAL_ST); // baseline withdrawals auto-load
  await page.waitForSelector("table tbody tr", { timeout: 120000 });
  const afterReload = await page.evaluate(() => ({
    first: [...document.querySelectorAll("table tbody tr[data-code]")].slice(0, 2).map((tr) => tr.getAttribute("data-code")),
    chip: (document.querySelector('.fchip[data-filter="watchlist"]') || {}).textContent || "",
  }));
  R.ok(
    afterReload.first.includes(PIN_A) && afterReload.first.includes(PIN_B),
    `pins survive a reload and still sort first (got ${JSON.stringify(afterReload.first)})`,
  );
  R.ok(/2/.test(afterReload.chip), `watchlist chip still counts 2 after reload (got "${afterReload.chip.trim()}")`);

  // ---- item-sheet toggle + unpin ----------------------------------------------
  R.ok(await searchTo(page, PIN_B), `row ${PIN_B} reachable after reload`);
  await page.click(`tr[data-code="${PIN_B}"] td.desc`);
  await page.waitForSelector("#modalCard .dt-title", { timeout: 5000 });
  const sheetPin = await page.evaluate(() => {
    const b = document.getElementById("dtPin");
    return b ? { on: b.classList.contains("is-on") } : null;
  });
  R.ok(sheetPin && sheetPin.on, "item sheet shows an active pin toggle for a pinned item");
  await page.click("#dtPin");
  const offNow = await poll(page, () => {
    const b = document.getElementById("dtPin");
    return b && !b.classList.contains("is-on");
  });
  R.ok(offNow, "item-sheet toggle unpins the item");
  await page.keyboard.press("Escape");
  const chipAfter = await poll(page, () => {
    const c = document.querySelector('.fchip[data-filter="watchlist"]');
    return c && /1/.test(c.textContent) ? c.textContent.trim() : null;
  });
  R.ok(chipAfter, `watchlist chip drops to 1 after unpinning (got "${chipAfter}")`);

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-watchlist completed without throwing");
} finally {
  await browser.close();
}

R.done();
