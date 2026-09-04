---
id: ADR-003
title: 지도 엔진 — MapLibre GL + CARTO 베이스맵 (토큰 불요)
status: Accepted
date: 2026-09-05
supersedes: —
relates_to: [IF-013, FR-003]
---

# ADR-003 — MapLibre + CARTO (Accepted — 웨이브 0 B1-02 구현 확인)

## 맥락
B1-02·B2-02·A1 지도는 장비 위치(GPS 3~10m)·현장 마커·상태 색이 핵심이고 위성·3D는 필요 없다. 이전 프로토타입은 Leaflet+CARTO 타일. Mapbox는 토큰·과금이 따른다.

## 결정
`packages/map`은 MapLibre GL JS 5 + CARTO Positron 벡터 스타일(IF-013, 토큰·키 불요). 마커는 DOM(`maplibregl.Marker`)으로 그리고 색·글리프는 `sys.color.domain.equipment.*`(장비 상태 5종), 현장 핀은 `sys.color.domain.map.*`. 국내 지도(카카오·네이버)는 현장 주소 검색이 필요해질 때 재검토.

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| Mapbox GL | 토큰·과금 · 참조 DS의 Mapbox는 채택 안 함 |
| Leaflet | 벡터 스타일·회전·클러스터 성능에서 열세 |
| 카카오/네이버 지도 | 키 발급·약관 · 목업 단계 불필요 |

## 결과
- 얻는 것: 키 없는 배포 · 벡터 타일(라이트/다크 스타일 전환 가능) · DOM 마커라 토큰·접근성(`aria-label`·포커스) 그대로
- 잃는 것: WebGL 의존 — 헤드리스 캡처는 `idle` 대기 + `fullPage` 금지 규약이 필요했다(QA §3)
- 같은 현장 장비는 국가 줌에서 한 픽셀에 겹친다 → 화면 좌표 24px 안 묶음을 56px 간격으로 펼친다(`fan.ts`, 줌 종료 시 재계산). 클러스터링은 웨이브 1 이후
- 되돌리려면: `MapView` 인터페이스(`markers` · `onselect`)만 유지하면 엔진 교체는 패키지 내부

## Rules
- [x] 스타일 URL은 `MapView`의 `styleUrl` prop(기본 CARTO Positron). 환경변수 배선은 웨이브 3.
- [x] 마커·클러스터 색은 `sys.color.domain.map.*`·`equipment.*`만. 마커 CSS도 sys 토큰만(`tokens:lint`).
- [x] 캡처는 `[data-map-ready]`(idle) 대기, 웹 전체 화면은 뷰포트를 문서 높이로 늘려 찍는다.
