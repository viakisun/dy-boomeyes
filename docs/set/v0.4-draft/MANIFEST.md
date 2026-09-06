# 문서 세트 매니페스트 — v0.4-draft

생성물 — `pnpm docs:set`(`tools/docs-gen/build.py`) · 커밋 `58d4f26` · 생성일 2026-09-06 · 수기 수정 금지.

세트 v0.4-draft(초안). 기준선 v0.3. 문서 번호 VIA-BE-SDD-001(설계서) · VIA-BE-SOW-001(과업지시서, 이번 초안 범위 밖) · VIA-BE-RTM-001(관리대장, 범위 밖). PDF·HTML은 git 밖(`build/`, 릴리스 아티팩트) — 아래 해시로 동일성을 확인한다.

## 입력

| 파일 | sha256(12) |
|---|---|
| `ssot/meta.yaml` | `a7581ed85b37` |
| `ssot/roles.yaml` | `cd9a073b7b5d` |
| `ssot/contract.yaml` | `768fa72796f1` |
| `ssot/requirements.yaml` | `7525c745e8ff` |
| `ssot/interfaces.yaml` | `db3b19a35c73` |
| `ssot/entities.yaml` | `e16bf8116e4f` |
| `ssot/screens.yaml` | `0b3bde9423ae` |
| `ssot/decisions.yaml` | `e8fa0305e031` |
| `ssot/options.yaml` | `af7f7d4cc49e` |
| `ssot/glossary.yaml` | `0a7a9ce4c05b` |
| `ssot/scenarios.yaml` | `8e01967034ed` |
| `shots/manifest.json` | wave 2 · DPR 2 · 라이트 56 · 다크 41 · 실패 0 |

## 산출물

| 파일 | bytes | sha256(12) |
|---|---|---|
| `build/BoomEyes_시스템화면설계서_v0.4-draft.html` | 189833 | `3c5687ce4413` |
| `build/BoomEyes_시스템화면설계서_v0.4-draft.pdf` | 10647862 | `8cbbbc9a8a5c` |
| `DELTA.md` | 8869 | `053f262e141a` |

PDF: PDF 75쪽

## 정합 검사(check_set)

- ✓ errors 0

## 발행 조건(사람 게이트)

- `set_version` 승격 · `ssot/meta.yaml history` 추가 · DY 전달은 사용자 승인 후(ADR-011 · CLAUDE.md). 과업지시서·관리대장·시나리오 생성기는 W3(같은 로더).
