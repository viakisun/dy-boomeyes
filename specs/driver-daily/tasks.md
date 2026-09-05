# driver-daily — 작업 (W1)

| # | 작업 | DoD | Refs |
|---|---|---|---|
| 1 | ui `Checklist` · `Gauge` · `TelemetryStrip` + `domain.consumable.*` 임계 토큰 확인 | 데모 렌더 · `tokens:lint` 0건 · 다크 렌더 | ADR-004 |
| 2 | mock: `today` · `checkin/checkout`(반경 판정) · `submitInspection` · `ackAlert` · 동의 · 픽스처 5 | Vitest `[FR-013]` `[FR-014]`(반경 · 제출 이력) | ENT-09 ENT-15 |
| 3 | A2-02 오늘(출근 · 알림 · 배지 · 점검 배너) | AC-1 · AC-2 · AC-4 · `a2-02-today.png` `a2-02-checked.png` | A2-02 FR-013 FR-011 FR-031 |
| 4 | A2-03 일일점검 5항목 제출 | AC-3 · `a2-03-inspect.png` `a2-03-inspected.png` | A2-03 FR-014 |
| 5 | A2-04 내 장비(텔레메트리 · 소모품 게이지) | AC-5 · `a2-04-mydev.png` | A2-04 FR-002 FR-007 |
| 6 | 오프라인 배너 · 반경 밖 안내 · e2e 장면 2(알림 → 체크인 → 점검) · axe · 시각 회귀 | AC-6 · 게이트 6 녹색 | QA |

순서 1 → 2 → 3 → 4 → 5 → 6. 커밋 예: `feat(driver): A2-02 오늘 · 출근 체크인 — Refs: SCR-A2-02 FR-013`.
