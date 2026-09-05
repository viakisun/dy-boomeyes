# notifications — 설계

## 데이터
- `packages/domain/src/notify.ts`: `PushPayload{title, body, url, tag, severity}` · `toPushPayload(alert, surface)`. IF-014 `data`의 코드 원천.
- `apps/pwa/src/lib/push.svelte.ts`: 권한 상태 `unsupported|default|granted|denied` · `request()` · `notify(alert)`(SW ready → `showNotification`, dev는 `new Notification` 폴백).
- `apps/pwa/src/service-worker.ts`: `push`(휴면) · `notificationclick`(클라이언트 focus+navigate / `openWindow`).

## 컴포넌트
- 앱바 종 `IconButton`(권한 `default`면 점) · `BottomSheet`(알림 켜기 · 상태 문구, `capture` prop).

## 테스트
- e2e: `context.grantPermissions(['notifications'])` → 로그인 → 대본 알림 → `registration.getNotifications()` 1 · `data.url` 검증 · `?state=push` 시트 axe.
- Vitest: `toPushPayload` URL 규칙(표면별).
