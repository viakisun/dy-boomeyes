---
id: ADR-011
title: 계약 문서 세트 생성기 — tools/docs-gen(파이썬 유지 + ssot 로더) · 설계서 먼저 · 산출물은 매니페스트만 git
status: Proposed
date: 2026-09-05
supersedes: —
relates_to: [ADR-006, ADR-008, DISC-021]
---

# ADR-011 — 문서 세트 생성기 이식 (Proposed — 사용자 승인 후 B14 착수)

## 맥락
문서 세트 v0.3 생성기(파이썬 18파일 · 생성기 9 + check_set · WeasyPrint)는 `archive/`(로컬 · git 제외)에만 있고 파이썬 SSOT를 읽는다. 원천은 이제 `ssot/*.yaml`이며, PLAN W2 결정 지점은 "v0.4 발행(생성기 이식 · 델타 반영)"과 "설계서 v0.4 = 앱 캡처"다. 사용자 결정(9/5): 델타표 + 설계서 생성기만 이식.

## 결정
`tools/docs-gen/`에 파이썬을 유지한 채 이식한다: `ssot_loader.py`(yaml → 기존 생성기가 기대하는 dict 어댑터) → `assemble.py`(설계서, 앱 캡처 `shots/manifest.json` 소비) → `check_set.py`. `pnpm docs:set`은 로컬 실행(`verify` 밖, CI는 `workflow_dispatch`). git에는 `docs/set/<ver>/{DELTA.md, MANIFEST.md}`만 두고 PDF·docx·xlsx는 릴리스 아티팩트(태그 `docset-<ver>`) 또는 S3(ADR-007 후). `tools/capture`는 `shots/manifest.json`(code · state · file · kind · 크기 · dpr · ok · dark)을 출력한다. SOW·RTM·시나리오 생성기는 같은 로더로 W3, 브리핑·발표자료·목업 html은 폐기 후보. 발행·DY 전달은 사람 게이트(CLAUDE.md).

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| 전체 이식(9종 + check_set, 3~5일) | W2 화면 25와 병행 부담 · 설계서 외 문서는 델타가 작음 |
| 델타표만(이식 W3) | "설계서 = 앱 캡처" Exit를 만들 수 없음 |
| Node 재작성(Playwright PDF) | 8~12일 · 기존 조판 자산 폐기 |

## 결과
- 얻는 것: 설계서가 앱 캡처에서 생성 · check_set 게이트 복원 · 델타가 SSOT에서 나옴.
- 잃는 것: 로컬 파이썬·WeasyPrint(pango·cairo·Pretendard) 환경 의존 · 리포에 파이썬 도구 추가.
- 되돌리려면: `tools/docs-gen` 삭제, 아카이브 파이프라인으로 복귀.

## Rules
- [ ] 생성기는 `ssot/*.yaml`·`docs/generated`·`shots/manifest.json`만 읽는다 — 파이썬 SSOT 복제 금지.
- [ ] 산출물(PDF 등)은 git에 넣지 않는다 — 매니페스트(해시·페이지 수·check_set 출력)만.
- [ ] 발행(`set_version` 승격·`history` 추가)과 DY 전달은 사용자 승인 후.

사용자 결정 필요: 파이썬 유지 승인 · wave 4 화면 12의 설계서 처리(프로토타입 v0.3 캡처 재사용 vs 자리) · 브리핑·발표자료 폐기.
