# 화면 레지스트리 (SCREENS)

생성물 — 원천 `ssot/screens.yaml` · 재생성 `pnpm ssot:build` · 수기 수정 금지.

| 표면 | 앱 | 화면 수 | 웨이브 0 | 1 | 2 | 4 |
|---|---|---|---|---|---|---|
| A1 | 현장 안전관리자 APP (pwa) | 9 | 0 | 5 | 4 | 0 |
| A2 | 운전자 APP (pwa) | 7 | 0 | 4 | 3 | 0 |
| A3 | 본사 안전관리자 APP (pwa) | 6 | 0 | 0 | 6 | 0 |
| A4 | 사업주 PWA (pwa) | 6 | 0 | 0 | 0 | 6 |
| B0 | 웹 공통 로그인 (web) | 1 | 1 | 0 | 0 | 0 |
| B1 | 운영사 관제 WEB (web) | 8 | 1 | 3 | 4 | 0 |
| B2 | 건설사 본사 관리 WEB (web) | 3 | 0 | 0 | 3 | 0 |
| B3 | 현장 안전관리자 WEB (web) | 6 | 0 | 0 | 0 | 6 |
| B4 | 관리자 WEB 백오피스 (web) | 7 | 0 | 2 | 5 | 0 |

| 코드 | 이름 | 표면 | 라우트 | 역할 | 단계 | 웨이브 | 상태 픽스처 | FR | spec |
|---|---|---|---|---|---|---|---|---|---|
| `A1-01` | 로그인 | A1 | `/a1/login` | site-safety | 1 | 1 | 1 (login) | FR-001 | shell-auth |
| `A1-02` | 업무함 | A1 | `/a1/inbox` | site-safety | 1 | 1 | 2 (inbox filter) | FR-008 FR-009 FR-011 FR-015 | demo-scripts task-escalation |
| `A1-03` | 업무 상세 | A1 | `/a1/inbox/[case]` | site-safety | 1 | 1 | 1 (case) | FR-006 FR-008 | demo-scripts task-escalation |
| `A1-04` | 관제(장비·영상) | A1 | `/a1/monitor` | site-safety | 1 | 1 | 1 (monitor) | FR-004 FR-028 FR-030 FR-034 | demo-scripts video-basics |
| `A1-05` | 장비 상세 | A1 | `/a1/monitor/[device]` | site-safety | 1 | 1 | 1 (dev) | FR-002 FR-005 FR-007 FR-016 FR-036 | demo-scripts video-basics |
| `A1-06` | 기록 | A1 | `/a1/records` | site-safety | 1 | 2 | 1 (rec) | FR-012 | — |
| `A1-07` | 메뉴·현장 정보 | A1 | `/a1/menu` | site-safety | 1 | 2 | 2 (menu apply) | FR-017 FR-018 FR-026 | — |
| `A1-08` | 완료 처리 시트 | A1 | `/a1/inbox/[case]?sheet=complete` | site-safety | 1 | 2 | 1 (sheet) | FR-008 | — |
| `A1-11` | 부품 점검 입력 | A1 | `/a1/parts/inspect` | site-safety | 1 | 2 | 1 (default) | FR-032 FR-035 | — |
| `A2-01` | 로그인 | A2 | `/a2/login` | driver | 1 | 1 | 1 (login) | FR-001 | shell-auth |
| `A2-02` | 오늘(출근·알림) | A2 | `/a2/today` | driver | 1 | 1 | 2 (today checked) | FR-011 FR-013 FR-031 | demo-scripts driver-daily |
| `A2-03` | 일일점검 | A2 | `/a2/today/inspect` | driver | 1 | 1 | 2 (inspect inspected) | FR-014 | demo-scripts driver-daily |
| `A2-04` | 내 장비 | A2 | `/a2/device` | driver | 1 | 1 | 1 (mydev) | FR-002 FR-007 | driver-daily |
| `A2-05` | 내 서류 | A2 | `/a2/docs` | driver | 1 | 2 | 1 (docs) | FR-015 | — |
| `A2-06` | 메뉴·현장 정보 | A2 | `/a2/menu` | driver | 1 | 2 | 1 (menu) | FR-018 | — |
| `A2-09` | 교체·폐기 처리 | A2 | `/a2/parts/replace` | driver | 1 | 2 | 1 (default) | FR-032 FR-035 | — |
| `A3-01` | 로그인 | A3 | `/a3/login` | hq-safety | 1 | 2 | 1 (login) | FR-001 | shell-auth |
| `A3-02` | 현장 목록(본사) | A3 | `/a3/sites` | hq-safety | 1 | 2 | 1 (sites) | FR-010 FR-022 | — |
| `A3-03` | 현장 상세 | A3 | `/a3/sites/[site]` | hq-safety | 1 | 2 | 2 (site normal) | FR-022 | — |
| `A3-04` | 장비 열람 | A3 | `/a3/sites/[site]/devices` | hq-safety | 1 | 2 | 1 (dev) | FR-004 FR-022 | — |
| `A3-05` | 업무(열람) | A3 | `/a3/tasks` | hq-safety | 1 | 2 | 1 (inbox) | FR-022 | — |
| `A3-06` | 기록 | A3 | `/a3/records` | hq-safety | 1 | 2 | 1 (rec) | FR-012 FR-022 | — |
| `A4-01` | 로그인 | A4 | `/a4/login` | owner | 2 | 4 | 1 (login) | FR-001 | shell-auth |
| `A4-02` | 보유·가용 현황 | A4 | `/a4/fleet` | owner | 2 | 4 | 1 (fleet) | FR-025 | — |
| `A4-03` | 투입 요청·배정 | A4 | `/a4/requests` | owner | 2 | 4 | 1 (inbox) | FR-026 | — |
| `A4-04` | 운전자 배치 | A4 | `/a4/drivers` | owner | 2 | 4 | 1 (drivers) | FR-027 | — |
| `A4-05` | 임대 계약 | A4 | `/a4/leases` | owner | 2 | 4 | 1 (lease) | FR-025 | — |
| `A4-06` | 운전자 서류 | A4 | `/a4/drivers/docs` | owner | 2 | 4 | 1 (docs) | FR-027 | — |
| `B0-01` | 웹 공통 로그인 | B0 | `/login` | control hq-safety site-safety ops-admin | 1 | 0 | 4 (login-b1 login-b2 login-b3 login-b4) | FR-001 FR-031 | shell-auth |
| `B1-02` | 관제 대시보드 | B1 | `/b1/dash` | control maintenance | 1 | 0 | 1 (dash) | FR-002 FR-003 FR-006 FR-024 FR-034 FR-036 | control-dashboard demo-scripts |
| `B1-02M` | 카메라 영상 모달 | B1 | `/b1/dash?cam=[camera]` | control maintenance | 1 | 1 | 1 (cam) | FR-004 FR-005 FR-024 FR-028 FR-029 FR-034 | control-dashboard video-basics |
| `B1-03` | 수신함 | B1 | `/b1/inbox` | control maintenance | 1 | 1 | 1 (inbox) | FR-017 FR-018 FR-024 | demo-scripts task-escalation |
| `B1-04` | 에스컬레이션 | B1 | `/b1/escalation` | control maintenance | 1 | 1 | 1 (esc) | FR-010 FR-024 | demo-scripts task-escalation |
| `B1-05` | 서류 현황 | B1 | `/b1/docs` | control maintenance | 1 | 2 | 1 (docs) | FR-016 FR-024 | — |
| `B1-06` | 임대 계약 | B1 | `/b1/leases` | control maintenance | 1 | 2 | 1 (lease) | FR-019 FR-024 | — |
| `B1-07` | 쇼케이스 | B1 | `/b1/showcase` | control maintenance | 2 | 2 | 1 (show) | FR-023 FR-024 | — |
| `B1-08` | 이벤트 복기 | B1 | `/b1/events/[event]` | control maintenance | 1 | 2 | 1 (default) | FR-024 FR-033 | — |
| `B2-02` | 본사 지도 | B2 | `/b2/map` | hq-safety | 1 | 2 | 1 (work) | FR-003 FR-022 FR-024 | — |
| `B2-03` | 현장 상세 | B2 | `/b2/sites/[site]` | hq-safety | 1 | 2 | 1 (site) | FR-004 FR-022 FR-024 | — |
| `B2-04` | 보고 모드 | B2 | `/b2/report` | hq-safety | 2 | 2 | 1 (report) | FR-022 FR-023 FR-024 | — |
| `B3-02` | 현장 콘솔 | B3 | `/b3/console` | site-safety | 2 | 4 | 1 (console) | FR-004 FR-024 FR-030 | — |
| `B3-03` | 업무 | B3 | `/b3/tasks` | site-safety | 2 | 4 | 1 (tasks) | FR-008 FR-024 | — |
| `B3-04` | 서류 | B3 | `/b3/docs` | site-safety | 2 | 4 | 1 (docs) | FR-016 FR-024 FR-027 | — |
| `B3-05` | 기록 | B3 | `/b3/records` | site-safety | 2 | 4 | 1 (rec) | FR-012 FR-024 | — |
| `B3-06` | 쇼케이스 | B3 | `/b3/showcase` | site-safety | 2 | 4 | 1 (show) | FR-023 FR-024 | — |
| `B3-07` | 현장 부품 현황 | B3 | `/b3/parts` | site-safety | 2 | 4 | 1 (default) | FR-024 FR-032 | — |
| `B4-02` | 프로토콜 관리 | B4 | `/b4/protocols` | ops-admin | 1 | 1 | 1 (proto) | FR-020 | admin-protocol-rules demo-scripts |
| `B4-03` | 장비·현장·프로파일 | B4 | `/b4/assets` | ops-admin | 1 | 2 | 1 (assets) | FR-018 FR-026 FR-029 FR-031 | — |
| `B4-04` | 사용자·권한 | B4 | `/b4/users` | ops-admin | 1 | 2 | 1 (users) | FR-021 | — |
| `B4-05` | 알림 기준 | B4 | `/b4/rules` | ops-admin | 1 | 1 | 1 (rules) | FR-006 FR-007 FR-011 FR-036 | admin-protocol-rules |
| `B4-06` | 서류 관리 | B4 | `/b4/docs` | ops-admin | 1 | 2 | 1 (docs) | FR-016 | — |
| `B4-07` | 부품 대장 | B4 | `/b4/parts` | ops-admin | 1 | 2 | 1 (default) | FR-032 | — |
| `B4-08` | 점검·교체 이력 | B4 | `/b4/parts/history` | ops-admin | 1 | 2 | 1 (default) | FR-032 | — |
