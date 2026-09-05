# PLAN — 웨이브 계획 (살아있는 문서, 매주 갱신)

기준일 2026-09-05. 웨이브 = 2주. 전략 근거: `METHOD.md` · 범위 원천: `ssot/`(화면 53 · FR 36 · DISC 43 미결). 계약 기준선(9/10 동결 · 9/30 시연 · 12/31)은 `ssot/meta.yaml`에 그대로 두고, 여기서 재기준선을 관리한다 — DY 합의 전까지 "제안".

## 현재 웨이브 — W0 스캐폴드 (선행 착수 9/5 · 계획 9/8~9/19)

준비 주(9/1~9/5): 방법론 v1 · 아카이브 · DS v0.1 · SSOT yaml 11 + check/build · 저작 문서(INTENT·CLAUDE·AGENTS·ADR 7·PLAN·DEMO·QA·specs 2) · hooks·CI·skills·agents — 완료.

| 산출 | 상태 (2026-09-05) |
|---|---|
| 워크스페이스 · `apps/web`·`pwa` · `packages/{tokens,domain,ui,mock,map,video}` | 완료 — main 12 커밋 |
| B0-01 역할 카드 로그인 + 가드 · 앱 로그인 4 · B1-02 대시보드(지도 마커 5·KPI·피드·표·카메라 월·인스펙터) · B1-02M 골격 | 완료 — 캡처 5장(`pnpm capture`, 시각 고정·지도 idle 대기) |
| 게이트: `pnpm verify`(ssot·tokens·tokens:lint·lint·check·test·생성물 diff 0) · `pnpm e2e` 19(로그인·가드·대시보드·realtime·모달·axe) · CI `e2e` 잡(capture 아티팩트) | 완료 — `✓ DY: lint files 56 · errors 0` · `19 passed` |
| ADR-002(트랜스포트 목) · ADR-003(MapLibre) Accepted | 완료 — ADR-007은 프리뷰 구성 후 |
| 리뷰어 판정(머지 불가 4건) 반영 — capture 모드 셸 렌더 · 시간대 고정 · 지도 대기 FAIL · mock realtime(AC-3) · 마커 갱신 · lint 규칙 보강 | 완료 — 다크 렌더(shell-auth AC-6)는 W1로 이동 |
| W1 선행(9/5): task-escalation 화면 4(A1-02 · A1-03 · B1-03 · B1-04) + ui 4(DataTable · TaskCard · Timeline · EscalationTimer) + mock(요청 · 에스컬레이션) + domain(profile · protocol) · e2e 29 · 캡처 `--wave 1` | 진행 중 — `feat/w1-domain`, `current_wave`는 W0 회고 후 1 |
| 남은 것 | S3+CloudFront 프리뷰(AWS 계정 DISC-006 — 사용자) · 리모트 리포 생성 → CI 1회 녹색 · 시각 회귀 기준선(W1) · W0 회고(9/19) → `current_wave: 1` · `?capture=1` 가드 우회 제거(W3 실 인증 전) |

## 웨이브 표 (제안)

| 웨이브 | 기간 | 범위 | Exit 기준 | 결정 지점 · 문서 |
|---|---|---|---|---|
| **W0 스캐폴드** | 9/8~9/19 | pnpm·Turbo 워크스페이스 · `apps/web` `apps/pwa`(adapter-static) · `packages/ui` 프리미티브 14 + WebShell/PwaShell · `packages/domain`(ids.ts 소비·상태기계 3) · `packages/mock`(시드·ApiClient·DemoClock·`?state=`) · B0-01 · B1-02 관통 · `tools/capture` · lint/typecheck/test/tokens:lint · S3+CloudFront 프리뷰 | 프리뷰 URL에서 7역할 로그인 → B1-02 · 캡처 `b0-01-login` `b1-02-dash` · `pnpm verify` + capture 녹색 · ADR-002/003/007 Accepted | W0 회고 → 방법론 v1.1 · `current_wave: 0→1` |
| **W1 시연 경로** | 9/22~10/3 | wave 1 화면 14: B1-02M · B1-03 · B1-04 · A1-01~05 · A2-01~04 · B4-02 · B4-05 · `packages/map`(MapLibre) `video`(루프 MP4·스냅샷·bbox) `realtime`(mock) · demo-scripts 장면 1~8 · PWA manifest/SW · 시각 회귀 기준선 | 장면 1~8이 프리뷰에서 mock으로 걸어짐 · states 전수 캡처 · axe critical 0 | 카메라 후보(DISC-040) · 일일점검 기준(DISC-033) DY 확인 · 브리핑 v0.4 초안 |
| **W2 1단계 잔여** | 10/6~10/17 | wave 2 화면 25: A1-06~08 · A2-05~06 · A3 전체 · B1-05~07 · B2 전체 · B4-03/04/06 + 부품·이벤트 복기 자리(B1-08 · B4-07/08 · A1-11 · A2-09) · Web Push · 오프라인 큐 | 화면 47(1단계) 전부 라우트·상태 픽스처 · 장면 9·10 · 설계서 v0.4 = 앱 캡처 | **문서 세트 v0.4 발행**(생성기 이식 · 델타 반영) · DISC 정리 회의 |
| **W3 실 인입** | 10/20~10/31 | `http` 트랜스포트(API-001~016) · WS/SSE · MQTT(IoT Core) 수신 · 프로토콜 업로드 실 · 카메라 1채널 실(L1) · E1 이벤트 수신 · 리플레이 폴백 | D1·D2 실데이터 동작 · 인입 실패 시 리플레이 자동 | 기종 확정 · 시연 일정 재기준선(DISC-017) |
| **W4~W5 2단계** | 11/3~11/28 | wave 4 화면 12: A4 전체 · B3 전체(B3-07 포함) · 현장 프로파일 8축(FR-029) · 저장 영상 타임라인(IF-007/008) · 바디캠·동의 스텁(FR-030/031) · 부품 생애주기 실동작(FR-032·035) · 이벤트 복기(FR-033) | 53화면 전부 실 또는 mock 어댑터 | OEM 부품 기준(DISC-038) · 태그 방식(DISC-043) |
| **W6~W7 하드닝** | 12/1~12/26 | Lighthouse PWA · a11y · 성능 예산 · 보안 입력(DISC-020·024·031) · 데이터 축적·예지 규칙 UI · 카메라 헬스(FR-034) 실 | Lighthouse PWA 통과 · axe serious 0 · ACC 전수 리허설 | 문서 세트 v0.5 |
| **인수** | 1/5~2/27 | ACC 전수 · 운영 매뉴얼·API 명세(OUT-016) · 브랜드 치환(DISC-021) · DY 승인 | 세트 v1.0 · 인수 | — |

## 규칙

- 웨이브 시작에 `ssot/meta.yaml` `current_wave`를 올린다 → 그 웨이브 화면은 route·spec 필수(check).
- 웨이브 종료: 회고 → `CLAUDE.md` 사고 SOP·skills·방법론 개정 · 문서 세트 발행 여부 결정.
- 매주: 데모 빌드 · DY 싱크 · 이 문서의 "현재 웨이브" 절 갱신 · 미결 DISC 정리.
- 범위 변경은 DISC 등록 후 이 표를 수정한다(표만 고치는 것 금지).

## 컷 순서 (시간 부족 시)

D3 사업주 → D5 바디캠 화면 → B3-06 쇼케이스 → D2 2채널을 1채널 실+1채널 녹화본 → 장면 9 재배치. 컷 금지: D1 인입 · 장면 8 파싱 · 장면 3 실시간 영상.
