# records-reports — 설계

## 데이터
- API `records(scope, {days})`: `cases[].history` · `inspections` · `attendance` · `docs[].history` · `rules.history`를 `{at, kind, actor, subjectId, text}`로 병합(append-only, 시각 역순). `report(scope, days)`: 현장별 요약 집계(mock 계산).

## 컴포넌트
- `Timeline` 재사용 + `Chip`(필터, 카탈로그 등록) · B2-04는 `Stat` 그리드 + `PageHeader` · ESC 핸들러(`b1/dash` 모달 패턴).

## 라우트 · 쿼리
- A1-06/A3-06 `?kind=task|inspection|attendance|doc` · B2-04 `?days=7|30`.

## 접근성 · 빈 상태
- 타임라인 `ol[aria-label="기록"]` · 0건 EmptyState · 보고 모드는 `role="document"` 열람 전용.
