@AGENTS.md

# BoomEyes — Claude 영구 규칙

> 영구 규칙·금지·검증만. 진행 상황은 `docs/PLAN.md`, 결정은 `docs/adr/`, 범위는 `ssot/decisions.yaml`.

## 스택 · 경계

- SvelteKit 2 · Svelte 5(runes) · Tailwind v4 · TypeScript strict · pnpm 10 · Node 22. 웹(`apps/web`, compact)과 PWA(`apps/pwa`, comfortable)는 같은 패키지를 쓴다.
- import 경계: `tokens`·`domain` → `ui` → `api-client`·`realtime`·`video`·`map` → `mock` → `apps`. apps 상호 import 금지, `ui`는 `mock` 금지, `cmp` 토큰만 소비.
- 원천: `ssot/*.yaml`(범위·화면·요구·결정) · `packages/tokens/src`(디자인). 생성물은 편집하지 않는다.

## 금지 (hooks가 막는 것은 ✱)

- ✱ `docs/generated/**` · `packages/domain/src/generated/**` · `packages/tokens/dist/**` 직접 편집 — 원천을 고치고 build.
- ✱ `git add -A/--all/.` · force push · `reset --hard` · `--no-verify` · 안전 디렉터리 밖 `rm -rf`.
- 화면 코드의 hex·px·Tailwind 기본 팔레트(`bg-blue-500`, `p-4`의 기본 스케일 의미) — 토큰 유틸리티만(`bg-canvas` `text-fg-muted` `p-inset-md` `text-body-md`). `pnpm tokens:lint`가 검사한다(hex · 기본 팔레트 · 임의값 `[420px]` · 숫자 스케일 `gap-1`(=1px) · `rounded-N` · `z-N` · `<style>`/`style=` px).
- Figma 재동기 · 참조 시스템 그대로 채택 · 화면 전용 토큰 · 다크/브랜드 전용 컴포넌트.
- 자율 배포 · 클라이언트(DY) 전달 문서 발행 · 파괴적 작업 — 사용자 승인 후.
- 검증 없는 "완료" 보고. 캡처 없는 화면 완료, 테스트 없는 상태기계 완료는 완료가 아니다.

## 명명 · 추적 규약

- 화면 ID = `ssot/screens.yaml`의 맨 코드(`B1-02`, `B1-02M`). 라우트 루트 요소에 `data-scr="B1-02"`. 상태 픽스처는 `?state=<states[].id>`.
- 토큰 `<layer>.<category>.<concept>[.<variant>][-<state>]` — 상세 `packages/tokens/dist/DY-design.md` §1.
- 컴포넌트 PascalCase(카탈로그 이름) · prop `variant tone size` + boolean 상태(`disabled loading selected invalid`).
- 커밋: `<type>(<scope>): <요약>` + 본문 + 트레일러 `Refs: SCR-B1-02 FR-012 DISC-040`(ID는 SSOT에 실존해야 함 — `check --commits`). 테스트 제목은 `[FR-012]`/`[B1-02]` 접두. 코드는 `ids.ts` 상수를 import한다.
- 1 task = 1 branch = 1 PR(웨이브 0부터). 변경 파일만 stage.

## 검증 명령

```
pnpm verify          # ssot:check · tokens:check · tokens:lint · lint · check · test · ssot:build · tokens:build · 생성물 diff 0
pnpm ssot:check      # 스키마·ID·참조·어휘·화면 규칙·DISC 생애주기 → 마지막 줄을 PR에 인용
node tools/ssot/check.mjs --specs | --docs | --commits <range>
```
`pnpm lint`(eslint·prettier) · `pnpm check`(svelte-check) · `pnpm test`(vitest) · `pnpm tokens:lint` · `pnpm capture`(빌드 후) — 게이트 정의는 `docs/QA.md`.

게이트 → 커밋 체인은 `&&`만: `pnpm build && pnpm e2e && pnpm verify && git add <files> && git commit …` (`;`는 빨간 게이트를 지나 커밋한다). merge는 verify 녹색 + reviewer 판정 "머지 가능" 인용 둘 다 있을 때만(`METHOD.md` §5).

## 작업 방식

- feature 이상은 플랜 모드 필수(`AGENTS.md` Task Type Matrix). 계획은 `docs/PLAN.md`·`specs/*/tasks.md`에 남긴다.
- 모델 배분: 계획·명세·리뷰 = 상위 모델, 반복 구현·조사 = 하위 모델. 병렬 작업은 worktree.
- 컨텍스트: 큰 생성물은 열지 말고 요약(`docs/generated/*.md`)을 읽는다. 한 작업의 컨텍스트는 spec + tasks + 관련 코드로 제한.
- 완료 보고는 게이트 출력 인용 + 캡처/프리뷰 링크.

