# sites-assets-leases — 작업 (W2 B5 · B6 · B7)

| # | 작업 | DoD | Refs |
|---|---|---|---|
| B5-1 | mock: site/device/user CRUD · `setSiteProfile` · 픽스처 `B4-03:assets` `B4-04:users` | Vitest `[FR-018]` `[FR-021]` | FR-018 FR-021 |
| B5-2 | B4-03(탭 3 · 프리셋 전환 → 채널 수) · B4-04(역할 매트릭스 · 가드 반영) | AC-1·2 e2e · 캡처 2 | SCR-B4-03 SCR-B4-04 |
| B6-1 | `Lease.state` · `planRelocation` · `transition('request')` · 픽스처 `B1-06:lease` `B2-02:work` | Vitest `[FR-019]` `[FR-017]` | FR-019 FR-017 |
| B6-2 | B1-06 · B2-02 · 장면 9 e2e | AC-3·4 · 캡처 2 | SCR-B1-06 SCR-B2-02 |
| B7-1 | `createRequest` · A1-07(menu·apply) · A2-06 · A3-03(site·normal) · KeyValueList | AC-5~7 e2e · 캡처 5 | SCR-A1-07 SCR-A2-06 SCR-A3-03 |

완료(W2 B5·B6·B7): B4-03 · B4-04 · B1-06 · B2-02 · A1-07(menu·apply) · A2-06 · A3-03(site·normal) 구현 · 마스터 API 8 · lease/request 기계 · createRequest · 장면 9 · e2e 12 · axe 7 · Vitest 6.

커밋 예: `feat(assets): B4-03 마스터·프로파일 프리셋 — Refs: SCR-B4-03 FR-018 FR-029`
