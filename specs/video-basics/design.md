# video-basics — 기술 설계

## 레이아웃
- **A1-04 현장 모니터**(PwaShell): 상단 현장 프로파일 칩(P-SD 등) · 장비 섹션마다 `CameraTile` 2(일반 · AI, 2열) + 헬스 배지 · AI 이벤트 시 타일 경고 오버레이 + bbox · 바디캠 탭 자리(스텁).
- **A1-05 장비 상세**: 헤더(호기 · 상태 · 현장) · `TelemetryStrip` · 소모품 `TelemetryGauge` 2 · 서류 카드(장비 서류 완비율 · 배정 운전자 교육 이수증 만료 임박 D-27 `Badge`) · 저장 영상 `Tabs`(프로파일별 소스) + 목록(날짜 · 길이 · 소스 · 재생 자리) · 카메라 타일 2.
- **B1-02M 완성**: `VideoPlayer`(source = 루프 MP4 | 스냅샷 폴러) · 채널 칩 2 · 라이브/스냅샷 토글 · 녹화 배지 · 헬스 오버레이("정상" 금지) · 저장 소스 `Tabs`(프로파일 플래그) · bbox SVG(AI 채널) · Esc. 월(wall)은 `data-theme=dark` 강제(control-dashboard AC-7).

## 컴포넌트 · 토큰
video 패키지: `VideoPlayer`(muted · autoplay · playsinline · 정지 버튼 · 소스 전환 · 스냅샷 폴링 5~10s 내장) · `BboxOverlay`(SVG, 정규화 좌표) · `HealthBadge`(camera 상태기계 라벨 `labels.ts`) — 뒤 둘은 `components.json` 등록. ui: `TelemetryGauge` `TelemetryStrip` `Tabs` `Badge` `EmptyState`. 토큰: `sys.color.media.*`(테마 무관) · `domain.video.*` · `domain.equipment.*`.

## 데이터 · 로직
- ENT-04 카메라(kind general/ai · ingestType E1~E5 · recordingMode · state: live/snapshot/recording/offline/ai-unavailable · snapshotAt · health) · ENT-01 현장 `videoProfile`(P-LITE/P-SD/P-NVR) · ENT-12 텔레메트리 · ENT-07 서류 · 저장 영상 목록(메타만: camera · 시각 · 길이 · 소스).
- `packages/domain/profile.ts`: `profileFlags(profile)` → { sources: ['server'|'sd'|'nvr'], snapshotEveryMs, sdRecall, nvrTimeline } — `options.profiles` AX-4 그대로: P-LITE 서버 · P-SD 서버+SD · P-NVR NVR. Vitest `[FR-005]`(QA 게이트 5 "프로파일→피처플래그"). camera 상태기계 테스트 `[FR-034]`.
- `MediaSource` 인터페이스(`packages/domain/api.ts` 추가, ADR-002 규칙) · mock 구현: 루프 MP4 2종(전방 조망 · 붐 끝 하향, 5~10초 · 무음 · 자체 합성) + 스냅샷 PNG 시퀀스 + 저장 영상 메타. 자산은 `packages/video/assets`(용량 ≤ 2MB/파일).
- realtime: `camera.updated`(헬스 변화) · AI 이벤트(IF-015 mock) → `alert.raised`(kind `ai-person`) + 타일 bbox.

## 라우트 · 쿼리
`/a1/monitor?state=monitor` · `/a1/monitor/[device]?state=dev` · `/b1/dash?cam=<id>&state=cam&source=server|sd|nvr`.

## 오류 · 빈 상태
채널 offline → 타일 회색 + "수신 끊김 · 마지막 hh:mm" · ai-unavailable → 배지 "AI 판단 불가" · 스냅샷 지연 → 배지 · 저장 영상 0 → EmptyState · 재생 실패 → 스냅샷 폴백.

## 접근성
타일 `aria-label`(장비 · 채널 · 상태) · 비디오 정지 버튼 · bbox 텍스트 대체("사람 1 — 호스 주변") · 모달 포커스 트랩 · 자동 재생은 무음.

## 열린 질문
DISC-028(옵션 카탈로그) · DISC-029(수신 경로 → 배지 3종 표기) · DISC-040(기종) · DISC-030(바디캠 범위).
