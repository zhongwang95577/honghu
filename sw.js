/* 楦块箘瀵硅处杞欢 路 Service Worker
   - 椤甸潰(HTML)锛氱綉缁滀紭鍏?鈫?淇濊瘉鎷垮埌鏈€鏂帮紱绂荤嚎鏃跺洖閫€缂撳瓨锛堟敮鎸佲€滃姞鍒颁富灞忓箷鈥濆悗鏃犵數鑴戜篃鑳藉紑锛?   - 鍥炬爣/娓呭崟绛夐潤鎬侊細缂撳瓨浼樺厛
   - 鎺ュ彛锛?load /lanip /scanAdd /save锛夛細涓嶇紦瀛橈紝濮嬬粓璧扮綉缁?*/
const CACHE = 'honghu-v4';
const SHELL = ['app.html', 'scan.html', 'index.html', '/index.html', '/manifest.json', '/manifest-scan.json', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return Promise.all(SHELL.map(function(u){ return c.add(u).catch(function(){}); })); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){return k!==CACHE;}).map(function(k){return caches.delete(k);})); }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var u = new URL(req.url);
  if (u.origin !== location.origin) return;
  if (/^\/(load|lanip|scanAdd|save)/.test(u.pathname)) return;
  var isDoc = req.mode === 'navigate' || /\.html?$/.test(u.pathname) || u.pathname === 'index.html' || u.pathname === 'app.html' || u.pathname === 'scan.html';
  if (isDoc) {
    e.respondWith(
      fetch(req).then(function(resp){
        try{ var cp = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }catch(_){}
        return resp;
      }).catch(function(){
        return caches.match(req).then(function(r){ return r || caches.match('app.html') || caches.match('scan.html'); });
      })
    );
  } else {
    e.respondWith(
      caches.match(req).then(function(hit){
        if (hit) return hit;
        return fetch(req).then(function(resp){ if (resp && resp.ok) { try{ var cp = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }catch(_){} } return resp; });
      })
    );
  }
});
