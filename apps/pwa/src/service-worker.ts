/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// PWA 서비스 워커(specs/shell-auth AC-7) — 오프라인에서도 앱 셸이 뜬다. 데이터(mock)는 세션 메모리라 캐시하지 않는다.
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `boomeyes-${version}`;
const SHELL = '/';
const ASSETS = [...build, ...files, SHELL];

sw.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => sw.skipWaiting()),
  );
});

sw.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => sw.clients.claim()),
  );
});

sw.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== sw.location.origin) return; // CARTO 타일·외부는 건드리지 않는다
  if (request.mode === 'navigate') {
    // 내비게이션: 네트워크 우선, 실패(오프라인)면 캐시된 셸(index.html fallback)
    event.respondWith(fetch(request).catch(async () => (await caches.match(SHELL)) ?? Response.error()));
    return;
  }
  // 자산·런타임 파일(_app/env.js · version.json 등): 캐시 우선, 없으면 네트워크 후 런타임 캐시에 저장 → 다음 오프라인에서도 제공
  event.respondWith(
    caches.match(request).then(
      (hit) =>
        hit ??
        fetch(request).then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        }),
    ),
  );
});
