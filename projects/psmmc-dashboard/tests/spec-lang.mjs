// spec-lang — PHASE 0 (routine v2): English is the factory-default language.
//
// Asserts: a fresh visitor (no persisted preference) gets the English LTR UI
// with a localized document title; the toggle switches to full Arabic RTL and
// the choice persists across reloads; and the en/ar dictionaries stay in
// strict 1:1 key parity so no string can ship in only one language.

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { DASHBOARD_DIR, launch, open, makeReporter } from "./helpers.mjs";

const R = makeReporter("spec-lang");

// ---- node-level: en/ar dictionary parity --------------------------------
function dictKeys(block) {
  // String-aware scan: a key is an identifier followed by ":" whose preceding
  // significant character is "{" or "," — identifiers inside string literals
  // (e.g. a value ending in "coverage:") never qualify.
  const keys = [];
  let inStr = false;
  let prevSig = "{";
  for (let i = 0; i < block.length; i++) {
    const ch = block[i];
    if (inStr) {
      if (ch === "\\") i++;
      else if (ch === '"') { inStr = false; prevSig = '"'; }
      continue;
    }
    if (ch === '"') { inStr = true; continue; }
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < block.length && /[A-Za-z0-9_]/.test(block[j])) j++;
      let k = j;
      while (k < block.length && /\s/.test(block[k])) k++;
      if (block[k] === ":" && (prevSig === "{" || prevSig === ",")) keys.push(block.slice(i, j));
      prevSig = "w";
      i = j - 1;
      continue;
    }
    if (!/\s/.test(ch)) prevSig = ch;
  }
  return keys;
}
const src = readFileSync(resolve(DASHBOARD_DIR, "app.js"), "utf8");
const enStart = src.indexOf("en: {");
const arStart = src.indexOf("ar: {", enStart);
const tEnd = src.indexOf("\n  };", arStart);
R.ok(enStart > 0 && arStart > enStart && tEnd > arStart, "T dict en/ar blocks located in app.js");
const enKeys = dictKeys(src.slice(enStart + "en: {".length, arStart));
const arKeys = dictKeys(src.slice(arStart + "ar: {".length, tEnd));
const enSet = new Set(enKeys);
const arSet = new Set(arKeys);
const missingAr = enKeys.filter((k) => !arSet.has(k));
const missingEn = arKeys.filter((k) => !enSet.has(k));
R.ok(enKeys.length > 100, `en dictionary parsed (${enKeys.length} keys)`);
R.eq(missingAr.join(","), "", "every en key exists in ar");
R.eq(missingEn.join(","), "", "every ar key exists in en");

// ---- browser-level: factory default + toggle persistence ----------------
const { browser, page, pageErrors } = await launch();
try {
  await open(page, { lang: null }); // no persisted preference: factory default

  const fresh = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    title: document.title,
    btn: document.getElementById("langName").textContent.trim(),
    tab: document.querySelector('.tab[data-view="planning"] .tab-lbl').textContent.trim(),
  }));
  R.eq(fresh.lang, "en", "fresh visitor gets English");
  R.eq(fresh.dir, "ltr", "fresh visitor gets LTR layout");
  R.ok(fresh.title.includes("Pharmaceutical Planning Department Dashboard"), `document title is localized English (got "${fresh.title}")`);
  R.eq(fresh.btn, "English", "language button names the active language");
  R.eq(fresh.tab, "Planning Department", "tabs render the English labels");

  await page.click("#langBtn");
  const ar = await page.evaluate(() => ({
    lang: document.documentElement.lang,
    dir: document.documentElement.dir,
    tab: document.querySelector('.tab[data-view="planning"] .tab-lbl').textContent.trim(),
  }));
  R.eq(ar.lang, "ar", "toggle switches to Arabic");
  R.eq(ar.dir, "rtl", "Arabic flips the document to RTL");
  R.eq(ar.tab, "قسم التخطيط", "tabs render the Arabic labels");

  await page.reload({ waitUntil: "load" });
  await page.waitForSelector("#btnSample");
  const persisted = await page.evaluate(() => document.documentElement.lang);
  R.eq(persisted, "ar", "language choice persists across reloads");

  R.ok(pageErrors.length === 0, `no page errors (saw: ${JSON.stringify(pageErrors)})`);
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-lang completed without throwing");
} finally {
  await browser.close();
}

R.done();
