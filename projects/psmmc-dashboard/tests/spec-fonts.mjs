// spec-fonts — DESIGN TRACK (routine v2, round 1): vendored typography.
//
// Contract being guarded:
//   1. Inter (latin subset, variable) and IBM Plex Sans Arabic (arabic
//      subset, 400/600/700) are self-hosted under vendor/fonts/ and
//      actually load and resolve in the browser for both languages.
//   2. The single-file build inlines every font as a data URI — the
//      published page and the offline PWA must never fetch from a CDN.
//   3. Figures keep tabular numerals (the .num primitive).

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { launch, open, makeReporter, DASHBOARD_DIR } from "./helpers.mjs";

const R = makeReporter("spec-fonts");

// ---- vendored files exist ---------------------------------------------------
const FONTS = [
  "inter-latin-var.woff2",
  "plexarabic-ar-400.woff2",
  "plexarabic-ar-600.woff2",
  "plexarabic-ar-700.woff2",
];
for (const f of FONTS) {
  R.ok(existsSync(resolve(DASHBOARD_DIR, "vendor", "fonts", f)), `vendored font present: ${f}`);
}

// ---- standalone build is fully self-contained -------------------------------
const standalone = readFileSync(resolve(DASHBOARD_DIR, "standalone.html"), "utf8");
const dataFonts = (standalone.match(/url\(data:font\/woff2;base64,/g) || []).length;
R.ok(dataFonts >= 4, `standalone.html inlines all font faces as data URIs (found ${dataFonts})`);
R.ok(!standalone.includes("fonts.gstatic.com"), "standalone.html has no Google Fonts CDN reference");
R.ok(!standalone.includes("url(./vendor/fonts/"), "standalone.html has no relative font path left");

// ---- fonts load and resolve in the live page --------------------------------
const { browser, page, pageErrors } = await launch({ lang: null, locale: "en" });
try {
  await open(page);

  const en = await page.evaluate(async () => {
    await document.fonts.load('400 16px "Inter"', "Pharmacy 0123456789");
    await document.fonts.load('700 16px "Inter"', "Pharmacy 0123456789");
    return {
      inter400: document.fonts.check('400 16px "Inter"'),
      inter700: document.fonts.check('700 16px "Inter"'),
      bodyStack: getComputedStyle(document.body).fontFamily,
      numVariant: getComputedStyle(document.querySelector(".num")).fontVariantNumeric,
    };
  });
  R.ok(en.inter400, "Inter 400 (latin) loads from the vendored face");
  R.ok(en.inter700, "Inter 700 resolves from the variable face");
  R.ok(/-apple-system/.test(en.bodyStack) && /Inter/.test(en.bodyStack), `EN body stack is Apple-grade (got: ${en.bodyStack})`);
  R.eq(en.numVariant, "tabular-nums", "figures use tabular numerals (.num)");

  // Switch to Arabic: Plex Sans Arabic leads the stack and loads.
  await page.click("#langBtn");
  const ar = await page.evaluate(async () => {
    await document.fonts.load('400 16px "IBM Plex Sans Arabic"', "صيدلية");
    await document.fonts.load('700 16px "IBM Plex Sans Arabic"', "صيدلية");
    return {
      plex400: document.fonts.check('400 16px "IBM Plex Sans Arabic"'),
      plex700: document.fonts.check('700 16px "IBM Plex Sans Arabic"'),
      bodyStack: getComputedStyle(document.body).fontFamily,
    };
  });
  R.ok(ar.plex400, "IBM Plex Sans Arabic 400 loads from the vendored face");
  R.ok(ar.plex700, "IBM Plex Sans Arabic 700 loads from the vendored face");
  R.ok(/^"?IBM Plex Sans Arabic/.test(ar.bodyStack), `AR body stack leads with Plex Sans Arabic (got: ${ar.bodyStack})`);

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-fonts completed without throwing");
} finally {
  await browser.close();
}

R.done();
