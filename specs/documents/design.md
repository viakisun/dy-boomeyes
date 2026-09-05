# documents — 설계

## 데이터
- `Doc`(ENT-07)에 `history: HistoryItem[]`(제출·검토) 추가 · 상태기계 `doc`은 ssot 생성 `MACHINES.doc`을 `transition('doc', …)`으로만 소비.
- API(`packages/domain/src/api.ts` ↔ mock): `doc(id)` · `submitDoc(id, file: {name, type, size}, meta?)`(expiring|rejected → submitted → review, 서류 검토 업무 `kind: doc` 생성) · `reviewDoc(id, decision: 'approved'|'rejected', by, note?)`(`decide()` 일반화) · `registerDoc(input)`(B4-06) · `docCompleteness(scope)`(A1-05 계산 이관). 쓰기는 `meta{clientId, at}`를 받는다(ADR-010).
- 시드: `submitted`/`approved`/`rejected` 예시 행 추가(DOC-005 반려 · DOC-006 승인) — 상태 pill 전수 표시.

## 컴포넌트 · 토큰
- `DocumentCard`(카탈로그 등록, `packages/ui`): 유형 라벨(`DOC_TONE`) · 상태 pill · D-n · 액션 슬롯. `FileUpload mode="image"`(accept image/*, capture=environment, objectURL 미리보기).
- 웹 B1-05·B4-06: 목록+인스펙터 2열(`b1/inbox` 패턴) → `Inspector` 추출(`packages/ui/src/shell/Inspector.svelte`) · `DataTable` · `Timeline`.
- 토큰: 상태색은 `domain.doc.*`(DOC_TONE), 완비율은 `ProgressBar` 대신 `Stat` + 텍스트(ProgressBar는 부품에서 등록).

## 라우트 · 쿼리
- A2-05 `?state=docs|queued` · B1-05 `?doc=<id>`(인스펙터 선택) · B4-06 `?tab=register`(폼 열림). 오프라인 흉내 `?net=off`(레이아웃 해석).

## 오프라인 · 오류 · 빈 상태
- 제출 실패(반려 아님)는 토스트 + 재시도 · 서류 0건 EmptyState · 오프라인은 아웃박스(ADR-010).

## 접근성
- 상태 pill은 색 + 텍스트 · 사진 미리보기 alt = 서류 유형 · 제출 버튼 48px(PWA).

## 열린 질문
- DISC-016(유형 5종 확정) · DISC-046(업로드 정책).
