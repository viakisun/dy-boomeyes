# owner-contracts — 작업

1. **엔티티·상태기계** — `ssot/entities.yaml`에 `OwnerRequest` 5단계 등록 → `pnpm ssot:build`. `machines.ts` 전이 + vitest.
   DoD: `pnpm verify` exit 0 · 상태기계 테스트 통과. `Refs: FR-026 DISC-052`
2. **읽기 모델·시드** — `OwnerRequest` 타입 · `ownerCandidates()` · 요청 5건 시드(페르소나 현장 유지) · 단위 테스트(후보가 보관 + 종료 임박에서만 나오는지).
   DoD: `pnpm test` 통과. `Refs: FR-026 FR-025`
3. **웹 요청·배정(B1-13)** — 목록 + `?request=` 배정 패널 + 확정 → 계약 기간 반영.
   DoD: `pnpm capture --dark --strict` B1-13 5픽스처 녹색(자리 0) · 눈으로 확인. `Refs: SCR-B1-13 FR-026`
4. **PWA 두 단계(A4-03 → A4-05)** — 목록 화면과 배정 화면 · 하단 내비 계약 항목.
   DoD: 캡처 PWA 4폭 녹색 · 48px 타깃. `Refs: SCR-A4-03 SCR-A4-05 FR-026`
5. **e2e** — AC-1~5 · web/pwa 제목 패리티(`tools/owner/check.mjs`).
   DoD: `pnpm e2e` 전건 · `owner:check` errors 0. `Refs: FR-026 FR-024`
