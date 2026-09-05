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
