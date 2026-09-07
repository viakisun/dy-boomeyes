# 추적 커버리지 (TRACE)

생성물 — 원천 `ssot/requirements.yaml · screens.yaml · interfaces.yaml · decisions.yaml` · 재생성 `pnpm ssot:build` · 수기 수정 금지.

| 지표 | 값 |
|---|---|
| 화면 | 53 |
| FR | 37 |
| FR 0건 화면(고아) | 0 |
| 화면 0건 FR | 0 |
| 현재 웨이브(2) 이하 spec 없는 화면 | 0 |
| 참조 수 | 1359 |
| 검사 오류 | 0 |

## FR → 화면 · IF · ACC · spec

| FR | 요구 | 단계 | 종류 | 상태 | 화면 | IF | ACC | spec |
|---|---|---|---|---|---|---|---|---|
| `FR-001` | 로그인·역할 분기 (웹 공통 + 앱별) | 1 | 기본 | 반영 | B0-01 A1-01 A2-01 A3-01 A4-01 | IF-009 | ACC-001 ACC-002 | shell-auth |
| `FR-002` | 실시간 장비 상태 조회 (통신·CAN·IO·전압·단선) | 1 | 기본 | 반영 | A1-05 A2-04 B1-02 | IF-004 IF-009 IF-010 | ACC-006 | demo-scripts video-basics driver-daily control-dashboard |
| `FR-003` | 지도 기반 위치·분포 표시 (실지도) | 1 | 기본 | 반영 | B1-02 B2-02 | IF-003 IF-013 | ACC-005 | control-dashboard demo-scripts sites-assets-leases |
| `FR-004` | 실시간 CCTV 영상 표시 | 1 | 기본 | 반영 | A1-04 A3-04 B1-02M B2-03 B3-02 | IF-005 IF-006 | ACC-007 ACC-104 | demo-scripts video-basics control-dashboard |
| `FR-005` | 저장 영상 조회 — 현장 프로파일 옵션(서버·SD·NVR·Edge) | 2 | 기본 | 구조 확보 | B1-02M A1-05 | IF-007 IF-008 | ACC-008 ACC-105 | control-dashboard video-basics demo-scripts |
| `FR-006` | 고장코드 표시·원격 진단 | 1 | 기본 | 반영 | A1-03 B1-02 B4-05 | IF-004 IF-010 | ACC-006 | demo-scripts documents task-escalation control-dashboard admin-protocol-rules |
| `FR-007` | 소모품(수송관·필터) 임계 알림 | 1 | 기본 | 반영 | A2-04 A1-05 B4-05 | IF-004 | ACC-006 | driver-daily demo-scripts video-basics admin-protocol-rules |
| `FR-008` | 이벤트 기반 업무함 (생성·접수·완료·이력) | 1 | 기본 | 반영 | A1-02 A1-03 A1-08 B3-03 | IF-009 IF-010 | ACC-002 | demo-scripts documents notifications task-escalation |
| `FR-009` | 업무 정렬·필터 (심각도·기한·상태) | 1 | 기본 | 반영 | A1-02 | IF-009 | — | demo-scripts documents notifications task-escalation |
| `FR-010` | 에스컬레이션 (미접수 자동 통보) | 1 | 기본 | 반영 | B1-04 A3-02 | IF-010 IF-014 | — | demo-scripts task-escalation notifications |
| `FR-011` | 알림 8종 수신·확인 | 1 | 기본 | 반영 | A2-02 A1-02 B4-05 | IF-010 IF-014 | ACC-006 | demo-scripts driver-daily notifications documents task-escalation admin-protocol-rules |
| `FR-012` | 이력 저장·기록 열람 (증빙) | 1 | 기본 | 반영 | A1-06 A3-06 B3-05 | IF-009 | — | records-reports |
| `FR-013` | 출근 체크인·퇴근 체크아웃 | 1 | 기본 | 반영 | A2-02 | IF-009 | — | demo-scripts driver-daily notifications |
| `FR-014` | 작업 전 일일점검 제출 | 1 | 기본 | 반영 | A2-03 | IF-009 | — | demo-scripts driver-daily |
| `FR-015` | 운전자 서류 제출·검토 (승인/반려) | 1 | 기본 | 반영 | A2-05 A1-02 | IF-011 IF-009 | — | documents demo-scripts notifications task-escalation |
| `FR-016` | 장비·현장 서류 관리 (완비율·만료 알림) | 1 | 기본 | 반영 | B1-05 B3-04 B4-06 A1-05 | IF-009 IF-011 | — | documents demo-scripts video-basics |
| `FR-017` | 신청·요청 흐름 (개설·장비·서류) + 수신함 승인 | 1 | 기본 | 반영 | A1-07 B1-03 | IF-009 | — | sites-assets-leases demo-scripts task-escalation |
| `FR-018` | 현장 개설·장비(호기) 배정 마스터 | 1 | 기본 | 반영 | B4-03 B1-03 A1-07 A2-06 | IF-009 | — | sites-assets-leases demo-scripts task-escalation driver-daily |
| `FR-019` | 임대 계약·재배치 관리 | 1 | 기본 | 반영 | B1-06 | IF-009 | — | sites-assets-leases |
| `FR-020` | 프로토콜 업로드·검증·샘플 테스트 | 1 | 기본 | 반영 | B4-02 | IF-012 | ACC-011 ACC-012 ACC-109 | admin-protocol-rules demo-scripts |
| `FR-021` | 사용자·권한 관리 (7역할 — 사업주 포함) | 1 | 기본 | 반영 | B4-04 | IF-009 | ACC-002 | sites-assets-leases |
| `FR-022` | 본사 스코프 열람·확인 요청 | 1 | 기본 | 반영 | A3-02 A3-03 A3-04 A3-05 A3-06 B2-02 B2-03 B2-04 | IF-009 | ACC-002 | notifications task-escalation sites-assets-leases video-basics records-reports |
| `FR-023` | 쇼케이스·보고 모드 (읽기 전용·마스킹) | 2 | 제안 | 반영 | B1-07 B3-06 B2-04 | IF-009 | — | owner-showcase records-reports |
| `FR-024` | 다중 스코프 관제 (운영사/본사/현장) | 1 | 기본 | 반영 | B1-02 B1-02M B1-03 B1-04 B1-05 B1-06 B1-07 B1-08 B2-02 B2-03 B2-04 B3-02 B3-03 B3-04 B3-05 B3-06 B3-07 | IF-009 | ACC-110 ACC-111 | control-dashboard demo-scripts video-basics task-escalation documents sites-assets-leases owner-showcase event-replay records-reports |
| `FR-025` | 사업주 보유·가용 현황 (가용/투입/정비 구분) | 2 | 제안 | 2단계 | A4-02 A4-05 | IF-009 | — | — |
| `FR-026` | 투입 요청 수신·승인·호기 배정 (사업주) | 2 | 제안 | 2단계 | A4-03 A1-07 B4-03 | IF-009 | — | sites-assets-leases |
| `FR-027` | 운전자 배치·서류 관리 (사업주 소속) | 2 | 제안 | 2단계 | A4-04 A4-06 B3-04 | IF-009 | — | — |
| `FR-028` | 사람 인식 — 붐 하부 인원 감지·경고 (AI 카메라 온보드) | 2 | 제안 | 2단계 | A1-04 B1-02M | IF-015 IF-010 | — | demo-scripts video-basics control-dashboard |
| `FR-029` | 현장 프로파일 관리 — 영상·네트워크·바디캠·개인정보 옵션 조합 등록 | 2 | 옵션 | 옵션 | B4-03 B1-02M | IF-009 | — | sites-assets-leases control-dashboard video-basics |
| `FR-030` | 바디캠 영상 관리 — 세션·업로드·재생·태그·보존 홀드·열람 로그 | 1 | 옵션 | 옵션 | B3-02 A1-04 | IF-016 IF-017 | — | demo-scripts video-basics |
| `FR-031` | 개인정보 절차 기능 — 동의 상태·촬영 표시·보존/홀드·열람 로그·마스킹 | 1 | 옵션 | 옵션 | A2-02 B4-03 B0-01 | IF-009 | — | demo-scripts driver-daily notifications sites-assets-leases shell-auth |
| `FR-032` | 마모·교체 부품 생애주기 — 등록·장착·누적·점검·교체·폐기·재고·발주 | 2 | 제안 | 2단계 | B4-07 B4-08 A1-11 A2-09 B3-07 | IF-009 IF-019 | — | equipment-parts |
| `FR-033` | 이벤트 복기 — event_id·공통 시각 기준 4소스 동기 재생(일반 CCTV·AI CCTV·바디캠·CPB 상태/부품 이력) | 2 | 제안 | 2단계 | B1-08 A1-03 B1-03 | IF-008 IF-017 IF-018 | — | event-replay demo-scripts documents task-escalation |
| `FR-034` | 카메라 헬스·AI 판단 불가 표시 — 정지화면·흐림·가림·수신 끊김 시 정상 표시 금지, 복구 후 누락분 재전송 표시 | 1 | 기본 | 반영 | B1-02 B1-02M A1-04 A1-05 A2-04 | IF-006 IF-010 IF-018 | — | control-dashboard demo-scripts video-basics driver-daily |
| `FR-035` | 부품 태그 스캔 — QR/RFID로 부품 ID 식별 후 점검·교체 입력 | 2 | 제안 | 2단계 | A1-11 A2-09 | IF-019 | — | equipment-parts |
| `FR-036` | 시나리오별 알림 등급 — 정상 타설 무알림 · 호스 주변 인원 접근 즉시 · 전도/무동작 고우선 · 배관·호스 이상 긴급 · 영상 장애 알림 | 2 | 제안 | 2단계 | B4-05 B1-02 A1-05 | IF-010 IF-014 IF-015 | — | admin-protocol-rules control-dashboard demo-scripts video-basics |
| `FR-037` | 오프라인 제출 큐 — 체크인·체크아웃·일일점검·서류를 저장 후 연결 시 순서대로 동기 | 1 | 기본 | 개발 단계 | A2-02 A2-03 A2-05 | IF-009 IF-011 | — | demo-scripts driver-daily notifications documents |

