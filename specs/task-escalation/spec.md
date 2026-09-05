---
id: SPEC-task-escalation
status: draft
wave: 1
screens: [A1-02, A1-03, B1-03, B1-04, A1-08, A3-02, A3-05]
fr: [FR-008, FR-009, FR-011, FR-006, FR-002, FR-017, FR-018, FR-010, FR-024]
---
# task-escalation — 업무함 · 업무 상세 · 운영사 수신함 · 에스컬레이션

## 목적 · 역할
이벤트(고장·서류·점검·통신)가 업무(ENT-06)로 생성되어 현장 안전관리자(`site-safety`)가 앱 업무함에서 접수·처리하고, 운영사 관제(`control`)가 신청·요청을 수신함에서 승인하며, 미접수 업무는 임계 시간 뒤 에스컬레이션된다. 데모 D1 장면 3(현장 접수)·4(수신함 처리)·6(에스컬레이션)의 화면이다. W1에서는 A1-02·A1-03·B1-03·B1-04, W2에서 A1-08·A3-02·A3-05를 같은 규칙으로 확장한다(B3-03 현장 웹 업무는 W4).

## 화면
| 코드 | 이름 | 라우트 | 상태 픽스처 |
|---|---|---|---|
| A1-02 | 업무함 | `/a1/inbox` | `inbox`(기본) · `filter` |
| A1-03 | 업무 상세 | `/a1/inbox/[case]` | `case` |
| B1-03 | 수신함 | `/b1/inbox` | `inbox` |
| B1-04 | 에스컬레이션 | `/b1/escalation` | `esc` |
| A1-08 | 완료 처리 시트 | `/a1/inbox/[case]?sheet=complete` | `sheet` |
| A3-02 | 현장 목록(본사) | `/a3/sites` | `sites` |
| A3-05 | 업무(열람) | `/a3/tasks` | `inbox` |

## 수용 기준
- **AC-1** Given `safety01` 로그인과 SITE-001 시드 업무 4(C-101 · C-102 · C-103 · C-105 — C-104는 SITE-002라 보이지 않는다) When 업무함(A1-02) 로드 Then 업무가 심각도·기한 순으로 정렬되고 각 행에 유형·상태(task 상태기계 값)·기한·심각도가 색 + 텍스트로 보이며, C-105(E-021 전압 이상)가 최상단이다 [FR-008, FR-009]
- **AC-2** Given 필터 칩 3종(미처리 = 기본 · 전체 · 고장·이상 — `entities.rules` 정렬·필터) When `?state=filter`(고장·이상 칩 선택) Then 목록이 고장·이상 업무(C-103 · C-105)만 남고 활성 칩과 건수가 표시되며, 전체 칩으로 4건이 복원된다 [FR-009]
- **AC-3** Given C-105가 `new` When 안전관리자가 상세(A1-03)에서 "접수" Then task 상태기계 `new → in-progress`로 전이되고 이력(ENT-09)에 행위자·시각이 추가되며 업무함 행의 상태가 갱신된다 (D1 장면 3 "업무함에서 C-105 접수") [FR-008]
- **AC-4** Given C-105 When 상세 로드 Then 고장코드 E-021과 설명, 대상 장비 CPB-003의 텔레메트리 요약(전압 342V · 통신 · 마지막 수신), 정비 담당 호출 액션이 보인다 [FR-006, FR-002]
- **AC-5** Given 업무함 표시 중 When 새 알림이 도착(mock realtime, IF-010) Then 알림 배지 건수가 증가하고 토스트가 뜨며, 알림에서 해당 업무로 이동한다 [FR-011]
- **AC-6** Given `control01` When 수신함(B1-03) 로드 Then 신청·요청(현장 개설·장비 배정·서류) 목록에 신청자·현장·요청 시각이 보이고, 승인/반려 시 상태와 이력이 갱신된다 (D1 장면 4 "수신함 처리") [FR-017, FR-018]
- **AC-7** Given `new` 상태로 1시간을 넘긴 업무(DemoClock 점프) When 에스컬레이션(B1-04) 로드 Then 해당 업무가 `escalated`로 표시되고 경과 시간·통보 대상(건설사 본사 안전관리자 + 관제, `entities.rules`)·통보 시각이 보인다 [FR-010]
- **AC-8** Given `site-safety` 로그인 When A1-02 Then 자기 현장(SITE-001)의 업무만 보이고, `control`의 B1-03·B1-04는 전국 범위다 [FR-024]

- **AC-9** Given C-105 `in-progress`(정비 보고 수신) When 완료 처리 시트(A1-08, `/a1/inbox/C-105?sheet=complete`)에서 조치 내용(필수)을 입력해 완료 Then `in-progress → done`으로 전이되고 이력에 행위자·조치 내용이 남으며 시트는 A1-03 위 `[data-capture-dialog]`로 열린다(모달형, `data-scr` 스왑) [FR-008]
- **AC-10** Given `hq01`(SITE-001·002) When 현장 목록(A3-02) Then 현장 카드 2에 이상 장비·미처리 업무·에스컬레이션 배지가 보이고 탭(업무 · 기록)으로 A3-05·A3-06에 가며, 에스컬레이션 알림(FR-010)은 이 화면으로 딥링크된다 [FR-010, FR-024]
- **AC-11** Given `hq01` When 업무(열람, A3-05) Then 전 현장 업무가 통합 목록으로 보이고 접수·완료 버튼은 없으며 "확인 요청"만 있다(DISC-015 권한 경계) [FR-024]

## 상태 픽스처
`screens.yaml` A1-02 `inbox` `filter` · A1-03 `case` · B1-03 `inbox` · B1-04 `esc`. 픽스처 ID: C-105(E-021 · CPB-003) · C-104(에스컬레이션 대상, `escalated`).

`A1-08:sheet`(C-105 in-progress · 시트 열림) · `A3-02:sites` · `A3-05:inbox`(W2).

## 비범위
Web Push 실수신(IF-014 — 로컬 알림 스텁은 `notifications`) · 서류 검토 흐름(A2-05·documents) · 현장 웹 업무 B3-03(W4) · 실 알림 서버(W3).
