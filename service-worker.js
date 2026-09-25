// Service worker for offline support.
// Strategy: cache the whole app shell on install, serve from cache first,
// and only fall back to the network for anything not cached (and update the
// cache in the background when the network does succeed).

var CACHE_NAME = 'conferencia-patrimonial-v1';
var APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './xlsx.full.min.js',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', function(event){
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL);
    }).then(function(){
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event){
  event.waitUntil(
    caches.keys().then(function(names){
      return Promise.all(
        names.filter(function(n){ return n !== CACHE_NAME; })
             .map(function(n){ return caches.delete(n); })
      );
    }).then(function(){
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event){
  if (event.request.method !== 'GET') return;
  event.respondWith(
    caches.match(event.request).then(function(cached){
      var networkFetch = fetch(event.request).then(function(response){
        if (response && response.status === 200) {
          var copy = response.clone();
          caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
        }
        return response;
      }).catch(function(){
        return cached; // offline and not cached elsewhere: fall back to whatever we already have
      });
      // Cache-first: return cached immediately if we have it, update cache quietly in the background.
      return cached || networkFetch;
    })
  );
});
