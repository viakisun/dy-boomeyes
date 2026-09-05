---
id: ADR-002
title: 트랜스포트 수준 목(ApiClient · RealtimeClient · Clock 인메모리 구현), MSW 불채택
status: Accepted
date: 2026-09-05
supersedes: —
relates_to: [IF-009, IF-010, IF-006]
---

# ADR-002 — 트랜스포트 수준 목 (Accepted — 웨이브 0 구현 확인)

## 맥락
목업은 배포 가능한 앱 골격이어야 하고, 웨이브 3에서 실 API·WS·MQTT로 전환된다. PWA의 서비스 워커와 네트워크 인터셉터(MSW)는 스코프가 충돌한다.

## 결정
인터페이스는 `packages/domain/src/api.ts`(`ApiClient` · `RealtimeClient` · `Clock`)에 두고, `packages/mock`이 인메모리 구현(시드 · 상태기계 · DemoClock · `?state=` 픽스처 · `?capture=1` 시각 고정)을 제공한다. 앱은 조립 지점(`+layout.ts`의 `bootMock`)에서만 mock을 import하고, 화면은 `data.api`·`data.clock`만 쓴다. 영상 소스(`MediaSource`)는 웨이브 1에 같은 규칙으로 추가하고, `mock|http` 전환 스위치는 웨이브 3(실 인입)에서 넣는다.

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| MSW | SW 스코프 충돌 · 오프라인 큐 시뮬레이션 어려움 |
| 화면별 하드코딩 데이터 | 상태기계·픽스처 재사용 불가, 캡처 상태 재현 불가 |

## 결과
- 얻는 것: 화면 코드가 트랜스포트를 모른다 · 상태 픽스처 55종을 URL만으로 재현 · 캡처·e2e가 결정적(DemoClock)
- 잃는 것: mock 구현이 도메인 규칙을 일부 중복한다(상태기계는 `packages/domain`을 호출해 최소화)
- 되돌리려면: `packages/mock`을 http 구현으로 교체 — 화면 변경 0

## Rules
- [x] 화면은 인터페이스만 의존. `@boomeyes/mock` import는 앱 조립 지점(`+layout.ts`)에서만(ESLint 경계 규칙).
- [x] `?state=`·`?capture=1`은 mock 구현이 해석(시각 고정 `meta.fixed_clock`). 화면은 `new Date()` 대신 `data.clock`.
- [x] 브라우저 `Date`·`Math.random` 프록시(캡처 도구의 init script)는 금지 — MapLibre 로드를 막는다(QA §3).
- [x] 최하층(`packages/domain`) 런타임 의존 추가는 두 앱 번들에 실린다 — W1 `yaml`(프로토콜 업로드 파싱)은 domain에 올리지 않고 `apps/web`에만 둔다(PWA 미사용 · 화면이 파싱해 객체를 API에 넘김).
