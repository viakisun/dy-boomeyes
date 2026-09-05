---
id: SPEC-equipment-parts
status: draft
wave: 2
screens: [B4-07, B4-08, A1-11, A2-09]
fr: [FR-032, FR-035, FR-024]
---
# equipment-parts — 부품 대장 · 점검·교체 이력 · 부품 점검 입력 · 교체·폐기 처리 (W2 = 구조)

## 목적 · 역할
마모·교체 부품(ENT-16~18)의 생애주기를 부품 ID 중심으로 다룬다. W2는 구조(자리+): 라우트·시드 부품·상태기계 `part` 실소비·이력 표까지 만들고, 태그 스캔(IF-019 · DISC-043)·OEM 임계(DISC-038)·발주는 비활성으로 표기한다. 단계 귀속은 DISC-044.

## 화면
| 코드 | 이름 | 라우트 | 상태 픽스처 |
|---|---|---|---|
| B4-07 | 부품 대장 | `/b4/parts` | `default` |
| B4-08 | 점검·교체 이력 | `/b4/parts/history` | `default` |
| A1-11 | 부품 점검 입력 | `/a1/parts/inspect` | `default` |
| A2-09 | 교체·폐기 처리 | `/a2/parts/replace` | `default` |

## 수용 기준
- **AC-1** Given `ops01`와 시드 부품 5(CPB-003, 5군 각 1 · 1건은 `due`) When 부품 대장(B4-07) Then 부품군·품번·장착 위치·설치일·상태 pill(part 상태기계)·누적 타설량(보조지표)이 표에 보이고 행 선택 시 인스펙터에 이력(ENT-17)이 보이며, 발주·재고 편집은 비활성("FR-032 2단계") · 임계 배너 "OEM 기준 미확정(DISC-038)"이 있다 [FR-032, FR-024]
- **AC-2** Given `safety01` When 부품 점검 입력(A1-11)에서 부품을 선택(스캔 버튼은 비활성 "DISC-043 확정 후")하고 실측두께·외관·체결·OEM 합불을 제출 Then `part` 상태기계 `installed → inspected`(합) 또는 `→ due`(불)로 전이되고 이력에 실측값·행위자·사진(objectURL)이 남는다 [FR-032, FR-035]
- **AC-3** Given `driver03`와 `due` 부품 When 교체·폐기 처리(A2-09)에서 사유·작업자·증빙 사진을 제출 Then `due → replaced`(재고 −1) 또는 `replaced → discarded`로 전이되고 B4-08 이력 표에 행이 추가된다 [FR-032]
- **AC-4** Given `ops01` When 점검·교체 이력(B4-08) Then 점검(실측·합불)·교체·폐기 행이 부품·시각으로 정렬되고 구분 칩으로 걸러진다; 누적 타설량·운전시간은 보조지표로만 표기된다 [FR-032]

## 상태 픽스처
`B4-07:default` · `B4-08:default` · `A1-11:default` · `A2-09:default` — 시드 부품 P-001~005(CPB-003) · 재고 5행.

## 비범위
태그 스캔 UI(IF-019 · DISC-043) · OEM 임계·주기(DISC-038) · 발주·안전재고 · 이벤트 복기 연결(B1-08 레인은 event-replay) · B3-07(W4).
