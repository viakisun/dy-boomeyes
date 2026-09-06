# notifications — 작업 (W2 B13)

| # | 작업 | DoD | Refs |
|---|---|---|---|
| 1 | `notify.ts` + Vitest · SW 핸들러 · `push.svelte.ts` | `[FR-011]` 단위 · SW 등록 e2e 유지 | FR-011 |
| 2 | 종 아이콘 · 시트 · `A1-02:push` 픽스처 · e2e(granted → OS 알림 · denied 문구) | AC-1~4 · 캡처 1 | SCR-A1-02 SCR-A2-02 SCR-A3-02 |

완료(W2 B13 · ADR-009): `packages/domain/src/notify.ts`(`toPushPayload` Vitest 2) · SW `push`(휴면)·`notificationclick` · `apps/pwa/src/lib/push.svelte.ts` · 앱바 종(`IconBell`, default면 점) · 시트(권한 4상태 문구) · `A1-02:push` · e2e 2(`grantPermissions` → 장면 1 알림 → `getNotifications()` · headless 거부 → denied 안내 · axe). AC-4(에스컬레이션 → A3-02 딥링크)는 `toPushPayload(alert, 'a3')` 단위로 고정 — 본사 계정 실시간 에스컬레이션 이벤트는 W3.
