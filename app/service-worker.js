// Note: use following command in DevTools console to force unreigstration of current service worker 
//////
////// navigator.serviceWorker.getRegistration().then(function(r){r.unregister();});
//////

const staticCacheName = 'restrev-static-v1';
const dynamicMapsCacheName = 'restrev-dynamic-maps-v1';
const dynamicImagesCacheName = 'restrev-dynamic-images-v1';
const dynamicPagesCacheName = 'restrev-dynamic-pages-v1'

const cssFiles = [
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.css',
  'dist/css/styles.min.css'
];

const jsFiles = [
  'https://unpkg.com/leaflet@1.3.1/dist/leaflet.js',
  'dist/js/index.min.js',
  'dist/js/restaurant.min.js'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(staticCacheName)
    .then((cache) => {
      cache.addAll([
        '/',
        'manifest.json',
        ...cssFiles,
        ...jsFiles
      ]);
    }).catch(() => {
      console.log('Error caching static assets!');
    })
  );
});

self.addEventListener('activate', (event) => {
  if (self.clients && clients.claim) {
    clients.claim();
  }
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.filter((cacheName) => {
          return cacheName.startsWith('restrev-') && cacheName !== staticCacheName;
        })
        .map((cacheName) => {
          return caches.delete(cacheName);
        })
      ).catch((error) => {
        console.log('Error removing existing cache!' + error);
      });
    }).catch((error) => {
      console.log('Error removing existing cache!' + error);
    }));
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request)
        .then((fetchResponse) => {
          if (event.request.url.endsWith('.webp') || event.request.url.endsWith('.jpg')) {
            return cacheDynamicRequestData(dynamicImagesCacheName, event.request.url, fetchResponse.clone());
          } else if (event.request.url.includes('.html')) {
            return cacheDynamicRequestData(dynamicPagesCacheName, event.request.url, fetchResponse.clone());
          } else if (event.request.url.includes('mapbox') || event.request.url.includes('leaflet')) {
            return cacheDynamicRequestData(dynamicMapsCacheName, event.request.url, fetchResponse.clone());
          } else if (event.request.url.includes('reviews') || event.request.url.includes('restaurant')) {
            return fetchResponse;
          }
        }).catch((error) => {
          console.log('Error saving or fetching data from dynamic cache!' + error);
        });
    })
  );
});

function cacheDynamicRequestData(dynamicCacheName, url, fetchResponse) {
  return caches.open(dynamicCacheName)
    .then((cache) => {
      cache.put(url, fetchResponse.clone());
      return fetchResponse;
    }).catch((error) => {
      console.log(`Error saving or fetching data from dynamic cache: ${dynamicCacheName}!` + error);
    });
}