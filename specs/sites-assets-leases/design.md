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
