# PLAN — 웨이브 계획 (살아있는 문서, 매주 갱신)

기준일 2026-09-05. 웨이브 = 2주. 전략 근거: `METHOD.md` · 범위 원천: `ssot/`(화면 53 · FR 37 · DISC 54 — 미결 47). 계약 기준선(9/10 동결 · 9/30 시연 · 12/31)은 `ssot/meta.yaml`에 그대로 두고, 여기서 재기준선을 관리한다 — DY 합의 전까지 "제안".

## 현재 웨이브 — W2 1단계 잔여 (선행 착수 9/5 · 계획 10/6~10/17)

W1은 9/5에 선행 완료(사용자 결정 항목만 잔여). 계획 `~/.claude/plans/form-tingly-gray.md` → 브랜치 B0~B15. `current_wave: 2`(B2에서 승격) — wave ≤ 2 화면 41 전부 route(check) · spec(TRACE "spec 없는 화면 0") · 자리 화면은 B3~B11에서 실화면으로.

| 산출 | 상태 (2026-09-05) |
|---|---|
| B0 SSOT 정합(nav 5 · states 3 · ENT-19/20 · request/lease 기계 · FR-037/NFR-016 · DISC-044~046 · ADR-009/010/011 Proposed) | 완료 — PR #2 |
| B1 spec 신규 7(documents · sites-assets-leases · records-reports · equipment-parts · event-replay · owner-showcase · notifications) + 확장 4 | 완료 — `--specs 14` · wave 2 화면 25 spec 커버 |
| B2 A1-08 완료 시트 · A3-02 · A3-05 + `current_wave: 2`(nav 활성 · 캡처 93장 → B11 후 97장, 자리 0) | 완료 |
| B3 documents 완료 · B4 hq-video(B2-03 · A3-04 · CameraWall·EquipmentCard) 완료 · B5 admin-masters(B4-03 · B4-04 · PageHeader·Select·KeyValueList·SiteProfileForm) 완료 · B6 leases-hqmap(B1-06 · B2-02 · 장면 9 · lease/request 기계) 완료 · B7 menus-siteinfo(A1-07 · A2-06 · A3-03 · createRequest) 완료 · B8 records-report(A1-06 · A3-06 · B2-04 · records/report · Chip) 완료 · B9 parts-stub(B4-07 · B4-08 · A1-11 · A2-09 · part 기계 · ProgressBar) 완료 · B10 event-replay-stub(B1-08 · EV-001 · 4레인 커서 · 피드 복기 링크) 완료 · B11 showcase(B1-07 · ShowcaseOverlay · mask · 장면 10) 완료 · B15 마감(capture --strict · axe 41 · 회고 · SOP · 방법론 v1.2) 완료 | 완료 — PR #2~#14(리뷰어 "머지 가능" 인용 · CI 녹색) |
| 리뷰 backlog 정리(chore/w2-backlog) · 시각 회귀 기준선(ADR-008 A) · 결정 반영(ADR-009/010/011 Accepted · DISC 7건 decided) | 완료 — PR #15 · #16 · #17 |
| B12 오프라인 큐(ADR-010) | 완료 — PR #18 (`packages/offline` IndexedDB 아웃박스 · `withOutbox(api)` · `?net=` · 셸 배너 · 카드 pill · 픽스처 `A2-02:queued` `A2-05:queued` · e2e 5 · Vitest 8) |
| B13 로컬 알림(ADR-009) | 완료 — PR #19 (`notify.ts` `toPushPayload` · SW push/notificationclick · `push.svelte.ts` · 앱바 종 + 권한 시트 · `A1-02:push` · e2e 2 · Vitest 2) |
| B14 문서 생성기(ADR-011) | 완료 — PR #20 (`tools/docs-gen` 설계서 HTML/PDF · `docs/set/v0.4-draft/{DELTA,MANIFEST}.md` · `shots/manifest.json` · `docs:set`/`docs:check` · QA 게이트 8) — 정식 발행은 사용자 승인 |
| 시각 회귀 기준선 첫 등록 | PR #21 — `baseline` 워크플로(ubuntu) 41장 · 이후 화면 변경 PR은 `capture:compare` |
| **디자인 개선 W2.5**(사용자 요청 2026-09-06) | 완료(2026-09-06) — D0 #22 리뷰·가이드·플랜 · D1 #23 셸(아이콘 · 표면 이름) · D2 #24 PageHeader·카피·근거(data-ref) · D3 #25 PWA 카피(audit 0) · D4 #26 Stat·표 규칙 · D5 #28 폼·B4-05 표형 · D6 #27 PWA 골격 · D7 #29 lint `copy-*` 승격·회고 `docs/retro/W2.5.md` — 측정 `docs/plans/design-uplift.md` §3 · 기준선은 브랜치마다 CI 재등록 |
| **W2.6 브랜드·삽화·격차 보강**(사용자 요청 2026-09-07 · 계획 `~/.claude/plans/form-tingly-gray.md`) | 진행 — D `docs/deck-disc`(DISC-047~054 · DISC-005/007/008/009/039/040 갱신 · 용어 3) → L `feat/brand-logo`(Logo mark/glyph/lockup · 사이드바 접힘 글리프 · 로그인 두 톤 · favicon·PWA 아이콘 빌드 · DY-design §13) → M `feat/media-illustrations`(참고자료 v5.0 삽화 → 타일 스틸·루프 MP4 · bbox 정정 · SW 선캐시 mp4 제외) → G1 영상 확보 상태·카메라 장착 위치·설치 구성도 → G2 미연동·미수신 표기 규칙 → G3 AI 판단 유보·현장 신고(FR 신규 제안 · kind proposed). 덱 22토픽 판정: 채택 4 · DISC 8 등록 · 기각 2(카메라 후보 그대로 · 3.6GB/일 수치) · 제조사 사진 제외(저작권) |
| W2 Exit 대비 | ① `current_wave: 2` · TRACE "spec 없는 화면 0" ✓ ② `capture --dark --strict` 97장 fail 0 · 자리 0 ✓ ③ e2e 녹색 · axe wave ≤ 2 화면 41 전수 0 ✓ ④ 장면 1~10 e2e ✓ ⑤ 픽스처 신규 27(17 → 44) ✓ ⑥ 문서 세트 v0.4 초안 `docs/set/v0.4-draft/` ✓(B14) ⑦ 회고 `docs/retro/W2.md` · SOP 5 ✓ |
| 사용자 결정 | 2026-09-06 확정: ADR-008 A(리포) · ADR-009/010/011 승인 · DISC-015/036/038/043/044~046 기준안 채택(decided · DY 이견 시 재개) — 남은 것: AWS(DISC-006, 보류) · v0.4 발행 · 2026-09-07: 로고는 DS 색으로 재구성 · 삽화 6장만(제조사 사진 제외) · 격차 소폭 4건 + DISC 등록 |

