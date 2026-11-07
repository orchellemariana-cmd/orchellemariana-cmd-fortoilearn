/* IELTS for Lao Learners - offline service worker. Host this file next to index.html (https or localhost). */
var V='ielts-offline-v2';
var SHELL=['./','index.html'];
var OPTIONAL=['manifest.webmanifest','icon-192.png','icon-512.png'];
var HOSTS=['fonts.googleapis.com','fonts.gstatic.com','i.ytimg.com','cdn.jsdelivr.net'];

function addOne(c,u){return fetch(u,{cache:'reload'}).then(function(r){if(!r||!r.ok)throw new Error(u+' '+(r&&r.status));return c.put(u,r)})}
function precache(){
  return caches.open(V).then(function(c){
    var failed=[];
    var jobs=SHELL.concat(OPTIONAL).map(function(u){return addOne(c,u).catch(function(){failed.push(u)})});
    return Promise.all(jobs).then(function(){
      return c.match('index.html',{ignoreSearch:true}).then(function(h){return c.match('./',{ignoreSearch:true}).then(function(h2){
        return {ok:!!(h||h2),shell:!!(h||h2),failed:failed}})})
    });
  });
}
function cacheUrls(urls){
  return caches.open(V).then(function(c){
    var failed=[],n=0;
    return Promise.all((urls||[]).map(function(u){
      var same=new URL(u,self.location.href).origin===self.location.origin;
      return fetch(u,same?{cache:'reload'}:{mode:'no-cors'}).then(function(r){
        if(!r||!(r.ok||r.type==='opaque'))throw new Error('bad');
        n++;return c.put(u,r);
      }).catch(function(){failed.push(u)});
    })).then(function(){
      return c.match('index.html',{ignoreSearch:true}).then(function(h){return c.match('./',{ignoreSearch:true}).then(function(h2){
        var shell=!!(h||h2);return {ok:shell,shell:shell,cached:n,failed:failed}})});
    });
  });
}

self.addEventListener('install',function(e){e.waitUntil(precache().then(function(){return self.skipWaiting()},function(){return self.skipWaiting()}))});
self.addEventListener('activate',function(e){e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(n){return n!==V}).map(function(n){return caches.delete(n)}))}).then(function(){return self.clients.claim()}))});

function swr(req){return caches.open(V).then(function(c){return c.match(req).then(function(hit){
  var net=fetch(req).then(function(r){if(r&&(r.ok||r.type==='opaque'))c.put(req,r.clone());return r}).catch(function(){return hit});
  return hit||net})})}

self.addEventListener('fetch',function(e){
  var r=e.request;if(r.method!=='GET')return;var u=new URL(r.url);
  if(r.mode==='navigate'){
    e.respondWith(fetch(r).then(function(res){
      if(res&&res.ok){var cp=res.clone();caches.open(V).then(function(c){c.put('index.html',cp)})}
      return res;
    }).catch(function(){
      return caches.open(V).then(function(c){return c.match('index.html',{ignoreSearch:true}).then(function(h){return h||c.match('./',{ignoreSearch:true})}).then(function(h){return h||c.match(r,{ignoreSearch:true})})});
    }));
    return;
  }
  if(u.origin===self.location.origin||HOSTS.indexOf(u.hostname)>=0){e.respondWith(swr(r))}
});

self.addEventListener('message',function(e){
  var d=e.data||{},port=e.ports&&e.ports[0];
  function reply(x){try{if(port)port.postMessage(x)}catch(_){}}
  if(d.type==='precache'){e.waitUntil(precache().then(reply,function(){reply({ok:false,shell:false})}))}
  else if(d.type==='cache'){e.waitUntil(cacheUrls(d.urls).then(reply,function(){reply({ok:false,shell:false})}))}
  else if(d.type==='status'){e.waitUntil(caches.open(V).then(function(c){return c.match('index.html',{ignoreSearch:true}).then(function(h){reply({ok:!!h,shell:!!h,version:V})})}))}
});
self.addEventListener('notificationclick',function(e){e.notification.close();e.waitUntil(self.clients.matchAll({type:'window'}).then(function(l){if(l.length)return l[0].focus();return self.clients.openWindow('./')}))});