## 사고 SOP (append-only — 사고에서 배운 절차를 여기에 추가)

- **2026-09-05 지도 캡처 빈 화면(W0)** — 증상: `b1-02-dash.png`에 타일·마커 없음, DOM 상태(ready·마커 5)는 정상. 원인 2: ① 캡처 도구의 브라우저 `Date`/`Math.random` 프록시(addInitScript)가 MapLibre 로드를 차단 ② 헤드리스 `fullPage`(captureBeyondViewport)가 지도 idle 후 WebGL 캔버스 서브트리(타일+DOM 마커)를 비운 채 촬영(간헐). 절차: 시각 고정은 앱 DemoClock(`data.clock`)만 · 웹 캡처는 뷰포트를 문서 높이로 늘려 일반 촬영 · 지도 캡처는 지도 영역 픽셀 표준편차(빈 ≈13 / 정상 ≈26)로 판정 · "캡처 N장 OK" 로그는 파일 존재만 뜻한다 — 눈으로 확인하기 전엔 완료가 아니다.
- **2026-09-05 숫자 스케일 유틸리티(W0)** — `gap-1`·`px-1`·`min-w-48`은 px 명명 ref 스케일에서 1px·48px(의도 4px·192px)로 조용히 렌더됐다. 절차: 화면·컴포넌트 코드는 sys 유틸리티만(`pnpm tokens:lint`가 차단) · 새 크기가 필요하면 `sys.layout/space/size` 토큰을 먼저 추가.
- **2026-09-05 fg-subtle 정보 텍스트(W0)** — axe color-contrast serious(타임스탬프·그룹 라벨). 절차: `fg-subtle`은 장식·아이콘·placeholder 전용, 텍스트는 `fg-muted` 이상 · 새 배경(sunken·selected)에 텍스트를 올리면 `packages/tokens/scripts/check.mjs` 대비 쌍을 추가.
- **2026-09-05 리뷰 전 머지(W0)** — reviewer 판정(머지 불가 4건)이 오기 전에 커밋 4건을 main에 ff-merge했다. 절차: 브랜치는 reviewer 판정 "머지 가능"을 인용한 뒤에만 merge · 판정 대기 중엔 다음 브랜치에서 작업 · 판정이 늦으면 머지가 늦는 것이지 리뷰를 건너뛰는 것이 아니다.
- **2026-09-05 Turbo 캐시가 워크스페이스 소스 변경을 모름(W1)** — `packages/mock` 수정 후 `pnpm build`가 apps 번들을 캐시에서 재생(라이브러리 패키지에 build 태스크가 없어 해시에 안 잡힘) → e2e가 옛 번들을 검사. 절차: `turbo.json` build·check·lint·test `cache: false`(빌드 2s, 정확성 우선) · "번들에 반영됐나" 의심되면 `pnpm build` 출력의 `cache hit, replaying` 여부 확인.
- **2026-09-05 고아 preview 서버(W1)** — 프로브 스크립트가 띄운 `vite preview`가 살아남아 옛 빌드를 4174로 서빙 → PWA e2e 전부 즉시 실패(자산 404). 절차: e2e·capture 전 `lsof -nP -iTCP:4173 -iTCP:4174 -sTCP:LISTEN`로 리스너 0 확인 · 프로브는 `process.on('exit')`에서 kill.
- **2026-09-05 API 경계 참조 공유(W1)** — mock이 db 객체를 그대로 돌려줘 in-place 전이(승인·접수)가 Svelte 키드 each에 보이지 않음(같은 참조 → 갱신 없음). 절차: API 경계는 `structuredClone` 복사본(실 HTTP와 동일) · 화면은 `invalidateAll()`로 다시 읽는다 · 브라우저 mock db는 세션 동안 유지(`bootMock` 캐시, 픽스처 키별).
- **2026-09-05 API 경계에 $state 프록시(W1)** — `bind:` 로 받은 `$state` 배열을 mock API에 그대로 넘기자 반환값 `structuredClone`이 DataCloneError로 죽고 화면이 조용히 멈춤(토스트 없음). 절차: API 호출 인자는 `$state.snapshot()`으로 벗겨 넘긴다 · 화면의 async 액션은 실패 시 토스트/다이얼로그로 드러낸다(조용한 실패 금지).
- **2026-09-05 게이트 우회(1주차)** — `pnpm verify | grep … && git commit`은 grep 종료 코드를 본다. 절차: verify는 단독 실행 후 exit code 확인 · 실패 원인이 미커밋 생성물 diff뿐인지 로그 끝(`diff --git`)으로 확인.
- **2026-09-05 정규식 치환의 백스페이스(W1)** — Python `re.sub` 치환 문자열의 `\b`가 U+0008로 바뀌어 lint의 팔레트·`<style>` 규칙이 조용히 죽었다(게이트는 녹색). 절차: 정규식 텍스트를 편집할 땐 `str.replace` · 편집 후 `grep -P '\x08'` · lint 규칙마다 생존 프로브(`PROBES`, 죽으면 exit 2).
- **2026-09-05 기본 픽스처가 live에 적용(W1)** — 화면 기본 `?state=` 픽스처를 live 모드에도 적용해 A2-03이 새로고침마다 출근 상태로 열렸다. 절차: 기본 픽스처는 capture 모드에서만 · live는 순수 시드 · 픽스처는 capture·e2e 전용(QA §3).
- **2026-09-05 실시간 알림의 키 중복(W1)** — 장면 1 타임라인이 알림을 db에도 기록하자 `invalidateAll()` 뒤 피드 `[...live, ...data.alerts]`에 같은 id가 두 번 들어가 Svelte `each_key_duplicate`로 갱신이 멈췄다(KPI만 바뀌고 마커·표는 멈춤 · 오류는 콘솔에만). 절차: 실시간 도착분과 다시 읽은 목록은 id로 합친다 · e2e가 "갱신 안 됨"으로 실패하면 `page.on('pageerror')`부터 본다(프로브 스크립트에 상시).
- **2026-09-05 DemoClock 점프가 invalidateAll에 지워짐(W1)** — `bootMock`이 live 진입마다 `clock.reset()`을 불러 "1시간 경과" 오프셋이 다음 load에서 사라졌다. 절차: 화면 진입은 고정 해제(`unfreeze`)만 · 시각 리셋은 `resetMock`(로그아웃)과 장면 해제(`?state=`·`?capture=` 진입 시 `bootMock`)에서만 · 시간 점프 기능은 e2e로 "점프 → 다시 읽기"까지 검사.
- **2026-09-05 편집 스크립트가 게이트 앞에서 조용히 실패(W1)** — 파일 편집용 python 히어독 뒤를 `;`로 이어 스크립트가 `assert`로 죽었는데도 prettier·verify·커밋이 진행돼, 커밋 메시지가 말한 편집 3건 중 2건이 빠진 채 커밋됐다(amend로 정정). 절차: 편집 스크립트도 게이트처럼 `&&`로만 잇는다(히어독 종료 `PYEOF` 뒤 `&& …`) · 커밋 직전 `git diff --stat`/`git show --stat`로 편집이 실제 반영됐는지 본다 · 프리티어가 줄을 바꾸므로 `str.replace` 대상은 포맷 뒤의 실제 텍스트를 읽고 정한다.
- **2026-09-05 상대 경로 셸의 오프라인 부팅 실패(W1)** — 빌드된 SPA 폴백 `index.html`은 절대 경로(`/_app/…`)지만 `vite preview`는 `/` 응답을 상대 경로(`./_app/…`)로 렌더한다 — 서비스 워커가 그 응답을 셸로 캐시하자 `/a2/login` 오프라인에서 `/a2/_app/…`을 찾아 부팅이 실패했다(배포는 파일 서빙이라 재현되지 않는 preview 전용 차이). 절차: PWA는 `paths.relative: false`로 preview·배포 경로를 맞춘다(`specs/shell-auth/design.md` 설치 절) · SW 오프라인 검증은 e2e(`pwa-install`: SW 제어 → offline → reload → 셸)로 · "빈 흰 화면"은 `page.on('requestfailed')`·`pageerror`를 찍는 프로브부터.
- **2026-09-05 파이프가 캡처 실패를 가림(W2)** — `pnpm capture --dark | grep | tail && git commit`은 `tail`의 exit 0을 봐서 `fail 2`(a1-08-sheet: `?sheet=` 모달형 화면에 자리 화면이 없어 `data-scr` 미검출)인 채 커밋·PR까지 진행됐다. 절차: 게이트 명령은 파일로 리다이렉트한 뒤 단독 exit code로 판정(`pnpm capture --dark > log; test $? -eq 0`) · 파이프 뒤에는 커밋을 잇지 않는다 · 모달형 화면(`?sheet=` `?cam=`)은 부모 화면에 `data-scr` 스왑이 생기기 전엔 웨이브 승격을 하지 않는다.
- **2026-09-05 토스트 `.first()` 단언(W2 B5)** — 토스트는 쌓여서 `getByRole('status').first()`가 옛 토스트를 잡아 새 액션의 성공 문구를 못 봤다. 절차: 토스트 단언은 `getByRole('status').filter({ hasText })` · 같은 이름의 버튼이 시트·하단 바에 함께 있으면 `locator('dialog[open]')` 등으로 범위를 좁힌다.
- **2026-09-06 쿼리 전환이 픽스처를 버림(W2 B8)** — 칩·기간 전환을 `goto('/x?kind=…')`로 하자 `?state=&capture=`가 사라져 mock db 키가 live로 바뀌고 픽스처 데이터가 없어진 채 e2e가 실패했다. 절차: 화면 안 쿼리 전환은 `new URL(location.href)`에 `searchParams.set/delete`(A1-08 `withSheet` 패턴) · `URLSearchParams` 생성은 eslint(svelte/prefer-svelte-reactivity)에 걸린다.
- **2026-09-06 감싸는 `<label>`의 접근 가능한 이름(W2 B9)** — `<label>`이 `<select>`를 감싸면 접근 가능한 이름에 option 텍스트까지 들어가 `getByLabel('부품', {exact:true})`가 실패했다. 절차: 라벨은 컨트롤 바깥 형제 `<label for>` · 폼 `aria-label`과 부분 일치하는 라벨 이름은 `exact`로 · 비동기 액션이 `invalidateAll` 뒤 `$derived` 값을 다시 읽으면 상태가 바뀐 뒤라 분기가 뒤집힌다 — 시작 시점 값을 상수로 고정.
- **2026-09-06 ISO 문자열 슬라이스 = UTC(W2 B9)** — `at.slice(0, 16)`으로 시각을 표시해 KST 10:42가 01:42로 찍혔다. 절차: 시각 표시는 `fmtDateTime`/`fmtTime`(Asia/Seoul)만 · 캡처를 눈으로 볼 때 고정 시각(10:42)이 보이는지 확인.
- **2026-09-06 자리 화면을 세는 게이트가 없었음(W2 B15)** — `ssot:check`는 `screens.yaml`의 route 필드만 보고, 캐치올 자리 화면도 `data-scr`를 붙여 캡처가 녹색으로 지나갔다. 절차: `pnpm capture --dark --strict`(자리 화면 = FAIL)를 CI에 두고 웨이브 Exit "자리 0"은 이 게이트 출력으로만 증명 · 리뷰 에이전트가 600초 멈추면 리스너·잔여 프로세스 확인 후 로그 리다이렉트 지시와 함께 새 에이전트로 재리뷰.
- **2026-09-06 기준선 커밋이 브랜치 순서에 끼임(W2.5)** — `baseline` 워크플로는 브랜치에 PNG를 커밋한다. main보다 뒤진 브랜치에서 돌리면 다음 PR 머지에서 바이너리 충돌. 절차: 기준선은 `git merge origin/main` 뒤에만 실행 · 체인 PR은 앞 PR 머지 → `gh pr edit --base main` → main 병합 → 기준선 → CI → 머지 순으로.
- **2026-09-06 shots/baseline manifest 대소문자 충돌(W2.5)** — `manifest.json`(캡처 목록)과 `MANIFEST.json`(렌더 환경)이 같은 디렉터리에 커밋돼 macOS에서 항상 수정 상태로 보였다. 절차: 프리셋 디렉터리에는 소문자 manifest를 쓰지 않는다(capture.mjs) · `git add` 목록에서 `^shots/`를 제외한다(기준선은 CI만 커밋).
- **2026-09-06 편집 스크립트 뒤 `;` 재발(W2.5 D6)** — 히어독 python이 assert로 죽었는데 뒤따른 verify가 부분 편집 상태로 돌아 녹색이 됐다. 절차: `PYEOF` 다음 토큰은 `&&`뿐 · 여러 파일을 고치는 스크립트가 죽으면 `git status --short`로 이미 써진 파일을 확인한 뒤 나머지만 재적용.
- **2026-09-06 리뷰어의 stale ref 비교(W2.5 D2)** — 앞 PR 머지로 base 브랜치가 지워져 `git diff <branch>..HEAD`가 옛 스냅샷과 비교됐다. 절차: 리뷰 지시의 base는 커밋 해시로 준다.
- **2026-09-06 기준선 봇 커밋의 CI가 승인 대기(W2.5 D2)** — `baseline` 워크플로가 github-actions[bot]으로 푸시한 커밋은 PR CI가 `action_required`(승인 대기)로 멈춰 `gh pr checks`에 아무것도 안 보였다. 절차: 기준선 뒤 `gh run list --branch <b> --json headSha,conclusion`로 PR head 커밋의 run을 찾고 `action_required`면 `gh api -X POST repos/<o>/<r>/actions/runs/<id>/approve` · 승인 뒤 녹색을 확인하고 머지.
