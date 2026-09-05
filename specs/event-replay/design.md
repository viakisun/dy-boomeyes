# event-replay — 설계

## 데이터
- `Event`(ENT-19): `{id, kind, deviceId, at, windowSec, alertId, caseId, lanes: {general?, ai?, bodycam?, cpb?}, locked}` · `Alert.eventId?` · API `event(id)` · 시드 EV-001.

## 컴포넌트
- 4레인 타임라인(`section[aria-label="복기 타임라인"]`, 레인 `ol`) + 커서(키보드 ←/→) · `VideoPlayer` ×2(일반·AI, `capture`) · `KeyValueList`(헤더) · 잠금 `Badge`.

## 라우트
- `/b1/events/[event]` · capture PARAMS `[event]=EV-001` · B1-02 피드 행 "복기" 링크.

## W2 B10 — 구현 메모(구조 · DISC-044)
- 타입 이름은 DOM `Event`와 충돌을 피해 `ReplayEvent`(ENT-19) · `ReplayLane{source, available, cameraId?, note?, segments[], markers[]}` · `Alert.eventId?`. 시드 EV-001: t0 = AL-001 시각(t−20s) · 창 ±60초 · 일반(CAM-3-1)·AI(CAM-3-2) 세그먼트 메타 + 마커 · 바디캠 `available:false`(P-SD 바디캠 A, 세션 연동 W4) · CPB 레인 마커(전압 378→351→342V · E-021 · AL-001/C-105) · `locked:true`.
- `event(id)`: 창 안의 부품 이력(B9 `partEvents`)을 CPB 레인 마커로 합친다 — 시드 P-004 점검(2일 전)은 창 밖이라 "부품 이력 없음 — 창 ±60초 안에 점검·교체 없음". 없으면 `undefined` → 페이지가 404 EmptyState(`+error.svelte` 없음).
- 커서: `cursor`(t0 기준 초) 하나를 4레인이 읽는다 — `←/→` 1초(window keydown, 입력 요소 제외) · `input[type=range]` · 레인 클릭(위치 → 초). 영상은 `VideoPlayer` ×2(루프 클립, 표시 시각 오버레이만 — seek 없음 "목업" 표기).
- B1-02 피드: `eventId`가 있는 알림 행에 형제 `<a>` "복기 ›"(기존 행 `<a>` 안에 중첩하지 않음 — `web-dashboard` e2e의 `rows.first().locator('a')`는 실시간 알림 행이라 영향 없음).
- 비범위 유지: 채번·공통 시각 원천(DISC-039) · 실 세그먼트 조회(API-018) · ±1초 동기 검증(NFR-014, 표기만) · 바디캠 실연동(W4).
