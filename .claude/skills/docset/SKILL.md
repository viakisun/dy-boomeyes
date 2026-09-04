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
- 발행본 v0.3과 생성 파이프라인은 `../boomeyes/archive/2026-09-05_docset-v0.3/` (읽기 전용). 원천은 이제 `ssot/*.yaml`.
- 생성기 이식(v0.4)은 별도 작업: `tools/docs-gen/`이 `ssot/*.yaml`을 읽어 docx·xlsx·pdf를 만든다(아카이브 `gen_*.py` 참조).

## 이식 전 절차
1. `docs/generated/DECISIONS.md`·`TRACE.md`·`SCREENS.md`로 v0.3 대비 델타를 표로 정리(신규 ENT/FR/IF/API/DISC/화면·용어·기종).
2. 급한 DY 문서는 아카이브 파이프라인 사용: `archive/README.md` 재현 절차(`.venv` · WeasyPrint · 폰트). 델타를 파이썬 SSOT에 임시 반영하지 말고, 사용자 승인 후 v0.4 이식에서 처리.
3. 클라이언트 전달은 사용자 승인 필수(CLAUDE.md 금지 항목).

## 이식 후 절차
`pnpm docs:set` → `check_set` 정합 → `docs/set/<version>/` 산출 → 세트 규칙(하나 바뀌면 전부 재발행).
