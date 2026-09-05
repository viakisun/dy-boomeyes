---
id: SPEC-documents
status: draft
wave: 2
screens: [A2-05, B1-05, B4-06, A1-02, A1-03]
fr: [FR-015, FR-016, FR-037, FR-008, FR-024]
---
# documents — 운전자 서류 제출 · 현장 검토 · 운영사 서류 현황 · 관리자 서류 관리

## 목적 · 역할
서류(ENT-07, 5유형 — DISC-016)는 운전자가 앱에서 촬영·제출하고(A2-05), 현장 안전관리자가 업무함의 서류 업무로 승인/반려하며(A1-02·A1-03), 운영사는 완비율·만료 임박을 모니터링하고 요청을 회신(B1-05), 관리자는 장비·현장 서류를 등록·관리한다(B4-06). 상태기계 `doc`(valid→expiring→submitted→review→approved|rejected→submitted). 데모 D4 장면 7(서류 흐름) · ops "서류 만료 D-30 → 재제출".

## 화면
| 코드 | 이름 | 라우트 | 상태 픽스처 |
|---|---|---|---|
| A2-05 | 내 서류 | `/a2/docs` | `docs` `queued` |
| B1-05 | 서류 현황 | `/b1/docs` | `docs` |
| B4-06 | 서류 관리 | `/b4/docs` | `docs` |
| A1-02 · A1-03 | 업무함 · 업무 상세(서류 업무) | 기존 | 기존 · `A1-03:docnew`(접수 전 서류 업무) |

## 수용 기준
- **AC-1** Given `driver03`의 서류 4(DOC-001 교육 이수증 `expiring` D-27 · DOC-002 면허 `valid` · DOC-003 CPB-003 제작증 `valid` · DOC-005 근로계약서 `rejected` 사유 포함 — CPB-002 성적서 DOC-004 `review`는 다른 호기라 보이지 않는다) When 내 서류(A2-05) 로드 Then 서류마다 유형·상태 pill·만료 D-n이 보이고 `expiring`·`rejected`에만 "촬영·제출" 액션이 있다 [FR-015, FR-016]
- **AC-2** Given DOC-001 `expiring` When 사진을 선택해 제출(IF-011, mock은 objectURL 미리보기) Then `doc` 상태기계 `expiring → submitted → review`(자동)로 전이되고 이력(ENT-09)에 제출 행이 남으며 현장 업무함(A1-02)에 서류 검토 업무가 생성된다 [FR-015, FR-008]
- **AC-3** Given 서류 검토 업무 When 안전관리자가 A1-03에서 승인 또는 반려(사유 필수) Then `review → approved` 또는 `review → rejected`로 전이되고(검토 업무가 접수 전 `new`/`escalated`면 A1-03은 먼저 "접수"를 보이고 접수 뒤 승인/반려 — API는 어느 상태든 `task` 상태기계로 in-progress→done을 거친다) 반려된 서류는 A2-05에서 사유와 함께 "재제출" 액션을 보이며 재제출은 `rejected → submitted`다 [FR-015, FR-008]
- **AC-4** Given `control01` When 서류 현황(B1-05) 로드 Then 현장(현장에 속한 서류 전체)·장비·운전자별 완비율(%)과 서류 표의 현장 열, 그리고 만료 임박(D-30 이내) 목록이 보이고, 서류 행 선택 시 인스펙터에 이력과 "요청 회신" 링크(수신함 RQ)가 보인다 — 등록·승인 액션은 없다(운영사 = 모니터링, entities.rules) [FR-016, FR-024]
- **AC-5** Given `ops01` When 서류 관리(B4-06) Then 5유형별 등록 폼(대상 장비/현장/운전자 · 유효기간)으로 서류를 등록하면 `valid`로 목록에 추가되고 만료일이 D-30 이내면 `expiring`으로 등록된다 [FR-016]
- **AC-6** Given 오프라인(`?net=off`) When A2-05에서 제출 Then 항목이 동기 대기(아웃박스)로 표시되고 배너 "동기 대기 n건"이 뜨며, 연결 후 순서대로 전송된다(ADR-010 · `queued` 픽스처) [FR-037]

## 상태 픽스처
`A2-05:docs`(시드) · `A2-05:queued`(오프라인 · 대기 1건) · `B1-05:docs`(완비율 · D-27 임박) · `B4-06:docs`(5유형 · 등록 폼 닫힘) · `A1-03:docnew`(C-106을 `new`로 — 접수 → 승인/반려). 픽스처 ID: DOC-001~006 · C-106 · RQ-003/005.

## 비범위
실 업로드 전송(IF-011 멀티파트 vs 서명 URL — DISC-046, W3) · 파일 형식·용량 정책(DISC-046) · A4-06 사업주 서류(W4) · B3-04 현장 서류(W4) · 만료 D-30 스케줄러(서버, W3).