### W1 시연 경로 — 완료(9/5)

W0는 9/5에 선행 완료(회고 `docs/retro/W0.md` · 방법론 v1.1).

| 산출 | 상태 (2026-09-05) |
|---|---|
| 기능 4 구현·merge — task-escalation · driver-daily · admin-protocol-rules · video-basics(specs `draft` → 구현됨, 잔여 AC는 각 `tasks.md`) | 완료 — e2e 78 · axe 15 · 캡처 25장 + 다크 16장(`pnpm capture --dark`) |
| 다크 렌더(shell-auth AC-6) — 완료(`?theme=` · 웹 토글 · `capture --dark` · e2e 6) · 시각 회귀 기준선(0.2%) — 완료(ADR-008 Accepted 2026-09-06 · A 리포 기준선 · CI `baseline` 워크플로가 등록 · `capture:compare` PR 차단) · demo-scripts 장면 1~8 — 완료(`?scene=N` · DemoBar · 장면 1 타임라인 · 장면 6 1시간 경과 · e2e 10 · W2 화면은 자리) · PWA manifest/SW — 완료(AC-7 · e2e 2) · `maintenance` 로그인 경로 — 완료(B0-01 카드 5 · e2e) · tokens:lint 잔여 — 완료(duration-N · border-N · ring-N · max-w-sm… 규칙 + duration-*/border-strong/border-radio 유틸리티) · 카탈로그 검사 — 완료(`tokens:check`에 catalog) · PWA 측 AX-1 픽스처 — 완료(`A1-04:plite` `A1-05:plite` · e2e 2) | 진행 예정 |
| 사용자 입력 | 리모트 리포 → CI 1회 녹색 · AWS 계정(DISC-006) → 프리뷰 → ADR-007 · DISC-033/036/038/040/042/043 |
| W1 Exit 대비 | 장면 1~8 mock 재생 ✓(`?scene=N`, W2 화면은 자리) · states 전수 캡처 ✓(41장 fail 0) · axe critical 0 ✓ — 프리뷰 URL·시각 회귀 기준선만 사용자 입력 대기 · 회고는 웨이브 종료(10/3) 또는 사용자 지시 시 |

### W0 스캐폴드 — 완료(9/5)

준비 주(9/1~9/5): 방법론 v1 · 아카이브 · DS v0.1 · SSOT yaml 11 + check/build · 저작 문서(INTENT·CLAUDE·AGENTS·ADR 7·PLAN·DEMO·QA·specs 2) · hooks·CI·skills·agents — 완료.

