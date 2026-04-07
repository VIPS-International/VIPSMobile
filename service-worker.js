'use strict';

var cacheName = 'VIPSMobile-SWCache-B-260312.155647';
var ignoreUrlParametersMatching = [/^(_dc|v)$/];

var urlsToCache = [
    'index.html'
];

self.addEventListener('install', function (event) {
    // Perform install steps
    event.waitUntil(
        caches.open(cacheName)
            .then(function (cache) {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('activate', function (event) {

    var cacheWhitelist = [cacheName];

    event.waitUntil(
        caches.keys().then(function (cacheNames) {
            return Promise.all(
                cacheNames.map(function (cn) {
                    if (cacheWhitelist.indexOf(cn) === -1) {
                        return caches.delete(cn);
                    }
                })
            );
        })
    );
});


self.addEventListener('fetch', function (event) {
    var url = new URL(event.request.url);
    url.hash = "";
    url.search = "";

    if (event.request.headers.get('range')) {
        console.log('Range request for', event.request.url);
        var rangeHeader = event.request.headers.get('range');
        var rangeMatch = rangeHeader.match(/^bytes\=(\d+)\-(\d+)?/);
        var pos = Number(rangeMatch[1]);
        var pos2 = rangeMatch[2];
        if (pos2) { pos2 = Number(pos2); }

        console.log('Range request for ' + event.request.url, 'Range: ' + rangeHeader, "Parsed as: " + pos + "-" + pos2);
        event.respondWith(
            caches.open(cacheName)
                .then(function (cache) {
                    return cache.match(event.request.url);
                }).then(function (res) {
                    if (!res) {
                        return fetch(event.request)
                            .then(res => {
                                return res.arrayBuffer();
                            });
                    }
                    return res.arrayBuffer();
                }).then(function (ab) {
                    var responseHeaders = {
                        status: 206,
                        statusText: 'Partial Content',
                        headers: [
                            ['Content-Range', 'bytes ' + pos + '-' +
                                (pos2 || (ab.byteLength - 1)) + '/' + ab.byteLength]]
                    };

                    var abSliced = {};
                    if (pos2 > 0) {
                        abSliced = ab.slice(pos, pos2 + 1);
                    } else {
                        abSliced = ab.slice(pos);
                    }

                    return new Response(
                        abSliced, responseHeaders
                    );
                }));
    } else {
        event.respondWith(
            fetch(event.request).then(
                function (response) {
                    // Check if we received a valid response
                    if (!response || response.status !== 200 || response.type !== 'basic' || event.request.method !== 'GET' || event.request.url.indexOf('http') !== 0) {
                        return response;
                    }

                    // IMPORTANT: Clone the response. A response is a stream
                    // and because we want the browser to consume the response
                    // as well as the cache consuming the response, we need
                    // to clone it so we have two streams.
                    var responseToCache = response.clone();

                    caches.open(cacheName)
                        .then(function (cache) {
                            cache.put(url, responseToCache);
                        });

                    return response;
                }
            ).catch(function () {

                return caches.match(url);
            })
        );
    }

});
