---
name: ssot
description: ssot/*.yaml 항목 추가·수정 절차 (화면·FR/NFR·IF/API·ENT·DISC·용어·데모 장면). "화면 추가", "DISC 등록", "요구 추가", "용어" 언급 시 사용. ID 채번 → 저작 방향 → enum → check → build → 생성물 diff.
when_to_use: |
  - 화면·요구·엔티티·인터페이스·결정·용어·데모 장면 추가/변경
  - 검사 실패(참조 미정의·문법) 해결
  - DISC 확정(decided) 처리
user-invocable: true
---

# ssot — 원천 편집 절차

1. **채번**: 축의 마지막 번호 +1 (`docs/generated/*.md`에서 확인). 결번 재사용 금지. 화면은 표면 내 다음 번호, 맨 코드(표면 접두 + 2자리).
2. **저작 방향**: 화면 → `trace{task,out,rfp,disc,if}` · FR → `screens[] if[] acc[]` · IF → `screens[]` · DISC → `scope[]`. 역방향(`screens[].fr`)은 쓰지 않는다.
3. **어휘**: `ssot/README.md` enum만. 한정어는 `note`. 화면은 `wave`(0..7)와 `states[]`(kebab id, `default` 지정).
4. **DISC 확정**: `status: decided` + `resolved{date, by, summary, adr?}`. 되돌리기 어려운 결정이면 ADR 번호 연결.
5. **검사·생성**:
```
pnpm ssot:check     # 마지막 줄 인용
pnpm ssot:build     # docs/generated · packages/domain/src/generated 갱신
git add ssot docs/generated packages/domain/src/generated
```
6. 계약 문서(SOW·관리대장·설계서)에 영향 있으면 `/docset`로 델타 목록을 남긴다.
