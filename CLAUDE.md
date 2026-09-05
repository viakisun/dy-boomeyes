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
