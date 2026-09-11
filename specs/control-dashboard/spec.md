---
id: SPEC-control-dashboard
status: draft
wave: 0
screens: [B1-02, B1-02M]
fr: [FR-002, FR-003, FR-004, FR-006, FR-011, FR-034, FR-039]
---
# control-dashboard — 관제 대시보드 · 카메라 영상 모달

## 목적 · 역할
운영사 관제 담당(`control`)이 전국 CPB의 상태·위치·알림·영상을 한 화면에서 보고, 이상 장비를 상단에서 잡는다. 데모 D1 장면 1·4, D2의 카메라 월이 이 화면이다.

## 화면
| 코드 | 이름 | 라우트 | 상태 픽스처 |
|---|---|---|---|
| B1-02 | 관제 대시보드 | `/b1/dash` | `dash`(기본) · `show`(쇼케이스 진입 전) … `screens.yaml` |
| B1-02M | 카메라 영상 모달 | `/b1/dash?cam=[camera]` | `cam` |

## 수용 기준
- **AC-1** Given 시드 장비(CPB-001~005, 상태 normal/caution/fault/offline/maintenance) When 대시보드 로드 Then 지도 마커가 `domain.equipment.*` 색 + 글리프로 상태 5종을 구분하고 클릭 시 장비 요약이 인스펙터에 뜬다 [FR-003, FR-002]
- **AC-2** Given 동일 시드 When 로드 Then KPI 4(가동·주의·고장·통신 두절)와 이상 장비 테이블이 상태 순으로 정렬되고 E-021(CPB-003)이 최상단이다 [FR-002, FR-006]
- **AC-3** Given 알림 피드 When 새 알림(severity critical/warning/info) 도착(mock realtime) Then 피드 상단에 severity 색·아이콘으로 추가되고 클릭 시 해당 업무(C-105)로 이동한다 [FR-011]
- **AC-4** Given 카메라 월 타일(장비당 2채널) When 채널 상태가 live/snapshot/offline/ai-unavailable Then 타일 배지가 `domain.video.*`·`camera` 상태기계 값을 그대로 표시하고, 장애 채널은 "정상"으로 표시되지 않는다 [FR-004, FR-034]
- **AC-5** Given 타일 클릭 When 모달(B1-02M) 열림 Then 채널 칩 2(일반/AI)·라이브/스냅샷 전환·녹화 배지·저장 소스 탭(서버/SD/NVR — 프로파일별)·bbox 오버레이(AI 채널 클립)가 있고 Esc로 닫힌다 [FR-004, FR-005]
- **AC-6** Given `?state=cam` When 캡처 Then `[data-capture-dialog]`가 모달을 클립하고 `b1-02m-cam.png`가 시각 회귀 기준과 일치한다 [FR-004]
- **AC-7** Given `data-theme="dark"` When 카메라 월만 wall 강제 Then 타일 영역은 다크, 나머지 대시보드는 현재 테마다 [FR-004]
- **AC-8** Given 인스펙터에서 장비 선택 When 두절 장비(CPB-004) Then TelemetryStrip 수신 상태 줄이 "두절 · 마지막 HH:MM"(warning)이고 마지막 값(전압·단선·고장코드)을 남기며, 연동 안 된 계측(CPB-005 단선)은 "미연동"으로 보인다 — GPS·수송관·필터 행은 그대로 [FR-034, FR-002]
- **AC-9** Given 소유주 `owner01`(B1 주인, ADR-012) 또는 `control01` When 대시보드 로드 Then KPI 첫 줄 "보유 호기"에 보유 호기 수·가동률(보유 호기 평균 · 작업 시간대 기준)·오늘 타설량(합계 m³)·타설 중 대수 4장이 `data-ref="DISC-055"`로 보이고 상태 KPI 5장은 둘째 줄이다; 소유주 세션은 `Scope.ownerId`로 보유 호기만 읽는다(시드는 전 장비 OWN-001이라 5대) · 사이드바 표면명은 "소유주 운영 WEB" [FR-039, FR-002]
## 상태 픽스처
`screens.yaml` B1-02 states(`dash` `show` …) · B1-02M `cam`. 추가 제안: `dash-quiet`(이상 0건) · `dash-offline`(CPB-004 두절) — `/ssot`로 등록 후 사용.

## 비범위
HLS/WebRTC 실스트림(루프 MP4·스냅샷으로 대체) · 저장 영상 타임라인·구간 스크럽(W4 — 목록의 재생은 대체 클립) · 지도 주소 검색.
