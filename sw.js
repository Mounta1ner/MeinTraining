const CACHE='meintraining-v27-132cfa2cc6ee';
const ASSETS=["./assets/icon.png", "./css/style.css", "./data/exercises.json", "./data/plans.json", "./data/translations.json", "./icon-192.png", "./icon-512.png", "./index.html", "./js/app.js", "./js/features.js", "./js/loader.js", "./js/tracking-advanced.js", "./js/v27.js", "./manifest.webmanifest"];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('meintraining-v27-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request;if(request.method!=='GET')return;
 const url=new URL(request.url);
 if(url.origin!==self.location.origin||!url.pathname.startsWith(new URL(self.registration.scope).pathname))return;
 if(request.mode==='navigate')event.respondWith(fetch(request).then(response=>response).catch(()=>caches.match('./index.html')));
 else event.respondWith(caches.match(request).then(hit=>hit||fetch(request)));
});
