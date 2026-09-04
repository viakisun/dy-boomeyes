| 항목 | 규칙 |
|---|---|
| 원천 | `packages/tokens/src` — `ref/`(값) · `sys/`(역할) · `cmp/`(컴포넌트) · `brands/`(사업자) · `components.json`(카탈로그) · `doc/`(산문) |
| 생성 | `pnpm tokens:build` → `dist/<brand>.tokens.css` · `<brand>.theme.css` · `<brand>.tokens.json` · `<brand>-design.md`. dist는 커밋한다(리뷰 가능한 diff) |
| 게이트 | `pnpm tokens:check` — 문법·계층·모드 차원·대비. 실패 시 CI 실패. 화면 코드는 `tokens:lint`(hex·px·기본 팔레트 0건) |
| 추가 절차 | ① 기존 토큰으로 표현 불가 근거 ② `sys` 역할 이름 제안(문법 준수) ③ light/dark·compact/comfortable 값 ④ 대비 검사 통과 ⑤ 이 문서 재생성·리뷰 |
| 브랜드 추가 | `src/brands/<ID>.json`(액센트 앵커·서체·기본 모드) → 빌드 → `<ID>-design.md`. 램프·역할·컴포넌트는 공통 |
| 버전 | 토큰 패키지 semver. 토큰 삭제·이름 변경 = major, 값 변경 = minor, 설명·문서 = patch. 브랜드 팩은 자체 버전 |
| 참조 자료 | Figma [DY] Crane Eyes 스냅샷(`boomeyes/docs/design/figma/`) · CraneEyes 코드 토큰(`boomeyes/_ref/craneeyes_ds/`) — 읽기 전용 참조, 동기 없음 |
| 금지 | dist 수기 수정 · 화면 전용 토큰 · 다크/브랜드 전용 컴포넌트 · Figma 재동기 |
