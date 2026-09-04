---
id: ADR-002
title: 트랜스포트 수준 목(ApiClient · RealtimeClient · MediaSource 인메모리 구현), MSW 불채택
status: Proposed
date: 2026-09-05
supersedes: —
relates_to: [IF-009, IF-010, IF-006]
---

# ADR-002 — 트랜스포트 수준 목 (Proposed — 웨이브 0 구현 후 Accepted)

## 맥락
목업은 배포 가능한 앱 골격이어야 하고, 웨이브 3에서 실 API·WS·MQTT로 전환된다. PWA의 서비스 워커와 네트워크 인터셉터(MSW)는 스코프가 충돌한다.

## 결정(안)
`packages/api-client`의 `ApiClient`, `packages/realtime`의 `RealtimeClient`, `packages/video`의 `MediaSource`를 인터페이스로 두고 `packages/mock`이 인메모리 구현(시드 픽스처·상태기계·DemoClock)을 제공한다. `PUBLIC_DATA_MODE=mock|http`로 전환.

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| MSW | SW 스코프 충돌 · 오프라인 큐 시뮬레이션 어려움 |
| 화면별 하드코딩 데이터 | 상태기계·픽스처 재사용 불가, 캡처 상태 55개 재현 불가 |

## Rules(안)
- [ ] 화면은 인터페이스만 의존. `mock` import는 앱 조립 지점(`+layout.ts`)에서만.
- [ ] `?state=`·`?capture=1`은 mock 구현이 해석(시각 고정 `meta.fixed_clock`).
