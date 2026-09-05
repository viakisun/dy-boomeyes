# BoomEyes AI 개발 방법론 v1.1 (2026-09-05 · W0 회고 반영)

개정 이력: v1(제안, 9/5 오전) → v1.1(W0 회고 `docs/retro/W0.md`, 9/5 밤) — 변경점은 §11.

한 줄: **사람은 의도·결정·검수를, 에이전트는 명세→구현→검증 루프를, 시스템은 단일 원천에서 문서·코드·검사를 생성한다.**

적용 대상: BoomEyes(가칭) CPB 관제 — 웹 백오피스 + 현장 PWA, 6개월, FE 2인 + AI 에이전트, 계약 문서 세트를 DY에 전달하는 프로젝트.

## 0. 지난 두 달에서 나온 교훈

| 잘된 것 | 부족했던 것 | 도출 원칙 |
|---|---|---|
| SSOT(파이썬 5종) → 문서 7종 생성, `check_set` 정합 검사 | 코드와 분리된 문서 SSOT — 앱이 생기면 곧 어긋남 | 원천은 하나, 문서와 코드 둘 다 그 원천에서 생성 |
| 식별자 추적(RFP→과업→OUT→FR→IF→SCR→DISC) | 추적이 문서 안에서 끝남 | 추적 ID를 코드·테스트·커밋까지 연장 |
| 설계서 105p | HTML 프로토타입 캡처에 의존 — 화면 하나 추가에 프로토타입·캡처·조판 재작업 | 설계 근거는 앱 자체(캡처 자동), 프로토타입 폐기 |
| 결정을 DISC로 관리(미결 32) | 계획은 채팅 플랜 파일에, 결정은 세션 메모리에 | 계획·결정은 리포 문서로(버전·리뷰 가능) |
| 디자인 시스템을 코드로 생성(`DY-design.md`) | 참조 DS를 그대로 채택할 뻔함 | 참조는 참조, 시스템은 코드에서 정의 |
| 문서 톤·분량 규칙(1장 1메시지, 표 ≤5행) | 검증 없이 "완료" 보고한 적 있음 | 완료 = 게이트 출력 인용 |

## 1. 일곱 기둥

1. **Intent first.** 왜 만드는지·누구를 위한 것인지·무엇을 하지 않는지를 먼저 1~2쪽으로 고정한다. 에이전트가 판단할 때 읽는 문서이며 거의 바뀌지 않는다.
2. **Executable specs.** 기능 단위 명세의 수용 기준(Given/When/Then)이 곧 테스트·상태 픽스처·캡처가 된다. 수용 기준 없는 작업은 시작하지 않는다.
3. **One source, generated views.** 구조화된 SSOT(`ssot/*.yaml`)에서 계약 문서(SOW·관리대장·설계서), 코드 레지스트리(화면·엔티티·추적), 디자인 문서(`DY-design.md`)를 생성한다. 손으로 유지하는 카탈로그는 없다.
4. **Traceability by ID.** RFP → FR/NFR → SCR → 컴포넌트/라우트(`data-scr`) → 테스트 ID → 커밋 트레일러(`Refs: SCR-B1-02 FR-012`). 커버리지는 빌드가 센다.
5. **Verification is the Definition of Done.** typecheck · lint(토큰 hex/px 0건) · unit(상태기계) · e2e(상태별 라우트) · 시각 회귀 · a11y(axe) · 레지스트리 커버리지 · 문서 정합. 사람은 게이트 결과와 데모를 본다.
6. **Agent operating system.** `CLAUDE.md`(영구 규칙) · `AGENTS.md`(진입·읽기 순서) · skills(반복 절차) · hooks(게이트 자동 실행) · 서브에이전트(구현/검토/검증 분리) · 플랜 모드(비자명 작업) · 메모리(세션 연속) · worktree(병렬).
7. **Small batches, visible progress.** 1 task = 1 branch = 1 PR, 매 PR 프리뷰 배포, 주간 데모, 웨이브 회고에서 규칙을 갱신한다.

## 2. 작업 루프

```
INTENT ──▶ SPEC ──▶ PLAN ──▶ IMPLEMENT ──▶ VERIFY ──▶ REVIEW ──▶ MERGE ──▶ GENERATE ──▶ LEARN
 사람        사람+AI    AI(플랜모드)  AI(서브에이전트)  시스템     사람(데모)   시스템     시스템        사람+AI
```

