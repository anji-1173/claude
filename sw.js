/* 全国波情報 Service Worker
   ネットワーク優先: オンラインなら常に最新のHTML/アイコンを取得し、
   取得できたものをキャッシュに保存。オフライン時のみキャッシュで応答する。
   これによりホーム画面アプリでも起動のたびに最新版が届く */
const CACHE = 'nami-info-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // 同一オリジンのGETのみ扱う(気象APIなどはブラウザに任せる)
  if (url.origin !== self.location.origin || e.request.method !== 'GET') return;
  e.respondWith(
    fetch(e.request)
      .then(res => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copy));
        }
        return res;
      })
      .catch(() => caches.match(e.request, { ignoreSearch: true }))
  );
});
