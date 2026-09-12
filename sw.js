/* 鸿鹄对账软件 · Service Worker（自动更新版）
   - HTML/导航：网络优先（保证拿到最新版），断网回退缓存
   - 静态资源（js/png/manifest）：缓存优先
   - 新版本 install 后立即接管；页面收到 controllerchange 会自动刷新
*/
const CACHE = 'honghu-v6';
const SHELL = ['app.html', 'scan.html', 'index.html', 'manifest.json', 'manifest-scan.json', 'icon-192.png', 'icon-512.png'];

self.addEventListener('install', function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return Promise.all(SHELL.map(function(u){ return c.add(u).catch(function(){}); })); }));
});

self.addEventListener('activate', function(e){
  e.waitUntil(
    caches.keys().then(function(ks){ return Promise.all(ks.filter(function(k){ return k!==CACHE; }).map(function(k){ return caches.delete(k); })); })
      .then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener('message', function(e){
  if(e.data === 'SKIP_WAITING'){ self.skipWaiting(); }
});

self.addEventListener('fetch', function(e){
  var req = e.request;
  if (req.method !== 'GET') return;
  var u = new URL(req.url);
  if (u.origin !== location.origin) return;
  if (/\/(load|lanip|scanAdd|save)/.test(u.pathname)) return;

  var isDoc = req.mode === 'navigate' || /\.html?$/i.test(u.pathname) || /(?:^|\/)(index|app|scan)$/.test(u.pathname) || u.pathname.slice(-1) === '/';
  if (isDoc) {
    e.respondWith(
      fetch(req).then(function(resp){
        try{ var cp = resp.clone(); caches.open(CACHE).then(function(c){ c.put(req, cp); }); }catch(_){}
        return resp;
      }).catch(function(){
        return caches.match(req).then(function(r){ return r || caches.match('app.html') || caches.match('scan.html') || caches.match('index.html'); });
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
