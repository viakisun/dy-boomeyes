# control-dashboard — 기술 설계

## 레이아웃 (WebShell · compact)
콘텐츠 3열: 좌 지도(`MapView` 60%) · 우 상단 KPI(`Stat`×4) + 알림 피드(`List` + `StatusDot`/severity) · 하단 이상 장비 `DataTable`(행 36) · 카메라 월(`CameraWall`, 장비 선택 시 2채널 `CameraTile`). 인스펙터(360) = `EquipmentCard` + `TelemetryStrip`.

## 컴포넌트 · 토큰
`MapView` `MapMarker`(status=domain.equipment) · `Stat` · `DataTable` · `StatusPill` · `CameraWall`/`CameraTile`(status=camera 상태기계) · `VideoPlayer`(source mp4/snapshot · bbox) · `Dialog`(B1-02M) · `Tabs`(저장 소스) · `Badge`. cmp: `cmp.table.*` `cmp.card.*` `cmp.overlay.dialog.*`.

## 데이터
- `ENT-02` 장비 · `ENT-12` 텔레메트리(최신 상태) · `ENT-08` 알림 · `ENT-04` 카메라(유형 general/ai · ingest_type · recording_mode) · `ENT-01` 현장(video_profile).
- mock: `packages/mock` 시드(CPB-001~005, 현장 2, 카메라 장비당 2) · `RealtimeClient` mock이 알림 스트림 재생(demo-scripts 장면 1).
- 상태기계: `equipment`(normal→caution→fault→maintenance→normal, *→offline) · `camera`(live/snapshot/recording/offline/ai-unavailable) — `MACHINES`(ids.ts).

## 라우트·쿼리
`/b1/dash` · `?cam=<camera_id>` 모달 · `?state=` 픽스처 · `?capture=1`.

## 프로파일 → 피처플래그
`site.video_profile`(P-LITE/P-SD/P-NVR, `options.yaml profiles`) → 저장 소스 탭 구성 · 스냅샷 주기 · SD 회수 버튼 · NVR 타임라인 노출.

## 오프라인·오류·빈 상태
실시간 끊김 → 피드 상단 Banner(neutral "실시간 갱신 중단, 마지막 수신 hh:mm") · 지도 타일 실패 → 라이트 폴백 스타일 · 장비 0건 → EmptyState.

## 접근성
마커·타일 상태는 색 + 글리프 + `aria-label` · 테이블 행 포커스·Enter로 인스펙터 · 모달 포커스 트랩·Esc.

## 열린 질문
DISC-040(기종) · DISC-029(수신 경로 → 배지 3종 표기) · DISC-037(장비 대수 정합 — 시드는 5대).
