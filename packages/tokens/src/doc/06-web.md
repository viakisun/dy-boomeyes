대상: B0 로그인 · B1 관제 · B2 본사 · B3 현장 · B4 관리자(백오피스). 기본 모드 light/compact. 사용자가 탑바 토글로 전체 다크를 고를 수 있다(기기 단위 `localStorage dy.theme`, 기본은 light). 모니터링 월보드·쇼케이스(B1-07 · B3-06 · CameraWall)는 사용자 설정과 무관하게 dark 강제.

**참조에서 취한 것(Linear)**: 중립색 우선·액센트 절제, 밀도(행 36 · 본문 13 · 컨트롤 32), 3열 셸(사이드바 240/56 · 상단 48 · 우측 인스펙터 360), ⌘K 커맨드 메뉴, 반투명 분리선(다크에서 white-8~16), 빠른 모션(100~200ms), 목록 → 상세 패널 흐름, 키보드 우선.

1. **셸.** `WebShell` = Sidebar(접힘 56) + Topbar 48 + Content(최대 1400, 좌우 24) + Inspector 360(선택 시). 페이지 제목은 Topbar가 아니라 본문 `PageHeader`.
2. **목록이 기본 화면.** 관제·업무·서류·장비는 `DataTable`(행 36, 셀 좌측 · 수치 우측 · 첫 열 고정)이 기본. 카드 그리드는 대시보드(B1-02)와 지도 병렬 뷰에만.
3. **상세는 옆에서.** 행 선택 → Inspector에 상세. 전체 페이지 이동은 편집·생성만. 뒤로가기로 목록 상태 복원.
4. **색은 세 층.** 바탕 `bg.canvas`, 면 `bg.surface`, 컨트롤 `bg.ui`. 액센트는 주 버튼·선택 표시·링크에만. 상태색은 점·필·셀 배경(`status.*.bg`)으로, 행 전체 채색은 금지.
5. **텍스트 위계.** heading-xl(24) 페이지 · heading-md(16) 패널 · body-md(13) 본문 · label-md(12) 메타 · code-md 식별자(CPB-004, E-021)는 모노.
6. **키보드.** 모든 목록 행 포커스 가능, `/` 검색, `⌘K` 커맨드, `Esc` 패널 닫기, 포커스 링 2px `focus.ring` offset 2.
7. **알림·피드.** B1-02 알림 피드는 `severity` 도메인 색 + 아이콘. 에스컬레이션은 `task.escalated`(danger)와 `EscalationTimer`.
8. **다크.** 전체 다크는 문서 루트 `data-theme="dark"`(탑바 토글 · 캡처 `?theme=`)로만 켠다 — 화면·컴포넌트는 다크 전용 스타일을 갖지 않는다. `CameraWall`·쇼케이스는 컴포넌트 루트에 `data-theme="dark"`를 두고 내부만 강제. 큰 수치 display-lg · 상태 solid 9단 · 텍스트 fg.default.
9. **빈·오류·로딩.** 목록 0건 `EmptyState`(행동 버튼 포함), 필터 0건(필터 초기화), 오류(재시도). 로딩은 300ms 후 Skeleton.
10. **밀도 고정.** 웹 루트는 `data-density="compact"`. 사용자가 comfortable로 바꾸는 설정은 두지 않는다(관제 화면 정보량 보호).
