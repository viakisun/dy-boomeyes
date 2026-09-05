# control-dashboard — 작업 (W0 관통 → W1 완성)

| # | 작업 | DoD | Refs |
|---|---|---|---|
| 1 | `packages/domain` 상태기계 equipment·camera(+task) 구현 · Vitest `[FR-002]` `[FR-034]` | 전이 표 100% 테스트 | ENT-02 ENT-04 |
| 2 | mock 시드(장비 5·현장 2·카메라 10·알림 8·텔레메트리 최신) + demo-scripts 장면 1 | `?state=dash` 재현 | FR-002 FR-011 |
| 3 | `packages/map` MapLibre + CARTO · `MapMarker` 상태 5종 | AC-1 · 타일 대기 캡처 | ADR-003 FR-003 |
| 4 | B1-02 레이아웃(KPI · 피드 · 이상 장비 테이블 · 인스펙터) | AC-2 · AC-3(mock realtime 도착 → 피드·토스트, 클릭 → B1-03 `?case=`; 업무 상세는 W1 task-escalation) · `b1-02-dash.png` | B1-02 |
| 5 | `packages/video` 루프 MP4·스냅샷 폴러·bbox SVG · `CameraTile`/`CameraWall`(wall 강제) | AC-4 · AC-7 | FR-004 FR-034 |
| 6 | B1-02M 모달(채널 칩·전환·녹화 배지·저장 소스 탭·프로파일 플래그) | AC-5 · AC-6 · `b1-02m-cam.png` | B1-02M FR-005 |
| 7 | e2e: 로그인→대시보드→모달→닫기 · axe · 시각 회귀 | 게이트 6 녹색 — `tests/e2e/web-dashboard.spec.ts`·`web-a11y.spec.ts` W0 선행(시각 회귀는 W1) | QA |

W0 Exit는 1~4 + 6의 골격(모달 열림)까지. 5·6 완성과 7은 W1.
