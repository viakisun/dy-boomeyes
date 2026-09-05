# equipment-parts — 설계

## 데이터
- 타입 `Part`(ENT-16) · `PartEvent`(ENT-17) · `Stock`(ENT-18) → `packages/domain/src/types.ts`; `MACHINES.part`를 `transition('part', …)`으로 소비.
- API: `parts(scope)` · `part(id)` · `partEvents(partId?)` · `inspectPart(id, input)` · `replacePart(id, input)` · `discardPart(id, input)` · `stock()`. 쓰기는 `meta{clientId, at}`.
- 시드: CPB-003 5군 각 1(직관 · 엘보 · 플랜지 · 가스켓 · 엔드호스), P-004 `due`, 재고 5행, 이력 3.

## 컴포넌트
- B4-07/B4-08: `DataTable` + `Inspector` + `Timeline` · `ProgressBar`(누적 보조지표, 카탈로그 등록).
- A1-11: `ChecklistForm` 변형(실측 입력 + 합불) · `FileUpload mode="image"` · 스캔 버튼 `disabled` + 안내.
- A2-09: 사유 `Select` · 작업자 · 사진 · 확인 `Dialog`(파괴 동작 2단계).

## 라우트 · 쿼리
- B4-07 `?part=` · A1-11/A2-09 `?part=`(선택 유지) · 진입 nav: A1-05→A1-11 · A2-04→A2-09 · B4-02→B4-07 · B4-07→B4-08.

## 접근성 · 빈 상태
- 상태 pill 색+텍스트 · 폼 오류 라벨 · 부품 0 EmptyState.

## W2 B9 — 구현 메모(구조 · DISC-044)
- 타입 `Part`(기준·최근 실측 두께 · 누적 타설·운전시간 보조지표) · `PartEvent`(점검 실측·외관·체결·합불 · 교체/폐기 사유·작업자·증빙) · `Stock`. 시드 P-001~005(CPB-003) · P-004 due · 이력 3 · 재고 5.
- 상태기계: `inspectPart` = installed → inspected, 불합이면 이어서 inspected → due(ENT-16에 installed→due 직행 전이가 없어 2단) · 이미 inspected면 재점검 허용 · 그 밖의 상태는 오류. `replacePart` = due → replaced + 재고 −1(재고 0이면 전이 전에 오류) · `discardPart` = replaced → discarded. 모든 전이는 `transition('part')`.
- 컴포넌트: `ProgressBar`(카탈로그, role=progressbar) 신설 — 누적 타설 보조지표. `ChecklistForm`은 숫자 입력 슬롯이 없어 재사용하지 않고 A1-11 페이지 폼(TextField number + Select 3 + FileUpload image)으로. A2-09는 `Dialog`(destructive) 2단계 확인.
- 비활성 표기: 태그 스캔 버튼(DISC-043) · 발주·재고 편집(FR-032 2단계) · 임계 배너(DISC-038). 진입: A1-05 → A1-11 · A2-04 → A2-09 링크, B4-02 → B4-07은 사이드바(B4-07은 HIDDEN 아님) · B4-07 → B4-08 링크.
- spec AC-1의 `[FR-024]`는 SSOT FR-024 screens에 부품 화면이 없다 — 커밋 Refs에서는 제외(FR-032 · FR-035 · DISC-038/043/044).
