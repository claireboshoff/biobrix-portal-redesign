/* BioBrix OS — offline service worker.
   NETWORK-FIRST for pages (so a refresh always shows the latest when online),
   cache-first for assets. Falls back to cache only when offline (the field).
   Data lives in localStorage (bb-data.js) so the app keeps working with no signal. */
// Its own cache family: the preview shares an address with other BioBrix builds, so it only
// ever clears its own old caches, never theirs.
var CACHE = 'biobrix-redesign-v49';
var SHELL = [
  'index.html','login.html','welcome.html','bb-config.js?v=redesign7','guard.js?v=redesign7','bb-data.js?v=redesign7','bb-shell.js?v=redesign7','bb-intel.js?v=redesign7','bb-ask.js?v=redesign7','bb-table.js?v=redesign7','manifest.json',
  'voice-order.html','forecast.html','territory.html','orders.html',
  'operations.html','stock.html','depots.html','suppliers.html','deliveries.html',
  'bioservices.html','farms.html','farm-detail.html','bioanalyze-soil.html',
  'bioanalyze-leaf.html','biowatch.html','bioconsult.html','products-library.html',
  'forecast-plan.html','sales-report.html','commission.html','farm-files.html','client-portal.html','team.html','labels.html','document.html','showcase.html','finance.html','dispatch.html','jobs.html',
  'assets/hero-field.webp','assets/hero-field-clean.webp'
];
self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return Promise.all(SHELL.map(function(u){ return c.add(u).catch(function(){}); })); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(keys){
    return Promise.all(keys.map(function(k){ if(k!==CACHE && k.indexOf('biobrix-redesign-')===0) return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  if(e.request.method!=='GET') return;
  var req = e.request;
  var isHTML = req.mode==='navigate' || (req.headers.get('accept')||'').indexOf('text/html')>=0;
  // app scripts + data files are tiny and change often: always fresh when online, cache only offline
  var isApp = /\.(js|json|txt)(\?|$)/.test(req.url) && req.url.indexOf(self.location.origin)===0;
  if(isHTML || isApp){
    // network-first AND cache:'reload' — GitHub Pages serves HTML with a max-age, so a plain
    // fetch() can be answered from the browser's own HTTP cache and hand back yesterday's page.
    // This is what made "fixed" changes invisible on a normal visit but visible with ?something.
    e.respondWith(
      fetch(new Request(req.url, {cache:'reload', credentials:'same-origin'})).then(function(r){
        var cl=r.clone(); caches.open(CACHE).then(function(c){ c.put(req,cl).catch(function(){}); });
        return r;
      }).catch(function(){
        return caches.match(req).then(function(hit){ return hit || caches.match('index.html'); });
      })
    );
    return;
  }
  // assets: cache-first for speed + offline
  e.respondWith(
    caches.match(req).then(function(hit){
      return hit || fetch(req).then(function(r){
        if(r&&r.ok && req.url.indexOf('http')===0){ var cl=r.clone(); caches.open(CACHE).then(function(c){ c.put(req,cl).catch(function(){}); }); }
        return r;
      }).catch(function(){ return hit; });
    })
  );
});
