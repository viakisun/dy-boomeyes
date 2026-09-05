---
id: ADR-009
title: PWA 알림 — 서비스 워커 표시 경로 단일화 · 목업은 로컬 트리거 · 서버 푸시는 W3
status: Proposed
date: 2026-09-05
supersedes: —
relates_to: [DISC-036, IF-014, FR-011, FR-010]
---

# ADR-009 — PWA 알림 (Proposed — 사용자 승인 후 B13 착수)

## 맥락
IF-014(Web Push 딥링크)는 1단계 요구지만 알림 채널(푸시·문자·전화)은 DISC-036으로 미결이고, 정적 SPA(ADR-007)에는 구독을 저장·발송할 서버가 없다. W1 앱은 인앱 배지·토스트만 있다.

## 결정
알림 표시 경로를 서비스 워커 `showNotification` 하나로 통일하고, W2 목업은 실시간 mock(IF-010) 이벤트를 트리거로 로컬에서 OS 알림을 만든다. 페이로드 계약 `PushPayload{title, body, url, tag, severity}`(`packages/domain/src/notify.ts`)를 IF-014 `data`의 코드 원천으로 삼는다. 서버 발송·VAPID·구독 저장은 W3, 그것도 DISC-036이 푸시를 포함할 때만.

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| 인앱 전용(배지·토스트 유지) | 이미 W1에 있음 · "푸시 딥링크"(과업 4.3.1/4.3.2)를 시연하지 못함 |
| 실 Web Push(VAPID + 소형 서버) | ADR-007 정적 배포 위반 · INTENT 비목표(서버) · 채널 미결 상태에서 서버 선행 |

## 결과
- 얻는 것: 서버 0으로 OS 알림·권한 UX·딥링크 검증 · W3는 트리거만 교체.
- 잃는 것: iOS 미설치 PWA는 알림 API 없음(`unsupported` 안내) · headless는 권한 자동 거부(e2e는 `grantPermissions`).
- 되돌리려면: SW `push`/`notificationclick` 핸들러와 `push.svelte.ts`(≈150줄) 제거, 인앱만 남김.

## Rules
- [ ] 앱은 `new Notification`을 직접 쓰지 않는다(dev 폴백 제외) — 표시는 SW 경로.
- [ ] 권한은 사용자 행동(종 아이콘 → 시트)에서만 요청한다. 자동 프롬프트 금지.
- [ ] 딥링크 URL 규칙은 `toPushPayload()` 단위 테스트로 고정한다.

사용자 결정 필요: 목업 수준(로컬 알림) 승인 · 종 아이콘을 셸 앱바에 두는 것(PWA 캡처 전량 갱신).
