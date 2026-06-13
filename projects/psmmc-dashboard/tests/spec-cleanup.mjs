// spec-cleanup — wave 6 interface tidy-up (owner items A1–A4).
//
// A1: the file-upload bar is collapsible (+/−), DEFAULT COLLAPSED for a clean
//     first view; clicking the toggle expands it, and the collapse state
//     persists across reloads.
// A2: the dashboard title is "Pharmaceutical Planning Department Dashboard"
//     (EN) / "داشبورد قسم التخطيط الصيدلاني" (AR), shown in the header and in
//     document.title.
// A3: the "Data quality" card and the "What changed" (digest) card are gone
//     from the Planning view.
// A4: the "Critical — out of stock" KPI card is gone from the Planning view.

import { launch, open, loadSample, switchTab, makeReporter } from "./helpers.mjs";

const R = makeReporter("spec-cleanup");

const { browser, page, pageErrors } = await launch();
try {
  // ---- A2: title (English) ----
  await open(page, { lang: "en" });
  const titleEn = await page.title();
  R.ok(
    /Pharmaceutical Planning Department Dashboard/.test(titleEn),
    `EN document.title is the planning-department title (got "${titleEn}")`,
  );
  const headEn = await page.$eval('[data-i18n="app_title"]', (el) => el.textContent.trim());
  R.ok(
    /Pharmaceutical Planning Department Dashboard/.test(headEn),
    `EN header shows the planning-department title (got "${headEn}")`,
  );

  // ---- A1: upload bar collapsed by default + toggle present ----
  const collapsedByDefault = await page.evaluate(() => {
    const bar = document.getElementById("uploadbar");
    const toggle = document.getElementById("uplToggle");
    const body = document.getElementById("uplBody");
    if (!bar || !toggle || !body) return { ok: false, reason: "missing elements" };
    const bodyVisible = body.offsetParent !== null && getComputedStyle(body).display !== "none";
    return {
      ok: true,
      collapsed: bar.classList.contains("is-collapsed"),
      bodyVisible,
      expanded: toggle.getAttribute("aria-expanded"),
    };
  });
  R.ok(collapsedByDefault.ok, `upload bar has #uploadbar/#uplToggle/#uplBody (${collapsedByDefault.reason || "ok"})`);
  R.ok(collapsedByDefault.collapsed === true, `upload bar is collapsed on first load (got ${collapsedByDefault.collapsed})`);
  R.ok(collapsedByDefault.bodyVisible === false, `upload tiles hidden while collapsed (visible=${collapsedByDefault.bodyVisible})`);
  R.ok(collapsedByDefault.expanded === "false", `toggle aria-expanded=false while collapsed (got ${collapsedByDefault.expanded})`);

  // Clicking the toggle expands it.
  await page.click("#uplToggle");
  const afterExpand = await page.evaluate(() => {
    const bar = document.getElementById("uploadbar");
    const body = document.getElementById("uplBody");
    return {
      collapsed: bar.classList.contains("is-collapsed"),
      bodyVisible: getComputedStyle(body).display !== "none",
    };
  });
  R.ok(afterExpand.collapsed === false, "toggle (+) expands the upload bar");
  R.ok(afterExpand.bodyVisible === true, "upload tiles visible after expand");

  // Expanded state persists across reload.
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("#uplToggle");
  const afterReload = await page.evaluate(() =>
    document.getElementById("uploadbar").classList.contains("is-collapsed"),
  );
  R.ok(afterReload === false, "expand choice persists across reload");

  // ---- A2: title (Arabic) ----
  await open(page, { lang: "ar" });
  const titleAr = await page.title();
  R.ok(/داشبورد قسم التخطيط الصيدلاني/.test(titleAr), `AR document.title is localized (got "${titleAr}")`);

  // ---- A3/A4: removed cards (load data first so cards would render) ----
  await loadSample(page);
  await switchTab(page, "planning");

  const cards = await page.evaluate(() => {
    const has = (sel) => !!document.querySelector(sel);
    const labels = Array.from(document.querySelectorAll(".kcard .klabel, .kcard .ktitle")).map((e) =>
      e.textContent.trim(),
    );
    return {
      quality: has(".qualitycard"),
      digest: has(".digest"),
      labels,
    };
  });
  R.ok(cards.quality === false, "A3: no data-quality card in Planning");
  R.ok(cards.digest === false, "A3: no digest (what-changed) card in Planning");
  const hasCritical = cards.labels.some((l) => /حرج|Critical/i.test(l));
  R.ok(hasCritical === false, `A4: no Critical KPI card (labels: ${JSON.stringify(cards.labels)})`);

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.stack);
  R.ok(false, "spec-cleanup completed without throwing");
} finally {
  await browser.close();
}

R.done();
