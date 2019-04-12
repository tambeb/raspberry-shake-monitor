var CACHE_NAME = 'static-stuff';
var urlsToCache = [];

self.addEventListener( 'install', function ( event ) {
  event.waitUntil(
    caches.open( CACHE_NAME ).then( function ( cache ) {
      return cache.addAll( urlsToCache ).then( () => { self.skipWaiting(); } );
    } )
  );
} );

self.addEventListener( 'activate', function ( event ) {

  var cacheWhitelist = [ 'static-stuff' ];

  event.waitUntil(
    caches.keys().then( function ( cacheNames ) {
      return Promise.all(
        cacheNames.map( function ( cacheName ) {
          if ( cacheWhitelist.indexOf( cacheName ) === -1 ) {
            return caches.delete( cacheName );
          }
        } )
      );
    } )
  );
} );

self.addEventListener( 'fetch', event => {
  event.respondWith(
    caches.match( event.request ).then( response => {
      return response || fetch( event.request );
    } ).catch( err => { } )
  );
} );
