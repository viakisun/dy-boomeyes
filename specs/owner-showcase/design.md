# owner-showcase — 설계

## 데이터
- API `showcase(scope)`: `{daysWithoutAccident, inspectionRate, docCompleteness, alerts24h, sites[]}` mock 집계 · 마스킹 유틸 `mask(name|phone)`(domain).

## 컴포넌트
- `ShowcaseOverlay`(카탈로그: mask · watermark, 화면 루트 `data-theme="dark"`) · `CameraWall`(B4에서 추출) · `Stat` display-lg.

## 라우트
- `/b1/showcase` · ESC/클릭 → `/b1/dash` · B1-02 "쇼케이스" 버튼(기존).
