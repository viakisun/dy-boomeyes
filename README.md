# BoomEyes(가칭) — CPB 관제 (웹 백오피스 + 현장 PWA)

코드 목업 → 프로덕션. 방법론: [METHOD.md](METHOD.md) · 진입: [AGENTS.md](AGENTS.md) · 규칙: [CLAUDE.md](CLAUDE.md) · 의도: [INTENT.md](INTENT.md) · 보관: `archive/`(로컬 보관 · git 제외) — 2026-09-05 이전 자료 전부, 로컬 보관(git 제외).

| 경로 | 내용 |
|---|---|
| `ssot/` | 단일 원천 yaml 11(화면 53 · FR 36 · DISC 43) — `ssot/README.md` |
| `tools/ssot/` `tools/hooks/` `tools/capture/` | 게이트·생성 · Claude Code 훅(생성물 편집 차단 · 위험 명령 차단 · 편집 후 게이트) · 캡처 |
| `docs/` | `PLAN`(웨이브) · `DEMO`(시연) · `QA`(게이트) · `adr/` · `retro/`(웨이브 회고) · `generated/`(SCREENS · DOMAIN · TRACE · DECISIONS · DEMO · SPECS) |
| `specs/` | 기능 스펙(spec · design · tasks) |
| `packages/` | `tokens`(DS 원천 → `dist/DY-design.md`) · `domain`(ids.ts · 상태기계 · 세션) · `ui` · `mock` · `map` · `video` |
| `apps/web` `apps/pwa` | SvelteKit 정적 SPA — 웹 백오피스 · 현장 PWA |
| `tests/e2e` · `shots/` | Playwright e2e·axe · 캡처 산출(git 제외) |
| `archive/` | DY 원본 · 문서 세트 v0.3 · 생성 파이프라인 · 검토 메모 · 디자인 참조 — 읽기 전용 |

```
pnpm install
pnpm verify                     # ssot · tokens · tokens:lint · lint · check · test · 생성물 최신성
pnpm build && pnpm e2e && pnpm capture
```

Claude 세션은 이 디렉터리에서 연다. `.claude/settings.json`의 훅이 `tools/hooks/*`를 호출한다. 개인 권한은 `.claude/settings.local.json`(git 제외).
