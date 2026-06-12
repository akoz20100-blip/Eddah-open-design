// spec-typography — DESIGN TRACK (routine v2, round 1): vendored type system.
//
// English/numerals render in the Apple-grade stack with vendored Inter as the
// cross-platform face; Arabic renders in self-hosted IBM Plex Sans Arabic
// (Saudi government digital style). Fonts are subset woff2 files inlined by
// build.py, so the single-file standalone and the offline PWA never touch a
// CDN. Figures use tabular numerals everywhere.

import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { DASHBOARD_DIR, launch, open, makeReporter } from "./helpers.mjs";

const R = makeReporter("spec-typography");

// ---- node-level: vendored files, stacks, and self-contained build --------
const css = readFileSync(resolve(DASHBOARD_DIR, "styles.css"), "utf8");
R.ok(/-apple-system,BlinkMacSystemFont,"SF Pro Text",Inter,"Segoe UI",sans-serif/.test(css), "EN stack: Apple system faces first, vendored Inter as the cross-platform face");
R.ok(/html\[lang="ar"\] body\{font-family:"IBM Plex Sans Arabic",Tajawal/.test(css), "AR stack: IBM Plex Sans Arabic primary, Tajawal fallback");
for (const f of ["inter-400", "inter-600", "plex-arabic-400", "plex-arabic-500", "plex-arabic-700"]) {
  const path = resolve(DASHBOARD_DIR, "vendor", "fonts", `${f}.woff2`);
  const size = statSync(path).size;
  R.ok(size > 5_000 && size < 60_000, `${f}.woff2 vendored and subset (${(size / 1024).toFixed(1)} KB)`);
  R.ok(css.includes(`./vendor/fonts/${f}.woff2`), `${f} wired through @font-face`);
}
R.ok(css.includes("font-display:swap"), "font-display swap (no invisible-text flash)");
R.ok(/td, \.kvalue, \.meta-chip[^{]*\{font-variant-numeric:tabular-nums\}/.test(css), "tabular numerals cover tables, KPI values and chips");

const standalone = readFileSync(resolve(DASHBOARD_DIR, "standalone.html"), "utf8");
R.ok(standalone.includes("data:font/woff2;base64,"), "standalone build inlines the fonts as data URIs");
R.ok(!/url\("\.\/vendor\/fonts\//.test(standalone), "standalone build leaves no external font url() behind");

// ---- browser-level: the vendored faces actually load and apply -----------
const { browser, page, pageErrors } = await launch();
try {
  await open(page, { lang: null }); // English default
  // Faces are lazy ("unloaded" until text demands them) — load() proves the
  // vendored woff2 bytes parse and register, which is the real contract.
  R.ok(await page.evaluate(() => document.fonts.load("16px Inter").then(() => document.fonts.check("16px Inter"))), "Inter loads from the vendored woff2");
  R.ok(await page.evaluate(() => document.fonts.load('16px "IBM Plex Sans Arabic"').then(() => document.fonts.check('16px "IBM Plex Sans Arabic"'))), "IBM Plex Sans Arabic loads from the vendored woff2");
  R.ok(await page.evaluate(() => document.fonts.load('700 16px "IBM Plex Sans Arabic"').then(() => document.fonts.check('700 16px "IBM Plex Sans Arabic"'))), "Plex Arabic bold face loads");

  await page.click("#langBtn"); // Arabic
  const arBody = await page.evaluate(() => getComputedStyle(document.body).fontFamily);
  R.ok(arBody.includes("IBM Plex Sans Arabic"), `Arabic body uses Plex Arabic (got ${arBody})`);
  const arHeading = await page.evaluate(() => getComputedStyle(document.querySelector(".brand-text strong")).letterSpacing);
  R.eq(arHeading, "normal", "Arabic headings drop the Latin negative tracking");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-typography completed without throwing");
} finally {
  await browser.close();
}

R.done();
