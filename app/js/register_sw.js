/* Register service worker */
if (navigator.serviceWorker) {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => {
        console.log('Service Worker Registration Successful, Scope: ' + reg.scope);
      })
      .catch(error => {
        console.log('Service Worker Registration Error: ' + error);
      });
  }