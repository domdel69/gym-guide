/* Mode hors ligne : réseau d'abord pour les fichiers de l'app, cache en secours. Change VERSION à chaque publication. */
const VERSION='gym-guide-0.27';
const FILES=['./','index.html','styles.css','data-ex.js','data-sessions.js','version.js','store.js','app.js','views.js','manifest.webmanifest','icons/icon-192.png','icons/icon-512.png','icons/apple-touch-icon.png','img/stretch/chest-0.jpg','img/stretch/chest-1.jpg','img/stretch/shoulder-0.jpg','img/stretch/shoulder-1.jpg','img/stretch/child-0.jpg','img/stretch/child-1.jpg','img/stretch/side-0.jpg','img/stretch/side-1.jpg','img/stretch/reach-0.jpg','img/stretch/reach-1.jpg','img/stretch/hams-0.jpg','img/stretch/hams-1.jpg','img/stretch/kneechest-0.jpg','img/stretch/kneechest-1.jpg','print/seance-a.pdf','print/seance-b.pdf','print/seance-c.pdf','print/routine-maison.pdf'];
self.addEventListener('install',e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()))});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k!==VERSION).map(k=>caches.delete(k)))).then(()=>self.clients.claim()))});
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin)return;
  /* 0.27 : seules les réponses complètes (200) vont au cache ; la page d’accueil ne sert de secours qu’aux navigations. */
  e.respondWith(fetch(e.request,{cache:'no-store'}).then(r=>{if(r.ok&&r.status===200&&r.type==='basic'){const c=r.clone();e.waitUntil(caches.open(VERSION).then(x=>x.put(e.request,c)))}return r})
    .catch(()=>caches.match(e.request).then(m=>m||(e.request.mode==='navigate'?caches.match('index.html'):Response.error()))));
});
