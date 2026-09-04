# 도메인 모델 (DOMAIN)

생성물 — 원천 `ssot/entities.yaml` · 재생성 `pnpm ssot:build` · 수기 수정 금지.

## 엔티티

| ID | 엔티티 | 단계 | 핵심 속성 | 관계 | 저장소 |
|---|---|---|---|---|---|
| `ENT-01` | 현장 (Site) | 1 | site_id · 현장명 · 주소 · 건설사 · 담당 안전관리자 · video_profile(옵션 조합 · DISC-028) | 1─N 장비 · 1─N 사용자(현장) · 1─N 업무 · 1─N 바디캠 | RDS |
| `ENT-02` | 장비 (Device/CPB) | 1 | device_id · 호기(1~120) · 상태 · 설치일 · 완료예정일 | N─1 현장 · N─1 사업주(보유) · 1─1 제어기 · 1─N 카메라 · 1─N 알림 | RDS · 최신 상태는 Redis |
| `ENT-03` | 제어기 (Controller) | 1 | controller_id · 프로토콜 버전 · 인증키 · 마지막 수신 | 1─1 장비 · N─1 프로토콜 버전 | RDS |
| `ENT-04` | 카메라 (Camera) | 1 | camera_id · 유형(general/ai) · ingest_type(E1~E5) · recording_mode · stream_url · 보존(현장별) | N─1 장비 (기본 2대) | RDS · 영상은 S3/SD/현장 녹화기 (프로파일) |
| `ENT-05` | 사용자 (User) | 1 | user_id · 역할(7종) · 소속(운영사/건설사/사업주) · 연락처 | N─M 현장 · 1─N 업무(담당) | RDS · 세션은 Redis |
| `ENT-06` | 업무 (Case) | 1 | case_id(C-xxx) · 유형(고장/서류/점검/통신) · 상태 · 기한 · 심각도 | N─1 장비/현장 · 1─N 이력 | RDS |
| `ENT-07` | 서류 (Document) | 1 | doc_id · 유형(5종) · 대상(장비/운전자/현장) · 유효기간 · 상태 | N─1 장비 · 사용자 · 현장 | RDS · 파일은 S3 |
| `ENT-08` | 알림 (Alert) | 1 | alert_id · 유형(8종) · 등급 · 확인 상태 · 발생 시각 | N─1 장비 · 1─N 업무 생성 | RDS |
| `ENT-09` | 이력 (History) | 1 | 시각 · 구분 · 내용 · 행위자 — append-only | N─1 업무/장비/서류 | RDS (append-only) |
| `ENT-10` | 임대 계약 (Lease) | 1 | 호기 범위 · 설치지역 · 건설사 · 기간 · 잔여(D-) | N─1 장비 · N─1 현장 · N─1 사업주(임대인) | RDS |
| `ENT-11` | 프로토콜 버전 (Protocol) | 1 | 버전 · 정의 파일(YAML/JSON) · 운영/테스트 구분 | 1─N 제어기 | RDS · 정의 파일은 S3 |
| `ENT-12` | 텔레메트리 (Telemetry) | 1 | timestamp · GPS · 통신 · CAN · IO · 전압 · 단선 · 고장 · 소모품 | N─1 장비 — 시계열 저장 | 시계열 DB · 원시는 S3 |
| `ENT-13` | 사업주 (Owner) | 2 | owner_id · 상호 · 대표 · 연락처 · 보유 호기 수 | 1─N 장비(보유) · 1─N 운전자(소속) · 1─N 임대 계약 | RDS — 2단계 제안 (DISC-026) |
| `ENT-14` | 바디캠 (BodyCam) | 2 | bodycam_id · 착용자(user_id) · 현장 · 세션(체크인~체크아웃) · 파일 · 태그 · 보존 홀드 | N─1 현장 · N─1 사용자 · 1─N 이력 | RDS · 영상은 S3 (보존 현장별) — 옵션 (DISC-030) |
| `ENT-15` | 개인정보 동의 (Consent) | 1 | consent_id · user_id · 항목(영상 · 음성 · 위치) · 목적 · 기간 · 철회 | N─1 사용자 · N─1 현장 | RDS — 표준 패키지 (DISC-031) |
| `ENT-16` | 부품 (Part) | 2 | part_id · 품번 · 부품군(직관·이송배관/엘보·리듀서/플랜지·클램프/가스켓·안전핀/엔드호스·피팅) · 압력등급 · 기준두께 · 로트 · 호환규격 · 장착 위치·설치일 · 누적 타설량·운전시간 · 상태(장착/재고/폐기) | N─1 장비(장착) · 1─N 부품 이력 · N─1 재고 | RDS — 2단계 제안 (DISC-038) |
| `ENT-17` | 부품 이력 (PartEvent) | 2 | event_id · part_id · 구분(등록/장착/점검/교체/폐기) · 실측두께·외관·체결·OEM 합불 · 사유 · 작업자 · 증빙(사진) · 시각 | N─1 부품 · N─1 사용자 · 0─1 이벤트(영상 복기 연결) | RDS (append-only) · 사진은 S3 |
| `ENT-18` | 재고·발주 (Stock) | 2 | stock_id · 품번 · 현재고 · 안전재고 · 발주 상태·수량·일자 | 1─N 부품 | RDS — 2단계 제안 |

## 상태기계

### task (ENT-06)

상태: `new` `assigned` `in-progress` `done` `escalated`

| from | to | 계기 |
|---|---|---|
| new | assigned | 관제 배정 / 자동 |
| assigned | in-progress | 담당자 접수 |
| in-progress | done | 정비 보고 → 현장 완료 확인 (2단계, DISC-015) |
| new | escalated | 1h 미접수 자동 (제안) |
| escalated | in-progress | 접수 |

