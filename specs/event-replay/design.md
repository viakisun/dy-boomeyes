# event-replay — 설계

## 데이터
- `Event`(ENT-19): `{id, kind, deviceId, at, windowSec, alertId, caseId, lanes: {general?, ai?, bodycam?, cpb?}, locked}` · `Alert.eventId?` · API `event(id)` · 시드 EV-001.

## 컴포넌트
- 4레인 타임라인(`section[aria-label="복기 타임라인"]`, 레인 `ol`) + 커서(키보드 ←/→) · `VideoPlayer` ×2(일반·AI, `capture`) · `KeyValueList`(헤더) · 잠금 `Badge`.

## 라우트
- `/b1/events/[event]` · capture PARAMS `[event]=EV-001` · B1-02 피드 행 "복기" 링크.
