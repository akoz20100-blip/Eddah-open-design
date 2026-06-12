// spec-lang — PHASE 0 (routine v2, round 1): English is the app's DEFAULT.
//
// Contract being guarded:
//   1. A first-time visitor (no persisted choice) gets the ENGLISH UI in LTR,
//      with an English document title and the language button reading the
//      current language ("English").
//   2. The Arabic toggle still works: one click flips to Arabic + RTL.
//   3. The choice persists across reloads (localStorage psmmc_lang).
//   4. T.en / T.ar key parity is exactly 1:1 (checked statically on app.js
//      source — every new string must land in BOTH dictionaries).

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { launch, open, makeReporter, DASHBOARD_DIR } from "./helpers.mjs";

const R = makeReporter("spec-lang");

// ---- 1–3: browser behavior --------------------------------------------------
const { browser, page, pageErrors } = await launch({ lang: null, locale: "en" });
try {
  await open(page);

  const fresh = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    title: document.title,
    btn: document.getElementById("langName").textContent,
    appTitle: document.querySelector('[data-i18n="app_title"]').textContent,
  }));
  R.eq(fresh.lang, "en", "first visit: document language is English");
  R.eq(fresh.dir, "ltr", "first visit: direction is LTR");
  R.ok(fresh.title.includes("Pharmacy Stock"), `first visit: English document title (got "${fresh.title}")`);
  R.eq(fresh.btn, "English", "language button shows the current language");
  R.ok(fresh.appTitle.includes("Pharmacy Stock"), "appbar heading is the English app title");

  // Toggle to Arabic: full RTL flip.
  await page.click("#langBtn");
  const ar = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    btn: document.getElementById("langName").textContent,
  }));
  R.eq(ar.lang, "ar", "toggle: document language flips to Arabic");
  R.eq(ar.dir, "rtl", "toggle: direction flips to RTL");
  R.eq(ar.btn, "عربي", "toggle: language button shows عربي");

  // Persists across reload.
  await page.reload();
  await page.waitForSelector("#langName", { timeout: 5000 });
  const after = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
  }));
  R.eq(after.lang, "ar", "reload: chosen Arabic persists");
  R.eq(after.dir, "rtl", "reload: RTL persists");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-lang completed without throwing");
} finally {
  await browser.close();
}

// ---- 4: static T.en / T.ar parity ------------------------------------------
const src = readFileSync(resolve(DASHBOARD_DIR, "app.js"), "utf8");

/** Extract the i18n keys of one dictionary by slicing app.js between its
 * opening marker and its terminal `langName` entry, then matching
 * `key: "` / `key: '` at property positions. */
function dictKeys(openMarker, closeMarker) {
  const start = src.indexOf(openMarker);
  const end = src.indexOf(closeMarker, start);
  if (start < 0 || end < 0) return null;
  const body = src.slice(start + openMarker.length, end);
  const keys = new Set();
  const re = /(?:^|\{|,)\s*([a-zA-Z][a-zA-Z0-9_]*)\s*:\s*["']/gm;
  let m;
  while ((m = re.exec(body))) keys.add(m[1]);
  keys.add("langName");
  return keys;
}

const enKeys = dictKeys("en: {", 'langName: "English"');
const arKeys = dictKeys("ar: {", 'langName: "عربي"');
R.ok(enKeys && enKeys.size > 100, `T.en parsed (${enKeys ? enKeys.size : 0} keys)`);
R.ok(arKeys && arKeys.size > 100, `T.ar parsed (${arKeys ? arKeys.size : 0} keys)`);
const onlyEn = [...enKeys].filter((k) => !arKeys.has(k));
const onlyAr = [...arKeys].filter((k) => !enKeys.has(k));
R.ok(onlyEn.length === 0, `every T.en key exists in T.ar (missing: ${JSON.stringify(onlyEn)})`);
R.ok(onlyAr.length === 0, `every T.ar key exists in T.en (missing: ${JSON.stringify(onlyAr)})`);
R.eq(enKeys.size, arKeys.size, `T.en and T.ar carry the same key count (${enKeys.size})`);

R.done();