### doc (ENT-07)

상태: `valid` `expiring` `submitted` `review` `approved` `rejected`

| from | to | 계기 |
|---|---|---|
| valid | expiring | D-30 스케줄러 |
| expiring | submitted | 촬영 업로드 |
| submitted | review | 자동 |
| review | approved | 현장 승인 |
| review | rejected | 반려(사유) |
| rejected | submitted | 재제출 |

### equipment (ENT-02)

상태: `normal` `caution` `fault` `offline` `maintenance`

| from | to | 계기 |
|---|---|---|
| normal | caution | 임계 접근(수송관·필터·전압) |
| caution | fault | E-코드 / 임계 초과 |
| * | offline | LWT 통신 두절 |
| fault | maintenance | 정비 출동 |
| maintenance | normal | 현장 완료 확인 |

### camera (ENT-04)

상태: `live` `snapshot` `recording` `offline` `ai-unavailable`

| from | to | 계기 |
|---|---|---|
| live | snapshot | 저대역 전략(NFR-003) |
| * | offline | 수신 끊김 |
| * | ai-unavailable | 정지화면·흐림·가림 (FR-034) |
| offline | live | 복구 + 누락분 재전송(IF-018) |

### part (ENT-16)

상태: `registered` `installed` `inspected` `due` `replaced` `discarded`

| from | to | 계기 |
|---|---|---|
| registered | installed | 장착(위치·설치일·로트) |
| installed | inspected | 점검 입력(A1-11) |
| inspected | due | OEM 기준 합불=불 / 임계 |
| due | replaced | 교체(A2-09) → 재고 차감 |
| replaced | discarded | 폐기(사유·증빙) |

## 규칙

**업무(케이스) 상태 모델**

| 항목 | 규칙 |
|---|---|
| 상태 흐름 | 신규 → 진행 중(접수) → 완료 · 이력은 append-only 증빙 |
| 고장 완료 확인 | 정비 보고 → 현장 안전관리자 완료 확인의 2단계 (DISC-015) |
| 정렬·필터 | 심각도·기한·발생시각 정렬 · 미처리(기본)/전체/고장이상 칩 |

**서류 상태 모델**

| 항목 | 규칙 |
|---|---|
| 상태 흐름 | 유효 → 만료 임박(D-30 알림) → 제출(촬영 업로드) → 검토 대기 → 승인/반려(사유)→재제출 |
| 역할 경계 | 등록·승인=현장(WEB·APP) · 운영사=완비 모니터링·요청 회신 · 유형 5종(DISC-016) |

**에스컬레이션 · 알림**

| 항목 | 규칙 |
|---|---|
| 티켓 생애주기와의 관계 | 업무(티켓) 흐름: 발행 → 처리 → 완료(해소) — 에스컬레이션 = 미접수로 흐름이 멈췄을 때 작동하는 보완 규칙 |
| 중대 업무 미접수 | 임계 1시간(협의) 경과 시 건설사 본사 + 관제 자동 통보 |
| 기한 업무 초과 | 기한 경과 즉시 본사 통보 · 통보 이력은 업무 이력에 기록 |
| 알림 8종 | 통신·GPS·전압·단선·고장코드·서류 미비·수송관·필터 (기준 등록: B4-05) |

**권한 경계**

| 항목 | 규칙 |
|---|---|
| 본사 안전관리자 | 열람 + 확인 요청만 — 직접 처리 불가 (DISC-015) |
| 운영사 | 안전관리자 권한 부여 불가 — 법적 안전관리 책임은 건설사 |
| 인증 | 웹 4종 공통 로그인(B0) · 계정 발급·인증키 정책 DISC-020 |

## 저장소 · 축적

| 저장소 | 노드 | 대상 | 용도 | 단계 |
|---|---|---|---|---|
| RDS (PostgreSQL) | MGD-02 | ENT-01~11 — 현장·장비·사용자·업무·서류·알림·이력·계약 | 운영 OLTP · 트랜잭션 · append-only 이력 | 1단계 |
| 시계열 DB | MGD-06 (Timestream 또는 TimescaleDB) | ENT-12 텔레메트리 시계열 | 장비 최신 상태 · 기간 집계 · 추세 (예지 쿼리) | 2단계 (스키마는 1단계 정의) |
| S3 (데이터 레이크 기초) | MGD-03 | 서류 파일 + 원시 텔레메트리 아카이브 (Parquet 제안) | 콜드 — 전 기간 보존 · 재처리·학습 원천 | 1단계부터 적재 |
| Redis | MGD-04 | 장비 최신 상태 핫 뷰 · 세션 | 실시간 화면·팬아웃 보조 | 1단계 |

| 축적 항목 | 원천 | ENT | 계층 |
|---|---|---|---|
| 상태 이력 | IF-004 · SVC-01 | ENT-12 | 웜+콜드 |
| GPS 이력 | IF-003·004 | ENT-12 | 웜+콜드 |
| 통신 이력 (두절 포함) | IF-004 · LWT | ENT-12 ENT-08 | 웜+콜드 |
| 고장 이력 | error 필드 · SVC-02 | ENT-08 ENT-09 | RDS+콜드 |
| 전압 이력 | power 필드 | ENT-12 | 웜+콜드 |
| 단선 이력 | harness 필드 | ENT-12 ENT-08 | 웜+콜드 |
| 소모품 사용량 | consumables 필드 | ENT-12 | 웜+콜드 |
| 알림 이력 | SVC-02 | ENT-08 | RDS |
| 점검 이력 | API-013 (일일점검) | ENT-09 | RDS+콜드 |
