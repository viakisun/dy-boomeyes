# QA — 게이트 정의 · 패리티 체크리스트 · 캡처 규약

검증이 곧 완료 정의(METHOD P5). "완료"는 아래 게이트 출력을 인용할 때만 쓴다.

## 1. 게이트

| # | 게이트 | 명령 | 실패 시 | 상태 |
|---|---|---|---|---|
| 1 | SSOT | `pnpm ssot:check` — 스키마·ID 문법·유일성·참조 무결성·어휘·화면 규칙(route·states·default)·DISC 생애주기 | 커밋 차단(hook) · CI 실패 | 있음 |
| 2 | 토큰 | `pnpm tokens:check` — 문법·계층·모드 차원·대비 76쌍 · `tokens:lint`(hex · 기본 팔레트 · 임의값 · 숫자 스케일 · rounded-N · z-N · duration-N · border-N · ring-N · max-w-sm… · 초기화된 기본 스케일 · style px — 규칙 생존 프로브) · `catalog`(컴포넌트 파일 ⊆ components.json) | 커밋 차단 | 있음 |
| 3 | 생성물 최신성 | `pnpm verify` 끝의 `git diff --exit-code` (docs/generated · domain/generated · tokens/dist) | CI 실패 | 있음 |
| 4 | 타입·정적 | svelte-check(error 0) · ESLint(경계 규칙 `eslint-plugin-boundaries`) · Prettier | 커밋 차단 | 있음 |
| 5 | 단위 | Vitest — 업무·서류·장비·카메라·부품 상태기계 · 프로파일→피처플래그 · 프로토콜 파서 · scr 커버리지 | 푸시 차단 | 있음(상태기계·라우트·mock) |
| 6 | e2e·캡처 | `pnpm e2e`(Playwright, 빌드 후) — 역할 로그인 8(웹 4 · 앱 4)·가드 스모크 · 화면별 AC · 장면 1~10 · axe serious/critical 0(wave ≤ 2 화면 41 전수, wcag2a·2aa·best-practice) · `pnpm capture --dark --strict` 라우트 × 상태 전수 + 다크 + 자리 화면 0 · `pnpm capture:compare` 기준선 대비 픽셀 차 0.2%(ADR-008 A) | PR 차단(CI `e2e` 잡, shots 아티팩트) | 있음 |
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

- e2e(`tests/e2e/*.spec.ts`, `playwright.config.ts`): 프로젝트 `web`(1280×842) · `pwa`(390×800 · 터치). 테스트 제목은 `[코드]`/`[FR-nnn]` 접두. 화면 진입은 `?capture=1`(시각 고정·가드 우회)로 하되 로그인·가드 스모크만 실제 흐름을 탄다. `fg-subtle`은 정보 텍스트에 쓰지 않는다(axe color-contrast).

