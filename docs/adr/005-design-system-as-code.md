---
id: ADR-005
title: 디자인 시스템은 코드가 원천 — Figma·CraneEyes 코드는 참조만
status: Accepted
date: 2026-09-05
supersedes: —
relates_to: [DISC-021, DISC-040]
---

# ADR-005 — 디자인 시스템 코드 원천 (Figma 참조만)

## 맥락
DY의 Figma "[DY] Crane Eyes"(navy 브랜드, 모바일 컴포넌트 36세트)와 CraneEyes 백오피스 코드 토큰(흑백)이 서로 다른 언어였다. 사용자 결정: Figma를 채택하지 않고 참조해서 **명명 규칙부터 새로 체계화**, Figma는 앞으로 쓰지 않는다. 문서(`DY-design.md`)는 시스템이 생성한다.

## 결정
`packages/tokens/src`(ref/sys/cmp yaml·json + 브랜드 팩 + 컴포넌트 카탈로그 + 산문)가 디자인 시스템의 유일한 원천이다. 빌드가 `tokens.css` · `theme.css` · `tokens.json` · `<brand>-design.md`를 생성한다. Figma 동기 도구는 만들지 않는다.

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| Figma 변수 동기(figma-sync) | Figma를 쓰지 않기로 함 · 램프 12단·모드·대비 게이트를 Figma가 못 담음 |
| CraneEyes 코드 토큰 채택 | 흑백·제로라운드 언어가 navy 브랜드·상태색 요구와 불일치 |
| 디자이너 수동 문서 | 드리프트 · 리뷰 불가 |

## 결과
- 디자이너 리뷰 = 브랜드 앵커·역할 이름 단위 리뷰(값은 생성).
- 참조 스냅샷은 `../boomeyes/archive/design-reference/`, `docs/design/figma/`(읽기 전용).

## Rules
- [ ] 색은 앵커 hex → OKLCH 12단 자동 생성. 램프 값을 손으로 고치지 않는다(앵커·사다리를 고친다).
- [ ] 컴포넌트 이름·변형 어휘는 `src/components.json`이 원천. 새 컴포넌트는 카탈로그 먼저.
- [ ] `dist/`는 커밋하되 편집 금지.
