W2 리뷰(`docs/design/REVIEW-2026-09-06.md`)에서 간결함을 깨는 원인은 토큰이 아니라 골격 편차였다 — 헤더 3종, 표 행 높이 불규칙, 전폭 폼, 색 숫자 Stat. 아래가 모든 화면의 기본 골격이다. 벗어나려면 `specs/<feature>/design.md`에 이유를 적는다.

### 11.1 웹 페이지

```
Topbar(브레드크럼 = 표면 이름 / 화면 이름)
PageHeader  제목 heading-xl · 부제 1줄(body-sm muted, ≤ 60자) · 메타 칩(현장 · 기간 · 건수) · 우측 액션 ≤ 2(주 solid 1 · 보조 outline 1) · 탭 슬롯
요약        Stat 행 — 최대 4, 각 폭 ≤ 240, 높이 88(compact) · 값 fg.default · 톤은 값 옆 점 또는 pill · 힌트 1줄
본문        DataTable(목록) 또는 Card 그리드(대시보드·지도) → 보조 섹션(heading-md + 건수)
인스펙터    360 · 헤더(식별자 label-md muted · 제목 heading-md · 상태 pill) · KeyValueList · 액션 행(하단, 주 1 · 보조 1) · 이력 Timeline
```

- 뒤로 가기는 브레드크럼이 담당한다. 본문 안 `‹ 상위 화면` 링크는 상세 화면(`[id]` 라우트)에만, PageHeader 위 한 곳에.
- 부제에는 화면이 "무엇을 보여주는가"만. 규칙·근거·한계는 §12(카피)의 자리로.
- 섹션 사이 `stack.lg`, 카드 안 `inset.lg`. 콘텐츠가 뷰포트 절반 미만이면 요약을 접거나 표 밀도를 올린다 — 빈 아래쪽을 여백으로 두지 않는다.

### 11.2 표(DataTable)

| 규칙 | 값 |
|---|---|
| 행 높이 | `row.dense` 36(compact) 기본 · 두 줄 셀은 만들지 않는다 |
| 식별자 셀 | `code-md` · `whitespace-nowrap` · 최소 폭 = 가장 긴 ID |
| 텍스트 셀 | 1줄 · 넘치면 `truncate` + `title` |
| 수치 셀 | 우측 정렬 · `tabular-nums` · 단위는 헤더에 |
| 상태 셀 | StatusPill sm 하나 · 셀 텍스트 채색은 danger 1종만(예: 전압 이상) |
| 첫 열 | 고정 폭 · 식별자 또는 이름 |
| 선택 | 행 `bg.selected` · 포커스 링 · Enter 열기 |
| 열 수 | 7 이하 — 넘치면 인스펙터로 |

### 11.3 폼

- 웹: 최대 폭 `form.max` 640 · 라벨 위 · 필수 `*` · 도움말 1줄 · 버튼은 내용 폭, 우측 정렬(주 1 · 취소 ghost) · 인스펙터 안 폼은 하단 액션 행.
- PWA: 전폭 · 컨트롤 48 · 주 CTA 전폭 solid 1개 · 파괴 동작은 시트 2단계.
- 반복 편집(규칙 8종 × 속성)은 카드 나열이 아니라 표형(행 = 항목, 열 = 속성). 저장 바는 하단 고정.

### 11.4 요약 지표(Stat)

- 값은 `fg.default`(display-md). 색으로 말하지 않는다 — 톤은 값 옆 점/pill, danger일 때만 값을 `danger.fg`.
- 라벨 label-md muted 위, 값, 힌트 1줄(body-sm muted). 힌트는 분모·기간·범위만.
- 4개 이하, 폭을 늘려 채우지 않는다(`max-w` 240). 모바일은 2×2.

### 11.5 아이콘

- 세트 `@lucide/svelte`(ui가 `Icon*`으로 재노출) · 크기 `size.icon.md`(웹 16 · PWA 20) · 굵기 기본 · 색 currentColor.
- 내비 항목 1개 = 아이콘 1개 + 라벨. 자리(placeholder) 사각형을 배포하지 않는다.

| 화면·항목 | 아이콘 |
|---|---|
| 대시보드 · 관제 | layout-dashboard · monitor |
| 수신함 · 업무함 · 업무 | inbox · clipboard-list |
| 에스컬레이션 | siren |
| 서류 | file-text |
| 임대 계약 | file-signature |
| 쇼케이스 · 보고 모드 | presentation |
| 이벤트 복기 | history |
| 지도 · 현장 | map · map-pin |
| 프로토콜 | file-code-2 |
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
