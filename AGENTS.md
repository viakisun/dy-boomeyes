# BoomEyes — 세션 진입 가이드

**프로젝트**: DY CPB 관제 플랫폼(웹 백오피스 + 현장 PWA) 코드 목업 → 프로덕션. 방법론: `../boomeyes/METHOD.md`(v1). 규칙: [CLAUDE.md](CLAUDE.md) · 의도: [INTENT.md](INTENT.md).

## Read Order (작업 시작 시)

| 순서 | 파일 | 이유 |
|---|---|---|
| 1 | `CLAUDE.md` | 영구 규칙·금지·검증 명령 |
| 2 | `INTENT.md` | 목적·역할·성공 기준·판단 규칙 |
| 3 | `docs/PLAN.md` 현재 웨이브 절 | 지금 무엇을 하는가 |
| 4 | 작업 관련 `specs/<feature>/spec.md` → `design.md` → `tasks.md` | 수용 기준·설계·작업 |
| 5 | `docs/generated/SCREENS.md` · `TRACE.md` | 화면 코드·라우트·커버리지(생성물) |

## 어디서 무엇을 찾나

| 찾는 것 | 위치 |
|---|---|
| 화면 코드·라우트·상태 픽스처·웨이브 | `ssot/screens.yaml` → `docs/generated/SCREENS.md` · 코드 상수 `packages/domain/src/generated/ids.ts` |
| 요구(FR/NFR)·화면 커버리지 | `ssot/requirements.yaml` → `docs/generated/TRACE.md` |
| 엔티티·상태기계 | `ssot/entities.yaml` → `docs/generated/DOMAIN.md` |
| 미결 결정(고객용 원장) | `ssot/decisions.yaml` → `docs/generated/DECISIONS.md` |
| 내부 기술 결정 | `docs/adr/` |
| 디자인 시스템(토큰·컴포넌트·플랫폼 가이드) | `packages/tokens/dist/DY-design.md` (원천 `packages/tokens/src`) |
| 데모 장면·트랙 | `docs/DEMO.md` · `ssot/scenarios.yaml` `demo[]` |
| 품질 게이트·패리티 체크리스트 | `docs/QA.md` |
| 용어 | `ssot/glossary.yaml` |
| 계약 문서(SOW·관리대장·설계서) 생성 | `docsset` skill — v0.4 이식 전엔 `../boomeyes/archive/…/boomeyes_build` |
| 참조 자료(원본·Figma·CraneEyes) | `../boomeyes/archive/README.md` |

## Task Type Matrix

| 유형 | 판정 | 절차 |
|---|---|---|
| **trivial** | 오타·주석·내부 리팩터링, SSOT·토큰·spec 영향 없음 | 바로 수정 → `pnpm verify` → 커밋 |
| **feature** | 새 화면·규칙·데이터·컴포넌트 | `/spec`(spec·design·tasks) → 플랜 모드 → 구현 → 게이트 → PR |
| **decision** | 되돌리기 어려운 기술 선택(스택·저장소·프로토콜·토큰 계층) | ADR 초안 → 사용자 승인 → 적용 |
| **scope** | 계약 범위·고객 결정이 필요한 것 | `ssot/decisions.yaml`에 DISC 등록(open) → 사용자 → DY |

**ImpactCheck(4질문)** — 시작 전 자문. 하나라도 yes면 해당 절차 먼저:
1. `ssot/*.yaml`을 바꿔야 하는가? (화면·요구·엔티티·결정·용어) → `/ssot` 절차, 생성물 재생성
2. `packages/tokens/src`를 바꿔야 하는가? (색·타이포·간격·컴포넌트 토큰) → `tokens:check`·`tokens:build`, DY-design.md 재생성
3. 되돌리기 어려운 결정인가? → ADR
4. `specs/`가 없거나 수용 기준이 바뀌는가? → spec 먼저

## 서브에이전트 역할

| 역할 | 파일 | 쓰임 |
|---|---|---|
| implementer | 메인 세션 | 코드·픽스처·테스트 |
| reviewer | `.claude/agents/reviewer.md` | spec 대조·경계 규칙·토큰 규칙 리뷰 (PR 전 필수) |
| verifier | 웨이브 0 이후 | 게이트 실행·캡처 대조·결과 인용 |
| researcher | `.claude/agents/researcher.md` | 외부 조사(제품 스펙·규격) — 결론에 출처 |

## Fallback

불확실하거나 spec이 없으면 구현 전 사용자에게 확인한다. 추측으로 커밋하지 않는다. "완료"는 게이트 출력을 인용할 때만 쓴다.

## 용어

`ssot/glossary.yaml`가 원천. 자주 쓰는 것: CPB(콘크리트 타설 붐) · 호기(1~120) · 업무(Case, 티켓) · 에스컬레이션(1h 미접수 통보) · 현장 프로파일(옵션 8축) · 마모·교체 부품(구 "소모품") · 이벤트 복기(event_id 4소스 동기 재생) · AI 판단 불가.
