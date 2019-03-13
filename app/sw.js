const staticCacheName = 'restaurant-cache-010';

// list of assets to cache on install
// cache each restaurant detail page as well
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(staticCacheName)
            .then(cache => {
                return cache.addAll([
                    '/',
                    '/index.html',
                    '/restaurant.html',
                    '/css/styles.css',
                    '/css/mediaQueries.css',
                    '/js/dbhelper.js',
                    '/js/main.js',
                    '/js/restaurant_info.js',
                    '/dist/img/1-300w.jpg',
                    '/dist/img/2-300w.jpg',
                    '/dist/img/3-300w.jpg',
                    '/dist/img/4-300w.jpg',
                    '/dist/img/5-300w.jpg',
                    '/dist/img/6-300w.jpg',
                    '/dist/img/7-300w.jpg',
                    '/dist/img/8-300w.jpg',
                    '/dist/img/9-300w.jpg',
                    '/dist/img/10-300w.jpg',
                    '/js/register_sw.js'
                ]).catch(error => {
                    console.log('Caches open failed: ' + error);
                });
            }).catch(error => {
                console.log('Caches open failed: ' + error);
            })
    );
});

self.addEventListener('activate', function (event) {
    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.filter(function (cacheName) {
                    return cacheName.startsWith('restaurant-cache-') &&
                        cacheName != staticCacheName;
                }).map(function (cacheName) {
                    return caches.delete(cacheName);
                })
            );
        })
    );
});

self.addEventListener('fetch', function(event) {
    // console.log("Service Worker starting fetch");
    event.respondWith(
      caches.open(staticCacheName).then(function(cache) {
        return cache.match(event.request).then(function (response) {
          if (response) {
            // console.log("data fetched from cache");
            return response;
          }
          else {
            return fetch(event.request).then(function(networkResponse) {
              // console.log("data fetched from network", event.request.url);
              //cache.put(event.request, networkResponse.clone());
              return networkResponse;
            }).catch(function(error) {
              console.log("Unable to fetch data from network", event.request.url, error);
            });
          }
        });
      }).catch(function(error) {
        console.log("Something went wrong with Service Worker fetch intercept", error);
      })
    );
  });