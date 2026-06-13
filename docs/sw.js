/* PSMMC dashboard service worker — cache-first so the permanent link keeps
   working fully offline (the app itself never needs a network: all parsing
   and calculation is client-side). The cache name carries a build stamp that
   build.py rewrites on every build; a changed sw.js byte-stream is what makes
   installed clients pick up a new dashboard version. */
var CACHE = "psmmc-3b40e4db5f"; /* __PSMMC_BUILD_LINE__ */
var SHELL = ["./"];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE && k.indexOf("psmmc-") === 0; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(function (hit) {
      if (hit) return hit;
      return fetch(e.request).then(function (res) {
        // Security L4: only persist responses from THIS app's own scope
        // (e.g. /psmmc/…), not any same-origin path — so co-hosted content on
        // a shared origin can never be cached into the dashboard's offline copy.
        if (res && res.ok && e.request.url.indexOf(self.registration.scope) === 0) {
          var copy = res.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return res;
      });
    })
  );
});
