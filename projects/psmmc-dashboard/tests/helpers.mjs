// Browser harness for the PSMMC pharmacy dashboard specs.
//
// Launches the chromium that ships with playwright-core (resolved from a
// portable location), opens the dashboard from file:// (the app is designed to
// run with no server), and exposes small helpers the spec files share:
// loading sample data, switching tabs, reading card text, uploading generated
// .xlsx fixtures, and driving the period-confirmation modal.
//
// Every helper is written against the SPEC, not against in-flight production
// edits. The dashboard persists baseline/history/snapshots into localStorage,
// so each spec must open a FRESH browser context (newPage below clears state
// by using a brand-new context) to stay deterministic.

import { createRequire } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, resolve } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// playwright-core lives outside the repo (no npm installs allowed inside it).
// PSMMC_PW_DIR overrides the lookup root for portability.
const PW_DIR = process.env.PSMMC_PW_DIR || "/tmp/pwtest";
const require = createRequire(resolve(PW_DIR, "package.json"));
let chromium;
try {
  ({ chromium } = require("playwright-core"));
} catch (err) {
  // Fall back to NODE_PATH-style resolution from the harness directory.
  const req2 = createRequire(import.meta.url);
  ({ chromium } = req2("playwright-core"));
}

const CHROME =
  process.env.PSMMC_CHROME ||
  "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

export const DASHBOARD_DIR = resolve(__dirname, "..");
export const INDEX_URL = pathToFileURL(resolve(DASHBOARD_DIR, "index.html")).href;
export const FIXTURES_DIR = resolve(__dirname, "fixtures");

// Arabic-localized sample button label (and the empty-state duplicate). The
// spec asks for the LAST match, which is the empty-state button rendered
// inside #content (the appbar one is #btnSample).
export const SAMPLE_TEXT = "تحميل بيانات تجريبية";

/**
 * Launch a chromium browser pinned to a timezone + locale.
 * Default timezone Asia/Riyadh pins the calendar invariant.
 */
export async function launch({ timezoneId = "Asia/Riyadh", locale = "ar" } = {}) {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const context = await browser.newContext({ timezoneId, locale });
  const page = await context.newPage();

  const pageErrors = [];
  const consoleErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e && e.message ? e.message : e)));
  page.on("console", (m) => {
    if (m.type() === "error") consoleErrors.push(m.text());
  });

  return { browser, context, page, pageErrors, consoleErrors };
}

/** Open the dashboard and wait for the app IIFE to wire up.
 *
 * The app's factory default language is ENGLISH (Phase 0, routine v2), but the
 * legacy specs assert Arabic UI strings — Arabic remains a first-class,
 * fully-supported surface — so `open` pins the persisted language to "ar"
 * before the page scripts run. Pass `{ lang: null }` to observe the true
 * factory default (spec-lang does), or `{ lang: "en" }` to pin English. */
export async function open(page, { lang = "ar" } = {}) {
  if (lang) {
    await page.addInitScript((l) => {
      try { localStorage.setItem("psmmc_lang", l); } catch (e) {}
    }, lang);
  }
  await page.goto(INDEX_URL, { waitUntil: "load" });
  // app.js runs on DOMContentLoaded/immediately; the sample button onclick is
  // the last thing init() sets, so wait until it's wired.
  await page.waitForSelector("#btnSample");
  await page.waitForFunction(() => !!window.PSMMC_SAMPLE, null, { timeout: 5000 });
}

/** Click the "load sample data" button (last match per spec). */
export async function loadSample(page) {
  const btns = page.getByText(SAMPLE_TEXT, { exact: false });
  await btns.last().click();
  // Sample render is synchronous inside loadSample(); wait for cards.
  await page.waitForSelector(".kcard", { timeout: 5000 });
}

/** Switch dashboard tab: planning | management | averages. */
export async function switchTab(page, view) {
  await page.click(`.tab[data-view="${view}"]`);
  await page.waitForFunction(
    (v) => document.querySelector(`.tab[data-view="${v}"]`)?.getAttribute("aria-selected") !== null,
    view,
    { timeout: 3000 },
  ).catch(() => {});
  await page.waitForSelector("#content .kcard, #content .tablecard", { timeout: 5000 }).catch(() => {});
}

/** Read the planning decision cards' visible value text by label key text. */
export async function cardTexts(page) {
  return page.$$eval(".kcard", (cards) =>
    cards.map((c) => ({
      label:
        c.querySelector(".klabel")?.textContent?.trim() ||
        c.querySelector(".ktitle")?.textContent?.trim() ||
        "",
      value:
        c.querySelector(".kvalue")?.textContent?.trim() ||
        c.querySelector(".kbadge")?.textContent?.trim() ||
        "",
      sub: c.querySelector(".ksub")?.textContent?.trim() || "",
      full: c.textContent?.replace(/\s+/g, " ").trim() || "",
    })),
  );
}

/** Period chip text (#metaPeriod). */
export async function periodText(page) {
  return page.$eval("#metaPeriod", (el) => el.textContent.trim());
}

/** Upload one or more files into a file input by id. */
export async function uploadFiles(page, inputId, paths) {
  const arr = Array.isArray(paths) ? paths : [paths];
  await page.setInputFiles(`#${inputId}`, arr);
}

/** Wait for the period-confirmation modal to be visible. */
export async function waitForPeriodModal(page) {
  await page.waitForSelector("#pcUseDetected", { state: "visible", timeout: 5000 });
}

/** Confirm the detected period in the modal. */
export async function confirmDetectedPeriod(page) {
  await waitForPeriodModal(page);
  await page.click("#pcUseDetected");
  await page.waitForSelector("#modal", { state: "hidden", timeout: 5000 }).catch(() => {});
}

/** Choose an override months button ([data-months="3|6"]) in the modal. */
export async function choosePeriodOverride(page, months) {
  await waitForPeriodModal(page);
  await page.click(`#modalCard .seg button[data-months="${months}"]`);
  await page.waitForSelector("#modal", { state: "hidden", timeout: 5000 }).catch(() => {});
}

/** Read every table-body row's cells as text arrays. */
export async function tableRows(page) {
  return page.$$eval("table tbody tr", (trs) =>
    trs.map((tr) => Array.from(tr.querySelectorAll("td")).map((td) => td.textContent.trim())),
  );
}

/** Find the planning table row for a given NUPCO code. */
export async function rowForCode(page, code) {
  return page.$$eval(
    "table tbody tr",
    (trs, code) => {
      for (const tr of trs) {
        const el = tr.getAttribute("data-code");
        if (el === code) return Array.from(tr.querySelectorAll("td")).map((td) => td.textContent.trim());
      }
      return null;
    },
    code,
  );
}

// Tiny assertion helpers shared by specs (no test framework, plain node).
export function makeReporter(specName) {
  let failures = 0;
  const log = [];
  function ok(cond, msg) {
    if (cond) {
      console.log(`  ✓ ${msg}`);
    } else {
      failures++;
      console.log(`  ✗ ${msg}`);
      log.push(msg);
    }
  }
  function eq(a, b, msg) {
    ok(a === b, `${msg} (got ${JSON.stringify(a)}, expected ${JSON.stringify(b)})`);
  }
  function done() {
    if (failures) {
      console.log(`\n${specName}: ${failures} FAILED`);
      process.exit(1);
    }
    console.log(`\n${specName}: all passed`);
    process.exit(0);
  }
  return { ok, eq, done, get failures() { return failures; }, log };
}
