/* IELTS for Lao Learners - offline service worker. Host this file next to index.html. */
var V='ielts-offline-v1';
var SHELL=['./','index.html'];
self.addEventListener('install',function(e){e.waitUntil(caches.open(V).then(function(c){return c.addAll(SHELL).catch(function(){})}).then(function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==V}).map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});
function swr(req){return caches.open(V).then(function(c){return c.match(req).then(function(hit){var net=fetch(req).then(function(r){if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(function(){return hit});return hit||net})})}
self.addEventListener('fetch',function(e){var r=e.request;if(r.method!=='GET')return;var u=new URL(r.url);
 if(r.mode==='navigate'){e.respondWith(fetch(r).then(function(res){var cp=res.clone();caches.open(V).then(function(c){c.put(r,cp)});return res}).catch(function(){return caches.match(r).then(function(h){return h||caches.match('index.html')||caches.match('./')})}));return}
 if(u.origin===self.location.origin||u.hostname==='fonts.googleapis.com'||u.hostname==='fonts.gstatic.com'||u.hostname==='i.ytimg.com'){e.respondWith(swr(r))}});
self.addEventListener('message',function(e){var d=e.data||{};if(d.type==='cache'&&d.urls){e.waitUntil(caches.open(V).then(function(c){return Promise.all(d.urls.map(function(u){return fetch(u,{mode:'no-cors'}).then(function(r){return c.put(u,r)}).catch(function(){})}))}))}});
self.addEventListener('notificationclick',function(e){e.notification.close();e.waitUntil(self.clients.matchAll({type:'window'}).then(function(l){if(l.length)return l[0].focus();return self.clients.openWindow('./')}))});
