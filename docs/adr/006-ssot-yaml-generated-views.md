---
id: ADR-006
title: 계약·화면·요구·결정의 단일 원천 = ssot/*.yaml, 문서·코드는 생성 뷰
status: Accepted
date: 2026-09-05
supersedes: —
relates_to: [DISC-017, DISC-025]
---

# ADR-006 — SSOT yaml + 생성 뷰

## 맥락
문서 세트 v0.3은 파이썬 상수 5종에서 문서 7종을 생성했지만 코드와 분리돼 있었다. 앱이 생기면 화면 코드·요구·결정이 문서와 어긋난다. 추적 ID를 코드·테스트·커밋까지 이어야 한다.

## 결정
`ssot/*.yaml`(meta·roles·contract·requirements·interfaces·entities·screens·decisions·options·glossary·scenarios)이 원천. `tools/ssot/check.mjs`가 스키마·ID·유일성·참조 무결성·어휘·화면 규칙·DISC 생애주기를 검사하고, `build.mjs`가 `packages/domain/src/generated/{ssot.json,ids.ts}`와 `docs/generated/*.md`를 결정적으로 생성한다. 계약 문서 생성기는 v0.4 발행 시 이 yaml을 읽도록 이식한다.

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| 파이썬 상수 유지 | 앱(Node)이 못 읽음 · 문법 검사 없음 |
| JSON | 주석·다행 텍스트 저작이 불편 |
| DB/노션 | 리뷰 diff·CI 게이트 불가 |

## 결과
- 저작 방향 1개: 화면→trace, FR→screens. 역방향은 생성(저작 시 check 거부).
- 파생값(건수·범위)은 저장하지 않는다.
- `Refs:` 트레일러·`data-scr`·테스트 접두로 코드까지 추적.

## Rules
- [ ] ID 채번은 축의 다음 번호, 결번 재사용 금지. 화면 ID는 맨 코드.
- [ ] 어휘는 영문 enum(`ssot/README.md`), 한글 라벨은 build의 맵.
- [ ] `ssot/**` 편집 후 `pnpm ssot:check && pnpm ssot:build`, 생성물 diff를 같은 커밋에.
- [ ] `decided` DISC는 `resolved{date,by,summary}` 필수. 되돌리기 어려운 결정은 ADR로 연결.
