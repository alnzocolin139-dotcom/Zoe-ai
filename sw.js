const CACHE='zoe-ai-v1';
const ASSETS=['./','./index.html','./styles.css','./app.js','./manifest.webmanifest','./icons/zoe.svg'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS))));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k))))));
self.addEventListener('fetch',e=>{if(e.request.method==='GET')e.respondWith(caches.match(e.request).then(cached=>cached||fetch(e.request)));});
