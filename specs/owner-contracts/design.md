# owner-contracts — 설계

## 컴포넌트
재사용: `List` · `EquipmentRow`(후보 호기) · `StatusPill`(요청 상태) · `Badge` · `PeriodBar`(희망 기간·확정 기간) · `ContactCard`(안전관리자) · `Timeline`(요청 진행) · `EmptyState` · `Button` · `Dialog`(배정 확정 확인) · `Toast`. `B1-03 수신함`의 승인 흐름과 `EscalationTimer` 패턴을 따른다. 새 컴포넌트는 `RequestRow`(요청 한 건)와 `CandidateRow`(후보 호기 + 가용 근거) 둘로 제한하고 `components.json`에 등록한다.

## 데이터 · 상태기계
`OwnerRequest`(신설) — `{id, siteName, builder, manager: {name, phone}, from, to, count, spec, status, assigned: string[]}`. 상태기계 5단계: `new(요청 접수) → assign(배정 중) → ship(운송·설치) → run(가동) → done(종료)`. `ssot/entities.yaml`에 등록하고 `packages/domain/src/machines.ts`에 전이와 vitest를 둔다. 후보 산출은 `ownerCandidates(devices, from, to)` — **보관 중**(`deployment === 'stored'`)과 **계약 종료 임박**(`leaseTo <= to`)만, 결정적 정렬(보관 먼저 · 종료일 오름차순 · 호기 번호).

## 라우트 · 쿼리
- 웹 `B1-13 /b1/requests` — `?request=<id>`로 우측 배정 패널을 연다(화면 전환 없음).
- PWA `A4-03 /a4/requests` 목록 → `A4-05 /a4/leases?request=<id>` 배정. 쿼리 전환은 `new URL(location.href)` + `searchParams.set`(query-audit 규칙).
- `?state=`는 capture 모드에서만.

## 오프라인 · 오류 · 빈 상태
조회 실패는 `EmptyState` tone=danger + 재시도. 후보 0건은 «없음»이 아니라 원인 문장(보관 0 · 종료 임박 0). 오프라인에서 «배정 확정»은 비활성 + 사유. 확정은 이 데모에서 메모리 전이이고 새로고침에 초기화된다는 사실을 DemoBar가 말한다(화면 문장 아님).

## 접근성
요청 목록은 `role=list`. 배정은 `<section>` 두 개(요청 / 후보)이고 각각 제목을 갖는다. 확정 버튼은 N/N 충족까지 `aria-disabled`와 남은 대수를 이름에 담는다. 확정 뒤 포커스는 토스트가 아니라 갱신된 요청 제목으로 옮긴다. 터치 타깃 PWA 48px.

## 골격 · 카피
헤더 = 제목 «계약» + 상태별 요청 수 칩 한 줄(부제 문장 없음). 후보 열 정의: 호기 · 현재 상태 · 가용 근거 · 확인 사항. 버튼은 동사 — «배정 확정·회신». 식별자(FR·DISC)는 화면에 두지 않는다.

## 열린 질문
- 요청이 앱으로 직접 들어오는지(현장 안전관리자 `A1-07`) 전화·메일 접수 기록인지 — DISC-052.
- 확정 회신의 전달 경로(알림·메일) — DISC-026.
