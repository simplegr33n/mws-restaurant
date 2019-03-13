const staticCacheName = 'restaurant-cache-007';

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

self.addEventListener('fetch', event => {
    const request = event.request;
    const requestUrl = new URL(request.url);

    if (requestUrl.port === '1337') {
        event.respondWith(idbResponse(request));
    } else {
        event.respondWith(cacheResponse(request));
    }
});


function cacheResponse(request) {
    return caches.match(request).then(cacheResponse => {
        return cacheResponse || fetch(request).then(fetchResponse => { // Return cacheResponse or fetch if undefined
            return caches.open(staticCacheName).then(cache => {
                if (!fetchResponse.url.includes('browser-sync')) {  // Filter browser-sync resources to prevent error
                    cache.put(request, fetchResponse.clone()); // Send Clone to Cache (original response can only be used once)
                }
                return fetchResponse; // Send fetch Original to browser
            });
        });
    }).catch(error => new Response(error));
}

function idbResponse(request) {
    return idbKeyVal.get('restaurants').then(restaurants => {
        return (
            restaurants || fetch(request)
                .then(fetchResponse => fetchResponse.json())
                .then(jsonResponse => {
                    idbKeyVal.set('restaurants', jsonResponse);
                    return jsonResponse;
                })
        );
    }).then(response => new Response(JSON.stringify(response)))
        .catch(error => {
            return new Response(error, {
                status: 404,
                statusText: 'Request Error: 404'
            });
        });
}