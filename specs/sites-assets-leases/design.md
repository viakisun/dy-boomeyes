# sites-assets-leases — 설계

## 데이터
- API: `createSite/updateSite` · `registerDevice/assignDevice(deviceId, siteId)` · `setSiteProfile(siteId, preset)` · `setUserRole/setUserSites` · `lease(id)` · `planRelocation(leaseId, toSiteId, note)` · `createRequest(input)`(`request` 기계) · 기존 `decide()`를 `transition('request', …)`로 전환.
- `Lease.state`(ssot `lease`) 추가 · 시드 LS-001 `expiring`.
- B2-02는 `sites(scope)`·`devices(scope)`·`kpis(scope)`(hq 스코프 = 2현장) 재사용.

## 컴포넌트
- B4-03: `PageHeader` + `Tabs` + 탭별 dirty 저장(`b4/rules` 패턴) + `Select`(프리셋) · 카탈로그 등록 PageHeader/Select.
- B4-04: `DataTable` + `Inspector` · 역할 `Select`.
- B1-06: 목록+인스펙터 · `Timeline` · 재배치 폼(`Dialog`).
- B2-02: `MapView` 재사용(hq 스코프 마커) + 현장 카드 목록 · 처리 버튼 없음.
- A1-07/A2-06: `KeyValueList`(등록) + `BottomSheet`(신청 폼, `capture` prop) · `List`.
- A3-03: `Stat` 4 + "확인 요청" 버튼(`requestConfirm`은 video-basics B4에서 도입, 공용).

## 라우트 · 쿼리
- B4-03 `?tab=devices|sites|profiles` · B4-04 `?user=` · B1-06 `?lease=` · B2-02 → `/b2/sites/[site]` · A1-07 `?state=apply`.

## 오류 · 빈 상태 · 접근성
- 호기 중복 배정은 폼 오류 · 현장 0 EmptyState · 지도 idle 대기(`[data-map-ready]`).

## 열린 질문
- DISC-015(본사 권한) · DISC-034 · DISC-037 · DISC-026(사업주 대행 입력).

## W2 B5 — B4-03 · B4-04 구현 메모
- 타입: `Site.period?{from,to}`(기간) · `User.status?('active'|'suspended')` — AC-1·AC-2 문구의 "기간"·"상태". 시드 현장 2에 기간, 계정 상태는 없으면 active.
- API: `createSite/updateSite`(현장명 필수) · `registerDevice`(호기 1~120 정수 · 중복 오류 · 설치 전 `offline`, 카메라 등록은 W3) · `assignDevice`(현장 좌표로 이동) · `setSiteProfile`(PROFILE_IDS 검증) · `setUserRole`(site-safety 부여 불가) · `setUserSites`(없는 현장 제외) · `setUserStatus`. 도메인 `ROLE_NAME`(roles.yaml name) · `profileAxes(preset)`(8축 선택지).
- 컴포넌트(카탈로그): PageHeader · Select(네이티브, label 연결, 옵션 disabled) · KeyValueList(dl) · SiteProfileForm(프리셋 Select + 8축 KeyValueList + 축 편집 비활성 버튼 + 표준 패키지 문구).
- "즉시 반영" 검증: 프리셋 적용 뒤 같은 db를 읽는 카메라 월 미리보기(`CameraWall`, B1-02·A1-04와 같은 `visibleIn`)가 채널 수를 바꾼다 — e2e `[B4-03]` 6 → 3. 계정을 바꿔 B1-02·A1-04에서 다시 보는 흐름은 e2e 한 테스트에 담기지 않는다(QA §3: 전체 로드 = mock db 초기화) → Vitest `[FR-029]`가 `profileFlags` 체인을 검사.
- B4-04 "가드 즉시 반영": 인스펙터 접근 화면 = `canAccess`(라우트 가드와 같은 함수)로 계산 · 내 계정 역할 변경은 세션(`login`)도 갱신.

## W2 B6 — B1-06 · B2-02 구현 메모
- `Lease.state`(lease 상태기계 ENT-10) · `toSiteId` · `note` · `history` — 시드 LS-001 `expiring`(D-27, 이력 "만료 임박 D-30") · LS-002 `active`. `planRelocation(leaseId, toSiteId, note, by)` = `transition('lease', state, 'relocated')`(expiring에서만) + 대상 현장·메모·이력. 만료 D-30 스케줄러(active → expiring)는 서버 W3.
- 수신함 `decide()`는 `request` 상태기계(ENT-20)로 전이한다 — doc 기계 차용 종료. domain `machines.test`에 lease·request 전이 표 테스트.
- B1-06: PageHeader + Stat 4 + DataTable(만료 빠른 순) + Inspector(계약 상세 · 재배치 계획 폼(expiring만) · 홍보 연계 문구 · Timeline). `?lease=` 선택.
- B2-02: hq 스코프(`users → me.siteIds`) · MapView 마커(장비 5) + 현장 카드(링크 → B2-03) · Stat 4(kpis) · "보고 모드" 링크(B2-04, B8) · 처리 버튼 없음. 마커 선택은 그 호기의 현장 상세로.
- 장면 9: `SCENE_FIXTURES[9]` = 시드(entry `/b1/leases` · control01 자동 파생) · e2e는 재배치까지.

## W2 B7 — A1-07 · A2-06 · A3-03 구현 메모
- `createRequest(input)` = request 상태기계 submitted → review(자동, "수신함 등록 — 검토 중" 이력) · id `RQ-${n}`(시드 5 → 첫 신청 RQ-006 — spec 픽스처 ID는 런타임 결과). B1-03은 코드 변경 없이 새 신청을 최상단(requestedAt desc)에 보인다.
- A1-07: 현장 기본정보 KeyValueList(현장명·주소·기간·담당·영상 채널·장비·타설 일정 DISC-034 미확정) · 내 신청 목록(requesterId = me) · "현장 개설 신청" 시트(BottomSheet `capture`, 종류 Select 현장 개설/장비 배정 · 현장명 또는 필요 대수 · 주소 · 기간 · 메모). `?state=apply`는 화면이 직접 읽어 시트를 연 채 시작(screenForPath 무관, 캡처·e2e). 로그아웃은 셸 앱바(중복 금지). `List` 컴포넌트는 만들지 않았다(`ul` + 카드 관례).
- A2-06: `today(me)` 하나로 현장·장비·동의·정비 연락처 — KeyValueList + EquipmentCard(summary) + 동의 Badge(`CONSENT_LABEL`, ui labels) + 앱 정보(계정·역할·wave). 버튼 0.
- A3-03: hq 스코프 · Stat 4(장비·이상·미처리 업무·서류 완비율 = docCompleteness 현장 행) · 기본정보 · 미처리 업무마다 "확인 요청"(`requestConfirm(caseId)` — 현장 단위 API 없음) · 장비 열람 링크(A3-04) · 처리 버튼 0. `normal` 픽스처 = SITE-002 장비를 정상으로(이상 0, capture `STATE_PARAMS` SITE-002) — "이상" 정의는 A3-02와 같은 `state !== 'normal'`.
