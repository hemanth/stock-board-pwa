// Hand coding, sw for the demo, please use better tools
// like: sw-precache, sw-toolbox, https://github.com/hemanth/awesome-pwa#tools
(function(){
  var CACHE_NAME = 'sw-stock-board';
  var CACHE_VERSION = 1;

  // targing android-chrome for the demo.
  var filesToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/app.js',
    '/images/fab_add.svg',
    '/images/touch/android-chrome-192x192.png'
  ];

  // The install event got fired.
  self.addEventListener('install', event => {
    //ExtendableEvent.waitUntil() & CacheStorage.open()
    event.waitUntil(
      caches.open(CACHE_NAME + '-v' + CACHE_VERSION)
      .then(cache => cache.addAll(filesToCache))
      .catch(console.error)
    );
  });

  // On activation.
  self.addEventListener('activate', event => {
    var currentCacheName = CACHE_NAME + '-v' + CACHE_VERSION;
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName =>  {
          // Validate the cache.
          if (cacheName.indexOf(CACHE_NAME) == -1) {
            return;
          }
          // Delete if not.
          if (cacheName != currentCacheName) {
            return caches.delete(cacheName);
          }
        })
      );
    });
    return self.clients.claim();
  });

  // On the fetch.
  self.addEventListener('fetch',function(event) {
    var request = event.request;
    /* 
      If requsted URL is found in caches
      respond from the cache or else
      fetch and add the response to the cache and 
      then return the reponse.
      [cache first strategy]
    */
    event.respondWith(
      caches.match(request).then(function(response) {
        if (response) {
          return response;
        }
        return fetch(request).then(function(response) {
          var responseToCache = response.clone();
          caches.open(CACHE_NAME + '-v' + CACHE_VERSION).then(
            function(cache) {
              cache.put(request, responseToCache).catch(function(err) {
                console.warn(request.url + ': ' + err.message);
              });
            });
          return response;
        });
      })
    );
  });

  // On push event.
  self.addEventListener('push', function(event) {
    console.log('Event: Push', event);

    var title = 'Push notification demo';
    var body = 'You have received a notification';
    var tag = 'demo';
    var icon = '/images/touch/android-chrome-192x192.png';

    event.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        tag: tag,
        icon: icon
      })
    );
  });

  //On click event for notification to close
  self.addEventListener('notificationclick', function(event) {
    console.log('Notification is clicked ', event);
    event.notification.close();
  });
  
}());