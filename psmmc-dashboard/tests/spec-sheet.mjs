// spec-sheet — OWNER REQUEST 4 (landed in PR #7, verified here): on an
// iPhone-sized viewport the item drill-down bottom sheet must keep its close
// button inside the visible viewport (dvh sizing), show the grab handle, and
// dismiss on a swipe-down gesture.

import {
  launch,
  open,
  loadSample,
  makeReporter,
} from "./helpers.mjs";

const R = makeReporter("spec-sheet");

const { browser, page, pageErrors } = await launch();
try {
  await page.setViewportSize({ width: 390, height: 660 });
  await open(page);
  await loadSample(page);

  // Open the first table row's drill-down sheet.
  await page.waitForSelector("table tbody tr", { timeout: 5000 });
  await page.click("table tbody tr");
  await page.waitForSelector("#dtClose", { state: "visible", timeout: 5000 });

  // Close button fully inside the visible viewport.
  const box = await page.$eval("#dtClose", (el) => {
    const b = el.getBoundingClientRect();
    return { top: b.top, bottom: b.bottom, left: b.left, right: b.right };
  });
  R.ok(box.top >= 0 && box.bottom <= 660, `close button vertically inside viewport (top ${box.top.toFixed(0)}, bottom ${box.bottom.toFixed(0)})`);
  R.ok(box.left >= 0 && box.right <= 390, "close button horizontally inside viewport");

  // dvh sizing applies on mobile: 88dvh of 660 = 580.8px (the vh-only
  // fallback is 84vh = 554.4px, so > 560 proves the dvh branch won).
  const maxH = await page.$eval("#modalCard", (el) => parseFloat(getComputedStyle(el).maxHeight));
  R.ok(maxH > 560 && maxH <= 660, `sheet max-height uses dvh (${maxH.toFixed(1)}px)`);

  // Grab handle (::before) rendered on the mobile sheet.
  const handle = await page.$eval("#modalCard", (el) => {
    const s = getComputedStyle(el, "::before");
    return { content: s.content, height: s.height };
  });
  R.ok(handle.content !== "none" && parseFloat(handle.height) >= 4, `grab handle rendered (${handle.height})`);

  // Swipe-down dismiss: synthesize the touch sequence the handler listens to
  // (start at the top of the sheet, drag down past the 80px threshold).
  await page.evaluate(() => {
    const card = document.getElementById("modalCard");
    card.scrollTop = 0;
    function fire(type, y) {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      ev.touches = type === "touchend" ? [] : [{ clientX: 180, clientY: y }];
      card.dispatchEvent(ev);
    }
    fire("touchstart", 120);
    fire("touchmove", 180);
    fire("touchmove", 260);
    fire("touchend", 260);
  });
  await page.waitForSelector("#modal", { state: "hidden", timeout: 3000 });
  R.ok(true, "swipe-down past the threshold dismisses the sheet");

  // A short drag below the threshold must NOT dismiss.
  await page.click("table tbody tr");
  await page.waitForSelector("#dtClose", { state: "visible", timeout: 5000 });
  await page.evaluate(() => {
    const card = document.getElementById("modalCard");
    card.scrollTop = 0;
    function fire(type, y) {
      const ev = new Event(type, { bubbles: true, cancelable: true });
      ev.touches = type === "touchend" ? [] : [{ clientX: 180, clientY: y }];
      card.dispatchEvent(ev);
    }
    fire("touchstart", 120);
    fire("touchmove", 150);
    fire("touchend", 150);
  });
  await page.waitForTimeout(350);
  const stillOpen = await page.$eval("#modal", (el) => !el.hidden);
  R.ok(stillOpen, "short drag below the threshold keeps the sheet open");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-sheet completed without throwing");
} finally {
  await browser.close();
}

R.done();