## 화면 → 과업 절 · OUT · RFP · DISC · IF

| 화면 | 과업 절 | OUT | RFP | DISC(직접+scope) | IF(직접+if.screens) |
|---|---|---|---|---|---|
| `A1-01` | 4.3.2 | OUT-002 | RFP-018 | DISC-020 | IF-009 |
| `A1-02` | 4.3.2 | OUT-002 | RFP-018 RFP-020 EXT-1 | DISC-016 DISC-036 DISC-050 | IF-009 IF-010 IF-014 |
| `A1-03` | 4.3.2 | OUT-002 | RFP-015 EXT-1 | DISC-012 DISC-015 DISC-035 | IF-009 IF-010 |
| `A1-04` | 4.3.2 4.3.8 | OUT-002 | RFP-007 | DISC-004 DISC-025 DISC-027 DISC-028 DISC-029 DISC-030 DISC-040 DISC-042 DISC-054 | IF-005 IF-006 IF-009 IF-015 IF-016 IF-017 |
| `A1-05` | 4.3.2 | OUT-002 | RFP-008 RFP-010 RFP-011 RFP-012 RFP-013 RFP-014 RFP-016 RFP-017 RFP-020 | DISC-008 DISC-009 DISC-010 DISC-011 | IF-001 IF-002 IF-004 IF-006 IF-007 IF-009 |
| `A1-06` | 4.3.2 4.3.11 | OUT-002 | EXT-1 | — | IF-009 |
| `A1-07` | 4.3.2 4.3.9 | OUT-002 | RFP-018 | DISC-034 DISC-047 DISC-049 | IF-009 |
| `A1-08` | 4.3.2 | OUT-002 | EXT-1 | DISC-015 | IF-009 IF-010 |
| `A1-11` | 5.3.3 | OUT-014 | RFP-016 RFP-017 | DISC-038 DISC-043 DISC-044 | IF-009 IF-011 IF-019 |
| `A2-01` | 4.3.1 | OUT-001 | RFP-018 | DISC-020 | IF-009 |
| `A2-02` | 4.3.1 | OUT-001 | RFP-015 RFP-018 EXT-2 | DISC-031 DISC-036 DISC-045 | IF-009 IF-010 IF-014 |
| `A2-03` | 4.3.1 | OUT-001 | EXT-2 | DISC-033 DISC-045 | IF-009 |
| `A2-04` | 4.3.1 | OUT-001 | RFP-010 RFP-011 RFP-013 RFP-016 RFP-017 | DISC-010 DISC-013 DISC-014 | IF-001 IF-009 IF-010 |
| `A2-05` | 4.3.1 4.3.10 | OUT-001 | RFP-020 EXT-2 | DISC-016 DISC-045 DISC-046 DISC-048 | IF-009 IF-011 |
| `A2-06` | 4.3.1 | OUT-001 | RFP-018 | — | IF-009 |
| `A2-09` | 5.3.3 | OUT-014 | RFP-016 RFP-017 | DISC-038 DISC-043 DISC-044 | IF-009 IF-011 IF-019 |
| `A3-01` | 4.3.2 | OUT-002 | RFP-018 RFP-022 | DISC-020 | IF-009 |
| `A3-02` | 4.3.2 | OUT-002 | RFP-022 EXT-3 | DISC-015 | IF-009 IF-014 |
| `A3-03` | 4.3.2 | OUT-002 | RFP-022 | DISC-015 | IF-009 |
| `A3-04` | 4.3.2 4.3.8 | OUT-002 | RFP-007 RFP-008 RFP-022 | — | IF-006 IF-009 |
| `A3-05` | 4.3.2 | OUT-002 | RFP-022 EXT-1 | DISC-015 | IF-009 |
| `A3-06` | 4.3.11 | OUT-002 | RFP-022 | — | IF-009 |
| `A4-01` | 4.3.9 | OUT-009 | RFP-021 | DISC-020 DISC-026 | — |
| `A4-02` | 4.3.9 | OUT-009 | RFP-021 EXT-5 | DISC-026 DISC-052 | — |
| `A4-03` | 4.3.9 4.3.4 | OUT-009 | RFP-021 EXT-5 | DISC-026 DISC-051 | — |
| `A4-04` | 4.3.9 | OUT-009 | EXT-5 | DISC-026 | — |
| `A4-05` | 4.3.9 | OUT-009 | EXT-4 EXT-5 | DISC-026 DISC-051 DISC-052 | — |
| `A4-06` | 4.3.10 | OUT-010 | RFP-020 EXT-5 | DISC-016 DISC-026 DISC-052 | — |
| `B0-01` | 4.3.5 | OUT-005 | RFP-019 | DISC-020 DISC-023 DISC-024 DISC-031 | IF-009 |
| `B1-02` | 4.3.3 | OUT-003 | RFP-009 RFP-010 RFP-013 RFP-014 RFP-015 RFP-019 RFP-021 | DISC-025 DISC-037 | IF-003 IF-004 IF-009 IF-010 IF-013 |
| `B1-02M` | 4.3.3 4.3.8 | OUT-003 | RFP-007 RFP-008 | DISC-004 DISC-005 DISC-007 DISC-027 DISC-028 DISC-029 DISC-040 DISC-042 DISC-054 | IF-005 IF-006 IF-007 IF-008 IF-015 IF-018 |
| `B1-03` | 4.3.9 4.3.4 | OUT-009 | RFP-020 EXT-1 | DISC-048 | IF-009 IF-010 |
| `B1-04` | 4.3.11 | OUT-011 | EXT-3 | DISC-015 DISC-035 DISC-050 DISC-051 | IF-009 IF-010 IF-014 |
| `B1-05` | 4.3.10 | OUT-010 | RFP-020 | DISC-016 DISC-053 | IF-009 |
| `B1-06` | 4.3.9 | OUT-009 | EXT-4 | DISC-037 | IF-009 |
| `B1-07` | 4.3.3 | OUT-003 | RFP-021 | DISC-019 DISC-031 | IF-009 IF-010 |
| `B1-08` | 5.3.1 | OUT-012 | RFP-008 | DISC-039 DISC-040 DISC-044 DISC-049 | IF-008 IF-009 IF-017 IF-018 |
| `B2-02` | 4.3.3 | OUT-003 | RFP-009 RFP-022 | — | IF-003 IF-009 IF-010 IF-013 |
| `B2-03` | 4.3.3 4.3.8 | OUT-003 | RFP-007 RFP-022 | DISC-015 | IF-006 IF-009 |
| `B2-04` | 4.3.3 | OUT-003 | RFP-022 | — | IF-009 |
| `B3-02` | 4.3.3 | OUT-003 | RFP-007 RFP-019 RFP-022 | DISC-019 DISC-030 DISC-041 | IF-006 IF-009 IF-010 IF-016 IF-017 |
| `B3-03` | 4.3.3 | OUT-003 | EXT-1 | DISC-019 | IF-009 IF-010 |
| `B3-04` | 4.3.10 | OUT-010 | RFP-020 | DISC-016 DISC-019 DISC-026 DISC-046 | IF-009 IF-011 |
| `B3-05` | 4.3.11 | OUT-011 | EXT-1 | DISC-019 DISC-053 | IF-009 |
| `B3-06` | 4.3.3 | OUT-003 | RFP-021 | DISC-019 | IF-009 |
| `B3-07` | 5.3.3 | OUT-014 | RFP-022 | DISC-019 DISC-038 | IF-009 |
| `B4-02` | 4.3.6 4.3.4 | OUT-006 | RFP-023 | DISC-008 DISC-009 | IF-009 IF-012 |
| `B4-03` | 4.3.9 4.3.4 | OUT-009 | — | DISC-004 DISC-005 DISC-007 DISC-026 DISC-028 DISC-030 DISC-031 DISC-034 DISC-040 DISC-047 DISC-048 DISC-049 | IF-009 |
| `B4-04` | 4.3.4 | OUT-004 | — | DISC-015 DISC-053 | IF-009 |
| `B4-05` | 4.3.11 4.3.4 | OUT-011 | RFP-015 RFP-016 RFP-017 | DISC-012 DISC-013 DISC-014 DISC-036 DISC-050 DISC-054 | IF-002 IF-009 |
| `B4-06` | 4.3.10 4.3.4 | OUT-010 | RFP-020 | DISC-016 DISC-046 DISC-047 DISC-048 | IF-009 IF-011 |
| `B4-07` | 5.3.3 | OUT-014 | RFP-016 RFP-017 | DISC-038 DISC-043 DISC-044 | IF-009 IF-019 |
| `B4-08` | 5.3.3 | OUT-014 | RFP-016 RFP-017 | DISC-038 DISC-044 | IF-009 |