| 단계 | 입력 | 출력 | 담당 | 게이트 |
|---|---|---|---|---|
| Intent | 계약 문서·DY 결정 | `INTENT.md` | 사람 | 사용자 승인 |
| Spec | Intent · SSOT 항목(FR/SCR) · DS | `specs/<feature>/spec.md`(수용 기준) · `design.md`(기술 설계) | AI 초안 → 사람 확정 | 수용 기준 존재 · ID 링크 |
| Plan | spec | `tasks.md`(순서·DoD) · `docs/PLAN.md` 갱신 | AI(플랜 모드) → 사람 승인 | 작업당 검증 방법 명시 |
| Implement | tasks · cmp 토큰 · 목 데이터 | 코드 · 상태 픽스처 · 테스트 | AI implementer + reviewer 서브에이전트 | hooks(typecheck·lint) |
| Verify | 코드 | 게이트 리포트 · 캡처 | 시스템(CI) + verifier 서브에이전트 | 전부 통과 |
| Review | 브랜치 · 캡처 · 게이트 출력 | 판정 "머지 가능/불가" + 심각도별 근거(file:line) | reviewer 에이전트 + 사람(데모 관점) | "머지 가능" 인용 없으면 merge 금지 |
| Merge | PR | main | 시스템 | ff/squash · 트레일러 · verify 녹색 + reviewer 판정 인용 |
| Generate | main | 문서 세트 · 레지스트리 문서 · DS 문서 | 시스템 | 정합 검사 |
| Learn | 회고 | ADR · CLAUDE.md 규칙 · 메모리 · 방법론 개정 | 사람+AI | — |

작업 분류: **trivial**(오타·주석·내부 리팩터링 → 바로) / **feature**(새 화면·규칙·데이터 → spec 필요, 플랜 모드) / **decision**(되돌리기 어려운 선택 → ADR) / **scope**(계약 범위 변화 → DISC 등록 + 사람 결정). danngam의 ImpactCheck 4질문을 그대로 쓴다.

## 3. 문서 체계 — 저작은 적게, 생성은 많이

| 파일 | 성격 | 수명 | 역할 |
|---|---|---|---|
| `INTENT.md` | 저작 | 안정(분기 1회) | 목적 · 7역할과 일(Jobs) · 성공 기준 · 비목표 · 제약(LTE·장갑·오프라인·개인정보) · 데모 우선순위 |
| `CLAUDE.md` | 저작 | 영구 | 금지·컨벤션·검증 명령·사고에서 나온 SOP(aprofleet 방식) |
| `AGENTS.md` | 저작 | 영구 | 읽기 순서 · 어디서 무엇을 찾나 · 작업 유형 매트릭스 · 용어(danngam 방식) |
| `docs/adr/NNN-*.md` | 저작 | 추가만 | 되돌리기 어려운 결정: 스택 통일 · 트랜스포트 목 · MapLibre · 토큰 3층 · Tailwind 스케일 교체 · DS-as-code · SSOT yaml |
| `specs/<feature>/{spec,design,tasks}.md` | 저작 | 기능 완료 후 보관 | 기능 12개 내외(셸·대시보드/지도·영상·업무/에스컬레이션·출퇴근/점검·서류·장비/부품·임대/사업주·관리자·현장 프로파일·이벤트 복기·쇼케이스) |
| `docs/PLAN.md` | 살아있음 | 매주 | 웨이브·현재 작업·다음 결정 지점 |
| `docs/DEMO.md` | 살아있음 | 데모마다 | 시연 장면 1~10 ↔ 트랙 D1~D5 ↔ 라우트·상태·데이터 |
| `docs/QA.md` | 저작 | 웨이브마다 | 게이트 정의 · 화면 패리티 체크리스트 |
| `docs/generated/{SCREENS,DOMAIN,TRACE}.md` | 생성 | 빌드마다 | 레지스트리·엔티티·추적 커버리지 |
| `DY-design.md` | 생성 | 토큰 변경마다 | 디자인 시스템 |
| 계약 문서 세트(SOW·관리대장·설계서·시나리오·브리핑) | 생성 | 마일스톤마다 | DY 전달분 — `ssot/`에서 생성, 설계서 화면은 앱 캡처 |

만들지 않는 것: 화면별 md(53×3), 설계서 내용의 리포 복제, 손 카탈로그, 채팅에만 있는 계획.

