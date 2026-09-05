# task-escalation — 기술 설계

## 레이아웃
- **A1-02 업무함**(PwaShell): 상단 요약 칩(new · in-progress · escalated 건수) · 필터 칩(`Tabs` pill: 미처리(기본) · 전체 · 고장·이상) · `TaskCard` 목록 = 유형 아이콘 · 제목 · `StatusPill`(task 상태) · 기한 D-n · 심각도 `StatusDot`. 알림 배지는 AppBar 액션.
- **A1-03 업무 상세**: 헤더(업무 ID · 상태 · 심각도) · 장비 카드(호기 · 현장 · 고장코드 `Badge` · 전압/통신 요약 · 정비 호출) · `Timeline`(ENT-09 이력) · 하단 고정 액션 바(접수 / 완료).
- **B1-03 수신함**(WebShell): `DataTable`(신청 유형 · 신청자 · 현장 · 요청 시각 · 상태) · 행 선택 → 인스펙터(내용 · 승인/반려). `?case=`로 진입하면 해당 행 선택.
- **B1-04 에스컬레이션**: 상단 `Banner`(규칙: 미접수 1h → 건설사 본사 + 관제 자동 통보) · `DataTable`(업무 · 현장 · 경과 `EscalationTimer` · 통보 대상 · 통보 시각).

## 컴포넌트 · 토큰
카탈로그(`packages/tokens/src/components.json`): `DataTable`(행 밀도 36/48 · 정렬 · 포커스 행 · Enter 선택) · `TaskCard` · `Timeline` · `EscalationTimer`. 기존: `StatusPill` `StatusDot` `Badge` `Banner` `EmptyState` `Toast` `Dialog`. 토큰: `cmp.table.*` `cmp.card.*` · severity = `sys.color.status.*`(SEVERITY_TONE) · task 상태 = `domain.task.*`(TASK_TONE).

## 데이터
- ENT-06 업무(id · kind · state · severity · due · deviceId · siteId · assignee) · ENT-09 이력(append-only: 시각 · 구분 · 내용 · 행위자) · ENT-08 알림(caseId 링크) · ENT-05 사용자(siteIds 스코프).
- 상태기계 `task`(`MACHINES.task`, `ssot/entities.yaml`) — 전이는 `packages/domain` `transition()`으로만. 에스컬레이션 = `new`가 1h를 넘기면 `escalated`(DemoClock 기준 계산, mock에서는 `api.escalations()`가 판정).
- mock 확장: `api.case(id)` · `api.transition(caseId, to, by)`(이력 자동) · `api.requests(scope)`(B1-03 신청 5: 개설 · 장비 · 서류) · `api.approve/reject(id)` · `api.escalations()` · realtime `case.created` `case.escalated`.

## 라우트 · 쿼리
`/a1/inbox?state=inbox|filter&filter=<state>,<kind>` · `/a1/inbox/[case]?state=case` · `/b1/inbox?state=inbox&case=<id>` · `/b1/escalation?state=esc`.

## 스코프(FR-024)
`site-safety` → `siteIds` 필터, `control`/`maintenance` → 전국. `canAccess` + `api` scope 인자.

## 오프라인 · 오류 · 빈 상태
업무 0건 → EmptyState("처리할 업무가 없습니다") · 전이 실패 → 토스트 + 상태 원복 · 오프라인 → Banner + 전이 버튼 비활성(읽기 전용).

## 접근성
행은 링크/버튼 역할 · 상태는 색 + 텍스트 · 하단 액션 바 48px · 타임라인 `<ol>` · 필터 칩 `aria-pressed` · 표 행 포커스 + Enter.

## 열린 질문
DISC-035(조치 보고 입력 채널) · DISC-036(알림 수신자·방식) — 통보 대상 = 건설사 본사 + 관제(`entities.rules`).