## 과업 절 커버리지

| 절 | 과업 | 단계 | 항목 | 화면 있는 항목 | 비화면·구조 |
|---|---|---|---|---|---|
| 4.3.1 | 운전자 PWA APP | 1 | 10 | 9 | 1 |
| 4.3.2 | 현장 안전관리자 PWA APP | 1 | 11 | 11 | 0 |
| 4.3.3 | CPB 관제 반응형 WEB | 1 | 11 | 11 | 0 |
| 4.3.4 | 관리자(백오피스) WEB | 1 | 10 | 10 | 0 |
| 4.3.5 | AWS 서버/API/DB | 1 | 3 | 2 | 1 |
| 4.3.6 | 미들웨어·프로토콜 관리 기능 | 1 | 3 | 3 | 0 |
| 4.3.7 | Linux 제어기 샘플 에이전트 | 1 | 1 | 0 | 1 |
| 4.3.8 | CCTV 실시간 영상 연동 | 1 | 4 | 3 | 1 |
| 4.3.9 | 현장 개설 및 장비 배정 | 1 | 5 | 5 | 0 |
| 4.3.10 | 서류 관리 | 1 | 5 | 5 | 0 |
| 4.3.11 | 기본 알림 및 이력 관리 | 1 | 4 | 4 | 0 |
| 5.3.1 | NVR 기반 저장 영상 조회 구조 | 2 | 1 | 1 | 0 |
| 5.3.2 | 데이터 축적 구조 | 2 | 1 | 0 | 1 |
| 5.3.3 | 규칙 기반 예지보전 구조 | 2 | 1 | 1 | 0 |
| 5.3.4 | 운영 리포트 | 2 | 1 | 1 | 0 |
| 5.3.5 | 권한 및 사용자 고도화 | 2 | 1 | 1 | 0 |
| 5.3.6 | 서류 워크플로우 고도화 | 2 | 1 | 1 | 0 |
| 5.3.7 | 미들웨어 운영 기능 고도화 | 2 | 1 | 1 | 0 |
