---
id: ADR-004
title: 토큰 3층(ref/sys/cmp) · 모드(테마×밀도) · Tailwind 기본 스케일 교체
status: Accepted
date: 2026-09-05
supersedes: —
relates_to: [DISC-021]
---

# ADR-004 — 토큰 3층 · 모드 · Tailwind 스케일 교체

## 맥락
디자인 시스템을 코드로 정의한다(ADR-005). 색·간격·타이포는 웹(compact)과 PWA(comfortable), light/dark, 사업자 브랜드에 따라 값이 달라져야 하지만 구조는 하나여야 한다. Tailwind v4의 기본 팔레트·0.25rem 간격 스케일은 시스템 밖의 값이 화면에 섞이는 통로다.

## 결정
- 토큰은 `ref`(원시) → `sys`(시맨틱) → `cmp`(컴포넌트) 3층. `cmp`는 `sys`만 참조, `ref`는 별칭을 갖지 않는다(액센트 예외). 문법 `<layer>.<category>.<concept>[.<variant>][-<state>]`.
- 모드는 같은 경로에 값만 다름: `$value: {light, dark}` · `{comfortable, compact}`. 한 토큰이 두 차원에 동시에 의존하면 빌드 실패.
- Tailwind `@theme`에서 `--color-*` `--spacing` `--font-*` `--text-*` `--radius-*` `--shadow-*`를 `initial`로 지우고 시스템 토큰만 노출한다. 간격은 px 명명(`p-16` = 16px).

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| Tailwind 기본 스케일 유지 + 토큰 병행 | 두 스케일이 섞여 `p-4`의 뜻이 문맥마다 다름 |
| 2층(primitive/semantic) | 컴포넌트 치수가 sys에 새어 나와 밀도 전환이 깨짐 |
| CSS 변수만, 유틸리티 없음 | 에이전트가 쓰기에 유틸리티 이름이 더 안전(문법 검사 가능) |

## 결과
- `tokens:check`가 문법·계층·모드 차원·대비(76쌍)를 게이트로 강제한다.
- 새 값은 기존 값으로 표현 불가함을 보인 뒤에만 추가.

## Rules
- [ ] 화면 코드는 sys/cmp 유틸리티만. hex·px·기본 팔레트 0건(`tokens:lint`).
- [ ] 밀도는 문서 루트 `data-density`, 테마는 `data-theme`. 컴포넌트 안에서 국소 강제는 `CameraWall` 류만.
- [ ] 브랜드는 `src/brands/<ID>.json` — 토큰 경로에 브랜드명 금지.
