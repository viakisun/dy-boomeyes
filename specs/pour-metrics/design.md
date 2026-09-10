# pour-metrics — 설계

## 컴포넌트
- `BarChart`(Display, #58) — 12/24버킷. `bars[].label`은 호출부가 `fmtHour`로 만든다. 색은 `bg-accent`(막대) · `bg-accent-solid-active`(강조 = 현재 버킷) · `bg-surface-sunken`(트랙)뿐 — `accent-bg-subtle`은 sunken 트랙 위에서 보이지 않아 쓰지 않는다(캡처 육안) — hue 증가 0(B1-02 hue 3 · A1-05 2 · A2-04 4(BASELINE_OVER)).
- `ProgressBar tone="neutral"` — A2-04 가동률 · B4-07 누적 타설. `TelemetryGauge`는 "높을수록 나쁨"이라 가동률에 쓰지 않는다.
- `KeyValueList`/`<dl>` — 누적 · 24시간 · 오늘 · 가동률.

## 데이터
- `Device.pour?: PourSeries`(ENT-12 · ADR-013) — mock 시드 상태별 **KST 시각별 리터럴 24**(`pourSeries(now, m3ByHour, {zeroFrom?})`): 합계·가동률은 시각 불변, 차트 모양만 시각에 맞게 돈다. 고장 = 현재 버킷 0 · 두절 = 두절 시점 이후 0 · 정비 = 전부 0. 화면은 집계하지 않는다: 합계·가동률은 `PourSeries`가 들고 오고, "오늘"만 `todayM3(buckets, now)`(KST 자정 이후 버킷 합, UTC 산술)로 센다.
- B1-02는 `buckets.slice(-12)`, A1-05는 24개 전부, A2-04는 숫자만.
- `Part.guideM3?` — B4-07 분모. 없으면 종전 `maxPoured`.

## 라우트 · 쿼리
- A1-05 `?tab=parts` — 기존 탭 쿼리. capture `STATE_QUERY['A1-05:pour'] = 'tab=parts'`, `states.ts`는 `dev`와 같은 db.

## 빈 · 미연동
- `pour` 없음 → "타설량 미연동"(`text-fg-muted`, `data-ref="DISC-055"`). 전부 0 → 0 m³ · 0%(미연동 아님).

## 접근성
- `BarChart`: `<figure aria-label>` + 보이는 캡션 + `aria-hidden` 플롯 + sr-only 표(e2e는 `getByRole('figure')`·`getByRole('row')`로 값을 센다).
- 블록은 `<section aria-label="타설량">`(role region).
