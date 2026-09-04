---
id: ADR-001
title: 웹·PWA 스택 통일 — SvelteKit 2 + Svelte 5 + Tailwind v4
status: Accepted
date: 2026-09-05
supersedes: —
relates_to: [OUT-001, OUT-002, OUT-003, OUT-004]
---

# ADR-001 — 웹·PWA 스택 통일 (SvelteKit 2 · Svelte 5 · Tailwind v4)

## 맥락
계약 산출물은 PWA 2종(A1/A2, A3 모드 포함)과 WEB 2종(B1~B3 스코프, B4). 팀은 FE 2인 + AI 에이전트, 6개월. DY의 기존 CraneEyes 백오피스가 SvelteKit이라 셸·승인 흐름·에러코드 관리의 구조를 참조할 수 있다. 화면 53개를 두 밀도로 만들어야 하므로 UI 패키지 공유가 핵심이다.

## 결정
`apps/web`(B0~B4, adapter-static SPA)과 `apps/pwa`(A1~A4, adapter-static + vite-plugin-pwa)를 **SvelteKit 2 + Svelte 5(runes) + Tailwind v4**로 통일하고 `packages/ui`·`domain`·`tokens`를 공유한다.

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| React/Next.js | 참조 구조(SvelteKit) 전부 재구현, DS 컴포넌트 이중 작업 +15pd |
| 웹은 SvelteKit·앱은 네이티브 | 스토어 배포·2코드베이스, 목업 단계에 과함 |
| 서버 렌더(adapter-node) 기본 | 서버 세션 요구(DISC-020) 전까지 불필요 — `+page.server.ts` 미사용 원칙으로 전환 비용 0 |

## 결과
- 하나의 컴포넌트가 밀도 토큰으로 두 플랫폼을 소화한다.
- Svelte 5 runes 학습 비용은 있으나 상태기계·픽스처 모델과 잘 맞는다.
- 되돌리려면: `packages/ui`를 다른 프레임워크로 재작성 — 비용이 커서 웨이브 1 전에만 재고.

## Rules
- [ ] 두 앱은 같은 `packages/ui`·`domain`·`tokens`를 쓴다. 앱 전용 컴포넌트는 앱 안에만.
- [ ] `+page.server.ts`·서버 훅 미사용(정적 배포 유지, ADR-007).
- [ ] Svelte 5 runes(`$state` `$derived` `$props`)만. 레거시 스토어 문법 금지.
