# boomeyes-app

BoomEyes(가칭) CPB 관제 — 웹 백오피스 + 현장 PWA. 코드 목업 → 프로덕션. 방법론: `../boomeyes/METHOD.md`. 진입: [AGENTS.md](AGENTS.md) · 규칙: [CLAUDE.md](CLAUDE.md) · 의도: [INTENT.md](INTENT.md).

| 경로 | 상태 | 내용 |
|---|---|---|
| `ssot/` | 있음 | 단일 원천 yaml 11 (화면 53 · FR 36 · DISC 43 …) — `ssot/README.md` |
| `tools/ssot/` | 있음 | `check.mjs`(게이트) · `build.mjs`(생성) · `convert_from_archive.py`(1회) |
| `tools/hooks/` | 있음 | Claude Code 훅 — 생성물 편집 차단 · 위험 명령 차단 · 편집 후 게이트 |
| `docs/generated/` | 생성 | SCREENS · DOMAIN · TRACE · DECISIONS · SPECS |
| `docs/adr/` | 있음 | 결정 기록 (001·004·005·006 Accepted, 002·003·007 Proposed) |
| `docs/PLAN.md` `DEMO.md` `QA.md` | 예정 | 웨이브 계획 · 데모 장면 · 게이트 |
| `specs/` | 예정 | 기능 스펙 (spec · design · tasks) |
| `packages/tokens/` | 있음 | 디자인 시스템 원천 · `dist/DY-design.md` |
| `packages/domain/src/generated/` | 생성 | `ssot.json` · `ids.ts` |
| `apps/web` `apps/pwa` `packages/ui` … | 웨이브 0 | 스캐폴드 |

```
pnpm install
pnpm verify                     # ssot·tokens 검사 + 생성물 최신성
pnpm ssot:build · pnpm tokens:build
```
