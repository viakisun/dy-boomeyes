---
id: ADR-008
title: 시각 회귀 기준선 — 저장 위치·범위·갱신 절차
status: Accepted
date: 2026-09-05
supersedes: —
relates_to: [DISC-006]
---

# ADR-008 — 시각 회귀 기준선 (Accepted 2026-09-06 — A 리포 기준선)

## 맥락
QA 게이트 "캡처 회귀 0.2%"(METHOD §6)에 기준선이 없다. 캡처(`shots/`, 웨이브 1 이하 25장 + 다크 16장, DPR 2 PNG 46~592KB(실측 41장 · 중앙값 ≈ 130KB · 평균 ≈ 190KB))는 git에 없고 CI 아티팩트(14일)로만 남아 브랜치 간 비교가 불가능하다. 기준선을 어디에 두느냐는 리포 크기·리뷰 방식·CI 구성에 되돌리기 어려운 영향을 준다.

## 결정
(결정 A · 2026-09-06) 리포에 DPR 1 PNG 기준선을 둔다 — `shots/baseline/<code>-<state>.png`, 범위는 웨이브 이하 화면의 **기본 상태만**(≈ 16장 · 1.5MB). 비교는 `tools/capture/diff.mjs`(pixelmatch · 픽셀 차 비율 0.2% · 지도 영역 마스크), 갱신은 `pnpm capture:accept` 커밋으로만. S3 프리뷰(ADR-007)가 생기면 기준선을 버킷(`baseline/`)으로 옮긴다.

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| B. CI 아티팩트 간 비교(이전 main 아티팩트 다운로드) | 아티팩트 14일 만료 · 첫 실행 기준 없음 · 로컬 비교 불가 |
| C. 외부 저장(S3 `baseline/`) | AWS 계정(DISC-006) 대기 — 계정이 생기면 A에서 이전 |
| 상태 전수 기준선(41장+) | 리포 히스토리 증가(갱신마다 4MB+) — 기본 상태만으로 셸·레이아웃 회귀는 잡힌다 |

## 결과
- 얻는 것: PR마다 결정적 시각 회귀 게이트 · 의도적 변경은 이미지 diff로 리뷰.
- 잃는 것: 리포 크기(초기 ≈ 1.5MB, 갱신마다 누적) · 지도 타일 편차 대응(마스크).
- 되돌리려면: `shots/baseline/` 삭제 · `diff.mjs` 게이트 제거 — 히스토리는 남는다.

## Rules
- [ ] 기준선 갱신은 `pnpm capture:accept` + 커밋 본문에 갱신 사유(화면 코드·AC) — 손으로 PNG를 넣지 않는다.
- [ ] 지도 영역은 마스크(타일 네트워크 편차) · 다크 변형은 기준선 밖(토큰 대비 게이트가 담당).
- [ ] 임계 0.2%는 QA §3에 기록하고 회고 때만 바꾼다.

결정(2026-09-06, 사용자): **A(리포)** · 범위 = 웨이브 이하 화면의 기본 상태만 · DPR 1 PNG.

구현 보정(B15 이후 확인): 글꼴 래스터가 OS마다 달라(macOS Apple SD Gothic ↔ Linux Noto CJK) 기준선과 비교는 **같은 러너**에서만 성립한다. 기준선은 CI `baseline` 워크플로(workflow_dispatch · ubuntu · Playwright chromium 고정 · `fonts-noto-cjk`)가 `pnpm capture:accept`로 만들어 브랜치에 커밋하고, PR CI가 `pnpm capture:compare`로 비교한다. `MANIFEST.json`(platform · playwright · dpr)이 다르면 `diff.mjs`는 비교하지 않는다(exit 2). 지도(`.be-map`)와 `<video>` 영역은 사이드카 `<name>.json` 마스크로 제외한다.
