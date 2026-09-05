# records-reports — 설계

## 데이터
- API `records(scope, {days})`: `cases[].history` · `inspections` · `attendance` · `docs[].history` · `rules.history`를 `{at, kind, actor, subjectId, text}`로 병합(append-only, 시각 역순). `report(scope, days)`: 현장별 요약 집계(mock 계산).

## 컴포넌트
- `Timeline` 재사용 + `Chip`(필터, 카탈로그 등록) · B2-04는 `Stat` 그리드 + `PageHeader` · ESC 핸들러(`b1/dash` 모달 패턴).

## 라우트 · 쿼리
- A1-06/A3-06 `?kind=task|inspection|attendance|doc` · B2-04 `?days=7|30`.

## 접근성 · 빈 상태
- 타임라인 `ol[aria-label="기록"]` · 0건 EmptyState · 보고 모드는 `role="document"` 열람 전용.

## W2 B8 — 구현 메모
- `records(scope, {days=30, kind})`: 업무(`cases[].history`) · 점검(`inspections.submittedAt`, 호기 → 현장) · 출근(체크인/체크아웃 2행) · 서류(`docs[].history`)를 `RecordItem{at,kind,actor,subjectId,siteId,text,note}`로 병합해 시각 역순. 규칙·임대 이력은 전국 스코프(siteIds 없음)에서만. `report(scope, days)`: 현장별 `SiteReport`(장비·이상·업무 처리율·점검 제출률(기간 내 제출 호기 비율)·서류 완비율(docCompleteness 현장 행)·에스컬레이션(이력으로 셈 — `escalations()`의 전이 부작용 없음)·알림).
- 픽스처: 출근·점검 시드가 비어 `A1-06:rec`·`A3-06:rec`가 오늘 출근(−2h)·점검(−1h)을 채운다 · `B2-04:report`는 30일 창에만 드는 SITE-002 완료 업무(20일 전)·서류(CPB-004 제작증)·점검(10일 전)을 더해 7일/30일 차이를 보인다.
- 컴포넌트: `Chip`(카탈로그, filter variant · aria-pressed · count) 신설 — A1-02/A3-05의 `Tabs pill` 칩과 공존(후속 정리 후보) · `Timeline`에 `label`(기본 '이력' — 기록 화면은 '기록') · `items[].tag` 배지 · `newestFirst={false}`(이미 정렬됨).
- B2-04: 라우트 화면(모달 아님) — `svelte:window` Escape + 루트 바깥 클릭 → `/b2/map` · `role="document"` · PDF 버튼 disabled(API-014 2단계) · `?days=7|30`. 장면 5 e2e는 완료 확인 → 하단 내비 "기록"(앱 내 이동, 장면 db 유지) → 최상단 완료 행.
