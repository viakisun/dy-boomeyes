# demo-scripts — 작업 (W1)

| # | 작업 | DoD | Refs |
|---|---|---|---|
| 1 | `packages/mock` `demo.ts` — SCENES(ssot.json 파생) · SCENE_FIXTURES 4·5·6 · 장면 1 realtime 스크립트 주입 · `optionsFromUrl` `?scene=` · `bootMock` 키 `scene|N` | 단위 테스트 `[FR-011]` `[FR-010]` 3 · `pnpm test` | FR-011 FR-010 |
| 2 | `DemoBar` 컴포넌트 + 카탈로그 등록 · 두 셸에 배치 · 장면 계정 세션 합성(`+layout.ts`) | `tokens:check` · `tokens:lint` 0 · 장면 바 e2e(AC-7) | SCR-B1-02 SCR-A1-02 FR-024 |
| 3 | 장면 1·4·6·8 e2e(웹) · 장면 2·3·5·7 e2e(PWA) | `pnpm e2e` 녹색(+9) · 장면 6 "1시간 경과" → 에스컬레이션 | SCR-B1-02 SCR-B1-03 SCR-B1-04 SCR-B4-02 SCR-A2-02 SCR-A2-03 SCR-A1-02 SCR-A1-03 SCR-A1-04 SCR-A1-05 |
| 4 | `docs/DEMO.md` §5 갱신(진입 URL 표) · QA §3 `?scene=` 가드 우회 명시 · PLAN W1 행 | `check --docs` · reviewer 판정 인용 | DISC-017 |

완료(W2): 장면 5(완료 확인 → 기록 최상단) · 6 · 7(서류 촬영·제출) · 9(재배치) · 10(쇼케이스) e2e — 장면 1~10 전 커버. `docs/DEMO.md` §5 갱신.

커밋 예: `feat(demo): 장면 재생 — ?scene=N · DemoBar · 장면 1 타임라인 · e2e 9 — Refs: SCR-B1-02 SCR-A2-02 FR-011 FR-010 FR-024`

장면 11 "쌓인 데이터"(DY gap 라운드 PR9): `ssot/scenarios.yaml demo[]` append(재번호 없음) · WF-17 연결 · `index.ts` 장면 범위를 `sceneOf`로(하드코딩 `n <= 10` 제거) · `SCENE_FIXTURES[11]` 기본 시드 · e2e `web-demo` +1 · 장면 바 N/11 · `docs/DEMO.md` §1·§5.
