# driver-daily — 기술 설계

## 레이아웃 (PwaShell · comfortable)
- **A2-02 오늘**: `CheckinCard`(체크인/체크아웃 큰 버튼 48px · 시각 · 현장명) · 점검 `Banner`(미제출 warning → "작업 전 점검 필요" · 제출 후 success) · 배정 장비 카드(호기 · 상태 `StatusPill` · 고장코드) · 오늘 알림 `List`(`StatusPill` 등급 · 메시지 · 시각, 탭 → 대응 안내 `Dialog`) · 촬영 중 `Badge` + 동의 상태 `Badge`.
- **A2-03 일일점검**: `ChecklistForm`(5항목 `Checkbox` 48px · 항목별 이상 메모) · 사진 첨부 자리 · 제출 `Button` block · 제출 후 요약(시각 · 결과 · 제출자).
- **A2-04 내 장비**: `TelemetryStrip`(통신 · 전압 · 단선 · 고장코드) · 소모품 `TelemetryGauge` 2(수송관 · 필터: 도달률 % + 임계 색 = `sys.color.status` warning/danger) · 카메라 상태 2 · 마지막 수신.

## 컴포넌트 · 토큰
카탈로그: `CheckinCard` · `ChecklistForm` · `TelemetryGauge`(`role=meter`) · `TelemetryStrip` · `Card` `Banner` `Badge` `StatusPill` `List` `Dialog` `Toast` `EmptyState`. 토큰: `sys.size.control.lg`(48) · `domain.equipment.*` · 도달률 임계 색 = `sys.color.status.*`(warning/danger — 별도 토큰 없음).

## 데이터
- ENT-05 운전자(siteIds · 배정 장비) · ENT-02 장비 · ENT-12 텔레메트리 · ENT-08 알림(driver 스코프) · ENT-09 이력(checkin · checkout · inspection) · ENT-15 동의.
- mock: `api.today(userId)` → {assignment, attendance, inspection, alerts, consent} · `api.checkin({lat,lng})`(현장 반경 판정 — 시드 상수 200m, SSOT 미정·DISC 후보 · mock GPS = 현장 좌표 ± 옵션 `?gps=out`) · `api.checkout()` · `api.submitInspection(items)` · `api.ackAlert(id)`. 픽스처: `today`(미체크인 · 미점검) · `checked`(체크인 후) · `inspect`(체크인 후 · 미점검) · `inspected`(제출 후) · `mydev`.
- 점검 항목 5는 시드 상수(DISC-033 확정 전 임시).

## 라우트 · 쿼리
`/a2/today?state=today|checked` · `/a2/today/inspect?state=inspect|inspected` · `/a2/device?state=mydev` · `?gps=out`(반경 밖 재현).

## 오프라인 · 오류 · 빈 상태
`navigator.onLine` false 또는 `?net=off` → 셸 배너 "오프라인 — 동기 대기 n건" · 체크인·체크아웃·점검 제출은 아웃박스(`packages/offline` `withOutbox(api)`, ADR-010)에 적재되고 카드에 "동기 대기" pill(읽기 오버레이 `pending`) · 연결(online 이벤트 · 앱 시작 · 배너 "지금 동기")되면 사용자별 FIFO로 `meta{clientId, at}`와 함께 전송 · `?net=fail`은 백오프 5회 뒤 "전송 실패 n건 · 재시도" · 업무 거부(반경 밖)는 항목 단위 토스트 · 반경 밖 → `Dialog`(거리 · 현장 주소) · 배정 장비 없음 → EmptyState.

## 접근성
체크리스트 `fieldset/legend` · 게이지 `aria-valuenow/min/max` + 텍스트 % · 큰 버튼 48px · 색 + 텍스트 · 알림 Dialog 포커스 트랩.

## 열린 질문
DISC-033(일일점검 항목 기준) · DISC-031(개인정보 표준 패키지 표시 문안) · DISC-034(타설 일정 입력 주체 — 오늘 카드의 일정 표시 여부).
