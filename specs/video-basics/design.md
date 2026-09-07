# video-basics — 기술 설계

## 레이아웃
- **A1-04 현장 모니터**(PwaShell): 상단 현장 프로파일 칩(P-SD 등) · 장비 섹션마다 `CameraTile` 2(일반 · AI, 2열) + 헬스 배지 · AI 이벤트 시 타일 경고 오버레이 + bbox · 바디캠 탭 자리(스텁).
- **A1-05 장비 상세**: 헤더(호기 · 상태 · 현장) · 상단 `Tabs` 4(상태 · 서류 · 영상 · 부품, `?tab=` — W2.5 D6, 6섹션 세로 나열 해소): 상태 = `TelemetryStrip` + CAN·IO · 서류 = 서류 카드(장비 서류 완비율 · 배정 운전자 교육 이수증 만료 임박 D-27 `Badge`) · 영상 = 저장 영상 `Tabs`(프로파일별 소스) + 목록(날짜 · 길이 · 소스 · 재생 자리) + 카메라 타일 2(타일 안 pill 없음, `HealthBadge`) · 부품 = 마모·교체 부품 `TelemetryGauge` 2 + 점검 입력 링크. `plite` 픽스처는 영상 탭으로 연다.
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

## W2 — 본사 열람(A3-04 · B2-03)
- `CameraWall`(`packages/video`, 카탈로그): B1-02 월을 추출 — `[data-wall]` 다크 강제 · AX-1 필터(`visibleIn`, `packages/video/src/wall.ts`) · 헤더 "N호기 M채널" · `onopen`. B1-02는 모달(`?cam=`)만 페이지에 남긴다.
- `EquipmentCard`(`packages/ui`, 카탈로그): 헤더(호기 · 상태 pill) · `summary`(현장 · 마지막 수신 · 고장코드) · 자식(타일) · `actions` 슬롯. A1-04·A3-04·B2-03이 사용; A2-04·A1-05 헤더와 B1-02 인스펙터는 후속 정리 후보(시각 동일 유지 우선).
- A3-04 = A1-04의 열람 전용 변형(링크·액션 없음, `A3-04:dev` 픽스처는 `A1-04:monitor`와 같은 카메라 변형). B2-03 = 장비 카드 + 현장 전체 월 + 인스펙터(미처리 업무 · `requestConfirm`).

## W2.6 — 삽화 대체 영상 (참고자료 v5.0)
- 원천: 참고자료 v5.0 PPTX(저장소 밖 — `python3 tools/media/build.py --deck <pptx>`) 슬라이드 11(붐 전개·이동)·12(작업구역 인원 접근). 제조사 제품 사진은 쓰지 않는다(권리). 산출물만 커밋한다 — `packages/video/src/assets/{front,boom,boom-person}.webp` · `{front,boom}.mp4` · `manifest.json`(원천 sha256·크롭·크기·바이트·bbox).
- 생성기: `tools/media/sources.json`(id → 슬라이드·크롭·크기·emit·bbox_px) → 스틸 960×540 WebP q75 · 루프 640×360·15fps·6s·무음 H.264(스틸에서 zoompan ±3%, sin 주기 90프레임 — QA video-caption 면제 유지). `--proof` 콘택트 시트를 눈으로 확인한 뒤 커밋한다. 제목 띠(슬라이드 8·12~14 상단)는 크롭 밖. idle 스틸(front·boom)에는 알람 그래픽이 없고, 알람 스틸(boom-person)의 구워진 빨간 상자는 `STILL_BBOX`(크롭 안 정규화)와 같은 자리 — seed(AL-008)·realtime·B1-08 마커가 그 값을 쓴다(리터럴 금지, Vitest 가드).
- 표시: `CameraTile`이 `STILL[still ?? kind]`를 배경 `<img data-still alt="">`로 그린다(A1-04는 실시간 인원 접근 이벤트가 오면 `still="boom-person"`) · `VideoPlayer`는 `poster`(MediaSource.live의 선택 필드) · mock `snapshot()`은 스틸 URL(시각은 UI가 표시, SVG data URL 삭제). 수신 없음·AI 판단 불가 오버레이·타일 수·`data-*` 훅은 그대로(FR-034).
- 예산: 스틸 39~53KB · 루프 133~149KB · 합계 ≈ 420KB(파일당 ≤ 2MB). PWA SW는 mp4를 선캐시하지 않고(런타임 cache-first) 스틸만 담는다. 두 앱이 import하는 `assets.ts`의 `new URL()`은 두 번들에 emit되므로 웹 전용 클립은 별도 모듈(`assets-web.ts`)로 분리한다(이번엔 없음).
- 미발행: 슬라이드 13(작업자 상태 이상 — DISC-042 검증 전, 보여줄 상태 없음) · 14(호스·배관 이상 — 2단계 FR-036) · 16(증빙 사진 자리 — W4) · 8(제목 띠가 붐과 겹침 — 설치 구성도는 front 재사용). 캡처는 `img`를 마스크하지 않으므로 스틸 교체는 기준선 재등록(7장: a1-04 · a3-04 · b1-02 · b1-02m · b1-07 · b1-08 · b2-03).