- 뷰포트: PWA 440×900(프레임 셀렉터 `[data-capture-frame]` 390×800 클립) · 웹 1280×842(문서 높이로 확장) · 모달/시트 `[data-capture-dialog]` 클립. DPR 2 · `ko-KR`.
- 시각 고정은 **앱의 DemoClock**(`?capture=1` → `ssot/meta.yaml fixed_clock` 2026-07-03 10:42)이 담당 — 화면 코드는 `new Date()` 대신 `data.clock`을 쓴다. 브라우저 `Date` 프록시는 쓰지 않는다(MapLibre 로드를 막음). 지도는 `[data-map-ready]`(idle) 대기 · 애니메이션 비활성. 웹 전체 화면은 `fullPage` 대신 뷰포트를 문서 높이로 늘려 찍는다 — 헤드리스 `fullPage`(captureBeyondViewport)는 WebGL 캔버스 서브트리(타일·마커)를 간헐적으로 비운다.
- axe `video-caption`은 `incomplete`(수동 검토)로 분류되며 게이트는 `violations`만 본다 — 라이브 대체 영상은 무음 합성 루프(자막 대상 음성 없음)라 면제. 실스트림(W3)에서 음성이 생기면 자막·설명 정책을 정한다(DISC-031 개인정보 음성 항목과 함께).
- PWA 긴 화면은 뷰포트를 문서 높이로 늘린 뒤 `[data-capture-frame]`을 찍는다(sticky 하단 내비가 문서 중간에 찍히는 것 방지). 스냅샷 mock의 시각도 Asia/Seoul.
- 이름 = `${code.toLowerCase()}-${state}` (`b1-02-dash` `b1-02m-cam`). 상태 목록은 `screens.yaml`에서 생성(매니페스트 손 편집 금지).
- 시각 회귀(ADR-008 A): 기준선 `shots/baseline/<code>-<state>.png`(웨이브 이하 화면 기본 상태 · DPR 1 · 라이트)와 `MANIFEST.json`(platform · playwright · dpr · shots)은 **CI `baseline` 워크플로**(workflow_dispatch → `pnpm capture:accept` → 커밋·푸시)로만 갱신한다 — 로컬(macOS) 캡처는 글꼴 래스터가 달라 기준선이 될 수 없다(`diff.mjs`가 환경 불일치를 exit 2로 거부) — 로컬 자기 비교(accept → compare)는 도구 점검용. 기준선이 아직 없으면 비교를 생략하고 경고만 낸다(첫 등록 전). PR CI는 `pnpm capture:compare`(= `--current` 캡처 → `tools/capture/diff.mjs`)로 픽셀 차 비율 0.2% 초과 · 크기 변화 · 기준선/현재 누락을 FAIL로 세고 차이 이미지를 `shots/diff/`(아티팩트)에 남긴다. 지도(`.be-map`)·`<video>` 영역은 사이드카 `<name>.json` 마스크로 제외. 의도한 화면 변경은 같은 PR에서 `baseline` 워크플로를 다시 실행해 기준선을 갱신한다(리뷰어는 기준선 diff를 본다).
- 오프라인 제출 큐(ADR-010): `?net=off|fail|slow`는 PWA 레이아웃이 해석하는 전송 조건 흉내(`?state=`는 데이터). 아웃박스 IndexedDB는 live `boomeyes-outbox` 하나, capture·e2e는 픽스처 키별 `boomeyes-outbox-capture|<code>|<state>`(캡처 간 누수 방지)이고 capture 모드는 자동 재전송을 하지 않는다(배너 "지금 동기"만). `?state=queued` 픽스처의 큐 항목은 db가 아니라 `+layout.ts QUEUED`가 아웃박스에 시드한다. e2e는 실제 `context.setOffline`(online 이벤트 → 자동 전송)과 `?net=`(새로고침 보존 · 백오프 5회 ≈ 6초)을 나눠 검사한다.
- 다크: `?theme=dark|light`는 문서 루트 `data-theme`에만 적용(저장 안 함, 캡처·e2e용). `pnpm capture --dark`는 화면 기본 상태를 한 번 더 찍는다(`<name>-dark.png`, CI 포함). 웹 탑바 토글은 `localStorage dy.theme`에 기기 단위로 유지 — 로그아웃·`resetMock`에도 남는다(`app.html`이 첫 페인트 전에 적용, `?theme=`가 있으면 그 값이 우선) · PWA는 시스템 다크를 따르고 토글이 없다(DY-design §10). 대비는 `tokens:check`가 light·dark 82쌍 모두 검사.
- capture 모드(`?capture=1`)는 로그인 없이 화면 첫 역할의 데모 세션을 합성해 **셸까지** 그린다(가드 우회 — W3 실 인증 전 제거). 시연 `?scene=N`은 장면 계정으로 `login()`해 localStorage에 남긴다 — 장면이 `?state=`·새로고침으로 해제돼도 로그아웃 전까지 그 계정이 유지된다(`specs/demo-scripts`, 함께 제거). 브라우저 컨텍스트는 `timezoneId: 'Asia/Seoul'`, 표시 포맷터도 `timeZone: 'Asia/Seoul'` 고정. 지도 `[data-map-ready]` 대기 타임아웃은 FAIL로 센다(빈 지도를 녹색으로 세지 않는다). 셸 렌더 시 스크롤 컨테이너는 `<main>`이라 캡처는 main 내용 높이로 뷰포트를 키운다. 외부 의존: CARTO 스타일·타일(네트워크 필요).
- PWA 설치: `apps/pwa/static/manifest.webmanifest`·`app.html` `theme-color`는 정적 파일이라 토큰 값(`sys.color.accent.solid` `#0d2877` · `bg.canvas` `#f8faff`)을 고정 기재 — 토큰이 바뀌면 함께 갱신(`tokens:lint` 범위 밖). 서비스 워커는 preview·배포 빌드에서만 등록되며 e2e `pwa-install`이 오프라인 새로고침 셸을 검사한다.
- 데모 계정: `roles.yaml demo_account`. 픽스처 ID: CPB-003(E-021) · CPB-004(통신 두절) · C-105 · D-27.
- `--strict`(W2): 캐치올 자리 화면("웨이브 N에서 구현됩니다")을 FAIL로 센다 — `data-scr`는 캐치올도 붙이므로 문구로 판별 · 웨이브 Exit "자리 0" 게이트 · CI는 `--dark --strict`. `ssot:check`는 `screens.yaml`의 route **필드**만 검사하고 실 라우트 파일 유무는 보지 않는다.
- `?state=` 픽스처는 capture·e2e 재현 전용 — 명시 `?state=`도, 화면 기본 픽스처(`states[].default`)도 `?capture=1`일 때만 적용하고(live의 `?state=`는 무시 · `bootMock` 키 `live`), 실사용(live) 흐름은 순수 시드에서 시작한다(W1 사고: 기본 픽스처가 live에 적용돼 A2-03이 출근 상태로 열림). 브라우저 mock db는 `bootMock` 키(live / capture|screen|state)별로 세션 동안 유지, 로그아웃에 `resetMock()`.
- e2e의 `page.goto()`(전체 로드)는 mock db(모듈 상태)를 새로 만들고 `logout()`도 `resetMock()`이라, 계정을 바꿔 이어지는 흐름(운전자 제출 → 안전관리자 승인)은 한 테스트에 담기지 않는다 — 중간 상태는 시드(C-106 `assigned`)나 픽스처(`A1-03:docnew`)로 만들고, 같은 화면 안의 전이만 실제 클릭으로 검증한다. capture 모드 키는 `screenForPath`가 정하므로 시트 쿼리(`?sheet=review`)가 다른 화면으로 잡히면 db가 갈린다(값까지 비교).

## 4. 리뷰 정책

- PR = 사람 1명 승인 + `reviewer` 에이전트 판정(머지 가능/불가) 첨부. 미충족 AC가 있으면 머지 불가.
- 생성물 diff는 리뷰 대상에서 접힘(`.gitattributes`) — 원천 diff를 본다.
- 클라이언트 전달·배포·범위 변경은 사람 게이트.

## 5. 추적 규약 검증

- `data-scr` 값 · 테스트 접두 · 커밋 트레일러의 ID는 `ssot`에 실존해야 한다(`check --commits` · `--docs`). `ids.ts` 상수를 import한 코드만 화면 코드를 참조한다.
- FR 0건 화면(고아)·화면 0건 FR은 `docs/generated/TRACE.md`에서 0이어야 한다.
