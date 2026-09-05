# shell-auth — 작업 (W0)

| # | 작업 | DoD | Refs |
|---|---|---|---|
| 1 | 워크스페이스 스캐폴드 — `apps/web` `apps/pwa`(SvelteKit 2 · adapter-static) · `packages/{ui,domain,mock}` · Turbo · ESLint 경계 · svelte-check · Vitest · Playwright | `pnpm verify` + `lint` `typecheck` 녹색 · 빈 앱 2개 빌드 | ADR-001 |
| 2 | `packages/ui` 프리미티브 14(Button IconButton TextField Checkbox Radio Switch Badge StatusPill Card Tabs Menu Toast Dialog EmptyState) — cmp 토큰만 소비 | 스토리/데모 페이지 렌더 · `tokens:lint` 0건 | ADR-004 |
| 3 | `WebShell` · `PwaShell` | AC-3 · AC-4 · AC-6(W1: 루트 `data-theme` · `?theme=` 쿼리 · 웹 탑바 토글(localStorage) · PWA 시스템 추종 · `capture --dark` 14장 · e2e `web-theme`/`pwa-theme` 6) · `maintenance` 로그인 경로(B0-01 roles 미포함)는 SSOT 정리 필요 | FR-024 |
| 4 | `packages/mock` 시드(7계정·현장 2·CPB 5) · `ApiClient` 인터페이스 + mock · `?state=` `?capture=1` 해석 · DemoClock | 단위 테스트 `[FR-001]` | ADR-002 |
| 5 | B0-01 역할 카드 로그인 + 라우트 가드 + 앱 로그인 4 | AC-1 · AC-2 · AC-5 | B0-01 A1-01 A2-01 A3-01 A4-01 |
| 6 | `tools/capture` — states 매니페스트 생성 · 뷰포트·고정 시각·클립 | `b0-01-login-b1..b4` `a1-01-login` … PNG · 시각 회귀 기준선 | QA §3 |
| 7 | 프리뷰 배포(S3+CloudFront, PR 경로) · CI에 capture·e2e 추가 | 프리뷰 URL에서 AC-1 재현 — CI `e2e` 잡(e2e 19 · capture · 아티팩트) 추가됨, 프리뷰는 AWS 계정(DISC-006) 후 | ADR-007 |

커밋 예: `feat(shell): WebShell·PwaShell 골격 — Refs: SCR-B0-01 FR-024`
