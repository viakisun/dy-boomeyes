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
