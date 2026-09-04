---
id: ADR-007
title: 정적 배포 — adapter-static · S3 + CloudFront 2오리진 · PR 프리뷰
status: Proposed
date: 2026-09-05
supersedes: —
relates_to: [DISC-006, DISC-020]
---

# ADR-007 — 정적 배포 (Proposed — 웨이브 0 프리뷰 구성 후 Accepted)

## 맥락
목업은 매 PR마다 프리뷰 URL이 있어야 리뷰·데모가 돌아간다. 서버 세션·SSR 요구는 아직 없다(DISC-020 미결).

## 결정(안)
두 앱 모두 `adapter-static`(SPA fallback). S3 + CloudFront 2오리진(web/app), 403/404 → `index.html`. PR 프리뷰는 브랜치별 경로 프리픽스. DISC-020이 서버 세션을 요구하면 web만 `adapter-node`로 전환(`+page.server.ts` 미사용 원칙으로 비용 0).

## 대안
| 대안 | 왜 아닌가 |
|---|---|
| Vercel/Netlify | DY AWS 계정(DISC-006) 정책과 어긋날 수 있음 · 데이터 위치 |
| adapter-node 기본 | 서버 운영 비용·복잡도, 필요 전까지 불필요 |

## Rules(안)
- [ ] 배포는 CI만. 에이전트 수동 배포 금지.
- [ ] 환경변수는 `PUBLIC_*`만 클라이언트에 노출.
