const staticCacheName = 'restaurant-cache-004';

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

self.addEventListener('fetch',
    function (event) {
        event.respondWith(caches.match(event.request)
            .then(function (response) {
                if (response !== undefined) {
                    return response;
                } else {
                    return fetch(event.request).then
                        (function (response) {
                            let responseClone = response.clone();
                            caches.open(staticCacheName)
                                .then
                                (function (cache) {
                                    cache.put(event.request, responseClone);
                                });
                            return response;
                        });
                }
            }) // end of cache match promise
        ); // end of respond with
    });