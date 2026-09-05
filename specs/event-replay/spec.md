---
id: SPEC-event-replay
status: draft
wave: 2
screens: [B1-08]
fr: [FR-033, FR-024]
---
# event-replay — 이벤트 복기 (W2 = 구조)

## 목적 · 역할
event_id와 공통 시각으로 일반 CCTV · AI CCTV · 바디캠 · CPB 상태/부품 이력 4소스를 동기 재생한다(FR-033 · NFR-014 · IF-018). W2는 구조: ENT-19 스텁 EV-001(AL-001 · C-105 연결) · 4레인 타임라인 + 공통 커서 · 보존 잠금 배지. 실영상 seek·채번(DISC-039)은 2단계(DISC-044).

## 화면
| 코드 | 이름 | 라우트 | 상태 픽스처 |
|---|---|---|---|
| B1-08 | 이벤트 복기 | `/b1/events/[event]` | `default` |

## 수용 기준
- **AC-1** Given EV-001(E-021 · CPB-003 · t0 = 알림 시각 · 창 ±60초) When 이벤트 복기(B1-08) 로드 Then 헤더에 event_id·종류·장비·t0·연결된 알림(AL-001)·업무(C-105)가 보이고 4레인(일반 CCTV · AI CCTV · 바디캠 · CPB 상태/부품 이력)이 공통 시각축 위에 그려진다 [FR-033, FR-024]
- **AC-2** Given 커서 When ←/→(1초) 또는 레인 클릭으로 이동 Then 4레인의 표시 시각이 동일하게 바뀌고, 소스가 없는 레인(바디캠 없음 · 부품 이력 없음)은 "없음"으로 표기된다 [FR-033]
- **AC-3** Given 긴급 이벤트 When 표시 Then 원본 보존 잠금 배지(NFR-015)가 보이고 삭제·편집 액션이 없다; 없는 event_id는 404 EmptyState다 [FR-033]
- **AC-4** Given B1-02 알림 피드의 E-021 행 When "복기" 링크 Then `/b1/events/EV-001`로 이동한다(nav B1-02→B1-08) [FR-024]

## 상태 픽스처
`B1-08:default` — EV-001. 영상 레인은 루프 클립(`@boomeyes/video` assets) + 시각 오버레이(seek 없음, "목업" 표기).

## 비범위
event_id 채번·공통 시각 원천(DISC-039) · 실 세그먼트 조회(API-018 · IF-008/017/018) · ±1초 동기 검증(NFR-014) · 바디캠 실연동(W4).
