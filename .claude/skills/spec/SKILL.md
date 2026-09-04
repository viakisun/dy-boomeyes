---
name: spec
description: 기능 스펙 작성·갱신 (specs/<feature>/{spec,design,tasks}.md). 새 화면·규칙·데이터·컴포넌트 요청, "스펙", "수용 기준", "AC" 언급 시 사용. ImpactCheck → SSOT 조회 → 템플릿 생성 → AC ≥3 · ID 실존 검사 → SPECS.md 재생성.
when_to_use: |
  - 새 기능·화면·규칙·데이터 요청 (feature 유형)
  - 기존 spec의 수용 기준 변경
  - "이 화면 스펙 있어?" "AC 써줘"
user-invocable: true
---

# spec — 기능 스펙 작성

## 1. ImpactCheck (AGENTS.md)
ssot yaml 변경? → `/ssot` 먼저. 토큰 변경? → tokens. 되돌리기 어려운 결정? → ADR. 이 중 없으면 spec 진행.

## 2. 대상 확정
- `docs/generated/SCREENS.md`에서 화면 코드·라우트·상태 픽스처·웨이브 확인. 화면이 없으면 `/ssot`로 먼저 등록.
- `docs/generated/TRACE.md`에서 FR·IF·ACC 확인. 요구가 없으면 `/ssot`.
- 기능 이름은 kebab-case(`shell-auth` `control-dashboard` `task-escalation` …). `specs/README.md`의 12기능 목록을 따른다.

## 3. 생성 (템플릿 `specs/README.md`)
- `spec.md`: frontmatter `id status: draft wave screens[] fr[]` · 목적 · 역할 · 화면 표(코드·라우트·상태) · **수용 기준 `**AC-n**` Given/When/Then ≥3, 각 AC에 FR/IF ID** · 상태 픽스처 목록 · 비범위.
- `design.md`: 컴포넌트(카탈로그 이름) · cmp 토큰 · 데이터(ENT)·상태기계 · 라우트/쿼리(`?state=`) · 오프라인/오류/빈 상태 · 접근성.
- `tasks.md`: 순서 · 각 작업의 DoD(게이트 명령·캡처 상태) · 예상 커밋 Refs.

## 4. 검증
```
node tools/ssot/check.mjs --specs   # frontmatter ID 실존 · AC ≥3
pnpm ssot:build                     # SPECS.md 재생성 → 커밋에 포함
```
수용 기준이 없으면 중단하고 사용자에게 묻는다. 추측으로 AC를 만들지 않는다.
