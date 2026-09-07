---
id: SPEC-video-basics
status: draft
wave: 1
screens: [A1-04, A1-05, B1-02M, A3-04, B2-03]
fr: [FR-004, FR-005, FR-034, FR-028, FR-030, FR-002, FR-007, FR-016, FR-022]
---
# video-basics — 현장 모니터 · 장비 상세 · 카메라 모달 완성

## 목적 · 역할
현장 안전관리자(`site-safety`)가 앱에서 현장 장비의 2채널 영상(일반 전방 · AI 붐 끝)과 장비 상태를 보고, 관제(`control`)의 카메라 모달(B1-02M)이 라이브 대체 재생·스냅샷·저장 소스 탭·헬스 배지로 완성된다. 데모 D1 장면 3 단계 2("실시간 영상(2채널) 확인 · 저장 영상 목록")와 장면 1(카메라 월 · 이상 장비 테이블 상단)의 화면이다. 검수 ACC-007·ACC-104(실시간 영상 표시), ACC-008·ACC-105(저장 영상 조회 구조)가 이 화면으로 시연된다. 영상 옵션은 현장 프로파일(`options.yaml` AX-1~4, DISC-028)에 따른다.

## 화면
| 코드 | 이름 | 라우트 | 상태 픽스처 |
|---|---|---|---|
| A1-04 | 현장 모니터 | `/a1/monitor` | `monitor` |
| A1-05 | 장비 상세 | `/a1/monitor/[device]` | `dev` |
| B1-02M | 카메라 영상 모달 | `/b1/dash?cam=[camera]` | `cam` |
| A3-04 | 장비 열람(본사) | `/a3/sites/[site]/devices` | `dev` |
| B2-03 | 현장 상세(본사 웹) | `/b2/sites/[site]` | `site` |

## 수용 기준
- **AC-1** Given `safety01`·SITE-001 장비 3(CPB-001~003)과 `monitor` 픽스처(CAM-1-1 오프라인 · CAM-2-2 AI 판단 불가) When 현장 모니터(A1-04) 로드 Then 장비별 2채널 타일(일반/AI)에 라이브·스냅샷·오프라인·AI 판단 불가 배지가 camera 상태기계 값 그대로 표시되고, 장애 채널은 "정상"으로 표시되지 않는다 [FR-004, FR-034]
- **AC-2** Given AI 카메라 이벤트(mock IF-015: 호스 주변 인원 접근, 스냅샷 + bbox) When 도착 Then 해당 타일에 경고 오버레이와 bbox가 그려지고 알림 피드에 즉시 등급으로 추가된다 [FR-028, FR-004]
- **AC-3** Given CPB-003 When 장비 상세(A1-05) 로드 Then 상단 탭 4(상태 · 서류 · 영상 · 부품, `?tab=`) 중 상태 탭에 텔레메트리(통신 · CAN · IO · 전압 342V · 단선 · 고장코드 E-021)가 보이고, 부품 탭에 수송관·필터 도달률과 임계 상태, 서류 탭에 장비 서류 완비율(FR-016)과 배정 운전자 교육 이수증 만료 임박 D-27(DOC-001), 영상 탭에 저장 영상 목록(프로파일 P-SD → 서버·SD 탭)과 카메라 타일이 보인다 — `plite` 픽스처는 영상 탭으로 열린다(1채널 · 서버만) [FR-002, FR-007, FR-016, FR-005]
- **AC-4** Given 라이브 채널 When 카메라 모달(B1-02M) Then 라이브 대체 루프 MP4가 재생되고 스냅샷 채널은 5~10초 주기로 갱신되며, 녹화 배지와 저장 소스 탭이 현장 프로파일대로(P-LITE 서버 / P-SD 서버·SD / P-NVR NVR — `options.profiles` AX-4) 구성된다 [FR-004, FR-005]
- **AC-5** Given 채널이 정지화면·흐림·가림·수신 끊김 When 타일·모달 표시 Then 상태 배지와 마지막 수신 시각이 보이고 "정상" 표시가 금지되며, 복구 후에는 누락분 재전송 표시가 나타난다 [FR-034]
- **AC-6** Given 현장 프로파일에 바디캠 옵션(AX-6) When A1-04 Then 바디캠 세션 탭 자리가 있고 목록은 스텁(W4에서 실연동)이다 [FR-030]
- **AC-7** Given `?state=monitor` `?state=dev` `?state=cam` When 캡처 Then `a1-04-monitor.png` `a1-05-dev.png` `b1-02m-cam.png`가 생성되고 시각 회귀 기준선이 된다 [FR-004]

- **AC-8** Given `hq01` When 현장 상세(B2-03, `/b2/sites/SITE-001`) Then 현장 장비 3의 상태와 2채널 카메라 월(프로파일 P-SD)이 열람되고 처리 버튼 대신 "확인 요청"(DISC-015)만 있어 누르면 이력·현장 알림이 생긴다 [FR-004, FR-022]
- **AC-9** Given `hq01` When 장비 열람(A3-04, `/a3/sites/SITE-001/devices`) Then A1-04와 같은 타일·헬스 배지가 열람 전용으로 보이고 AI 채널 표시는 현장 프로파일을 따른다 [FR-004, FR-034, FR-022]
- **AC-10** Given A1-05 영상 탭 When 카메라 목록 Then 채널마다 장착 위치(일반 본체·1번 관절 인근 · AI 마지막 강체·경사 시야)가 헬스 배지 아래에 보인다 [FR-004]

## 상태 픽스처
`screens.yaml` A1-04 `monitor` `plite` · A1-05 `dev`(상태 탭) `plite`(영상 탭) · B1-02M `cam` · A3-04 `dev` · B2-03 `site`. 픽스처 ID: CPB-003 · CAM-3-1(일반) · CAM-3-2(AI) · CAM-2-2(AI 판단 불가) · DOC-001(D-27). `monitor`는 CAM-1-1을 offline, CAM-2-2를 ai-unavailable로 변형한다.

## 비범위
HLS/WebRTC 실스트림(IF-006 L1~L3, W3) · 저장 영상 실재생(목록·타임라인 자리만, W4) · 바디캠 실연동(W4) · 본사·건설사 영상 실스트림(W3).
