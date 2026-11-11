/* Apex Carts offline cache. Page/code: network-first. Libraries and assets: cache-first (versioned). */
const V='7.0.0',C='apex-carts-'+V,LIBS=["lib/three.min.js","lib/GLTFLoader.js","lib/RGBELoader.js","lib/SkeletonUtils.js","lib/BufferGeometryUtils.js","lib/peerjs.min.js"];
self.addEventListener('install',e=>{self.skipWaiting();e.waitUntil(caches.open(C).then(c=>c.addAll(['./','game.js?v='+V,'style.css?v='+V,...LIBS]).catch(()=>{})));});
self.addEventListener('activate',e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n!==C).map(n=>caches.delete(n)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',e=>{const r=e.request;if(r.method!=='GET')return;const u=new URL(r.url);if(u.origin!==location.origin)return;
  const stat=/\/(assets|lib)\//.test(u.pathname);
  if(stat){e.respondWith(caches.match(r,{ignoreSearch:true}).then(m=>m||fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(r,cp));}return res;})));return;}
  e.respondWith(fetch(r).then(res=>{if(res.ok){const cp=res.clone();caches.open(C).then(c=>c.put(u.pathname.endsWith('/')||u.pathname.endsWith('index.html')?'./':r,cp));}return res;}).catch(()=>caches.match(r,{ignoreSearch:true}).then(m=>m||caches.match('./'))));
});
