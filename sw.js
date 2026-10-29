/* Mode hors ligne : réseau d'abord pour les fichiers de l'app, cache en secours. Change VERSION à chaque publication. */
const VERSION='gym-guide-0.12';
const FILES=['./','index.html','styles.css','data-ex.js','data-sessions.js','version.js','store.js','app.js','views.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','print/seance-a.pdf','print/seance-b.pdf','print/seance-c.pdf','print/routine-maison.pdf'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{const c=r.clone();caches.open(VERSION).then(x=>x.put(e.request,c));return r}).catch(()=>caches.match(e.request).then(m=>m||caches.match('index.html'))));
});
