/// <reference types="@sveltejs/kit" />
/// <reference no-default-lib="true"/>
/// <reference lib="esnext" />
/// <reference lib="webworker" />
// PWA 서비스 워커(specs/shell-auth AC-7) — 오프라인에서도 앱 셸이 뜬다. 데이터(mock)는 세션 메모리라 캐시하지 않는다.
// 알림(ADR-009 · IF-014): 표시는 showNotification 한 경로 — W2는 페이지가 registration.showNotification을 호출, push 이벤트는 W3 서버 발송용으로 휴면
import type { PushPayload } from '@boomeyes/domain';
import { build, files, version } from '$service-worker';

const sw = self as unknown as ServiceWorkerGlobalScope;
const CACHE = `boomeyes-${version}`;
const SHELL = '/';
// 루프 MP4(각 ~140KB)는 선캐시하지 않는다 — addAll은 원자적이라 설치 비용·실패 위험을 키운다. 첫 재생 때 아래 런타임 캐시가 담는다
const ASSETS = [...build.filter((f) => !/\.mp4$/.test(f)), ...files, SHELL];

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

sw.addEventListener('push', (event) => {
  // W3: 서버 Web Push 페이로드 = PushPayload(packages/domain/src/notify.ts)
  const p = event.data?.json() as PushPayload | undefined;
  if (!p) return;
  event.waitUntil(sw.registration.showNotification(p.title, { body: p.body, tag: p.tag, data: { url: p.url } }));
});

sw.addEventListener('notificationclick', (event) => {
  // 딥링크(specs/notifications AC-3): 열린 창이 있으면 focus + navigate, 없으면 새 창. 로그인이 없으면 앱 가드가 로그인으로 보낸다
  event.notification.close();
  const url = (event.notification.data as { url?: string } | undefined)?.url ?? '/';
  event.waitUntil(
    sw.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(async (list) => {
      const c = list[0];
      if (c) {
        await c.focus();
        return c.navigate(url);
      }
      return sw.clients.openWindow(url);
    }),
  );
});
