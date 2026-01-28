/**
 * 오늘의 운세 - Service Worker
 * 오프라인 지원 및 캐싱
 */

const CACHE_NAME = 'oneulunse-v1';
const CACHE_URLS = [
  '/',
  '/index.html',
  '/css/main.css',
  '/js/app.js',
  '/js/fortune.js',
  '/js/fortuneData.js',
  '/manifest.json'
];

// 설치 이벤트
self.addEventListener('install', (event) => {
  console.log('[SW] Installing...');

  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Caching files...');
        return cache.addAll(CACHE_URLS);
      })
      .then(() => {
        console.log('[SW] Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[SW] Installation failed:', error);
      })
  );
});

// 활성화 이벤트
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating...');

  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => name !== CACHE_NAME)
            .map((name) => {
              console.log('[SW] Deleting old cache:', name);
              return caches.delete(name);
            })
        );
      })
      .then(() => {
        console.log('[SW] Activated successfully');
        return self.clients.claim();
      })
  );
});

// Fetch 이벤트 (네트워크 우선, 캐시 폴백)
self.addEventListener('fetch', (event) => {
  // HTML 요청은 네트워크 우선
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 성공하면 캐시 업데이트
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // 실패하면 캐시에서 제공
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/');
          });
        })
    );
    return;
  }

  // 정적 자산은 캐시 우선
  event.respondWith(
    caches.match(event.request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          // 캐시가 있으면 반환하고 백그라운드에서 업데이트
          fetch(event.request).then((networkResponse) => {
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, networkResponse);
            });
          }).catch(() => {});

          return cachedResponse;
        }

        // 캐시가 없으면 네트워크 요청
        return fetch(event.request)
          .then((response) => {
            // 유효한 응답만 캐시
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            const responseClone = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseClone);
            });

            return response;
          });
      })
  );
});

// 메시지 이벤트 (업데이트 알림)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
