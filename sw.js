/**
 * 오늘의 운세 - Service Worker
 * 오프라인 지원 및 캐싱
 */

const CACHE_NAME = 'oneulunse-v3';
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
  const url = new URL(event.request.url);

  // http/https가 아닌 요청은 무시 (chrome-extension 등)
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // 외부 도메인 요청은 네트워크만 사용
  if (url.origin !== location.origin) {
    return;
  }

  // HTML 요청 (네비게이션) - SPA 라우팅 지원
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // 404 응답이면 index.html 반환 (SPA 라우팅)
          if (response.status === 404) {
            return caches.match('/index.html').then((cachedIndex) => {
              return cachedIndex || response;
            });
          }
          // 성공하면 캐시 업데이트
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // 네트워크 실패시 캐시된 index.html 반환 (SPA)
          return caches.match('/index.html').then((cachedIndex) => {
            return cachedIndex || caches.match('/');
          });
        })
    );
    return;
  }

  // 정적 자산은 네트워크 우선으로 변경 (최신 파일 우선)
  event.respondWith(
    fetch(event.request)
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
      })
      .catch(() => {
        // 네트워크 실패시 캐시 사용
        return caches.match(event.request);
      })
  );
});

// 메시지 이벤트 (업데이트 알림)
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