## 4. 리포 구조

```
boomeyes/                 git 루트 = Claude 세션 진입점(메모리 키) — 코드·명세·문서·SSOT의 단일 원천
  METHOD.md               이 문서 · archive/ (2026-09-05 이전 자료, 로컬 보관 · git 제외)
  CLAUDE.md AGENTS.md INTENT.md
  ssot/                   entities · screens · requirements · interfaces · decisions · glossary (yaml + schema)
  specs/<feature>/
  docs/ adr/ PLAN.md DEMO.md QA.md generated/
  packages/ tokens(있음) · ui · domain(ssot에서 생성) · mock · api-client · realtime · video · map
  apps/ web · pwa
  tools/ ssot-gen(yaml → 타입·레지스트리·문서) · capture · docs-gen(계약 문서 생성기 이식) · figma(참조 읽기, 보관)
```

계약 문서 생성기(파이썬)는 `archive/…/boomeyes_build`에 보존한다. v0.4 발행이 필요해지는 시점(부품 모듈·기종 변경 반영)에 `ssot/*.yaml`을 읽도록 이식한다. 그 전에 급한 DY 문서 갱신은 아카이브 파이프라인으로 처리한다.

## 5. 에이전트 운영 규칙

- **세션 진입**: `AGENTS.md` 읽기 순서 — `CLAUDE.md` → `INTENT.md` → `docs/PLAN.md`(현재 웨이브) → 해당 `specs/` → `tasks.md`. 메모리는 사실만, 계획은 문서로.
- **서브에이전트 역할**: implementer(코드·픽스처) · reviewer(spec 대조·경계 규칙) · verifier(게이트 실행·캡처 대조) · researcher(외부 조사·제품 스펙). 병렬 작업은 worktree.
- **hooks**: 편집 후 prettier · 커밋 전 typecheck+lint+`tokens:lint` · 푸시 전 unit · PR에서 e2e·시각 회귀·a11y·커버리지.
- **사람 게이트만 남기는 것**: 클라이언트 전달 문서 발행 · 범위 변경(DISC) · 디자인 앵커(브랜드·역할 이름) 변경 · 파괴적 작업 · 배포.
- **완료 보고 규칙**: 게이트 출력을 인용한다. 캡처 없는 화면 완료, 테스트 없는 상태기계 완료는 완료가 아니다.
- **컨텍스트 위생**: 생성물(`dist/` `generated/`)은 편집 금지 · 큰 파일은 요약 대신 링크 · 한 작업의 컨텍스트는 spec + tasks + 관련 코드로 제한.
- **모델 사용**: 계획·명세·리뷰는 상위 모델, 반복 구현·조사는 하위 모델. 플랜 모드는 feature 이상에서 필수.
- **머지 규칙**(v1.1): 브랜치는 `pnpm verify` 녹색과 reviewer 판정 "머지 가능" 인용 둘 다 있어야 merge. 판정 대기 중엔 다음 브랜치에서 작업한다(W0 1회 위반 → CLAUDE.md SOP).
- **명령 체인**(v1.1): 게이트 → 커밋은 `&&`로만 잇는다. `;`로 이으면 빨간 게이트를 지나 커밋된다(W0 2회).
- **API 경계·픽스처**(v1.1): mock/실 API 모두 반환은 복사본(`structuredClone`), 화면은 `$state.snapshot`으로 넘긴다. `?state=` 픽스처는 capture·e2e 전용이며 실사용 흐름은 순수 시드(ADR-002 Rules · QA §3).

## 6. 품질 게이트 (DoD)

| 게이트 | 검사 | 실패 시 |
|---|---|---|
| 타입·정적 | svelte-check(error 0) · ESLint(경계 규칙) · Prettier | 커밋 차단 |
| 토큰 | `tokens:check`(문법·계층·대비 82쌍) · `tokens:lint`(hex · 기본 팔레트 · 임의값 · 숫자 스케일 · rounded-N · z-N · 초기화된 기본 스케일 · style px — 규칙 생존 프로브 포함) | 커밋 차단 |
| 단위 | 상태기계 · 프로파일→플래그 · 프로토콜 검증·파서 · 요청/에스컬레이션/출근/점검/규칙 mock | 푸시 차단 |
| e2e | 역할 로그인 8 · 가드/403 · 화면별 AC 스모크 · realtime · 오프라인 · axe serious/critical 0(W1 착수 시점 55건) | PR 차단 |
| 캡처 | 라우트 × 상태 전수(웨이브 이하) · 셸 포함 · TZ 고정 · 지도 idle 실패 집계 · 시각 회귀 기준선(0.2%)은 W1 항목 | PR 차단 |
| 커버리지 | SCR 레지스트리 = 라우트 = 캡처(`current_wave` 이하 route·spec 필수) · FR→테스트 ID 매핑 | PR 차단 |
| 문서 정합 | `ssot` 스키마 · 생성 문서 최신 · `--specs/--docs/--commits` · 계약 문서 세트 `check_set`(v0.4 이식 후) | 커밋·PR·발행 차단 |