| 산출 | 상태 (2026-09-05) |
|---|---|
| 워크스페이스 · `apps/web`·`pwa` · `packages/{tokens,domain,ui,mock,map,video}` | 완료 — main 12 커밋 |
| B0-01 역할 카드 로그인 + 가드 · 앱 로그인 4 · B1-02 대시보드(지도 마커 5·KPI·피드·표·카메라 월·인스펙터) · B1-02M 골격 | 완료 — 캡처 5장(`pnpm capture`, 시각 고정·지도 idle 대기) |
| 게이트: `pnpm verify`(ssot·tokens·tokens:lint·lint·check·test·생성물 diff 0) · `pnpm e2e` 19(로그인·가드·대시보드·realtime·모달·axe) · CI `e2e` 잡(capture 아티팩트) | 완료 — `✓ DY: lint files 56 · errors 0` · `19 passed` |
| ADR-002(트랜스포트 목) · ADR-003(MapLibre) Accepted | 완료 — ADR-007은 프리뷰 구성 후 |
| 리뷰어 판정(머지 불가 4건) 반영 — capture 모드 셸 렌더 · 시간대 고정 · 지도 대기 FAIL · mock realtime(AC-3) · 마커 갱신 · lint 규칙 보강 | 완료 — 다크 렌더(shell-auth AC-6)는 W1로 이동 |
| W1 선행(9/5): 기능 4 구현 — task-escalation(A1-02 · A1-03 · B1-03 · B1-04) · driver-daily(A2-02~04) · admin-protocol-rules(B4-02 · B4-05) · video-basics(A1-04 · A1-05 · B1-02M 완성) + ui 12 · mock(요청·에스컬레이션·출근·점검·프로토콜·규칙·미디어) · domain(profile · protocol · rules) · e2e 53 · axe 15 · 캡처 `--wave 1` 14장 | 완료 — ff-merge 브랜치 16 · 첫 판정 머지 가능 2 · 결함 17 반영(세션 기록) |
| 남은 것 | S3+CloudFront 프리뷰(AWS 계정 DISC-006 — 사용자) · 리모트 리포 생성 → CI 1회 녹색 · `?capture=1` 가드 우회 제거(W3 실 인증 전) — W1 표로 이관 |

## 웨이브 표 (제안)

| 웨이브 | 기간 | 범위 | Exit 기준 | 결정 지점 · 문서 |
|---|---|---|---|---|
| **W0 스캐폴드** | 9/8~9/19 | pnpm·Turbo 워크스페이스 · `apps/web` `apps/pwa`(adapter-static) · `packages/ui` 프리미티브 14 + WebShell/PwaShell · `packages/domain`(ids.ts 소비·상태기계 3) · `packages/mock`(시드·ApiClient·DemoClock·`?state=`) · B0-01 · B1-02 관통 · `tools/capture` · lint/typecheck/test/tokens:lint · S3+CloudFront 프리뷰 | 프리뷰 URL에서 7역할 로그인 → B1-02 · 캡처 `b0-01-login` `b1-02-dash` · `pnpm verify` + capture 녹색 · ADR-002/003/007 Accepted | 완료 9/5 — 회고 `docs/retro/W0.md` · 방법론 v1.1 · `current_wave: 1` |
| **W1 시연 경로** | 9/22~10/3 | wave 1 화면 14: B1-02M · B1-03 · B1-04 · A1-01~05 · A2-01~04 · B4-02 · B4-05 · `packages/map`(MapLibre) `video`(루프 MP4·스냅샷·bbox) `realtime`(mock) · demo-scripts 장면 1~8 · PWA manifest/SW · 시각 회귀 기준선 | 장면 1~8이 프리뷰에서 mock으로 걸어짐 · states 전수 캡처 · axe critical 0 | 카메라 후보(DISC-040) · 일일점검 기준(DISC-033) DY 확인 · 브리핑 v0.4 초안 |
| **W2 1단계 잔여** | 10/6~10/17 | wave 2 화면 25: A1-06~08 · A2-05~06 · A3 전체 · B1-05~07 · B2 전체 · B4-03/04/06 + 부품·이벤트 복기 자리(B1-08 · B4-07/08 · A1-11 · A2-09) · Web Push · 오프라인 큐 | wave ≤ 2 화면 41(1단계 39 + B1-07·B2-04) 전부 라우트·상태 픽스처·자리 0 · 장면 9·10 · 설계서 v0.4 = 앱 캡처 | **문서 세트 v0.4 발행**(생성기 이식 · 델타 반영) · DISC 정리 회의 — 화면 41 완료 2026-09-06(회고 `docs/retro/W2.md` · 방법론 v1.2 · `capture --strict`) · 큐·알림·문서 생성기는 ADR 승인 대기 |
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
