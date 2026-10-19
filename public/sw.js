const CACHE_NAME='kru-tools-pages-v5';
const BASE=new URL('./',self.registration.scope);
self.addEventListener('install',event=>{
 event.waitUntil(fetch(new URL('precache.json',BASE)).then(response=>response.json()).then(files=>caches.open(CACHE_NAME).then(cache=>cache.addAll(files.map(file=>new URL(file,BASE).href)))).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
 event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('kru-tools-pages-')&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin)return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();void caches.open(CACHE_NAME).then(cache=>cache.put(new URL('index.html',BASE).href,copy))}return response}).catch(()=>caches.match(new URL('index.html',BASE).href)));
  return;
 }
 event.respondWith(caches.match(request).then(cached=>cached??fetch(request).then(response=>{
  if(response.ok&&url.pathname.startsWith(new URL('./',BASE).pathname)){const copy=response.clone();void caches.open(CACHE_NAME).then(cache=>cache.put(request,copy))}
  return response;
 })));
});
