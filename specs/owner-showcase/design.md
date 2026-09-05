# owner-showcase — 설계

## 데이터
- API `showcase(scope)`: `{daysWithoutAccident, inspectionRate, docCompleteness, alerts24h, sites[]}` mock 집계 · 마스킹 유틸 `mask(name|phone)`(domain).

## 컴포넌트
- `ShowcaseOverlay`(카탈로그: mask · watermark, 화면 루트 `data-theme="dark"`) · `CameraWall`(B4에서 추출) · `Stat` display-lg.

## 라우트
- `/b1/showcase` · ESC/클릭 → `/b1/dash` · B1-02 "쇼케이스" 버튼(기존).

## W2 B11 — 구현 메모
- `showcase(scope)`: 무사고 D+ = 스코프 현장 개설일(`period.from`) 기준 최솟값(사고 기록 없음, 시드 = 대전 B 63일) · 점검 제출률 = 24시간 안 점검 제출 호기 비율 · 서류 완비율 = valid·approved/전체 · 24시간 알림 · 현장 카드(마스킹된 안전관리자·임대인). 전이 부작용 없음.
- 마스킹 유틸 `packages/domain/src/mask.ts`(`maskName` 가운데 · `maskPhone` 가운데 4자리) — 정책은 DISC-031 미확정, 표시 규칙만.
- `ShowcaseOverlay`(카탈로그): 화면 루트 `data-theme="dark"` + `role="document"` + 워터마크(읽기 전용 · 마스킹 · DISC-031). 문서 루트는 건드리지 않는다(AC-1). 셸(사이드바·탑바)은 유지 — 전체화면 API는 비범위.
- B1-07: 지표 4 `Stat` + `CameraWall`(전 현장, AX-1) + 현장 카드 · 링크·버튼 0(카메라 타일은 `onopen` 없음) · `svelte:window` Esc + 루트 클릭 → `/b1/dash`. 장면 10 entry `/b1/showcase`(scenarios 파생) · 계정 safety01은 레이아웃이 control로 대체.
