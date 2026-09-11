W2 리뷰(`docs/design/REVIEW-2026-09-06.md`)에서 간결함을 깨는 원인은 토큰이 아니라 골격 편차였다 — 헤더 3종, 표 행 높이 불규칙, 전폭 폼, 색 숫자 Stat. 아래가 모든 화면의 기본 골격이다. 벗어나려면 `specs/<feature>/design.md`에 이유를 적는다.

### 11.1 웹 페이지

```
Topbar(브레드크럼 = 표면 이름 / 화면 이름)
PageHeader  제목 heading-xl · 부제 1줄(body-sm muted, ≤ 60자) · 메타 칩(현장 · 기간 · 건수) · 우측 액션 ≤ 2(주 solid 1 · 보조 outline 1) · 탭 슬롯
요약        Stat 행 — 최대 4, 각 폭 ≤ 240, 높이 88(compact) · 값 fg.default · 톤은 라벨 색(점 없음) · 힌트 1줄
본문        DataTable(목록) 또는 Card 그리드(대시보드·지도) → 보조 섹션(heading-md + 건수)
인스펙터    360 · 헤더(식별자 label-md muted · 제목 heading-md · 상태 pill) · KeyValueList · 액션 행(하단, 주 1 · 보조 1) · 이력 Timeline
```

- 뒤로 가기는 브레드크럼이 담당한다 — 상세 화면(`[id]` 라우트)은 가운데 조각이 부모 화면 링크(`crumbsFor`의 `PARENT`). 본문 안 `‹ 상위 화면` 링크는 두지 않는다.
- 부제에는 화면이 "무엇을 보여주는가"만. 규칙·근거·한계는 §12(카피)의 자리로.
- 섹션 사이 `stack.lg`, 카드 안 `inset.lg`. 콘텐츠가 뷰포트 절반 미만이면 요약을 접거나 표 밀도를 올린다 — 빈 아래쪽을 여백으로 두지 않는다.

### 11.2 표(DataTable)

| 규칙 | 값 |
|---|---|
| 행 높이 | `row.default`(compact 36) 기본 · 조밀 표만 `row.dense`(32) · 식별자+현장처럼 의미가 다른 정보는 2줄 허용. 좁은 폭에서 주요 정보 숨김 금지 |
| 식별자 셀 | `code-md` · `whitespace-nowrap` · 최소 폭 = 가장 긴 ID |
| 텍스트 셀 | 1줄 · 넘치면 `truncate` + `title` |
| 수치 셀 | 우측 정렬 · `tabular-nums` · 단위는 헤더에 |
| 상태 셀 | StatusPill sm 하나 — warning·danger만 pill, 나머지는 텍스트(§0-4 색 예산) · 셀 텍스트 채색은 danger 1종만(예: 전압 이상) |
| 첫 열 | 고정 폭 · 식별자 또는 이름 |
| 선택 | 행 `bg.selected` · 포커스 링 · Enter 열기 |
| 열 수 | 7 이하 — 넘치면 인스펙터로 |

### 11.3 폼

- 웹: 최대 폭 `form.max` 640 · 라벨 위 · 필수 `*` · 도움말 1줄 · 버튼은 내용 폭, 우측 정렬(주 1 · 취소 ghost) · 인스펙터 안 폼은 하단 액션 행.
- PWA: 전폭 · 컨트롤 48 · 주 CTA 전폭 solid 1개 · 파괴 동작은 시트 2단계.
- 반복 편집(규칙 8종 × 속성)은 카드 나열이 아니라 표형(행 = 항목, 열 = 속성). 저장 바는 하단 고정.

### 11.4 요약 지표(Stat)

- 값은 `fg.default`(display-md). 톤은 라벨 색(warning · danger)으로만, 점은 쓰지 않는다(§0-4 점은 신호에만) — danger일 때만 값을 `danger.fg`.
- 라벨 label-md muted 위, 값, 힌트 1줄(body-sm muted). 힌트는 분모·기간·범위만.
- 4개 이하, 폭을 늘려 채우지 않는다 — `StatGroup`(열 폭 `sys.layout.stat.width` 240 · 좌측 정렬 · 보고 화면만 6열) 안에 `Stat`(최소 높이 `sys.size.stat.height` 88). 모바일은 2×2.

### 11.5 아이콘

- 세트 `@lucide/svelte`(ui가 `Icon*`으로 재노출) · 크기 `size.icon.md`(웹 16 · PWA 20) · 굵기 기본 · 색 currentColor.
- 내비 항목 1개 = 아이콘 1개 + 라벨. 자리(placeholder) 사각형을 배포하지 않는다.

