# task-escalation — 작업 (W1)

| # | 작업 | DoD | Refs |
|---|---|---|---|
| 1 | ui `DataTable` · `TaskCard` · `Timeline` · `EscalationTimer` (카탈로그 이름 · cmp 토큰만) | 데모 렌더 · `tokens:lint` 0건 · 다크 렌더 | ADR-004 |
| 2 | mock: 업무 5 + 이력 · 신청 5 · `transition` · `requests/approve/reject` · `escalations`(DemoClock) · realtime case 이벤트 · 픽스처 `inbox` `filter` `case` `esc` | Vitest `[FR-008]` `[FR-010]` (전이 · 1h 경과 판정) | ENT-06 ENT-09 |
| 3 | A1-02 업무함 + 필터 + 스코프 | AC-1 · AC-2 · AC-8 · `a1-02-inbox.png` `a1-02-filter.png` | A1-02 FR-008 FR-009 FR-024 |
| 4 | A1-03 상세 + 접수/완료 + 타임라인 + 정비 호출 | AC-3 · AC-4 · `a1-03-case.png` | A1-03 FR-006 |
| 5 | 알림 도착 → 배지 · 토스트 · 업무 딥링크 (앱) | AC-5 · e2e | FR-011 |
| 6 | B1-03 수신함 + 승인/반려 + `?case=` 선택 | AC-6 · `b1-03-inbox.png` | B1-03 FR-017 FR-018 |
| 7 | B1-04 에스컬레이션 | AC-7 · `b1-04-esc.png` | B1-04 FR-010 |
| 8 | e2e(접수 흐름 · 스코프 · 승인) · axe · 시각 회귀 기준선 | 게이트 6 녹색 | QA |

순서 1 → 2 → 3·4 → 5 → 6·7 → 8. 커밋 예: `feat(task): A1-02 업무함 · 필터 — Refs: SCR-A1-02 FR-008 FR-009`.
