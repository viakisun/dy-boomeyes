# owner-drivers — 작업

1. **읽기 모델·시드** — `OwnerDriver` · `OwnerDevice.driver` · `OwnerDoc.owner` 갈래 · 운전자 6명 시드 · 단위 테스트(호기 서류에 운전자 서류가 섞이지 않는지).
   DoD: `pnpm test` 통과 · `pnpm verify` exit 0. `Refs: FR-027 FR-016`
2. **호기 «오늘 운전자» 한 줄** — `UnitPanel`·`OwnerDetail`에 추가하고 서류 목록에서 운전자 자격증을 뺀다.
   DoD: 캡처 호기 단계 녹색 · 눈으로 확인(서류 7종에 자격증 없음). `Refs: SCR-B1-10 SCR-A4-08 FR-027`
3. **명단(B1-14 · A4-04)** — 행 = 이름·면허·만료·오늘 배정·연락처 · 만료 임박 정렬 우선.
   DoD: `capture --dark --strict` 4픽스처 녹색. `Refs: SCR-B1-14 SCR-A4-04 FR-027`
4. **운전자 서류(B1-15 · A4-06)** — 운전자별 서류·원문 열람·미비 표시.
   DoD: 캡처 녹색 · 뷰어 복귀 e2e. `Refs: SCR-B1-15 SCR-A4-06 FR-027 FR-016`
5. **만료 알림·AI 경고 연결** — 종 패널에 만료 임박 · AI 이벤트에 그 시각 배정 운전자 기록.
   DoD: `pnpm e2e` AC-4·AC-5 통과. `Refs: FR-027 FR-028`

### 상태(2026-09-13 · `feat/owner-overview-stages`)

1~5 구현 완료. 명단·서류는 계약 화면 옆 탭에서 열고(메뉴는 시안대로 셋이다), 호기 화면은 차량 서류 아래에 운전자 서류 링크를 둔다. 자격 만료는 종 알림의 한 종류가 됐고, AI 경고는 그 시각 배정 운전자를 함께 기록한다.
