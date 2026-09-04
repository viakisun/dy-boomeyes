# QA — 게이트 정의 · 패리티 체크리스트 · 캡처 규약

검증이 곧 완료 정의(METHOD P5). "완료"는 아래 게이트 출력을 인용할 때만 쓴다.

## 1. 게이트

| # | 게이트 | 명령 | 실패 시 | 상태 |
|---|---|---|---|---|
| 1 | SSOT | `pnpm ssot:check` — 스키마·ID 문법·유일성·참조 무결성·어휘·화면 규칙(route·states·default)·DISC 생애주기 | 커밋 차단(hook) · CI 실패 | 있음 |
| 2 | 토큰 | `pnpm tokens:check` — 문법·계층·모드 차원·대비 76쌍 · `tokens:lint`(화면 코드 hex/px/기본 팔레트 0건) | 커밋 차단 | 있음 |
| 3 | 생성물 최신성 | `pnpm verify` 끝의 `git diff --exit-code` (docs/generated · domain/generated · tokens/dist) | CI 실패 | 있음 |
| 4 | 타입·정적 | svelte-check(error 0) · ESLint(경계 규칙 `eslint-plugin-boundaries`) · Prettier | 커밋 차단 | 있음 |
| 5 | 단위 | Vitest — 업무·서류·장비·카메라·부품 상태기계 · 프로파일→피처플래그 · 프로토콜 파서 · scr 커버리지 | 푸시 차단 | 있음(상태기계·라우트·mock) |
| 6 | e2e·캡처 | Playwright — 라우트 × 상태 픽스처 전수 렌더 · 7역할 로그인 스모크 · 데모 장면 스크립트 · 시각 회귀(0.2%) · axe serious/critical 0 | PR 차단 | W0~W1 |
| 7 | 추적·문서 | `check --specs`(frontmatter ID·AC ≥3) · `check --docs`(링크·ID) · `check --commits`(Refs 트레일러) | PR 차단 | 있음 |

## 2. 화면 패리티 체크리스트 (화면당, PR 본문에 체크)

- [ ] 토큰 외 색·px 0건 · 상태는 색 + 글리프/텍스트 병행
- [ ] 라우트 루트 `data-scr` = 화면 코드 · `?state=` 픽스처가 `ssot/screens.yaml` states 전부를 재현
- [ ] 반응형: 웹 1280/1024/768 · PWA 375/390/430 · 폴드 768
- [ ] 대비 본문 7:1 · 보조 4.5:1 · UI 3:1 · 터치 44px(PWA 컨트롤 48) · 최소 12px
- [ ] 4상태: 빈(EmptyState) · 오류(재시도) · 오프라인(Banner·큐) · 로딩(300ms 후 Skeleton)
- [ ] 다크(`data-theme=dark`) 렌더 · 월보드는 컴포넌트 내부 강제
- [ ] 키보드(웹): 포커스 링 · Esc 닫기 · 목록 행 포커스
- [ ] 캡처 파일 `shots/<code>-<state>.png` 갱신 · 시각 회귀 통과
- [ ] 테스트 제목 `[FR-nnn]`/`[코드]` · 커밋 `Refs:`

## 3. 캡처 규약 (`tools/capture`, W0)

- 뷰포트: PWA 440×900(프레임 셀렉터 `[data-capture-frame]` 390×800 클립) · 웹 1280×842(문서 높이로 확장) · 모달/시트 `[data-capture-dialog]` 클립. DPR 2 · `ko-KR`.
- 시각 고정은 **앱의 DemoClock**(`?capture=1` → `ssot/meta.yaml fixed_clock` 2026-07-03 10:42)이 담당 — 화면 코드는 `new Date()` 대신 `data.clock`을 쓴다. 브라우저 `Date` 프록시는 쓰지 않는다(MapLibre 로드를 막음). 지도는 `[data-map-ready]`(idle) 대기 · 애니메이션 비활성. 웹 전체 화면은 `fullPage` 대신 뷰포트를 문서 높이로 늘려 찍는다 — 헤드리스 `fullPage`(captureBeyondViewport)는 WebGL 캔버스 서브트리(타일·마커)를 간헐적으로 비운다.
- 이름 = `${code.toLowerCase()}-${state}` (`b1-02-dash` `b1-02m-cam`). 상태 목록은 `screens.yaml`에서 생성(매니페스트 손 편집 금지).
- 데모 계정: `roles.yaml demo_account`. 픽스처 ID: CPB-003(E-021) · CPB-004(통신 두절) · C-105 · D-27.

## 4. 리뷰 정책

- PR = 사람 1명 승인 + `reviewer` 에이전트 판정(머지 가능/불가) 첨부. 미충족 AC가 있으면 머지 불가.
- 생성물 diff는 리뷰 대상에서 접힘(`.gitattributes`) — 원천 diff를 본다.
- 클라이언트 전달·배포·범위 변경은 사람 게이트.

## 5. 추적 규약 검증

- `data-scr` 값 · 테스트 접두 · 커밋 트레일러의 ID는 `ssot`에 실존해야 한다(`check --commits` · `--docs`). `ids.ts` 상수를 import한 코드만 화면 코드를 참조한다.
- FR 0건 화면(고아)·화면 0건 FR은 `docs/generated/TRACE.md`에서 0이어야 한다.
