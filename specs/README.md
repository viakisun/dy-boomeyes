# specs — 기능 스펙 (저작 · 기능 단위)

인덱스는 생성물 [../docs/generated/SPECS.md](../docs/generated/SPECS.md)(frontmatter에서 생성). 상태 전환은 frontmatter `status`로 하고 폴더를 옮기지 않는다.

## 기능 12 (계획)

| 기능 | 화면 | 웨이브 | 상태 |
|---|---|---|---|
| `shell-auth` | B0-01 · A1-01 · A2-01 · A3-01 · A4-01 + WebShell/PwaShell | 0~1 | draft |
| `control-dashboard` | B1-02 · B1-02M | 0~1 | draft |
| `task-escalation` | B1-03 · B1-04 · A1-02 · A1-03 · A1-08 · A2-04 · A3-02 · A3-05 · B3-03 | 1~2 | — |
| `driver-daily` | A2-02 · A2-03 · A2-05 · A2-06 | 1~2 | — |
| `admin-protocol-rules` | B4-02 · B4-05 | 1 | — |
| `video-basics` | A1-04 · A1-05 · B1-02M(영상) · A3-04 · B2-03 | 1~2 | — |
| `documents` | A2-05 · A1-02 · B1-05 · B3-04 · B4-06 · A4-06 | 2 | — |
| `sites-assets-leases` | B4-03 · B4-04 · B1-06 · A1-07 · A3-03 · B2-02 | 2 | — |
| `records-reports` | A1-06 · A3-06 · B3-05 · B2-04 | 2 | — |
| `equipment-parts` | B4-07 · B4-08 · A1-11 · A2-09 · B3-07 | 2~4 | — |
| `event-replay` | B1-08 | 2~4 | — |
| `owner-showcase` | A4-02~05 · B1-07 · B3-02 · B3-06 | 4 | — |

## 절차

`/spec` skill: ImpactCheck → SSOT 조회(`docs/generated/SCREENS.md` `TRACE.md`) → 아래 템플릿으로 3파일 → `node tools/ssot/check.mjs --specs` → `pnpm ssot:build`(SPECS.md). 수용 기준 없이 구현 시작 금지.

## 템플릿

### spec.md
```md
---
id: SPEC-<feature>
status: draft            # draft | approved | done
wave: 0
screens: [B0-01]
fr: [FR-001]
---
# <기능 이름>
## 목적 · 역할
## 화면
| 코드 | 이름 | 라우트 | 상태 픽스처 |
## 수용 기준
- **AC-1** Given … When … Then … [FR-001]
## 상태 픽스처
## 비범위
```
### design.md
컴포넌트(카탈로그 이름) · cmp 토큰 · 데이터(ENT)·상태기계 · 라우트/쿼리(`?state=`) · 오프라인/오류/빈 상태 · 접근성 · 열린 질문(DISC).
### tasks.md
순서 있는 체크리스트 — 각 작업에 DoD(게이트 명령·캡처 상태)와 예상 커밋 `Refs:`.
