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

self.addEventListener('fetch', function (event) {
    event.respondWith(
        caches.open(staticCacheName).then((cache) => {
            return cache.match(event.request).then((response) => {
                if (response) {
                    return response;
                } else {
                    return fetch(event.request).then((networkResponse) => {
                        if (!fetchResponse.url.includes('browser-sync')) { // Prevent error
                            cache.put(event.request, fetchResponse.clone()); // put clone in cache
                        }
                        return networkResponse;
                    }).catch((error) => {
                        console.log("Service Worker unable to fetch network data", event.request.url, error);
                    });
                }
            });
        }).catch((error) => {
            console.log("Service Worker Intercept Error", error);
        })
    );
});