| 화면·항목 | 아이콘(lucide 정식 이름) |
|---|---|
| 대시보드 · 관제 | layout-dashboard · monitor |
| 수신함 · 업무함 · 업무 | inbox · clipboard-list |
| 에스컬레이션 | siren |
| 서류 | file-text |
| 임대 계약 | file-pen-line |
| 쇼케이스 · 보고 모드 | presentation |
| 이벤트 복기 | rotate-ccw-clock |
| 지도 · 현장 | map · map-pin |
| 프로토콜 | file-code-corner |
| 장비 · 호기 | truck |
| 사용자·권한 | users |
| 알림 기준 · 알림 | bell |
| 부품 · 점검 | wrench · clipboard-check |
| 기록 | scroll-text |
| 오늘 | calendar-check |
| 메뉴·현장 정보 | menu |
| 로그아웃 · 다크 | log-out · moon |

### 11.6 4상태

빈(EmptyState — 행동 버튼) · 오류(재시도) · 오프라인(셸 배너 + 큐, §10) · 로딩(300ms 후 Skeleton). 화면당 spec에 넷을 적는다.

### 11.7 소유주 데모 패턴 — 텍스트에서 시각으로

owner-experience의 현황/탐색/상세/뷰어는 목적별 구성을 적용한다(§0-10). 근거와 측정은 `docs/design/OWNER-VISUAL-LANGUAGE-2026-09-11.md`.

1. **한 화면 한 주인공** — 현황 = 지도(xl 12열 중 8, 높이 `layout.panel.height`), 보유 = 장비 행/카드, 상세 = 장비 히어로(display 호기 · 스틸 · 조건 pill · 배치 배지 · 주 행동), 영상 = 플레이어, 서류 = 원문, 알림 = 선택한 알림. 주인공이 첫 뷰포트의 절반 이상.
2. **설명하지 않고 보여준다** — 지시 부제·각주·상태 설명 문장을 두지 않는다. 문장은 빈·오류·오프라인 상태에만. 상태는 아이콘 + 2~4어 라벨(StatusPill · Badge). "시연" 칩·"기준 시각" 문장·푸터는 화면에 두지 않는다(DemoBar).
3. **큰 숫자, 작은 라벨** — 값 `display` + 라벨 `label-md` muted + 단위 `body-sm`. `·`로 메타를 이어 붙이지 않고 아이콘 메타 행(줄당 아이콘 ≤ 1: map-pin 현장 · building-2 건설사 · clock 수신 · calendar 계약 · wifi-off 미수신) 또는 KeyValueList.
4. **시각 인코딩** — 계약 기간 = PeriodBar(양끝 time · 오늘 마커 `radius.mark` · 종료까지 D-n, ≤ 30일 warning), 보유 구성 = FleetSummary 분포 막대(`role=img`), 담당자 = ContactCard(이니셜 아바타 · tel: 링크 · 복사), 장비 = 카메라 poster 스틸 또는 IconTile, 서류 = previewUrl 썸네일 또는 IconTile, 위치 = 지도 스니펫(상세는 1마커 `fitMarkers`).
5. **선 대신 여백·층** — 카드 크롬(`radius.card` · `shadow.raised` · `bg.surface`)은 List와 카드 외곽에만. 섹션은 제목 + 간격 + `bg.surface-sunken` 층. 표 머리글 텍스트 없음. 행 구분선은 `border.subtle`.
6. **시각은 상대 + 절대** — 목록은 `relativeLabel`(DemoClock 기준) + `<time title>` 절대. 미수신은 "마지막 수신 + 절대 시각"을 warning 텍스트로(FR-034). 상세 "장비 상태" 영역은 절대 시각만(오프라인 전후 텍스트 동일).
7. **밀도는 역할에서(§0-6)** — 소유주 화면은 웹도 comfortable. 웹 레이아웃이 루트 `data-density`를 전환한다.
8. **색 예산 유지(§0-4)** — IconTile·PeriodBar의 톤은 `neutral|warning|danger`뿐. 점(StatusDot · signal · Badge dot)은 소유주 화면에 0. 6초 루프 샘플에 LIVE 표시를 붙이지 않는다.

컴포넌트: IconTile · List · PeriodBar · ContactCard · ContextHeader(스크롤 시 sticky 축약 바, compact일 때만 렌더) · AlertCard · EquipmentRow(layout columns/stacked · poster) · FleetSummary. 채택하지 않음: Tabs(`role=tab`) · DataTable(`<table>`) — 목록은 List + 정렬 열 행(`role=list`). 보관 대수를 가용 대수로 표시하지 않는다.
