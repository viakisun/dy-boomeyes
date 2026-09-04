---
id: ADR-003
title: 지도 엔진 — MapLibre GL + CARTO 베이스맵 (토큰 불요)
status: Proposed
date: 2026-09-05
supersedes: —
relates_to: [IF-013, FR-003]
---

# ADR-003 — MapLibre + CARTO (Proposed — 웨이브 1 B1-02 구현 후 Accepted)

## 맥락
B1-02·B2-02·A1 지도는 장비 위치(GPS 3~10m)·현장 마커·상태 색이 핵심이고 위성·3D는 필요 없다. 이전 프로토타입은 Leaflet+CARTO 타일. Mapbox는 토큰·과금이 따른다.

## 결정(안)
`packages/map`은 MapLibre GL JS + CARTO 라이트 베이스맵(IF-013). 마커는 DS 토큰(`domain.map.*`)으로 그린다. 국내 지도(카카오·네이버)는 현장 주소 검색이 필요해질 때 재검토.

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| Mapbox GL | 토큰·과금 · 참조 DS의 Mapbox는 채택 안 함 |
| Leaflet | 벡터 스타일·회전·클러스터 성능에서 열세 |
| 카카오/네이버 지도 | 키 발급·약관 · 목업 단계 불필요 |

## Rules(안)
- [ ] 타일 URL은 `PUBLIC_TILE_STYLE_URL` 환경변수. 캡처는 타일 로드 대기.
- [ ] 마커·클러스터 색은 `sys.color.domain.map.*`·`equipment.*`만.
