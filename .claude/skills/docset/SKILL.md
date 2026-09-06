---
name: docset
description: 계약 문서 세트(과업지시서·개발관리대장·설계서·시나리오·브리핑·발표자료) 갱신 요청 시 사용. v0.4 이식 전에는 ssot 델타 목록을 만들고 아카이브 파이프라인 실행 절차를 안내한다. "문서 세트", "v0.4", "과업지시서 갱신", "DY 전달" 언급 시.
when_to_use: |
  - 세트 재발행·버전 올림 요청
  - DY 전달용 문서 갱신
  - 계약 문서 생성기 이식 작업
user-invocable: true
---

# docset — 계약 문서 세트

## 현재 상태
- 발행본 v0.3과 구 파이프라인은 `archive/2026-09-05_docset-v0.3/`(읽기 전용). 원천은 `ssot/*.yaml`.
- 생성기 `tools/docs-gen/`(ADR-011, W2 B14): 설계서(HTML → WeasyPrint PDF) · 델타표 `DELTA.md` · `MANIFEST.md`. 과업지시서·관리대장·시나리오 생성기는 W3(같은 로더). 브리핑·발표자료·목업 html은 폐기 후보.

## 절차
1. `pnpm build && pnpm capture --dark --strict` → `shots/manifest.json`.
2. `pnpm docs:set [--pdf]` → `docs/set/<next_set_version>/{DELTA.md, MANIFEST.md}`(커밋) + `build/BoomEyes_시스템화면설계서_<ver>.html|.pdf`(git 밖, 릴리스 아티팩트). PDF는 WeasyPrint 파이썬(`DOCS_GEN_PDF_PYTHON`, 없으면 아카이브 `.venv` · `DYLD_FALLBACK_LIBRARY_PATH=/opt/homebrew/lib`).
3. `pnpm docs:check`(check_set errors 0)를 PR에 인용. 델타 기준선은 `tools/docs-gen/baseline/<발행판>.json`(`snapshot_baseline.py`로 발행 시 갱신).
4. 정식 발행 = `ssot/meta.yaml set_version` 승격 + `history` 추가 + 태그 `docset-<ver>` + DY 전달 — 전부 사용자 승인 후(CLAUDE.md 금지 항목). 세트 규칙: 하나가 바뀌면 전부 재발행.
