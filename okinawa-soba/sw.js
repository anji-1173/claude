// 沖縄そば巡りの旅 — Service Worker（ネットワーク優先）
// バージョンを上げると新SWとして再インストールされ、古いキャッシュを掃除する。
// デプロイのたびに CACHE_VERSION を更新する（自動更新スクリプトが差し替える）。
const CACHE_VERSION = '2026.09.17.1';
const CACHE = 'okinawa-soba-' + CACHE_VERSION;

self.addEventListener('install', (e) => {
  // 新SWをすぐ有効化（待機させない）
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

// ネットワーク優先：オンラインなら常に最新を取得し、コピーをキャッシュ。
// オフライン時のみキャッシュから返す（オフライン閲覧用のフォールバック）。
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return; // 外部（フォント等）はそのまま
  e.respondWith((async () => {
    try {
      const fresh = await fetch(req);
      if (fresh && fresh.status === 200 && fresh.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(req, fresh.clone());
      }
      return fresh;
    } catch (err) {
      const cached = await caches.match(req);
      if (cached) return cached;
      // ナビゲーション要求のオフライン時はトップを返す
      if (req.mode === 'navigate') {
        const top = await caches.match('./');
        if (top) return top;
      }
      throw err;
    }
  })());
});

// ページからの手動更新指示
self.addEventListener('message', (e) => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
