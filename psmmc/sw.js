/* RETIRED: this location moved to /Dashboard/psmmc-military/. This SW replaces
   the old cache-first worker — it clears every cache, unregisters itself, and
   reloads open clients so installed PWAs pick up the redirect page. */
self.addEventListener('install', function(e){ self.skipWaiting(); });
self.addEventListener('activate', function(e){
  e.waitUntil((async function(){
    try{ var ks=await caches.keys(); await Promise.all(ks.map(function(k){return caches.delete(k);})); }catch(_){}
    try{ await self.registration.unregister(); }catch(_){}
    try{ var cs=await self.clients.matchAll({type:'window'}); cs.forEach(function(c){ c.navigate(c.url); }); }catch(_){}
  })());
});
self.addEventListener('fetch', function(e){ /* pass-through: no caching */ });
