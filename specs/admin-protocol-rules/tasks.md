# admin-protocol-rules — 작업 (W1)

| # | 작업 | DoD | Refs |
|---|---|---|---|
| 1 | `packages/domain/protocol.ts` — `validateProtocol` · `parseSample` (cpb.v0.1 필드 · 샘플 3종) | Vitest `[FR-020]` 정상/누락/타입 오류 | FR-020 |
| 2 | mock: 프로토콜 2(운영 · 테스트) · 샘플 3 · 규칙 8 · 고장코드 · 이력 · 픽스처 `proto` `rules` | `?state=` 재현 | ENT-11 ENT-08 |
| 3 | ui `FileDrop` · `CodeBlock` · `DataTable` 편집 셀 | 데모 렌더 · `tokens:lint` 0건 | ADR-004 |
| 4 | B4-02 목록 · 업로드 검증 · 샘플 테스트 · 알림 미리보기 | AC-1 · AC-2 · AC-3 · `b4-02-proto.png` | B4-02 FR-020 |
| 5 | B4-05 알림 기준 · 고장코드 · 시나리오 등급(잠금) · 저장 이력 | AC-4 · AC-5 · AC-6 · AC-7 · `b4-05-rules.png` | B4-05 FR-011 FR-007 FR-006 FR-036 |
| 6 | e2e 장면 8(업로드 → 오류 샘플 → 알림 확인) · axe · 시각 회귀 | 게이트 6 녹색 | QA |

순서 1 → 2 → 3 → 4 → 5 → 6. 커밋 예: `feat(admin): B4-02 프로토콜 업로드·검증 — Refs: SCR-B4-02 FR-020`.
