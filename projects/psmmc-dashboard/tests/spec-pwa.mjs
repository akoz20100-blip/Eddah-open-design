// spec-pwa — PLANNER FEATURE 10 (round 3): installable, offline-capable PWA.
// Node-level checks on the committed sources (no browser): the manifest is
// valid and self-contained, the service worker is cache-first and
// version-stamped by the build, the page links the manifest, the app
// registers the SW only on http(s), the build emits the docs/ copies, and the
// publish workflow ships sw.js + manifest next to the permanent link.

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import { DASHBOARD_DIR, makeReporter } from "./helpers.mjs";

const R = makeReporter("spec-pwa");
const ROOT = resolve(DASHBOARD_DIR, "..", "..");

try {
  // Manifest: valid JSON, installable fields, self-contained icon.
  const manifest = JSON.parse(readFileSync(resolve(DASHBOARD_DIR, "manifest.webmanifest"), "utf8"));
  R.ok(!!manifest.name && manifest.short_name === "PSMMC", "manifest has name/short_name");
  R.eq(manifest.display, "standalone", "manifest display is standalone (installable)");
  R.eq(manifest.start_url, "./", "start_url is relative (works under /psmmc/ and /docs/)");
  R.eq(manifest.scope, "./", "scope is relative");
  R.ok(Array.isArray(manifest.icons) && manifest.icons[0].src.startsWith("data:image/svg+xml"), "icon is a self-contained data URI (no asset dependency)");

  // Service worker: version stamp + cache-first fetch.
  const sw = readFileSync(resolve(DASHBOARD_DIR, "sw.js"), "utf8");
  R.ok(/var CACHE = "psmmc-[a-z0-9]+";/.test(sw), "sw cache name carries a build stamp");
  R.ok(sw.includes('addEventListener("install"') && sw.includes('addEventListener("activate"') && sw.includes('addEventListener("fetch"'), "sw handles install/activate/fetch");
  R.ok(sw.includes("caches.match"), "sw serves cache-first");
  R.ok(sw.includes("caches.delete"), "sw cleans up old versioned caches on activate");

  // Page links the manifest; the app registers the SW guarded to http(s) so
  // the double-clicked standalone (file://) never throws.
  const html = readFileSync(resolve(DASHBOARD_DIR, "index.html"), "utf8");
  R.ok(html.includes('rel="manifest"') && html.includes("manifest.webmanifest"), "index.html links the manifest");
  const app = readFileSync(resolve(DASHBOARD_DIR, "app.js"), "utf8");
  R.ok(app.includes('serviceWorker.register("./sw.js")'), "app registers ./sw.js");
  R.ok(/https\?:.*location\.protocol|location\.protocol.*https\?:/.test(app.replace(/\n/g, " ")), "registration is guarded to http(s) only");

  // Build pipeline emits the docs/ companions and stamps the SW.
  const build = readFileSync(resolve(DASHBOARD_DIR, "build.py"), "utf8");
  R.ok(build.includes('"sw.js"') && build.includes("manifest.webmanifest"), "build.py emits sw.js + manifest companions");
  R.ok(build.includes("hashlib"), "build.py stamps the sw cache from the built HTML hash");

  // Publish workflow ships the companions next to the permanent link.
  const wfPath = resolve(ROOT, ".github", "workflows", "psmmc-pages.yml");
  if (existsSync(wfPath)) {
    const wf = readFileSync(wfPath, "utf8");
    R.ok(wf.includes("pages/psmmc/sw.js") && wf.includes("pages/psmmc/manifest.webmanifest"), "pages workflow publishes sw.js + manifest to /psmmc/");
  } else {
    R.ok(true, "pages workflow not present in this checkout — skipped");
  }
} catch (err) {
  console.log("  ✗ spec threw:", err && err.message);
  R.ok(false, "spec-pwa completed without throwing");
}

R.done();