## 7. 리듬과 측정

- 일: 작업 단위 PR 1~3건 · 프리뷰 URL로 확인.
- 주: 데모 빌드 · DY 싱크 · `PLAN.md` 갱신 · 미결 결정 정리.
- 웨이브(2~4주): 회고 → `CLAUDE.md`·skills·방법론 개정 · 문서 세트 발행 여부 결정.
- 측정: spec→merge 리드타임 · 게이트 첫 통과율 · 재작업률(리뷰 후 수정 PR 비율) · 데모 장면 커버리지 · SCR/FR 추적 커버리지 · 문서 정합 실패 수.
- W0 실측(9/5): 브랜치 8 · 첫 판정 "머지 가능" 1/8 · 리뷰가 잡은 결함 17(미구현 AC 6 · 게이트 우회 3 · 데이터 유실/비반응 3 · 문서 드리프트 3 · AX-1 우회 2) · 사고 SOP 11건. 상세 `docs/retro/W0.md`.

## 8. 도입 2주

| 주 | 할 일 | 산출물 | 결과 |
|---|---|---|---|
| 1 | 문서 초판 · SSOT 구조화(v0.3 파이썬 → `ssot/*.yaml` 변환 스크립트, 영상·소모품 v2.0 델타 반영) · 게이트 스캐폴드(CI·hooks) · skills 4종(spec · screen · capture · docset) | `INTENT.md` `CLAUDE.md` `AGENTS.md` `docs/PLAN.md` `docs/DEMO.md` `docs/QA.md` ADR 6 · `specs/` 인덱스 + 웨이브 0·1 기능 스펙 · `ssot/` | 완료(9/5 오전) — ADR 7 · spec 2 · ssot yaml 11 |
| 2 | 웨이브 0을 이 루프로 수행 — 스캐폴드 · `packages/ui`가 cmp 토큰 소비 · 셸 2종 · B0-01·B1-02 관통 · 캡처·게이트 통과 | 첫 프리뷰 URL · 회고 → 방법론 v1.1 | 완료(9/5) — W0 + W1 기능 4 선행 · 회고 → v1.1(이 문서) · 프리뷰 URL은 AWS 계정 대기 |

## 9. 하지 않는 것

문서 과잉(화면별 md) · 채팅에만 있는 계획 · 손으로 유지하는 카탈로그 · 검증 없는 완료 보고 · Figma 재동기 · 대형 PR(화면 3개 초과) · 에이전트 자율 배포·클라이언트 전달 · 참조 시스템 그대로 채택.

## 10. 사용자 결정 필요

1. 리포 구조 — ~~형제 유지 vs 포함~~ → **결정(2026-09-05): `boomeyes/` 단일 루트**(코드 리포를 루트로 통합, 아카이브는 로컬 보관).
2. ~~`ssot/*.yaml` 전환을 1주차에 할지~~ → **결정(9/5): 1주차에 전환 완료**(yaml 11 · check/build).
3. 프리뷰 배포 인프라 — S3+CloudFront(ADR-007 Proposed) — **대기: AWS 계정(DISC-006)**.
4. ~~리뷰 정책~~ → **결정(9/5): reviewer 에이전트 판정 필수 + 사람 1명**(§5 머지 규칙).
5. ~~웨이브 길이~~ → **결정(9/5): 2주**(`docs/PLAN.md`).

## 11. 개정 이력

- v1.1(2026-09-05): W0 회고(`docs/retro/W0.md`) 반영 — §2 Review/Merge 행 · §5 머지 규칙·명령 체인·API 경계/픽스처 · §6 게이트 현행화 · §7 W0 실측 · §8 결과 열 · §10 결정 현행화.
- v1(2026-09-05): 제안 승인.
