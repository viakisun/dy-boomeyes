# owner-drivers — 설계

## 컴포넌트
재사용: `List` · `StatusPill`(자격 상태) · `ContactCard` · `KeyValueList` · `DocumentViewer`(운전자 서류 원문) · `EmptyState` · `Badge`. 새 컴포넌트는 `DriverRow` 하나로 제한하고 `components.json`에 등록한다. 호기 화면의 «오늘 운전자»는 새 컴포넌트가 아니라 `UnitPanel` 안의 한 줄(이름 + 연락처 + 명단 링크)이다.

## 데이터
`OwnerDriver`(신설) — `{id, name, license, licenseTo, phone, docs: OwnerDoc[]}`. `OwnerDevice.driver?: {id, name, phone}`(오늘 배정, 선택 필드 — 없으면 «배정 없음»). 배정은 날짜별이지만 이 데모는 **오늘 하루**만 다룬다(이력·미래 배정 없음). 서류 갈래는 `OwnerDoc.owner: 'vehicle' | 'driver'`로 구분해 호기 서류 목록이 운전자 서류를 섞지 않게 한다.

## 라우트 · 쿼리
`B1-14 /b1/drivers` · `A4-04 /a4/drivers` · `B1-15 /b1/drivers/docs` · `A4-06 /a4/drivers/docs`. 서류 원문은 기존 뷰어 패턴(`?doc=`)을 따른다. 웹은 계약 화면 옆에서 명단으로 가고, PWA는 계약 목록의 탭 하나로 간다.

## 오프라인 · 오류 · 빈 상태
조회 실패 `EmptyState` tone=danger + 재시도. 등록 0명은 원인 문장. 배정 없음은 빈 상태가 아니라 호기 한 줄의 «배정 없음» 텍스트. 서류 미비는 목록에 남기고 «미비»로 표시한다(행을 지우지 않는다).

## 접근성
명단은 `role=list`. 만료일은 `relativeLabel` + `<time title>` 절대. 만료 임박은 색만이 아니라 «D-n» 텍스트를 함께 둔다(원칙 4). 전화는 `tel:` 링크. 터치 타깃 PWA 48px.

## 골격 · 카피
헤더 = 제목 «운전자» + 인원·만료 임박 칩(부제 문장 없음). 열 정의: 이름 · 면허 · 만료 · 오늘 배정 · 연락처. 카피는 사람의 말로 — «면허 만료 D-12», «오늘 배정 없음».

## 열린 질문
- 운전자 고용 형태와 배정 주체 — DISC-052(업무 기획이 남긴 확인 항목).
- 운전자 서류 4종의 확정 목록 — DISC-016.
